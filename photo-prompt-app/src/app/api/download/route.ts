import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Simple, restricted proxy to download external demo images as attachments.
// Restricts to Unsplash CDN to avoid becoming an open proxy.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const urlParam = searchParams.get('url')
    if (!urlParam) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
    }

    const target = new URL(urlParam)
    if (target.hostname !== 'images.unsplash.com') {
      return NextResponse.json({ error: 'Host not allowed' }, { status: 400 })
    }

    const upstream = await fetch(target.toString(), {
      // Pass through caching headers; Next will still cache per route if configured
      headers: {
        // Some CDNs behave better with a UA, but keep it minimal
        'Accept': 'image/*,*/*;q=0.8',
      },
      // Revalidate frequently for demo images if needed
      cache: 'no-store',
    })

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: upstream.status })
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg'
    const arrayBuffer = await upstream.arrayBuffer()

    // Derive a simple filename from the path
    const pathParts = target.pathname.split('/')
    const last = pathParts[pathParts.length - 1] || 'download'
    const filename = last.split('?')[0] || 'download'

    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(arrayBuffer.byteLength),
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=604800',
      },
    })
  } catch (error) {
    console.error('Download proxy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


