import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { type Prisma } from '@/generated/prisma'

const updatePromptSchema = z.object({
  text: z.string().min(1, 'Prompt text is required').max(500, 'Prompt text too long').optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  maxUploads: z.number().int().min(1).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; promptId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { slug, promptId } = await params
    const body = await request.json()
    const data = updatePromptSchema.parse(body)

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

    // Check if prompt exists and belongs to this event
    const existingPrompt = await prisma.prompt.findFirst({
      where: {
        id: promptId,
        eventId: event.id
      }
    })

    if (!existingPrompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      )
    }

    // Update the prompt
    const prompt = await prisma.prompt.update({
      where: { id: promptId },
      data: {
        ...(data.text !== undefined && { text: data.text }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.maxUploads !== undefined && { maxUploads: data.maxUploads }),
        ...(data.settings !== undefined && { settings: data.settings as Prisma.InputJsonValue }),
      }
    })

    return NextResponse.json({
      success: true,
      prompt
    })

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

    console.error('Error updating prompt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; promptId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { slug, promptId } = await params

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

    // Check if prompt exists and belongs to this event
    const existingPrompt = await prisma.prompt.findFirst({
      where: {
        id: promptId,
        eventId: event.id
      }
    })

    if (!existingPrompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      )
    }

    // Delete the prompt (uploads will be set to promptId: null due to SetNull constraint)
    await prisma.prompt.delete({
      where: { id: promptId }
    })

    return NextResponse.json({
      success: true,
      message: 'Prompt deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting prompt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}