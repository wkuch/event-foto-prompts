import { mockClient } from 'aws-sdk-client-mock'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { beforeEach } from 'vitest'

// Create S3 mock client
export const s3Mock = mockClient(S3Client)

// Reset mocks before each test
beforeEach(() => {
  s3Mock.reset()
})

// Setup default successful S3 responses
export function setupSuccessfulS3Mocks() {
  s3Mock.on(PutObjectCommand).resolves({
    ETag: 'mock-etag-123',
    VersionId: 'mock-version-123',
  })
}

// Setup S3 error responses
export function setupS3ErrorMocks() {
  s3Mock.on(PutObjectCommand).rejects(new Error('S3 upload failed'))
}

// Generate mock presigned URL
export function generateMockPresignedUrl(key: string) {
  return `https://mock-bucket.r2.cloudflare.com/${key}?X-Amz-Signature=mock-signature`
}

// Generate mock public URL
export function generateMockPublicUrl(key: string) {
  return `https://mock-cdn.example.com/${key}`
}