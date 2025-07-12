import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as postUploadUrl } from '@/app/api/events/[slug]/upload-url/route'
import { POST as postUploadComplete } from '@/app/api/events/[slug]/upload-complete/route'
import { GET as getUploads } from '@/app/api/events/[slug]/uploads/route'
import { createMockRequest } from '../helpers/test-helpers'
import { mockPrisma } from '../helpers/mock-prisma'
import { setupSuccessfulS3Mocks, setupS3ErrorMocks } from '../helpers/mock-s3'
import { testEvents, testUploadMetadata } from '../fixtures/test-data'

// Import mock setup
import '../helpers/mock-prisma'
import '../helpers/mock-s3'

// Mock presigned URL generation
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://mock-presigned-url.com/test-key')
}))

describe('Upload Workflow', () => {
  const testEvent = {
    id: 'event-123',
    slug: testEvents.wedding.slug,
    isActive: true,
  }

  const testPrompt = {
    id: 'prompt-123',
    eventId: testEvent.id,
    isActive: true,
    maxUploads: 10,
    _count: { uploads: 3 }
  }

  beforeEach(() => {
    setupSuccessfulS3Mocks()
  })

  describe('POST /api/events/[slug]/upload-url', () => {
    it('should generate presigned URL for valid file', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)
      mockPrisma.prompt.findFirst.mockResolvedValue(testPrompt)

      const request = createMockRequest('POST', `/api/events/${testEvent.slug}/upload-url`, {
        fileName: testUploadMetadata.validFile.fileName,
        fileType: testUploadMetadata.validFile.mimeType,
        fileSize: testUploadMetadata.validFile.fileSize,
        promptId: testPrompt.id,
      })

      const response = await postUploadUrl(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.presignedUrl).toBeDefined()
      expect(data.publicUrl).toBeDefined()
      expect(data.fileName).toBeDefined()
      expect(data.r2Key).toBeDefined()
      expect(data.presignedUrl).toContain('mock-presigned-url.com')
    })

    it('should reject large files', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)

      const request = createMockRequest('POST', `/api/events/${testEvent.slug}/upload-url`, {
        fileName: testUploadMetadata.largeFile.fileName,
        fileType: testUploadMetadata.largeFile.mimeType,
        fileSize: testUploadMetadata.largeFile.fileSize,
      })

      const response = await postUploadUrl(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
    })

    it('should reject invalid file types', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)

      const request = createMockRequest('POST', `/api/events/${testEvent.slug}/upload-url`, {
        fileName: testUploadMetadata.invalidFile.fileName,
        fileType: testUploadMetadata.invalidFile.mimeType,
        fileSize: testUploadMetadata.invalidFile.fileSize,
      })

      const response = await postUploadUrl(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.')
    })

    it('should reject upload to prompt at max capacity', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)
      
      const fullPrompt = {
        ...testPrompt,
        maxUploads: 5,
        _count: { uploads: 5 } // Already at max
      }
      mockPrisma.prompt.findFirst.mockResolvedValue(fullPrompt)

      const request = createMockRequest('POST', `/api/events/${testEvent.slug}/upload-url`, {
        fileName: testUploadMetadata.validFile.fileName,
        fileType: testUploadMetadata.validFile.mimeType,
        fileSize: testUploadMetadata.validFile.fileSize,
        promptId: fullPrompt.id,
      })

      const response = await postUploadUrl(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('This prompt has reached its maximum number of uploads')
    })

    it('should reject upload to inactive event', async () => {
      const inactiveEvent = { ...testEvent, isActive: false }
      mockPrisma.event.findUnique.mockResolvedValue(inactiveEvent)

      const request = createMockRequest('POST', `/api/events/${testEvent.slug}/upload-url`, {
        fileName: testUploadMetadata.validFile.fileName,
        fileType: testUploadMetadata.validFile.mimeType,
        fileSize: testUploadMetadata.validFile.fileSize,
      })

      const response = await postUploadUrl(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Event is not active')
    })

    it('should handle upload without prompt ID', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)

      const request = createMockRequest('POST', `/api/events/${testEvent.slug}/upload-url`, {
        fileName: testUploadMetadata.validFile.fileName,
        fileType: testUploadMetadata.validFile.mimeType,
        fileSize: testUploadMetadata.validFile.fileSize,
        // No promptId provided
      })

      const response = await postUploadUrl(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.presignedUrl).toBeDefined()
    })
  })

  describe('POST /api/events/[slug]/upload-complete', () => {
    it('should complete upload successfully', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)
      
      const mockUpload = {
        id: 'upload-123',
        fileName: testUploadMetadata.validFile.fileName,
        originalName: testUploadMetadata.validFile.originalName,
        r2Url: 'https://cdn.example.com/test-photo.jpg',
        caption: testUploadMetadata.validFile.caption,
        uploaderName: testUploadMetadata.validFile.uploaderName,
        createdAt: new Date(),
      }
      mockPrisma.upload.create.mockResolvedValue(mockUpload)

      const request = createMockRequest('POST', `/api/events/${testEvent.slug}/upload-complete`, {
        fileName: testUploadMetadata.validFile.fileName,
        originalName: testUploadMetadata.validFile.originalName,
        fileSize: testUploadMetadata.validFile.fileSize,
        mimeType: testUploadMetadata.validFile.mimeType,
        r2Key: 'events/test-event/uploads/test-photo.jpg',
        r2Url: 'https://cdn.example.com/test-photo.jpg',
        caption: testUploadMetadata.validFile.caption,
        uploaderName: testUploadMetadata.validFile.uploaderName,
        uploaderInfo: testUploadMetadata.validFile.uploaderInfo,
      })

      const response = await postUploadComplete(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.upload.fileName).toBe(testUploadMetadata.validFile.fileName)
      expect(data.upload.caption).toBe(testUploadMetadata.validFile.caption)
      expect(mockPrisma.upload.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventId: testEvent.id,
          fileName: testUploadMetadata.validFile.fileName,
          originalName: testUploadMetadata.validFile.originalName,
          fileSize: testUploadMetadata.validFile.fileSize,
          mimeType: testUploadMetadata.validFile.mimeType,
          caption: testUploadMetadata.validFile.caption,
          uploaderName: testUploadMetadata.validFile.uploaderName,
        })
      })
    })

    it('should validate required fields', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)

      const request = createMockRequest('POST', `/api/events/${testEvent.slug}/upload-complete`, {
        fileName: testUploadMetadata.validFile.fileName,
        // Missing required fields like originalName, fileSize, etc.
      })

      const response = await postUploadComplete(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details.length).toBeGreaterThan(0)
    })

    it('should reject completion for inactive event', async () => {
      const inactiveEvent = { ...testEvent, isActive: false }
      mockPrisma.event.findUnique.mockResolvedValue(inactiveEvent)

      const request = createMockRequest('POST', `/api/events/${testEvent.slug}/upload-complete`, {
        fileName: testUploadMetadata.validFile.fileName,
        originalName: testUploadMetadata.validFile.originalName,
        fileSize: testUploadMetadata.validFile.fileSize,
        mimeType: testUploadMetadata.validFile.mimeType,
        r2Key: 'test-key',
        r2Url: 'https://test.com/file.jpg',
      })

      const response = await postUploadComplete(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Event is not active')
    })
  })

  describe('GET /api/events/[slug]/uploads', () => {
    it('should return uploads for an event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)
      
      const mockUploads = [
        {
          id: 'upload-1',
          r2Url: 'https://cdn.example.com/photo1.jpg',
          caption: 'Beautiful moment',
          uploaderName: 'John Doe',
          createdAt: new Date(),
          prompt: {
            id: 'prompt-1',
            text: 'Take a photo with someone in your favorite color'
          }
        },
        {
          id: 'upload-2',
          r2Url: 'https://cdn.example.com/photo2.jpg',
          caption: 'Fun times',
          uploaderName: 'Jane Smith',
          createdAt: new Date(),
          prompt: {
            id: 'prompt-2',
            text: 'Capture a candid moment of laughter'
          }
        }
      ]
      mockPrisma.upload.findMany.mockResolvedValue(mockUploads)
      mockPrisma.upload.count.mockResolvedValue(2)

      const request = createMockRequest('GET', `/api/events/${testEvent.slug}/uploads`)

      const response = await getUploads(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.uploads).toHaveLength(2)
      expect(data.uploads[0].url).toBe('https://cdn.example.com/photo1.jpg')
      expect(data.uploads[0].prompt.text).toBe('Take a photo with someone in your favorite color')
      expect(data.pagination.total).toBe(2)
      expect(data.pagination.hasMore).toBe(false)
    })

    it('should filter uploads by prompt ID', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)
      
      const mockUploads = [
        {
          id: 'upload-1',
          r2Url: 'https://cdn.example.com/photo1.jpg',
          caption: 'Beautiful moment',
          uploaderName: 'John Doe',
          createdAt: new Date(),
          prompt: {
            id: 'prompt-1',
            text: 'Take a photo with someone in your favorite color'
          }
        }
      ]
      mockPrisma.upload.findMany.mockResolvedValue(mockUploads)
      mockPrisma.upload.count.mockResolvedValue(1)

      const request = createMockRequest('GET', `/api/events/${testEvent.slug}/uploads?promptId=prompt-1`)

      const response = await getUploads(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.uploads).toHaveLength(1)
      expect(mockPrisma.upload.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            promptId: 'prompt-1'
          })
        })
      )
    })

    it('should handle pagination correctly', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)
      mockPrisma.upload.findMany.mockResolvedValue([])
      mockPrisma.upload.count.mockResolvedValue(100)

      const request = createMockRequest('GET', `/api/events/${testEvent.slug}/uploads?limit=10&offset=20`)

      const response = await getUploads(request, { params: { slug: testEvent.slug } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.limit).toBe(10)
      expect(data.pagination.offset).toBe(20)
      expect(data.pagination.total).toBe(100)
      expect(data.pagination.hasMore).toBe(true)
      expect(mockPrisma.upload.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20
        })
      )
    })

    it('should reject access to non-existent event', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null)

      const request = createMockRequest('GET', '/api/events/non-existent/uploads')

      const response = await getUploads(request, { params: { slug: 'non-existent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Event not found')
    })
  })
})