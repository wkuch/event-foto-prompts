import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, GET } from '@/app/api/events/route'
import { createMockRequest, createMockSession, createTestUser } from '../helpers/test-helpers'
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
    // Reset all mocks
    vi.clearAllMocks()
    
    // Set default session mock
    mockGetServerSession.mockResolvedValue(createMockSession(testUser.id))
  })

  describe('POST /api/events', () => {
    it('should create a new event with valid data', async () => {
      // Mock existing user (email already in system)
      mockPrisma.user.findUnique.mockResolvedValue(testUser)
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
      
      // Mock session creation for auto-login
      mockPrisma.session.create.mockResolvedValue({
        id: 'session-123',
        sessionToken: 'mock-token',
        userId: testUser.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })

      const request = createMockRequest('POST', '/api/events', testEvents.wedding)

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
      
      // Verify existing user was used (not created)
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: testEvents.wedding.email }
      })
      
      // Verify session was NOT created (security fix - no auto-login)
      expect(mockPrisma.session.create).not.toHaveBeenCalled()
      
      // Verify response indicates sign-in required
      expect(data.requiresSignIn).toBe(true)
      expect(data.userEmail).toBe(testUser.email)
    })

    it('should reject duplicate slugs', async () => {
      // Mock existing event with duplicate slug
      mockPrisma.event.findUnique.mockResolvedValue({ 
        id: 'existing', 
        slug: 'duplicate-slug',
        name: 'Existing Event',
        userId: 'other-user',
        type: 'wedding',
        isActive: true,
        description: null,
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const request = createMockRequest('POST', '/api/events', {
        name: 'Second Event',
        slug: 'duplicate-slug',
        type: 'birthday',
        email: 'test@example.com',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Slug already exists')
    })

    it('should validate required fields', async () => {
      const request = createMockRequest('POST', '/api/events', {
        slug: 'test-slug',
        // Missing required 'name' and 'email' fields
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details).toHaveLength(2)
      expect(data.details.some((d: any) => d.field === 'name')).toBe(true)
      expect(data.details.some((d: any) => d.field === 'email')).toBe(true)
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

    it('should create event without prior authentication and auto-login user', async () => {
      mockGetServerSession.mockResolvedValue(null)
      
      // Mock Prisma responses for user creation and event creation
      mockPrisma.user.findUnique.mockResolvedValue(null) // User doesn't exist
      const mockUser = {
        id: 'new-user-123',
        email: 'newuser@test.com',
        emailVerified: new Date(),
        name: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockPrisma.user.create.mockResolvedValue(mockUser)
      
      mockPrisma.event.findUnique.mockResolvedValue(null) // No existing event with slug
      const mockEvent = {
        id: 'event-123',
        name: 'Test Event',
        slug: 'test-slug',
        type: 'general',
        description: null,
        settings: null,
        userId: mockUser.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        prompts: [],
        _count: { uploads: 0 }
      }
      mockPrisma.event.create.mockResolvedValue(mockEvent)
      
      const mockSession = {
        id: 'session-123',
        sessionToken: 'mock-token',
        userId: mockUser.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }
      mockPrisma.session.create.mockResolvedValue(mockSession)

      const request = createMockRequest('POST', '/api/events', {
        name: 'Test Event',
        slug: 'test-slug',
        email: 'newuser@test.com',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.event.name).toBe('Test Event')
      expect(data.message).toContain('Please check your email for a sign-in link')
      expect(data.requiresSignIn).toBe(true)
      
      // Verify user was created
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'newuser@test.com',
          emailVerified: expect.any(Date),
        }
      })
      
      // Verify session was NOT created (security fix - no auto-login)
      expect(mockPrisma.session.create).not.toHaveBeenCalled()
    })

    it('should set default values correctly', async () => {
      // Mock user exists
      mockPrisma.user.findUnique.mockResolvedValue(testUser)
      mockPrisma.event.findUnique.mockResolvedValue(null) // No existing event with slug
      
      const mockEvent = {
        id: 'event-123',
        name: 'Minimal Event',
        slug: 'minimal-event',
        type: 'general', // default value
        description: null,
        settings: null,
        userId: testUser.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        prompts: [],
        _count: { uploads: 0 }
      }
      mockPrisma.event.create.mockResolvedValue(mockEvent)
      mockPrisma.session.create.mockResolvedValue({
        id: 'session-123',
        sessionToken: 'mock-token',
        userId: testUser.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })

      const request = createMockRequest('POST', '/api/events', {
        name: 'Minimal Event',
        slug: 'minimal-event',
        email: testUser.email,
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
      // Mock Prisma to return events for the user
      const mockEvents = [
        {
          id: 'event-2',
          name: 'Event 2',
          slug: 'event-2',
          type: 'general',
          userId: testUser.id,
          isActive: true,
          description: null,
          settings: null,
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02'),
          _count: { prompts: 0, uploads: 0 }
        },
        {
          id: 'event-1',
          name: 'Event 1',
          slug: 'event-1',
          type: 'general',
          userId: testUser.id,
          isActive: true,
          description: null,
          settings: null,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          _count: { prompts: 0, uploads: 0 }
        }
      ]
      mockPrisma.event.findMany.mockResolvedValue(mockEvents)

      // Get events
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
      // Mock Prisma to return empty array
      mockPrisma.event.findMany.mockResolvedValue([])

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
      // Create another user
      const anotherUser = {
        id: 'test-user-2',
        name: 'Another User',
        email: 'another@test.com',
      }
      
      // Mock session for the other user
      mockGetServerSession.mockResolvedValue(createMockSession(anotherUser.id))
      
      // Mock Prisma to return only events for the authenticated user
      const mockEvents = [
        {
          id: 'event-user-2',
          name: 'User 2 Event',
          slug: 'user-2-event',
          type: 'general',
          userId: anotherUser.id,
          isActive: true,
          description: null,
          settings: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { prompts: 0, uploads: 0 }
        }
      ]
      mockPrisma.event.findMany.mockResolvedValue(mockEvents)

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