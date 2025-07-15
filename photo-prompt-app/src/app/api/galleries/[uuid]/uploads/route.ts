import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params
    const { searchParams } = new URL(request.url)
    const promptId = searchParams.get('promptId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Find the event by UUID (no auth required for public gallery access)
    const event = await prisma.event.findUnique({
      where: { id: uuid },
      select: { id: true }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Build where clause
    const where = {
      eventId: event.id,
      isApproved: true,
      ...(promptId && { promptId })
    }

    // Get uploads
    const uploads = await prisma.upload.findMany({
      where,
      include: {
        prompt: {
          select: {
            id: true,
            text: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Get total count
    const total = await prisma.upload.count({ where })

    return NextResponse.json({
      success: true,
      uploads: uploads.map(upload => ({
        id: upload.id,
        r2Url: upload.r2Url,
        caption: upload.caption,
        uploaderName: upload.uploaderName,
        createdAt: upload.createdAt,
        prompt: upload.prompt
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: total > offset + limit
      }
    })

  } catch (error) {
    console.error('Error fetching uploads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}