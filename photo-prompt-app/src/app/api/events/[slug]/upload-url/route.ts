import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2'

const presignedUrlSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().min(1, 'File type is required'),
  fileSize: z.number().int().min(1).max(10 * 1024 * 1024), // 10MB max
  promptId: z.string().optional(),
})

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const data = presignedUrlSchema.parse(body)

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

    // Validate file type
    if (!ALLOWED_TYPES.includes(data.fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      )
    }

    // Validate promptId if provided
    if (data.promptId) {
      const prompt = await prisma.prompt.findFirst({
        where: {
          id: data.promptId,
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
    const fileExtension = data.fileName.split('.').pop() || 'jpg'
    const fileName = `${timestamp}-${randomString}.${fileExtension}`
    const r2Key = `events/${event.id}/uploads/${fileName}`

    // Generate presigned URL
    const putObjectCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: r2Key,
      ContentType: data.fileType,
      ContentLength: data.fileSize,
    })

    const presignedUrl = await getSignedUrl(r2, putObjectCommand, {
      expiresIn: 300, // 5 minutes
    })

    // Generate public URL
    const publicUrl = `${R2_PUBLIC_URL}/${r2Key}`

    return NextResponse.json({
      success: true,
      presignedUrl,
      publicUrl,
      fileName,
      r2Key
    })

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

    console.error('Error generating presigned URL:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}