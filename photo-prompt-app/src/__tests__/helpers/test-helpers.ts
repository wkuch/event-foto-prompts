import { prisma } from '@/lib/db'
import { testUsers, testEvents, testPrompts } from '../fixtures/test-data'
import type { User, Event, Prompt } from '@prisma/client'

// Create test user
export async function createTestUser(userData = testUsers.organizer): Promise<User> {
  return await prisma.user.create({
    data: userData
  })
}

// Create test event with owner
export async function createTestEvent(
  userId: string, 
  eventData = testEvents.wedding
): Promise<Event> {
  return await prisma.event.create({
    data: {
      ...eventData,
      userId,
    }
  })
}

// Create test prompts for an event
export async function createTestPrompts(eventId: string): Promise<Prompt[]> {
  const prompts = []
  for (const promptData of testPrompts) {
    const prompt = await prisma.prompt.create({
      data: {
        ...promptData,
        eventId,
      }
    })
    prompts.push(prompt)
  }
  return prompts
}

// Create complete test setup (user + event + prompts)
export async function createTestSetup() {
  const user = await createTestUser()
  const event = await createTestEvent(user.id)
  const prompts = await createTestPrompts(event.id)
  
  return { user, event, prompts }
}

// Mock Next.js request object
export function createMockRequest(
  method: string,
  url: string,
  body?: any,
  headers?: Record<string, string>
) {
  // Ensure URL is absolute for proper parsing
  const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`
  
  const mockHeaders = {
    'content-type': 'application/json',
    'user-agent': 'test-agent',
    ...headers,
  }
  
  return {
    method,
    url: fullUrl,
    headers: {
      ...mockHeaders,
      get: (key: string) => mockHeaders[key.toLowerCase()] || null,
    },
    json: async () => {
      // Ensure proper JSON serialization/deserialization for complex objects
      return body ? JSON.parse(JSON.stringify(body)) : body
    },
    formData: async () => {
      const formData = new FormData()
      if (body) {
        Object.entries(body).forEach(([key, value]) => {
          formData.append(key, value as string)
        })
      }
      return formData
    },
  } as any
}

// Mock NextAuth session
export function createMockSession(userId: string) {
  return {
    user: {
      id: userId,
      name: testUsers.organizer.name,
      email: testUsers.organizer.email,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

// Generate test file data
export function createTestFile(
  name = 'test.jpg',
  type = 'image/jpeg',
  size = 1024000
) {
  const buffer = Buffer.alloc(size, 'test-data')
  return new File([buffer], name, { type })
}