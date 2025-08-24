import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
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
    
    // Convert stream/body to a single Uint8Array
    const bodyAny: any = response.Body as any
    let u8: Uint8Array
    if (bodyAny && typeof bodyAny.transformToByteArray === 'function') {
      u8 = await bodyAny.transformToByteArray()
    } else {
      const chunks: Uint8Array[] = []
      const reader = bodyAny.transformToWebStream().getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }
      const total = chunks.reduce((sum, c) => sum + c.length, 0)
      u8 = new Uint8Array(total)
      let offset = 0
      for (const c of chunks) {
        u8.set(c, offset)
        offset += c.length
      }
    }
    
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
      ext === 'heic' || ext === 'heif' ? 'image/heic' :
      ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
      'image/jpeg'
    const originContentType = (response.ContentType && response.ContentType !== 'binary/octet-stream')
      ? response.ContentType
      : inferredType

    const isHeic = originContentType === 'image/heic' || originContentType === 'image/heif'

    // Transcode HEIC/HEIF to JPEG for broad browser compatibility
    let outBuffer: Uint8Array | Buffer = u8
    let outType = originContentType
    let outFileName = fileName
    if (isHeic) {
      try {
        outBuffer = await sharp(u8).jpeg({ quality: 90 }).toBuffer()
        outType = 'image/jpeg'
        // ensure .jpg extension for downloads
        outFileName = fileName.replace(/\.(heic|heif)$/i, '.jpg')
      } catch (e) {
        // If conversion fails, fall back to original buffer and mark as octet-stream to force download
        outType = 'application/octet-stream'
      }
    }

    // Prepare ArrayBuffer body for Response API compatibility
    const bodyBytes = outBuffer instanceof Uint8Array
      ? outBuffer
      : new Uint8Array(outBuffer as any)
    const bodyArrayBuffer = bodyBytes.buffer.slice(bodyBytes.byteOffset, bodyBytes.byteOffset + bodyBytes.byteLength)

    // Return image with appropriate headers
    return new NextResponse(bodyArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': outType,
        'Content-Length': bodyBytes.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'ETag': response.ETag || '',
        'Accept-Ranges': 'bytes',
        'Content-Disposition': shouldDownload ? `attachment; filename="${outFileName}"` : 'inline',
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