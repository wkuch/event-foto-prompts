import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const uploadSchema = z.object({
  promptId: z.string().optional(),
  caption: z.string().max(500, 'Caption too long').optional(),
  uploaderName: z.string().max(100, 'Name too long').optional(),
  uploaderInfo: z.record(z.string(), z.unknown()).optional(),
})

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const metadataStr = formData.get('metadata') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type and size
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Parse and validate metadata
    let metadata = {}
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr)
        uploadSchema.parse(metadata)
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid metadata format' },
          { status: 400 }
        )
      }
    }

    const { promptId, caption, uploaderName, uploaderInfo } = metadata as z.infer<typeof uploadSchema>

    // Validate promptId if provided
    if (promptId) {
      const prompt = await prisma.prompt.findFirst({
        where: {
          id: promptId,
          eventId: event.id,
          isActive: true
        },
        include: {
          _count: {
            select: { uploads: true }
          }
        }
      })

      if (!prompt) {
        return NextResponse.json(
          { error: 'Prompt not found or inactive' },
          { status: 404 }
        )
      }

      // Check if prompt has reached max uploads
      if (prompt.maxUploads && prompt._count.uploads >= prompt.maxUploads) {
        return NextResponse.json(
          { error: 'This prompt has reached its maximum number of uploads' },
          { status: 409 }
        )
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `${timestamp}-${randomString}.${fileExtension}`
    const r2Key = `events/${slug}/uploads/${fileName}`

    // Upload to R2
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: file.type,
      ContentLength: file.size,
    })

    await s3Client.send(uploadCommand)

    // Generate public URL
    const r2Url = `${process.env.R2_PUBLIC_URL}/${r2Key}`

    // Save upload record to database
    const upload = await prisma.upload.create({
      data: {
        eventId: event.id,
        promptId: promptId || null,
        fileName,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        r2Key,
        r2Url,
        caption: caption || null,
        uploaderName: uploaderName || null,
        uploaderInfo: uploaderInfo ? JSON.parse(JSON.stringify(uploaderInfo)) : null,
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

    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const { searchParams } = new URL(request.url)
    const promptId = searchParams.get('promptId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Find the event
    const event = await prisma.event.findUnique({
      where: { slug },
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
        url: upload.r2Url,
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