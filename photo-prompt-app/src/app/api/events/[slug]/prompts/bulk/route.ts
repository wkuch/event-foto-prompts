import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'

const bulkCreatePromptsSchema = z.object({
  prompts: z.array(z.string().min(1, 'Prompt text is required').max(500, 'Prompt text too long'))
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { slug } = await params
    const body = await request.json()
    const data = bulkCreatePromptsSchema.parse(body)

    // Find the event and verify ownership
    const event = await prisma.event.findUnique({
      where: { slug },
      select: { id: true, userId: true }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (event.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get the current highest order number
    const lastPrompt = await prisma.prompt.findFirst({
      where: { eventId: event.id },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const nextOrderStart = (lastPrompt?.order ?? -1) + 1

    // Normalize helper to match client-side sanitize + lowercase
    const normalize = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()

    // Fetch existing prompts to detect duplicates on server, case/space-insensitive
    const existing = await prisma.prompt.findMany({
      where: { eventId: event.id },
      select: { text: true }
    })
    const existingSet = new Set(existing.map(p => normalize(p.text)))

    // Prepare clean inputs and detect existing duplicates
    const inputCleaned = data.prompts.map(s => s.trim().replace(/\s+/g, ' '))
    const duplicatesExisting: string[] = []
    const toCreateTexts: string[] = []
    const seenInBatch = new Set<string>()
    inputCleaned.forEach((text) => {
      const norm = normalize(text)
      if (existingSet.has(norm)) {
        duplicatesExisting.push(text)
        return
      }
      if (seenInBatch.has(norm)) {
        // within-batch duplicates are already handled on client; skip here
        return
      }
      seenInBatch.add(norm)
      toCreateTexts.push(text)
    })

    // Build data with sequential order for new items only
    const toCreate = toCreateTexts
      .map((text, i) => ({
        text,
        order: nextOrderStart + i,
        eventId: event.id
      }))
      .filter(p => p.text.length > 0 && p.text.length <= 500)

    // Use createMany with skipDuplicates to avoid race-condition conflicts
    const createResult = await prisma.prompt.createMany({
      data: toCreate,
      skipDuplicates: true
    })

    return NextResponse.json({
      success: true,
      created: createResult.count,
      total: data.prompts.length,
      duplicatesExisting,
      attempted: toCreateTexts.length
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    console.error('Error creating bulk prompts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}