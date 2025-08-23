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
  prompts: z.array(z.string().min(1, 'Prompt text is required').max(500, 'Prompt text too long')).optional(),
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

    // Create the event with prompts in a transaction
    const event = await prisma.event.create({
      data: {
        name: data.name,
        slug: data.slug,
        type: data.type,
        description: data.description,
        settings: data.settings as Prisma.InputJsonValue,
        userId: user.id,
        // Create prompts along with the event
        prompts: data.prompts && data.prompts.length > 0 ? {
          create: data.prompts.map((promptText, index) => ({
            text: promptText,
            order: index,
            isActive: true,
          }))
        } : undefined,
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

    // Return success with instructions to sign in via email
    console.log('✅ Event created successfully:', {
      eventId: event.id,
      eventSlug: event.slug,
      userEmail: user.email
    })

    return NextResponse.json({
      success: true,
      event,
      message: 'Event created successfully! Please check your email for a sign-in link to manage your event.',
      requiresSignIn: true,
      userEmail: user.email
    }, { status: 201 })

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