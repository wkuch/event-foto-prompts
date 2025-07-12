import { beforeEach } from 'vitest'
import { resetMockPrisma } from './helpers/mock-prisma'

// Reset mocks before each test
beforeEach(() => {
  resetMockPrisma()
})