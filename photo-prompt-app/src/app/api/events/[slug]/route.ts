import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export async function GET(
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

    // Find the event and verify ownership
    const event = await prisma.event.findFirst({
      where: { 
        slug,
        userId: session.user.id
      },
      include: {
        prompts: {
          include: {
            _count: {
              select: {
                uploads: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        },
        uploads: {
          include: {
            prompt: {
              select: {
                text: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 6
        },
        _count: {
          select: {
            prompts: true,
            uploads: true
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      event
    })

  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const updateEventSchema = z.object({
  isActive: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const raw = await request.json()
    const data = updateEventSchema.parse(raw)

    // Find event and verify ownership
    const event = await prisma.event.findFirst({
      where: { slug, userId: session.user.id },
      select: { id: true }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const updated = await prisma.event.update({
      where: { id: event.id },
      data: {
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        _count: { select: { prompts: true, uploads: true } },
      }
    })

    return NextResponse.json({ success: true, event: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}