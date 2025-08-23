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

    const nextOrder = (lastPrompt?.order ?? -1) + 1

    // Prepare clean inputs (trim, enforce length constraints already validated by zod)
    const toCreate = data.prompts
      .map((text, i) => ({
        text: text.trim(),
        order: nextOrder + i,
        eventId: event.id
      }))
      .filter(p => p.text.length > 0 && p.text.length <= 500)

    // Use createMany to avoid long interactive transactions on serverless
    const createResult = await prisma.prompt.createMany({
      data: toCreate
    })

    return NextResponse.json({
      success: true,
      created: createResult.count,
      total: data.prompts.length,
      prompts: [],
      errors: []
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