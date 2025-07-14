'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Eye, Filter, Grid, List, Loader, RefreshCw } from 'lucide-react'

interface Upload {
  id: string
  r2Url: string
  caption?: string
  uploaderName?: string
  createdAt: string
  prompt: {
    id: string
    text: string
  }
}

interface Event {
  id: string
  name: string
  slug: string
  description?: string
  isActive: boolean
}

export default function GalleryPage() {
  const params = useParams()
  const uuid = params.uuid as string
  
  const [event, setEvent] = useState<Event | null>(null)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [filteredUploads, setFilteredUploads] = useState<Upload[]>([])
  const [prompts, setPrompts] = useState<any[]>([])
  const [selectedPromptId, setSelectedPromptId] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState<Upload | null>(null)

  useEffect(() => {
    fetchEventData()
    fetchUploads()
    fetchPrompts()
  }, [uuid])

  useEffect(() => {
    if (selectedPromptId === 'all') {
      setFilteredUploads(uploads)
    } else {
      setFilteredUploads(uploads.filter(upload => upload.prompt.id === selectedPromptId))
    }
  }, [uploads, selectedPromptId])

  const fetchEventData = async () => {
    try {
      const response = await fetch(`/api/galleries/${uuid}`)
      
      if (!response.ok) {
        throw new Error('Event nicht gefunden')
      }

      const data = await response.json()
      if (data.success) {
        setEvent(data.event)
      }
    } catch (err) {
      setError('Event-Informationen konnten nicht geladen werden')
    }
  }

  const fetchUploads = async () => {
    try {
      const response = await fetch(`/api/galleries/${uuid}/uploads`)
      
      if (!response.ok) {
        throw new Error('Uploads konnten nicht abgerufen werden')
      }

      const data = await response.json()
      if (data.success) {
        setUploads(data.uploads)
      }
    } catch (err) {
      setError('Fotos konnten nicht geladen werden')
    }
  }

  const fetchPrompts = async () => {
    try {
      const response = await fetch(`/api/galleries/${uuid}/prompts`)
      
      if (!response.ok) {
        throw new Error('Aufgaben konnten nicht abgerufen werden')
      }

      const data = await response.json()
      if (data.success) {
        setPrompts(data.prompts)
      }
    } catch (err) {
      console.warn('Aufgaben für Filter konnten nicht geladen werden')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const downloadImage = async (upload: Upload) => {
    try {
      if (!upload.r2Url) {
        console.error('No URL available for download')
        return
      }

      // Try direct download first
      const response = await fetch(upload.r2Url, {
        mode: 'cors'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${upload.uploaderName || 'photo'}-${upload.id}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Failed to download image:', err)
      // Fallback: try opening in new tab
      if (upload.r2Url) {
        window.open(upload.r2Url, '_blank')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFF9E5' }}>
        <div className="text-center bg-white rounded-lg p-8 shadow-sm border border-gray-100">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: '#4A9782' }} />
          <p className="font-light" style={{ color: '#004030' }}>Galerie wird geladen...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#FFF9E5' }}>
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center border border-gray-100">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#4A9782' }}>
            <RefreshCw className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-light mb-3" style={{ color: '#004030' }}>
            Galerie konnte nicht geladen werden
          </h2>
          <p className="text-gray-600 mb-6 font-light">{error}</p>
          <button
            onClick={() => window.location.reload()}
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFF9E5' }}>
      {/* Header */}
      <div className="shadow-sm" style={{ backgroundColor: '#004030' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-8">
            <div className="flex items-center">
              <Link
                href={`/event/${event?.slug}`}
                className="mr-4 p-2 rounded-md hover:bg-white/10 transition-colors"
                style={{ color: '#DCD0A8' }}
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-light text-white tracking-wide">
                  {event?.name} Galerie
                </h1>
                <p className="text-sm font-light" style={{ color: '#DCD0A8' }}>
                  {filteredUploads.length} {filteredUploads.length === 1 ? 'Foto' : 'Fotos'}
                  {selectedPromptId !== 'all' && ' für diese Aufgabe'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm font-medium rounded-l-md border transition-colors ${
                    viewMode === 'grid'
                      ? 'text-white border-white/30'
                      : 'border-white/20 hover:bg-white/10'
                  }`}
                  style={{ 
                    backgroundColor: viewMode === 'grid' ? '#4A9782' : 'transparent',
                    color: viewMode === 'grid' ? 'white' : '#DCD0A8'
                  }}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b transition-colors ${
                    viewMode === 'list'
                      ? 'text-white border-white/30'
                      : 'border-white/20 hover:bg-white/10'
                  }`}
                  style={{ 
                    backgroundColor: viewMode === 'list' ? '#4A9782' : 'transparent',
                    color: viewMode === 'list' ? 'white' : '#DCD0A8'
                  }}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {prompts.length > 0 && (
        <div className="border-b" style={{ backgroundColor: '#DCD0A8', borderColor: '#4A9782' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5" style={{ color: '#004030' }} />
              <select
                value={selectedPromptId}
                onChange={(e) => setSelectedPromptId(e.target.value)}
                className="border rounded-md shadow-sm focus:ring-1 focus:outline-none transition-colors font-medium"
                style={{ 
                  borderColor: '#4A9782', 
                  color: '#004030',
                  backgroundColor: 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = '#004030'}
                onBlur={(e) => e.target.style.borderColor = '#4A9782'}
              >
                <option value="all">Alle Aufgaben ({uploads.length})</option>
                {prompts.map((prompt) => {
                  const count = uploads.filter(u => u.prompt.id === prompt.id).length
                  return (
                    <option key={prompt.id} value={prompt.id}>
                      {prompt.text} ({count})
                    </option>
                  )
                })}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredUploads.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#4A9782' }}>
              <Eye className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-light mb-3" style={{ color: '#004030' }}>
              Noch keine Fotos
            </h3>
            <p className="text-gray-600 mb-8 font-light">
              Fotos werden hier angezeigt, sobald Gäste sie hochladen
            </p>
            <Link
              href={`/event/${event?.slug}`}
              className="inline-flex items-center px-6 py-3 border rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 transition-colors"
              style={{ borderColor: '#4A9782', color: '#4A9782' }}
            >
              Mit dem Hochladen von Fotos beginnen
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredUploads.map((upload) => (
              <div
                key={upload.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group cursor-pointer border border-gray-100"
                onClick={() => setSelectedImage(upload)}
              >
                <div className="aspect-square relative overflow-hidden" style={{ backgroundColor: '#FFF9E5' }}>
                  {/* Loading placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-t-2 rounded-full animate-spin" style={{ borderColor: '#DCD0A8', borderTopColor: '#4A9782' }}></div>
                  </div>
                  
                  <img
                    src={upload.r2Url}
                    alt={upload.caption || 'Event photo'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 relative z-10"
                    loading="lazy"
                    onLoad={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.opacity = '1'
                      // Hide loading spinner
                      const parent = target.parentElement
                      const spinner = parent?.querySelector('.animate-spin')?.parentElement
                      if (spinner) {
                        (spinner as HTMLElement).style.display = 'none'
                      }
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-200"><span class="text-gray-500 text-sm">Bild nicht verfügbar</span></div>'
                      }
                    }}
                    style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-90 transition-opacity duration-200" />
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-1">{upload.prompt.text}</p>
                  {upload.caption && (
                    <p className="text-sm text-gray-900 mb-2 line-clamp-2">{upload.caption}</p>
                  )}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{upload.uploaderName || 'Anonym'}</span>
                    <span>{formatDate(upload.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUploads.map((upload) => (
              <div
                key={upload.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 flex items-center space-x-6"
              >
                <div className="w-20 h-20 bg-gray-200 rounded-md overflow-hidden relative">
                  {/* Loading placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                  
                  <img
                    src={upload.r2Url}
                    alt={upload.caption || 'Event photo'}
                    className="w-full h-full object-cover cursor-pointer relative z-10"
                    loading="lazy"
                    onClick={() => setSelectedImage(upload)}
                    onLoad={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.opacity = '1'
                      // Hide loading spinner
                      const parent = target.parentElement
                      const spinner = parent?.querySelector('.animate-spin')?.parentElement
                      if (spinner) {
                        (spinner as HTMLElement).style.display = 'none'
                      }
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-200"><span class="text-gray-400 text-xs">Kein Bild</span></div>'
                      }
                    }}
                    style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{upload.prompt.text}</p>
                  {upload.caption && (
                    <p className="text-gray-900 mb-2">{upload.caption}</p>
                  )}
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Von {upload.uploaderName || 'Anonym'}</span>
                    <span>{formatDate(upload.createdAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => downloadImage(upload)}
                  className="p-2 rounded-md hover:bg-gray-50 transition-colors"
                  style={{ color: '#4A9782' }}
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="max-w-4xl w-full bg-white rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-gray-100">
              <img
                src={selectedImage.r2Url}
                alt={selectedImage.caption || 'Event photo'}
                className="w-full h-auto max-h-[70vh] object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.innerHTML = '<div class="w-full h-64 flex items-center justify-center bg-gray-200"><span class="text-gray-500">Bild nicht verfügbar</span></div>'
                  }
                }}
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-2 bg-white shadow-lg rounded-full hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" style={{ color: '#004030' }} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-2">{selectedImage.prompt.text}</p>
              {selectedImage.caption && (
                <p className="text-gray-900 mb-4">{selectedImage.caption}</p>
              )}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  <span>Von {selectedImage.uploaderName || 'Anonym'}</span>
                  <span className="mx-2">•</span>
                  <span>{formatDate(selectedImage.createdAt)}</span>
                </div>
                <button
                  onClick={() => downloadImage(selectedImage)}
                  className="inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-offset-1 transition-all"
                  style={{ backgroundColor: '#004030', borderColor: '#004030' }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Herunterladen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}