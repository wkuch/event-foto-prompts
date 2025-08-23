import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { r2, R2_BUCKET_NAME } from '@/lib/r2'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; uploadId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { slug, uploadId } = await params

    // Verify event ownership by slug
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

    // Load the upload and ensure it belongs to this event
    const upload = await prisma.upload.findFirst({
      where: {
        id: uploadId,
        eventId: event.id,
      },
      select: {
        id: true,
        r2Key: true,
      }
    })

    if (!upload) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      )
    }

    // Try to delete the object from R2 (ignore NotFound)
    if (upload.r2Key) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: upload.r2Key,
        })
        await r2.send(command)
      } catch (storageError) {
        // Log and continue; we still remove DB record
        console.warn('R2 delete error (continuing):', storageError)
      }
    }

    // Remove DB record
    await prisma.upload.delete({ where: { id: upload.id } })

    return NextResponse.json({
      success: true,
      message: 'Upload deleted successfully',
    })

  } catch (error) {
    console.error('Error deleting upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


