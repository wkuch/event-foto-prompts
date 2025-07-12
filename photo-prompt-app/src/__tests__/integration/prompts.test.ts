import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, GET } from '@/app/api/events/[slug]/prompts/route'
import { PUT, DELETE } from '@/app/api/events/[slug]/prompts/[promptId]/route'
import { createMockRequest, createMockSession } from '../helpers/test-helpers'
import { mockPrisma } from '../helpers/mock-prisma'
import { testEvents, testUsers, testPrompts } from '../fixtures/test-data'
import { getServerSession } from 'next-auth'

// Import mock setup
import '../helpers/mock-prisma'

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

const mockGetServerSession = vi.mocked(getServerSession)

describe('Prompts API', () => {
  const testUser = testUsers.organizer
  const testEvent = {
    id: 'event-123',
    slug: testEvents.wedding.slug,
    userId: testUser.id,
    isActive: true,
  }
  
  beforeEach(() => {
    mockGetServerSession.mockResolvedValue(createMockSession(testUser.id))
  })

  describe('POST /api/events/[slug]/prompts', () => {
    it('should create a prompt with valid data', async () => {
      // Mock event exists and user owns it
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)
      
      // Mock no existing prompts (for auto-ordering)
      mockPrisma.prompt.findFirst.mockResolvedValue(null)
      
      const mockPrompt = {
        id: 'prompt-123',
        text: testPrompts[0].text,
        order: 0,
        maxUploads: testPrompts[0].maxUploads,
        eventId: testEvent.id,
        isActive: true,
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockPrisma.prompt.create.mockResolvedValue(mockPrompt)

      const request = createMockRequest('POST', `/api/events/${testEvent.slug}/prompts`, {
        text: testPrompts[0].text,
        maxUploads: testPrompts[0].maxUploads,
      })

      const response = await POST(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.prompt.text).toBe(testPrompts[0].text)
      expect(data.prompt.order).toBe(0)
      expect(mockPrisma.prompt.create).toHaveBeenCalledWith({
        data: {
          text: testPrompts[0].text,
          order: 0,
          maxUploads: testPrompts[0].maxUploads,
          settings: undefined,
          eventId: testEvent.id,
        }
      })
    })

    it('should auto-increment order when not provided', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)
      
      // Mock existing prompt with order 2
      mockPrisma.prompt.findFirst.mockResolvedValue({ order: 2 })
      
      const mockPrompt = {
        id: 'prompt-123',
        text: 'New prompt',
        order: 3, // Should be 2 + 1
        eventId: testEvent.id,
        isActive: true,
        maxUploads: null,
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockPrisma.prompt.create.mockResolvedValue(mockPrompt)

      const request = createMockRequest('POST', `/api/events/${testEvent.slug}/prompts`, {
        text: 'New prompt',
      })

      const response = await POST(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.prompt.order).toBe(3)
    })

    it('should reject unauthorized access', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = createMockRequest('POST', `/api/events/${testEvent.slug}/prompts`, {
        text: 'Test prompt',
      })

      const response = await POST(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should reject access to non-existent event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null)

      const request = createMockRequest('POST', '/api/events/non-existent/prompts', {
        text: 'Test prompt',
      })

      const response = await POST(request, { params: { slug: 'non-existent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Event not found')
    })

    it('should reject access to event owned by another user', async () => {
      const anotherUsersEvent = { ...testEvent, userId: 'another-user' }
      mockPrisma.event.findUnique.mockResolvedValue(anotherUsersEvent)

      const request = createMockRequest('POST', `/api/events/${testEvent.slug}/prompts`, {
        text: 'Test prompt',
      })

      const response = await POST(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    it('should validate prompt text', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)

      const request = createMockRequest('POST', `/api/events/${testEvent.slug}/prompts`, {
        text: '', // Empty text should fail
      })

      const response = await POST(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details).toHaveLength(1)
      expect(data.details[0].field).toBe('text') // Mobile-friendly field string
    })
  })

  describe('GET /api/events/[slug]/prompts', () => {
    it('should return all prompts for an event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)
      
      const mockPrompts = [
        {
          id: 'prompt-1',
          text: testPrompts[0].text,
          order: 0,
          isActive: true,
          eventId: testEvent.id,
          maxUploads: 10,
          settings: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { uploads: 3 }
        },
        {
          id: 'prompt-2',
          text: testPrompts[1].text,
          order: 1,
          isActive: true,
          eventId: testEvent.id,
          maxUploads: 5,
          settings: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { uploads: 5 }
        }
      ]
      mockPrisma.prompt.findMany.mockResolvedValue(mockPrompts)

      const request = createMockRequest('GET', `/api/events/${testEvent.slug}/prompts`)

      const response = await GET(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.prompts).toHaveLength(2)
      expect(data.prompts[0].text).toBe(testPrompts[0].text)
      expect(data.prompts[1].text).toBe(testPrompts[1].text)
    })

    it('should return next available prompt when ?next=true', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)
      
      const mockPrompt = {
        id: 'prompt-1',
        text: testPrompts[0].text,
        order: 0,
        isActive: true,
        eventId: testEvent.id,
        maxUploads: 10,
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { uploads: 3 }
      }
      mockPrisma.prompt.findFirst.mockResolvedValue(mockPrompt)

      const request = createMockRequest('GET', `/api/events/${testEvent.slug}/prompts?next=true`)

      const response = await GET(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.prompt.text).toBe(testPrompts[0].text)
    })

    it('should reject access to inactive event', async () => {
      const inactiveEvent = { ...testEvent, isActive: false }
      mockPrisma.event.findUnique.mockResolvedValue(inactiveEvent)

      const request = createMockRequest('GET', `/api/events/${testEvent.slug}/prompts`)

      const response = await GET(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Event is not active')
    })
  })

  describe('PUT /api/events/[slug]/prompts/[promptId]', () => {
    it('should update a prompt successfully', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)
      
      const existingPrompt = {
        id: 'prompt-123',
        eventId: testEvent.id,
      }
      mockPrisma.prompt.findFirst.mockResolvedValue(existingPrompt)
      
      const updatedPrompt = {
        id: 'prompt-123',
        text: 'Updated prompt text',
        order: 1,
        isActive: false,
        eventId: testEvent.id,
        maxUploads: 15,
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockPrisma.prompt.update.mockResolvedValue(updatedPrompt)

      const request = createMockRequest('PUT', `/api/events/${testEvent.slug}/prompts/prompt-123`, {
        text: 'Updated prompt text',
        order: 1,
        isActive: false,
        maxUploads: 15,
      })

      const response = await PUT(request, { 
        params: { slug: testEvent.slug, promptId: 'prompt-123' } 
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.prompt.text).toBe('Updated prompt text')
      expect(mockPrisma.prompt.update).toHaveBeenCalledWith({
        where: { id: 'prompt-123' },
        data: {
          text: 'Updated prompt text',
          order: 1,
          isActive: false,
          maxUploads: 15,
        }
      })
    })

    it('should reject update to non-existent prompt', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)
      mockPrisma.prompt.findFirst.mockResolvedValue(null)

      const request = createMockRequest('PUT', `/api/events/${testEvent.slug}/prompts/non-existent`, {
        text: 'Updated text',
      })

      const response = await PUT(request, { 
        params: { slug: testEvent.slug, promptId: 'non-existent' } 
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Prompt not found')
    })
  })

  describe('DELETE /api/events/[slug]/prompts/[promptId]', () => {
    it('should delete a prompt successfully', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)
      
      const existingPrompt = {
        id: 'prompt-123',
        eventId: testEvent.id,
      }
      mockPrisma.prompt.findFirst.mockResolvedValue(existingPrompt)
      mockPrisma.prompt.delete.mockResolvedValue(existingPrompt)

      const request = createMockRequest('DELETE', `/api/events/${testEvent.slug}/prompts/prompt-123`)

      const response = await DELETE(request, { 
        params: { slug: testEvent.slug, promptId: 'prompt-123' } 
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Prompt deleted successfully')
      expect(mockPrisma.prompt.delete).toHaveBeenCalledWith({
        where: { id: 'prompt-123' }
      })
    })

    it('should require authorization for deletion', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = createMockRequest('DELETE', `/api/events/${testEvent.slug}/prompts/prompt-123`)

      const response = await DELETE(request, { 
        params: { slug: testEvent.slug, promptId: 'prompt-123' } 
      })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })
})