import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as createEvent } from '@/app/api/events/route'
import { POST as createPrompt, GET as getPrompts } from '@/app/api/events/[slug]/prompts/route'
import { POST as generateUploadUrl } from '@/app/api/events/[slug]/upload-url/route'
import { POST as completeUpload } from '@/app/api/events/[slug]/upload-complete/route'
import { GET as getUploads } from '@/app/api/events/[slug]/uploads/route'
import { GET as generateQR } from '@/app/api/events/[slug]/qr/route'
import { createMockRequest, createMockSession } from '../helpers/test-helpers'
import { mockPrisma } from '../helpers/mock-prisma'
import { setupSuccessfulS3Mocks } from '../helpers/mock-s3'
import { testEvents, testUsers, testPrompts, testUploadMetadata } from '../fixtures/test-data'
import { getServerSession } from 'next-auth'

// Import mock setup
import '../helpers/mock-prisma'
import '../helpers/mock-s3'

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock QRCode library
vi.mock('qrcode', () => ({
  toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-qr-png-data')),
}))

// Mock presigned URL generation
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://mock-presigned-url.com/test-key')
}))

const mockGetServerSession = vi.mocked(getServerSession)

describe('Complete Event Workflow', () => {
  const testUser = testUsers.organizer
  let eventId: string
  let eventSlug: string
  let promptIds: string[]

  beforeEach(() => {
    mockGetServerSession.mockResolvedValue(createMockSession(testUser.id))
    setupSuccessfulS3Mocks()
    
    // Mock environment variables
    vi.stubEnv('R2_PUBLIC_URL', 'https://cdn.example.com')
    vi.stubEnv('R2_BUCKET_NAME', 'test-bucket')
    vi.stubEnv('R2_ENDPOINT', 'https://test.r2.cloudflarestorage.com')
    vi.stubEnv('R2_ACCESS_KEY_ID', 'test-key-id')
    vi.stubEnv('R2_SECRET_ACCESS_KEY', 'test-secret-key')
    
    // Reset for each test
    eventId = 'event-123'
    eventSlug = testEvents.wedding.slug
    promptIds = ['prompt-1', 'prompt-2', 'prompt-3']
  })

  describe('Organizer Workflow: Event Setup', () => {
    it('should complete full organizer setup workflow', async () => {
      // Step 1: Create Event (with user auto-creation)
      mockPrisma.user.findUnique.mockResolvedValue(testUser) // User exists
      mockPrisma.event.findUnique.mockResolvedValue(null) // No existing event
      
      const mockEvent = {
        id: eventId,
        name: testEvents.wedding.name,
        slug: eventSlug,
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

      const createEventRequest = createMockRequest('POST', '/api/events', testEvents.wedding)

      const createEventResponse = await createEvent(createEventRequest)
      const eventData = await createEventResponse.json()

      expect(createEventResponse.status).toBe(201)
      expect(eventData.success).toBe(true)
      expect(eventData.event.slug).toBe(eventSlug)

      // Step 2: Add Prompts
      const testEvent = {
        id: eventId,
        slug: eventSlug,
        userId: testUser.id,
        isActive: true,
      }
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)

      for (let i = 0; i < testPrompts.length; i++) {
        const promptData = testPrompts[i]
        
        // Mock last prompt order for auto-increment
        mockPrisma.prompt.findFirst.mockResolvedValue(i === 0 ? null : { order: i - 1 })
        
        const mockPrompt = {
          id: promptIds[i],
          text: promptData.text,
          order: i,
          maxUploads: promptData.maxUploads,
          eventId: testEvent.id,
          isActive: true,
          settings: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        mockPrisma.prompt.create.mockResolvedValue(mockPrompt)

        const createPromptRequest = createMockRequest('POST', `/api/events/${eventSlug}/prompts`, {
          text: promptData.text,
          maxUploads: promptData.maxUploads,
        })

        const createPromptResponse = await createPrompt(createPromptRequest, { params: { slug: eventSlug } })
        const promptResponseData = await createPromptResponse.json()

        expect(createPromptResponse.status).toBe(201)
        expect(promptResponseData.success).toBe(true)
        expect(promptResponseData.prompt.text).toBe(promptData.text)
        expect(promptResponseData.prompt.order).toBe(i)
      }

      // Step 3: Generate QR Code
      const qrRequest = createMockRequest('GET', `/api/events/${eventSlug}/qr`)
      const qrResponse = await generateQR(qrRequest, { params: { slug: eventSlug } })

      expect(qrResponse.status).toBe(200)
      expect(qrResponse.headers.get('content-type')).toBe('image/png')

      console.log('✅ Organizer workflow completed: Event created, prompts added, QR generated')
    })
  })

  describe('Guest Workflow: Photo Upload Journey', () => {
    it('should complete full guest upload workflow', async () => {
      const testEvent = {
        id: eventId,
        slug: eventSlug,
        isActive: true,
      }

      const availablePrompt = {
        id: promptIds[0],
        text: testPrompts[0].text,
        order: 0,
        isActive: true,
        eventId: testEvent.id,
        maxUploads: testPrompts[0].maxUploads,
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { uploads: 3 }
      }

      // Step 1: Guest gets next available prompt
      mockPrisma.event.findUnique.mockResolvedValue(testEvent)
      mockPrisma.prompt.findFirst.mockResolvedValue(availablePrompt)

      const getPromptRequest = createMockRequest('GET', `/api/events/${eventSlug}/prompts?next=true`)
      const getPromptResponse = await getPrompts(getPromptRequest, { params: { slug: eventSlug } })
      const promptData = await getPromptResponse.json()

      expect(getPromptResponse.status).toBe(200)
      expect(promptData.success).toBe(true)
      expect(promptData.prompt.text).toBe(testPrompts[0].text)

      // Step 2: Guest requests upload URL
      mockPrisma.prompt.findFirst.mockResolvedValue(availablePrompt)

      const uploadUrlRequest = createMockRequest('POST', `/api/events/${eventSlug}/upload-url`, {
        fileName: testUploadMetadata.validFile.fileName,
        fileType: testUploadMetadata.validFile.mimeType,
        fileSize: testUploadMetadata.validFile.fileSize,
        promptId: availablePrompt.id,
      })

      const uploadUrlResponse = await generateUploadUrl(uploadUrlRequest, { params: { slug: eventSlug } })
      const uploadUrlData = await uploadUrlResponse.json()

      expect(uploadUrlResponse.status).toBe(200)
      expect(uploadUrlData.success).toBe(true)
      expect(uploadUrlData.presignedUrl).toBeDefined()
      expect(uploadUrlData.publicUrl).toBeDefined()

      // Step 3: Guest completes upload (after uploading to S3)
      const mockUpload = {
        id: 'upload-123',
        fileName: uploadUrlData.fileName,
        originalName: testUploadMetadata.validFile.originalName,
        r2Url: uploadUrlData.publicUrl,
        caption: testUploadMetadata.validFile.caption,
        uploaderName: testUploadMetadata.validFile.uploaderName,
        createdAt: new Date(),
      }
      mockPrisma.upload.create.mockResolvedValue(mockUpload)

      const completeUploadRequest = createMockRequest('POST', `/api/events/${eventSlug}/upload-complete`, {
        fileName: uploadUrlData.fileName,
        originalName: testUploadMetadata.validFile.originalName,
        fileSize: testUploadMetadata.validFile.fileSize,
        mimeType: testUploadMetadata.validFile.mimeType,
        r2Key: uploadUrlData.r2Key,
        r2Url: uploadUrlData.publicUrl,
        promptId: availablePrompt.id,
        caption: testUploadMetadata.validFile.caption,
        uploaderName: testUploadMetadata.validFile.uploaderName,
        uploaderInfo: testUploadMetadata.validFile.uploaderInfo,
      })

      const completeUploadResponse = await completeUpload(completeUploadRequest, { params: { slug: eventSlug } })
      const uploadData = await completeUploadResponse.json()

      expect(completeUploadResponse.status).toBe(201)
      expect(uploadData.success).toBe(true)
      expect(uploadData.upload.fileName).toBe(uploadUrlData.fileName)
      expect(uploadData.upload.caption).toBe(testUploadMetadata.validFile.caption)

      console.log('✅ Guest workflow completed: Got prompt, uploaded photo, completed upload')
    })
  })

  describe('Multi-Guest Scenario', () => {
    it('should handle multiple guests uploading photos simultaneously', async () => {
      const testEvent = {
        id: eventId,
        slug: eventSlug,
        isActive: true,
      }

      const availablePrompts = [
        {
          id: promptIds[0],
          text: testPrompts[0].text,
          order: 0,
          isActive: true,
          eventId: testEvent.id,
          maxUploads: 10,
          settings: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { uploads: 2 }
        },
        {
          id: promptIds[1],
          text: testPrompts[1].text,
          order: 1,
          isActive: true,
          eventId: testEvent.id,
          maxUploads: 5,
          settings: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { uploads: 4 }
        }
      ]

      mockPrisma.event.findUnique.mockResolvedValue(testEvent)

      // Guest 1: Gets first prompt
      mockPrisma.prompt.findFirst.mockResolvedValueOnce(availablePrompts[0])
      mockPrisma.prompt.findFirst.mockResolvedValue(availablePrompts[0])

      const guest1PromptRequest = createMockRequest('GET', `/api/events/${eventSlug}/prompts?next=true`)
      const guest1PromptResponse = await getPrompts(guest1PromptRequest, { params: { slug: eventSlug } })
      const guest1PromptData = await guest1PromptResponse.json()

      expect(guest1PromptResponse.status).toBe(200)
      expect(guest1PromptData.prompt.text).toBe(testPrompts[0].text)

      const guest1UploadRequest = createMockRequest('POST', `/api/events/${eventSlug}/upload-url`, {
        fileName: 'guest1-photo.jpg',
        fileType: 'image/jpeg',
        fileSize: 1000000,
        promptId: availablePrompts[0].id,
      })

      const guest1UploadResponse = await generateUploadUrl(guest1UploadRequest, { params: { slug: eventSlug } })
      expect(guest1UploadResponse.status).toBe(200)

      // Guest 2: Gets second prompt (first one still has capacity)
      mockPrisma.prompt.findFirst.mockResolvedValue(availablePrompts[0])

      const guest2PromptRequest = createMockRequest('GET', `/api/events/${eventSlug}/prompts?next=true`)
      const guest2PromptResponse = await getPrompts(guest2PromptRequest, { params: { slug: eventSlug } })
      const guest2PromptData = await guest2PromptResponse.json()

      expect(guest2PromptResponse.status).toBe(200)
      expect(guest2PromptData.prompt.text).toBe(testPrompts[0].text) // Same prompt, has capacity

      console.log('✅ Multi-guest scenario: Both guests got prompts and can upload')
    })
  })

  describe('Organizer Gallery View', () => {
    it('should allow organizer to view all uploaded photos', async () => {
      const testEvent = {
        id: eventId,
        slug: eventSlug,
        isActive: true,
      }

      const mockUploads = [
        {
          id: 'upload-1',
          r2Url: 'https://cdn.example.com/photo1.jpg',
          caption: 'Beautiful moment',
          uploaderName: 'John Doe',
          createdAt: new Date(),
          prompt: {
            id: promptIds[0],
            text: testPrompts[0].text
          }
        },
        {
          id: 'upload-2',
          r2Url: 'https://cdn.example.com/photo2.jpg',
          caption: 'Fun times',
          uploaderName: 'Jane Smith',
          createdAt: new Date(),
          prompt: {
            id: promptIds[1],
            text: testPrompts[1].text
          }
        },
        {
          id: 'upload-3',
          r2Url: 'https://cdn.example.com/photo3.jpg',
          caption: 'Great memories',
          uploaderName: 'Bob Wilson',
          createdAt: new Date(),
          prompt: {
            id: promptIds[0],
            text: testPrompts[0].text
          }
        }
      ]

      mockPrisma.event.findUnique.mockResolvedValue(testEvent)
      mockPrisma.upload.findMany.mockResolvedValue(mockUploads)
      mockPrisma.upload.count.mockResolvedValue(3)

      const getUploadsRequest = createMockRequest('GET', `/api/events/${eventSlug}/uploads`)
      const getUploadsResponse = await getUploads(getUploadsRequest, { params: { slug: eventSlug } })
      const uploadsData = await getUploadsResponse.json()

      expect(getUploadsResponse.status).toBe(200)
      expect(uploadsData.success).toBe(true)
      expect(uploadsData.uploads).toHaveLength(3)
      expect(uploadsData.pagination.total).toBe(3)
      
      // Check that photos are linked to correct prompts
      const prompt1Photos = uploadsData.uploads.filter((u: any) => u.prompt.id === promptIds[0])
      const prompt2Photos = uploadsData.uploads.filter((u: any) => u.prompt.id === promptIds[1])
      
      expect(prompt1Photos).toHaveLength(2)
      expect(prompt2Photos).toHaveLength(1)

      console.log('✅ Organizer gallery: Can view all photos grouped by prompts')
    })
  })

  describe('Error Scenarios', () => {
    it('should handle prompt capacity limits gracefully', async () => {
      const testEvent = {
        id: eventId,
        slug: eventSlug,
        isActive: true,
      }

      // Prompt at maximum capacity
      const fullPrompt = {
        id: promptIds[0],
        eventId: testEvent.id,
        isActive: true,
        maxUploads: 3,
        _count: { uploads: 3 } // Already at max
      }

      mockPrisma.event.findUnique.mockResolvedValue(testEvent)
      mockPrisma.prompt.findFirst.mockResolvedValue(fullPrompt)

      const uploadUrlRequest = createMockRequest('POST', `/api/events/${eventSlug}/upload-url`, {
        fileName: testUploadMetadata.validFile.fileName,
        fileType: testUploadMetadata.validFile.mimeType,
        fileSize: testUploadMetadata.validFile.fileSize,
        promptId: fullPrompt.id,
      })

      const uploadUrlResponse = await generateUploadUrl(uploadUrlRequest, { params: { slug: eventSlug } })
      const data = await uploadUrlResponse.json()

      expect(uploadUrlResponse.status).toBe(409)
      expect(data.error).toBe('This prompt has reached its maximum number of uploads')

      console.log('✅ Error handling: Prompt capacity limits enforced')
    })

    it('should handle inactive event access correctly', async () => {
      const inactiveEvent = {
        id: eventId,
        slug: eventSlug,
        isActive: false,
      }

      mockPrisma.event.findUnique.mockResolvedValue(inactiveEvent)

      const getPromptRequest = createMockRequest('GET', `/api/events/${eventSlug}/prompts?next=true`)
      const getPromptResponse = await getPrompts(getPromptRequest, { params: { slug: eventSlug } })
      const data = await getPromptResponse.json()

      expect(getPromptResponse.status).toBe(403)
      expect(data.error).toBe('Event is not active')

      console.log('✅ Error handling: Inactive event access blocked')
    })
  })
})