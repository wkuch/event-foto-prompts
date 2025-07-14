import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { type Prisma } from '../../../../../generated/prisma'

const createPromptSchema = z.object({
  text: z.string().min(1, 'Prompt text is required').max(500, 'Prompt text too long'),
  order: z.number().int().min(0).optional(),
  maxUploads: z.number().int().min(1).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
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
    const body = await request.json()
    const data = createPromptSchema.parse(body)

    // Find the event and verify ownership
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

    // Get the next order number if not provided
    let order = data.order
    if (order === undefined) {
      const lastPrompt = await prisma.prompt.findFirst({
        where: { eventId: event.id },
        orderBy: { order: 'desc' },
        select: { order: true }
      })
      order = (lastPrompt?.order ?? -1) + 1
    }

    // Create the prompt
    const prompt = await prisma.prompt.create({
      data: {
        text: data.text,
        order,
        maxUploads: data.maxUploads,
        settings: data.settings as Prisma.InputJsonValue,
        eventId: event.id,
      }
    })

    return NextResponse.json({
      success: true,
      prompt
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    console.error('Error creating prompt:', error)
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
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const nextOnly = searchParams.get('next') === 'true'

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

    if (nextOnly) {
      // Return the next prompt that has available upload slots
      const prompt = await prisma.prompt.findFirst({
        where: {
          eventId: event.id,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              uploads: true
            }
          }
        },
        orderBy: { order: 'asc' }
      })

      // Filter out prompts that have reached their max uploads
      let availablePrompt: typeof prompt = prompt
      if (prompt?.maxUploads && prompt._count.uploads >= prompt.maxUploads) {
        const prompts = await prisma.prompt.findMany({
          where: {
            eventId: event.id,
            isActive: true,
          },
          include: {
            _count: {
              select: {
                uploads: true
              }
            }
          },
          orderBy: { order: 'asc' }
        })
        
        availablePrompt = prompts.find(p => 
          !p.maxUploads || p._count.uploads < p.maxUploads
        ) || null
      }

      return NextResponse.json({
        success: true,
        prompt: availablePrompt
      })
    }

    // Return all prompts for the event
    const prompts = await prisma.prompt.findMany({
      where: {
        eventId: event.id,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            uploads: true
          }
        }
      },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({
      success: true,
      prompts
    })

  } catch (error) {
    console.error('Error fetching prompts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}