import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const completeUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  originalName: z.string().min(1, 'Original name is required'),
  fileSize: z.number().int().min(1),
  mimeType: z.string().min(1),
  r2Key: z.string().min(1),
  r2Url: z.string().url(),
  promptId: z.string().optional(),
  caption: z.string().max(500, 'Caption too long').optional(),
  uploaderName: z.string().max(100, 'Name too long').optional(),
  uploaderInfo: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const data = completeUploadSchema.parse(body)

    // Find the event
    const event = await prisma.event.findUnique({
      where: { slug },
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

    // Generate API proxy URL using current request URL
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const apiUrl = `${baseUrl}/api/images/${data.r2Key}`

    // Save upload record to database
    const upload = await prisma.upload.create({
      data: {
        eventId: event.id,
        promptId: data.promptId || null,
        fileName: data.fileName,
        originalName: data.originalName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        r2Key: data.r2Key,
        r2Url: apiUrl, // Use API proxy URL instead of direct R2 URL
        caption: data.caption || null,
        uploaderName: data.uploaderName || null,
        uploaderInfo: data.uploaderInfo ? JSON.parse(JSON.stringify(data.uploaderInfo)) : null,
        metadata: {
          userAgent: request.headers.get('user-agent'),
          uploadedAt: new Date().toISOString(),
        }
      }
    })

    return NextResponse.json({
      success: true,
      upload: {
        id: upload.id,
        fileName: upload.fileName,
        originalName: upload.originalName,
        url: upload.r2Url,
        caption: upload.caption,
        uploaderName: upload.uploaderName,
        createdAt: upload.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: error.issues.map((e) => ({
            field: e.path.join('.'), // Mobile-friendly field string
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    console.error('Error completing upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}