import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { r2, R2_BUCKET_NAME } from '@/lib/r2'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
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
    
    // Return image with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': response.ContentType || 'image/jpeg',
        'Content-Length': response.ContentLength?.toString() || buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'ETag': response.ETag || '',
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