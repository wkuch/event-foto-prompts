import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params
    const { searchParams } = new URL(request.url)
    const nextOnly = searchParams.get('next') === 'true'

    // Find the event by UUID (no auth required for public gallery access)
    const event = await prisma.event.findUnique({
      where: { id: uuid },
      select: { id: true, isActive: true }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (!event.isActive) {
      return NextResponse.json(
        { error: 'Event is not active' },
        { status: 403 }
      )
    }

    if (nextOnly) {
      // Get all available prompts that have upload slots
      const prompts = await prisma.prompt.findMany({
        where: {
          eventId: event.id,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              uploads: true
            }
          }
        },
        orderBy: { order: 'asc' }
      })

      // Filter out prompts that have reached their max uploads
      const availablePrompts = prompts.filter(p => 
        !p.maxUploads || p._count.uploads < p.maxUploads
      )

      // Return a random prompt from available ones
      let selectedPrompt = null
      if (availablePrompts.length > 0) {
        const randomIndex = Math.floor(Math.random() * availablePrompts.length)
        selectedPrompt = availablePrompts[randomIndex]
      }

      return NextResponse.json({
        success: true,
        prompt: selectedPrompt
      })
    }

    // Return all prompts for the event
    const prompts = await prisma.prompt.findMany({
      where: {
        eventId: event.id,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            uploads: true
          }
        }
      },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({
      success: true,
      prompts
    })

  } catch (error) {
    console.error('Error fetching prompts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}