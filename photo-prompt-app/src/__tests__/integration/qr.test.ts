import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/events/[slug]/qr/route'
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

// Mock QRCode library
vi.mock('qrcode', () => ({
  toString: vi.fn().mockResolvedValue('<svg>mock-qr-svg</svg>'),
  toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-qr-png-data')),
}))

const mockGetServerSession = vi.mocked(getServerSession)

describe('QR Code API', () => {
  const testUser = testUsers.organizer
  const testEvent = {
    id: 'event-123',
    name: testEvents.wedding.name,
    slug: testEvents.wedding.slug,
    userId: testUser.id,
    isActive: true,
  }

  beforeEach(() => {
    mockGetServerSession.mockResolvedValue(createMockSession(testUser.id))
  })

  describe('GET /api/events/[slug]/qr', () => {
    it('should generate PNG QR code by default', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)

      const request = createMockRequest('GET', `/api/events/${testEvent.slug}/qr`)

      const response = await GET(request, { params: { slug: testEvent.slug } })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe('image/png')
      expect(response.headers.get('content-disposition')).toContain(`event-${testEvent.slug}-qr.png`)
      expect(response.headers.get('cache-control')).toBe('public, max-age=3600')
    })

    it('should generate SVG QR code when requested', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)

      const request = createMockRequest('GET', `/api/events/${testEvent.slug}/qr?format=svg`)

      const response = await GET(request, { params: { slug: testEvent.slug } })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe('image/svg+xml')
      expect(response.headers.get('content-disposition')).toContain(`event-${testEvent.slug}-qr.svg`)
    })

    it('should accept custom size parameter', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)

      const request = createMockRequest('GET', `/api/events/${testEvent.slug}/qr?size=400`)

      const response = await GET(request, { params: { slug: testEvent.slug } })

      expect(response.status).toBe(200)
      // QR code generation should be called with size 400
    })

    it('should reject invalid format parameter', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)

      const request = createMockRequest('GET', `/api/events/${testEvent.slug}/qr?format=invalid`)

      const response = await GET(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid format. Use png or svg.')
    })

    it('should reject invalid size parameter', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)

      const request = createMockRequest('GET', `/api/events/${testEvent.slug}/qr?size=2000`)

      const response = await GET(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid size. Must be between 50 and 1000 pixels.')
    })

    it('should reject access to non-existent event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null)

      const request = createMockRequest('GET', '/api/events/non-existent/qr')

      const response = await GET(request, { params: { slug: 'non-existent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Event not found')
    })

    it('should allow public access to active events', async () => {
      // No authentication
      mockGetServerSession.mockResolvedValue(null)
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)

      const request = createMockRequest('GET', `/api/events/${testEvent.slug}/qr`)

      const response = await GET(request, { params: { slug: testEvent.slug } })

      expect(response.status).toBe(200)
    })

    it('should reject public access to inactive events', async () => {
      // No authentication
      mockGetServerSession.mockResolvedValue(null)
      const inactiveEvent = { ...testEvent, isActive: false }
      mockPrisma.event.findUnique.mockResolvedValue(inactiveEvent)

      const request = createMockRequest('GET', `/api/events/${testEvent.slug}/qr`)

      const response = await GET(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Event is not active')
    })

    it('should allow owner access to inactive events', async () => {
      // Owner authenticated
      const inactiveEvent = { ...testEvent, isActive: false }
      mockPrisma.event.findUnique.mockResolvedValue(inactiveEvent)

      const request = createMockRequest('GET', `/api/events/${testEvent.slug}/qr`)

      const response = await GET(request, { params: { slug: testEvent.slug } })

      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/events/[slug]/qr', () => {
    it('should return QR code metadata for event owner', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)

      const request = createMockRequest('POST', `/api/events/${testEvent.slug}/qr`)

      const response = await POST(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.eventUrl).toBe(`http://localhost:3000/event/${testEvent.slug}`)
      expect(data.qrCodes.png.small).toBeDefined()
      expect(data.qrCodes.png.medium).toBeDefined()
      expect(data.qrCodes.png.large).toBeDefined()
      expect(data.qrCodes.svg.small).toBeDefined()
      expect(data.qrCodes.svg.medium).toBeDefined()
      expect(data.qrCodes.svg.large).toBeDefined()
    })

    it('should require authentication', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = createMockRequest('POST', `/api/events/${testEvent.slug}/qr`)

      const response = await POST(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should require event ownership', async () => {
      const anotherUsersEvent = { ...testEvent, userId: 'another-user' }
      mockPrisma.event.findUnique.mockResolvedValue(anotherUsersEvent)

      const request = createMockRequest('POST', `/api/events/${testEvent.slug}/qr`)

      const response = await POST(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    it('should reject access to non-existent event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null)

      const request = createMockRequest('POST', '/api/events/non-existent/qr')

      const response = await POST(request, { params: { slug: 'non-existent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Event not found')
    })
  })
})