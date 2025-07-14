import { ListObjectsV2Command, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { r2, R2_BUCKET_NAME, R2_PUBLIC_URL } from './r2'

export async function testR2Connection() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      MaxKeys: 10,
    })
    
    const response = await r2.send(command)
    console.log('✅ R2 connection successful')
    console.log('Bucket:', R2_BUCKET_NAME)
    console.log('Public URL base:', R2_PUBLIC_URL)
    console.log('Objects found:', response.KeyCount || 0)
    
    if (response.Contents && response.Contents.length > 0) {
      console.log('Sample objects:')
      response.Contents.forEach((obj, i) => {
        if (i < 3) { // Show first 3 objects
          console.log(`  - ${obj.Key} (${obj.Size} bytes)`)
          const publicUrl = `${R2_PUBLIC_URL}/${obj.Key}`
          console.log(`    Public URL: ${publicUrl}`)
        }
      })
      
      // Test access to first object
      const firstObject = response.Contents[0]
      if (firstObject?.Key) {
        console.log('\n🔍 Testing object access...')
        try {
          const headCommand = new HeadObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: firstObject.Key
          })
          const headResponse = await r2.send(headCommand)
          console.log('✅ Object accessible via S3 API')
          console.log('Content-Type:', headResponse.ContentType)
          console.log('Content-Length:', headResponse.ContentLength)
        } catch (headError) {
          console.error('❌ Object not accessible via S3 API:', headError)
        }
      }
    }
    
    return true
  } catch (error) {
    console.error('❌ R2 connection failed:', error)
    return false
  }
}

export async function testPublicAccess(r2Key: string) {
  const publicUrl = `${R2_PUBLIC_URL}/${r2Key}`
  console.log('🌐 Testing public access to:', publicUrl)
  
  try {
    const response = await fetch(publicUrl, { method: 'HEAD' })
    console.log('Status:', response.status)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))
    return response.ok
  } catch (error) {
    console.error('Public access test failed:', error)
    return false
  }
}