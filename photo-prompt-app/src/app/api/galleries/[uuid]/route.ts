import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { uuid } = await params

    // Find the event by UUID (no auth required for public gallery access)
    const event = await prisma.event.findUnique({
      where: { 
        id: uuid
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        createdAt: true,
        userId: true
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const isOwner = !!(session?.user?.id && event.userId === session.user.id)

    // Do not expose userId to client
    const { userId: _omit, ...publicEvent } = event

    return NextResponse.json({
      success: true,
      event: publicEvent,
      isOwner
    })

  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}