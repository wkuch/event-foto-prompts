import { ListObjectsV2Command } from '@aws-sdk/client-s3'
import { r2, R2_BUCKET_NAME } from './r2'

export async function testR2Connection() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      MaxKeys: 1,
    })
    
    const response = await r2.send(command)
    console.log('✅ R2 connection successful')
    console.log('Bucket:', R2_BUCKET_NAME)
    console.log('Objects found:', response.KeyCount || 0)
    return true
  } catch (error) {
    console.error('❌ R2 connection failed:', error)
    return false
  }
}