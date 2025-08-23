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
    
    let nextOrder = (lastPrompt?.order ?? -1) + 1

    // Create all prompts in a transaction
    const results = await prisma.$transaction(async (tx) => {
      const createdPrompts = []
      const errors = []

      for (let i = 0; i < data.prompts.length; i++) {
        const promptText = data.prompts[i].trim()
        
        try {
          // Validate each prompt text individually
          if (promptText.length === 0) {
            errors.push({
              index: i,
              text: promptText,
              error: 'Prompt text is required'
            })
            continue
          }

          if (promptText.length > 500) {
            errors.push({
              index: i,
              text: promptText,
              error: 'Prompt text too long (max 500 characters)'
            })
            continue
          }

          const prompt = await tx.prompt.create({
            data: {
              text: promptText,
              order: nextOrder + i,
              eventId: event.id,
            }
          })

          createdPrompts.push(prompt)
        } catch (error) {
          console.error(`Error creating prompt ${i}:`, error)
          errors.push({
            index: i,
            text: promptText,
            error: 'Failed to create prompt'
          })
        }
      }

      return { createdPrompts, errors }
    })

    return NextResponse.json({
      success: true,
      created: results.createdPrompts.length,
      total: data.prompts.length,
      prompts: results.createdPrompts,
      errors: results.errors
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