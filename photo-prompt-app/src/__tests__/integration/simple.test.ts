import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/events/route'
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

describe('Simple API Test', () => {
  const testUser = testUsers.organizer
  
  beforeEach(() => {
    mockGetServerSession.mockResolvedValue(createMockSession(testUser.id))
  })

  it('should create an event successfully', async () => {
    // Mock Prisma responses - user exists
    mockPrisma.user.findUnique.mockResolvedValue(testUser)
    mockPrisma.event.findUnique.mockResolvedValue(null) // No existing event
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
    expect(data.event.name).toBe(testEvents.wedding.name)
    expect(mockPrisma.event.create).toHaveBeenCalled()
  })

  it('should create new user when email not found', async () => {
    mockGetServerSession.mockResolvedValue(null)
    
    // Mock user doesn't exist, will be created
    mockPrisma.user.findUnique.mockResolvedValue(null)
    const newUser = {
      id: 'new-user-123',
      email: 'newuser@test.com',
      emailVerified: new Date(),
      name: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockPrisma.user.create.mockResolvedValue(newUser)
    
    mockPrisma.event.findUnique.mockResolvedValue(null)
    const mockEvent = {
      id: 'event-123',
      name: 'Test Event',
      slug: 'test-event',
      type: 'general',
      description: null,
      settings: null,
      userId: newUser.id,
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
      userId: newUser.id,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })

    const request = createMockRequest('POST', '/api/events', {
      name: 'Test Event',
      slug: 'test-event',
      email: 'newuser@test.com',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(mockPrisma.user.create).toHaveBeenCalled()
  })
})