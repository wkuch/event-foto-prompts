import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { type Prisma } from '@/generated/prisma'

const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(100, 'Event name too long'),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  type: z.string().optional().default('general'),
  description: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  email: z.string().email('Please enter a valid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createEventSchema.parse(body)

    // Check if slug already exists
    const existingEvent = await prisma.event.findUnique({
      where: { slug: data.slug }
    })

    if (existingEvent) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 409 }
      )
    }

    // Check if user exists, create if not
    let user = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          emailVerified: new Date(), // Auto-verify since they're creating their first event
        }
      })
    }

    // Create the event
    const event = await prisma.event.create({
      data: {
        name: data.name,
        slug: data.slug,
        type: data.type,
        description: data.description,
        settings: data.settings as Prisma.InputJsonValue,
        userId: user.id,
      },
      include: {
        prompts: true,
        _count: {
          select: {
            uploads: true,
          }
        }
      }
    })

    // Create a session for the user (auto-login)
    const sessionToken = crypto.randomUUID()
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    console.log('🔐 Creating session for user:', {
      userId: user.id,
      email: user.email,
      sessionToken: sessionToken.substring(0, 8) + '...',
      expires: expires.toISOString()
    })

    const newSession = await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires,
      }
    })

    console.log('✅ Session created successfully:', {
      sessionId: newSession.id,
      eventId: event.id,
      eventSlug: event.slug
    })

    // Set the session cookie
    const response = NextResponse.json({
      success: true,
      event,
      message: 'Event created successfully! You can manage it from this device. Use your email to access from other devices.'
    }, { status: 201 })

    // Set secure session cookie with more robust settings for mobile compatibility
    const cookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token' 
      : 'next-auth.session-token'
    
    response.cookies.set(cookieName, sessionToken, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // Add domain for production if available
      ...(process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL && {
        domain: new URL(process.env.NEXTAUTH_URL).hostname
      })
    })

    // Also set the regular cookie name for better compatibility
    if (process.env.NODE_ENV === 'production') {
      response.cookies.set('next-auth.session-token', sessionToken, {
        expires,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      })
    }

    return response

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: error.issues.map(e => ({
            field: e.path.join('.'), // Convert path array to simple field string
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('📊 Dashboard events request:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    })
    
    if (!session?.user?.id) {
      console.log('❌ No valid session found for events request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const events = await prisma.event.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        _count: {
          select: {
            prompts: true,
            uploads: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`✅ Found ${events.length} events for user ${session.user.id}`)
    
    // Debug: also check if there are events for this user's email
    if (events.length === 0 && session.user.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { events: true }
      })
      console.log('🔍 Debug - User lookup by email:', {
        userFoundByEmail: !!user,
        userId: user?.id,
        eventCount: user?.events?.length || 0,
        sessionUserId: session.user.id,
        userIdMatch: user?.id === session.user.id
      })
    }

    return NextResponse.json({
      success: true,
      events
    })

  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}