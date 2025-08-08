import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'
import * as QRCode from 'qrcode'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'png'
    const size = parseInt(searchParams.get('size') || '200')
    const margin = parseInt(searchParams.get('margin') || '4')

    // Validate parameters
    if (!['png', 'svg'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Use png or svg.' },
        { status: 400 }
      )
    }

    if (size < 50 || size > 1000) {
      return NextResponse.json(
        { error: 'Invalid size. Must be between 50 and 1000 pixels.' },
        { status: 400 }
      )
    }

    // Check if event exists and is active
    const event = await prisma.event.findUnique({
      where: { slug },
      select: { id: true, name: true, isActive: true, userId: true }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // For private events, require authentication
    const session = await getServerSession(authOptions)
    if (event.userId !== session?.user?.id) {
      // Allow public access to active events for QR code generation
      if (!event.isActive) {
        return NextResponse.json(
          { error: 'Event is not active' },
          { status: 403 }
        )
      }
    }

    // Generate the URL that the QR code will point to using current request URL
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const eventUrl = `${baseUrl}/event/${slug}`

    // QR code options
    const qrOptions = {
      width: size,
      margin: margin,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M' as const
    }

    if (format === 'svg') {
      // Generate SVG QR code
      const svgString = await QRCode.toString(eventUrl, {
        ...qrOptions,
        type: 'svg'
      })

      return new NextResponse(svgString, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'Content-Disposition': `inline; filename="event-${slug}-qr.svg"`
        }
      })
    } else {
      // Generate PNG QR code
      const pngBuffer = await QRCode.toBuffer(eventUrl, {
        ...qrOptions,
        type: 'png'
      })

      // Use Uint8Array (ArrayBufferView) which is a valid BodyInit
      const uint8 = new Uint8Array(pngBuffer)

      return new NextResponse(uint8, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'Content-Disposition': `inline; filename="event-${slug}-qr.png"`
        }
      })
    }

  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Additional endpoint to get QR code metadata and download URLs
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { slug } = await params

    // Check if event exists and user owns it
    const event = await prisma.event.findUnique({
      where: { slug },
      select: { id: true, name: true, userId: true }
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

    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const eventUrl = `${baseUrl}/event/${slug}`
    const qrApiBase = `${baseUrl}/api/events/${slug}/qr`

    return NextResponse.json({
      success: true,
      eventUrl,
      qrCodes: {
        png: {
          small: `${qrApiBase}?format=png&size=150`,
          medium: `${qrApiBase}?format=png&size=300`,
          large: `${qrApiBase}?format=png&size=600`
        },
        svg: {
          small: `${qrApiBase}?format=svg&size=150`,
          medium: `${qrApiBase}?format=svg&size=300`,
          large: `${qrApiBase}?format=svg&size=600`
        }
      }
    })

  } catch (error) {
    console.error('Error getting QR code info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}