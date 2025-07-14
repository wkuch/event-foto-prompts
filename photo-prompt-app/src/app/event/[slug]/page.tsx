'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Camera, Upload, CheckCircle, AlertCircle, Loader, RefreshCw } from 'lucide-react'

interface Prompt {
  id: string
  text: string
  order: number
  maxUploads?: number
  _count: { uploads: number }
}

interface Event {
  id: string
  name: string
  slug: string
  description?: string
  isActive: boolean
}

export default function EventPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [event, setEvent] = useState<Event | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploaderName, setUploaderName] = useState('')
  const [caption, setCaption] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchEventAndPrompt()
  }, [slug])

  const fetchEventAndPrompt = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // Get next available prompt
      const response = await fetch(`/api/events/${slug}/prompts?next=true`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Event not found')
        } else if (response.status === 403) {
          setError('This event is not currently active')
        } else {
          setError('Failed to load event')
        }
        return
      }

      const data = await response.json()
      
      if (data.success && data.prompt) {
        setCurrentPrompt(data.prompt)
        setEvent({
          id: data.prompt.eventId,
          name: slug, // We'll improve this later
          slug,
          isActive: true
        })
      } else {
        setError('No prompts available for this event')
      }
    } catch (err) {
      setError('Failed to connect to the event')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    setError('')
    
    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleUpload = async () => {
    if (!selectedFile || !currentPrompt) return

    setIsUploading(true)
    setError('')

    try {
      // Step 1: Get presigned URL
      const uploadUrlResponse = await fetch(`/api/events/${slug}/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          promptId: currentPrompt.id,
        }),
      })

      if (!uploadUrlResponse.ok) {
        const errorData = await uploadUrlResponse.json()
        throw new Error(errorData.error || 'Failed to prepare upload')
      }

      const { presignedUrl, publicUrl, fileName, r2Key } = await uploadUrlResponse.json()

      // Step 2: Upload to R2
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      // Step 3: Complete upload registration
      const completeResponse = await fetch(`/api/events/${slug}/upload-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          originalName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type,
          r2Key,
          r2Url: publicUrl,
          promptId: currentPrompt.id,
          caption: caption.trim() || undefined,
          uploaderName: uploaderName.trim() || undefined,
          uploaderInfo: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          },
        }),
      })

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json()
        throw new Error(errorData.error || 'Failed to save upload')
      }

      // Success!
      setUploadSuccess(true)
      setSelectedFile(null)
      setPreviewUrl(null)
      setCaption('')
      
      // Refresh prompt after a delay
      setTimeout(() => {
        setUploadSuccess(false)
        fetchEventAndPrompt()
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    )
  }

  if (error && !currentPrompt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Event
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchEventAndPrompt}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (uploadSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Photo Uploaded Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for sharing! Getting your next prompt...
          </p>
          <div className="w-8 h-8 mx-auto">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white text-center">
            <h1 className="text-2xl font-bold mb-2">📸 Photo Challenge</h1>
            <p className="text-blue-100">
              Help capture memories from this event!
            </p>
          </div>

          {/* Current Prompt */}
          {currentPrompt && (
            <div className="px-6 py-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                  <Camera className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Your Photo Prompt
                </h2>
                <div className="bg-blue-50 rounded-lg p-6 mb-6">
                  <p className="text-lg text-gray-800 font-medium">
                    {currentPrompt.text}
                  </p>
                </div>
                
                {currentPrompt.maxUploads && (
                  <p className="text-sm text-gray-500">
                    {currentPrompt._count.uploads} of {currentPrompt.maxUploads} photos uploaded for this prompt
                  </p>
                )}
                
                {/* Get New Prompt Button */}
                <button
                  onClick={fetchEventAndPrompt}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Get New Prompt
                </button>
              </div>

              {/* Upload Section */}
              <div className="space-y-6">
                {!selectedFile ? (
                  <div className="text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-6 py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Take or Select Photo
                    </button>
                    <p className="mt-2 text-xs text-gray-500">
                      JPG, PNG, WebP or GIF up to 10MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Image Preview */}
                    {previewUrl && (
                      <div className="relative">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                        <button
                          onClick={clearSelection}
                          className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    {/* Upload Form */}
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="uploaderName" className="block text-sm font-medium text-gray-700 mb-1">
                          Your Name (Optional)
                        </label>
                        <input
                          type="text"
                          id="uploaderName"
                          value={uploaderName}
                          onChange={(e) => setUploaderName(e.target.value)}
                          placeholder="Enter your name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-1">
                          Caption (Optional)
                        </label>
                        <textarea
                          id="caption"
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          placeholder="Add a caption to your photo..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                          <p className="text-sm text-red-600">{error}</p>
                        </div>
                      )}

                      <div className="flex space-x-3">
                        <button
                          onClick={clearSelection}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpload}
                          disabled={isUploading}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUploading ? (
                            <>
                              <Loader className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Photo
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Powered by Event Photo Prompts
          </p>
        </div>
      </div>
    </div>
  )
}