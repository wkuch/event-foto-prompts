import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, GET } from '@/app/api/events/route'
import { createMockRequest, createMockSession } from '../helpers/test-helpers'
import { mockPrisma } from '../helpers/mock-prisma'
import { testEvents, testUsers } from '../fixtures/test-data'
import { getServerSession } from 'next-auth'

// Import mock setup
import '../helpers/mock-prisma'

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

const mockGetServerSession = vi.mocked(getServerSession)

describe('Events API', () => {
  const testUser = testUsers.organizer
  
  beforeEach(() => {
    mockGetServerSession.mockResolvedValue(createMockSession(testUser.id))
  })

  describe('POST /api/events', () => {
    it('should create a new event with valid data', async () => {
      // Mock Prisma responses
      mockPrisma.event.findUnique.mockResolvedValue(null) // No existing event with slug
      const mockEvent = {
        id: 'event-123',
        name: testEvents.wedding.name,
        slug: testEvents.wedding.slug,
        type: testEvents.wedding.type,
        description: testEvents.wedding.description,
        userId: testUser.id,
        isActive: true,
        settings: testEvents.wedding.settings,
        createdAt: new Date(),
        updatedAt: new Date(),
        prompts: [],
        _count: { uploads: 0 }
      }
      mockPrisma.event.create.mockResolvedValue(mockEvent)

      const request = createMockRequest('POST', '/api/events', {
        name: testEvents.wedding.name,
        slug: testEvents.wedding.slug,
        type: testEvents.wedding.type,
        description: testEvents.wedding.description,
        settings: testEvents.wedding.settings,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.event).toMatchObject({
        name: testEvents.wedding.name,
        slug: testEvents.wedding.slug,
        type: testEvents.wedding.type,
        description: testEvents.wedding.description,
        userId: testUser.id,
        isActive: true,
      })
      expect(mockPrisma.event.create).toHaveBeenCalledWith({
        data: {
          name: testEvents.wedding.name,
          slug: testEvents.wedding.slug,
          type: testEvents.wedding.type,
          description: testEvents.wedding.description,
          settings: testEvents.wedding.settings,
          userId: testUser.id,
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
    })

    it('should reject duplicate slugs', async () => {
      // Create first event
      const firstRequest = createMockRequest('POST', '/api/events', {
        name: 'First Event',
        slug: 'duplicate-slug',
        type: 'wedding',
      })
      await POST(firstRequest)

      // Try to create second event with same slug
      const secondRequest = createMockRequest('POST', '/api/events', {
        name: 'Second Event',
        slug: 'duplicate-slug',
        type: 'birthday',
      })

      const response = await POST(secondRequest)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Slug already exists')
    })

    it('should validate required fields', async () => {
      const request = createMockRequest('POST', '/api/events', {
        slug: 'test-slug',
        // Missing required 'name' field
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details).toHaveLength(1)
      expect(data.details[0].field).toBe('name')
    })

    it('should validate slug format', async () => {
      const request = createMockRequest('POST', '/api/events', {
        name: 'Test Event',
        slug: 'Invalid Slug With Spaces!',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details[0].field).toBe('slug')
      expect(data.details[0].message).toContain('lowercase letters, numbers, and hyphens')
    })

    it('should require authentication', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = createMockRequest('POST', '/api/events', {
        name: 'Test Event',
        slug: 'test-slug',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should set default values correctly', async () => {
      const request = createMockRequest('POST', '/api/events', {
        name: 'Minimal Event',
        slug: 'minimal-event',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.event.type).toBe('general') // default value
      expect(data.event.isActive).toBe(true) // default value
      expect(data.event.description).toBeNull()
      expect(data.event.settings).toBeNull()
    })
  })

  describe('GET /api/events', () => {
    it('should return user events with counts', async () => {
      // Create some test events
      const event1Request = createMockRequest('POST', '/api/events', {
        name: 'Event 1',
        slug: 'event-1',
      })
      const event2Request = createMockRequest('POST', '/api/events', {
        name: 'Event 2',
        slug: 'event-2',
      })

      await POST(event1Request)
      await POST(event2Request)

      // Get events
      const getRequest = createMockRequest('GET', '/api/events')
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.events).toHaveLength(2)
      
      // Check that events are ordered by creation date (newest first)
      expect(data.events[0].name).toBe('Event 2')
      expect(data.events[1].name).toBe('Event 1')

      // Check that counts are included
      data.events.forEach((event: any) => {
        expect(event._count).toBeDefined()
        expect(event._count.prompts).toBe(0)
        expect(event._count.uploads).toBe(0)
      })
    })

    it('should return empty array for user with no events', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.events).toHaveLength(0)
    })

    it('should require authentication', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should only return events for authenticated user', async () => {
      // Create event for test user
      const eventRequest = createMockRequest('POST', '/api/events', {
        name: 'User 1 Event',
        slug: 'user-1-event',
      })
      await POST(eventRequest)

      // Create another user and their event
      const anotherUser = await createTestUser({
        id: 'test-user-2',
        name: 'Another User',
        email: 'another@test.com',
      })
      
      mockGetServerSession.mockResolvedValue(createMockSession(anotherUser.id))
      
      const anotherEventRequest = createMockRequest('POST', '/api/events', {
        name: 'User 2 Event',
        slug: 'user-2-event',
      })
      await POST(anotherEventRequest)

      // Get events for second user
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.events).toHaveLength(1)
      expect(data.events[0].name).toBe('User 2 Event')
      expect(data.events[0].userId).toBe(anotherUser.id)
    })
  })
})