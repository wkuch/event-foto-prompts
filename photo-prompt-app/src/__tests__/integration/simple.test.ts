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
    // Mock Prisma responses
    mockPrisma.event.findUnique.mockResolvedValue(null) // No existing event
    const mockEvent = {
      id: 'event-123',
      name: testEvents.wedding.name,
      slug: testEvents.wedding.slug,
      type: testEvents.wedding.type,
      description: testEvents.wedding.description,
      userId: testUser.id,
      isActive: true,
      settings: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      prompts: [],
      _count: { uploads: 0 }
    }
    mockPrisma.event.create.mockResolvedValue(mockEvent)

    const request = createMockRequest('POST', '/api/events', {
      name: testEvents.wedding.name,
      slug: testEvents.wedding.slug,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.event.name).toBe(testEvents.wedding.name)
    expect(mockPrisma.event.create).toHaveBeenCalled()
  })

  it('should require authentication', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const request = createMockRequest('POST', '/api/events', {
      name: 'Test Event',
      slug: 'test-event',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })
})