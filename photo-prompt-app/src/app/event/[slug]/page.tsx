'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Camera, Upload, CheckCircle, AlertCircle, Loader, RefreshCw, X } from 'lucide-react'

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
          setError('Event nicht gefunden')
        } else if (response.status === 403) {
          setError('Dieses Event ist derzeit nicht aktiv')
        } else {
          setError('Event konnte nicht geladen werden')
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
        setError('Keine Aufgaben für dieses Event verfügbar')
      }
    } catch (err) {
      setError('Verbindung zum Event fehlgeschlagen')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Bitte wähle eine Bilddatei aus')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('Dateigröße muss unter 10MB liegen')
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFF9E5' }}>
        <div className="text-center bg-white rounded-lg p-8 shadow-sm border border-gray-100">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: '#4A9782' }} />
          <p className="font-light" style={{ color: '#004030' }}>Event wird geladen...</p>
        </div>
      </div>
    )
  }

  if (error && !currentPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#FFF9E5' }}>
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center border border-gray-100">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#4A9782' }} />
          <h2 className="text-lg font-light mb-3" style={{ color: '#004030' }}>
            Event konnte nicht geladen werden
          </h2>
          <p className="text-gray-600 mb-6 font-light">{error}</p>
          <button
            onClick={fetchEventAndPrompt}
            className="inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 transition-colors"
            style={{ borderColor: '#4A9782', color: '#4A9782' }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  if (uploadSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#FFF9E5' }}>
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center border border-gray-100">
          <CheckCircle className="w-16 h-16 mx-auto mb-6" style={{ color: '#4A9782' }} />
          <h2 className="text-xl font-light mb-4" style={{ color: '#004030' }}>
            Foto erfolgreich hochgeladen
          </h2>
          <p className="text-gray-600 mb-6 font-light">
            Danke fürs Teilen dieses Moments
          </p>
          <p className="text-sm mb-6" style={{ color: '#4A9782' }}>
            Deine nächste Aufgabe wird geladen...
          </p>
          <div className="w-6 h-6 mx-auto">
            <Loader className="w-6 h-6 animate-spin" style={{ color: '#4A9782' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFF9E5' }}>
      <div className="w-full md:max-w-lg md:mx-auto px-0 md:px-6 py-0 md:py-8">
        <div className="bg-white md:rounded-lg shadow-sm overflow-hidden border-0 md:border border-gray-100 min-h-screen md:min-h-0">
          {/* Header */}
          <div className="px-6 md:px-8 py-8 md:py-12 text-center" style={{ backgroundColor: '#004030' }}>
            <h1 className="text-2xl font-light mb-3 text-white tracking-wide">
              Foto-Moment
            </h1>
            <p className="text-sm font-light" style={{ color: '#DCD0A8' }}>
              Teile deine Sicht auf dieses besondere Event
            </p>
          </div>

          {/* Current Prompt */}
          {currentPrompt && (
            <div className="px-4 md:px-6 py-6 md:py-8">
              <div className={`text-center ${selectedFile ? 'mb-6' : 'mb-10'}`}>
                <div className="w-12 h-12 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#4A9782' }}>
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-light mb-6" style={{ color: '#004030' }}>
                  Deine Foto-Aufgabe
                </h2>
                <div className="rounded-lg p-6 mb-8 border" style={{ backgroundColor: '#DCD0A8', borderColor: '#4A9782' }}>
                  <p className="text-lg font-medium leading-relaxed" style={{ color: '#004030' }}>
                    {currentPrompt.text}
                  </p>
                </div>
                
                {currentPrompt.maxUploads && (
                  <p className="text-sm text-gray-500">
                    {currentPrompt._count.uploads} von {currentPrompt.maxUploads} Fotos für diese Aufgabe hochgeladen
                  </p>
                )}
                
                {/* Get New Prompt Button - only show when no image is selected */}
                {!selectedFile && (
                  <button
                    onClick={fetchEventAndPrompt}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border rounded-md text-sm font-light hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ borderColor: '#4A9782', color: '#4A9782' }}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Neue Aufgabe holen
                  </button>
                )}
              </div>

              {/* Upload Section */}
              <div className="space-y-6">
                {!selectedFile ? (
                  <div className="text-center py-4 md:py-6">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-8 py-4 border-2 border-dashed rounded-lg font-semibold text-white hover:opacity-90 transition-all shadow-lg"
                      style={{ backgroundColor: '#004030', borderColor: '#4A9782' }}
                    >
                      <Camera className="w-5 h-5 mr-3" />
                      Foto auswählen
                    </button>
                    <p className="mt-3 text-sm font-light text-gray-500">
                      JPG, PNG, WebP oder GIF bis 10MB
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
                          className="w-full max-h-80 object-contain bg-gray-50 rounded-lg"
                        />
                        <button
                          onClick={clearSelection}
                          className="absolute top-2 right-2 p-2 bg-white shadow-lg rounded-full hover:bg-gray-50 transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    )}

                    {/* Upload Form */}
                    <div className="space-y-4 md:space-y-6">
                      <div>
                        <label htmlFor="uploaderName" className="block text-sm font-medium mb-2" style={{ color: '#004030' }}>
                          Dein Name (Optional)
                        </label>
                        <input
                          type="text"
                          id="uploaderName"
                          value={uploaderName}
                          onChange={(e) => setUploaderName(e.target.value)}
                          placeholder="Gib deinen Namen ein"
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:border-transparent transition-colors"
                          style={{ '--tw-ring-color': '#4A9782' } as any}
                          onFocus={(e) => e.target.style.borderColor = '#4A9782'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                      </div>

                      <div>
                        <label htmlFor="caption" className="block text-sm font-medium mb-2" style={{ color: '#004030' }}>
                          Bildunterschrift (Optional)
                        </label>
                        <textarea
                          id="caption"
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          placeholder="Erzähl die Geschichte hinter deinem Foto..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:border-transparent resize-none transition-colors"
                          style={{ '--tw-ring-color': '#4A9782' } as any}
                          onFocus={(e) => e.target.style.borderColor = '#4A9782'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                          <p className="text-sm text-red-600">{error}</p>
                        </div>
                      )}

                      <div className="flex space-x-3 pt-2">
                        <button
                          onClick={clearSelection}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-300 transition-colors"
                        >
                          Abbrechen
                        </button>
                        <button
                          onClick={handleUpload}
                          disabled={isUploading}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-white font-medium hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          style={{ backgroundColor: '#004030', '--tw-ring-color': '#004030' } as any}
                        >
                          {isUploading ? (
                            <>
                              <Loader className="w-4 h-4 mr-2 animate-spin" />
                              Wird hochgeladen...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Foto hochladen
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
          <p className="text-xs font-light text-gray-400">
            Powered by Event-Foto-Aufgaben
          </p>
        </div>
      </div>
    </div>
  )
}