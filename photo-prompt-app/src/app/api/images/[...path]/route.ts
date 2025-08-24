import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { r2, R2_BUCKET_NAME } from '@/lib/r2'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const r2Key = path.join('/')
    
    // Get object from R2
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: r2Key
    })
    
    const response = await r2.send(command)
    
    if (!response.Body) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }
    
    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    const reader = response.Body.transformToWebStream().getReader()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    
    const buffer = Buffer.concat(chunks)
    
    // Optional forced download
    const { searchParams } = new URL(request.url)
    const shouldDownload = searchParams.get('download') === '1'
    const fileName = r2Key.split('/').pop() || 'image.jpg'

    // Infer a safe content type if missing or generic
    const ext = (r2Key.split('.').pop() || '').toLowerCase()
    const inferredType =
      ext === 'png' ? 'image/png' :
      ext === 'webp' ? 'image/webp' :
      ext === 'gif' ? 'image/gif' :
      ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
      'image/jpeg'
    const contentType = (response.ContentType && response.ContentType !== 'binary/octet-stream')
      ? response.ContentType
      : inferredType

    // Return image with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': response.ContentLength?.toString() || buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'ETag': response.ETag || '',
        'Accept-Ranges': 'bytes',
        'Content-Disposition': shouldDownload ? `attachment; filename="${fileName}"` : 'inline',
      }
    })
    
  } catch (error) {
    console.error('Error serving image from R2:', error)
    return NextResponse.json(
      { error: 'Failed to load image' },
      { status: 500 }
    )
  }
}