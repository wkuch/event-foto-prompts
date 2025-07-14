'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Eye, Filter, Grid, List, Loader, RefreshCw, X } from 'lucide-react'

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
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
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
      const response = await fetch(upload.r2Url)
      if (!response.ok) throw new Error('Network response was not ok.')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `event-photo-${upload.id}.jpg`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download image:', err)
      if (upload.r2Url) {
        window.open(upload.r2Url, '_blank')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#27374D' }}>
        <div className="text-center p-8">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: '#DDE6ED' }} />
          <p className="font-light" style={{ color: '#DDE6ED' }}>Galerie wird geladen...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#27374D' }}>
        <div className="max-w-md w-full rounded-lg p-8 text-center" style={{ backgroundColor: '#526D82' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#9DB2BF' }}>
            <RefreshCw className="w-6 h-6" style={{ color: '#27374D' }}/>
          </div>
          <h2 className="text-lg font-light mb-3" style={{ color: '#DDE6ED' }}>
            Galerie konnte nicht geladen werden
          </h2>
          <p className="mb-6 font-light" style={{ color: '#9DB2BF' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium hover:opacity-90 transition-colors"
            style={{ borderColor: '#9DB2BF', color: '#DDE6ED' }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#27374D' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#526D82' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                href={`/event/${event?.slug}`}
                className="mr-4 p-2 rounded-md hover:bg-white/10 transition-colors"
                style={{ color: '#DDE6ED' }}
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-light tracking-wide" style={{ color: '#DDE6ED' }}>
                  {event?.name} Galerie
                </h1>
                <p className="text-sm font-light" style={{ color: '#9DB2BF' }}>
                  {filteredUploads.length} {filteredUploads.length === 1 ? 'Foto' : 'Fotos'}
                  {selectedPromptId !== 'all' && ' für diese Aufgabe'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex rounded-md border" style={{ borderColor: '#9DB2BF' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm font-medium rounded-l-md transition-colors ${viewMode === 'grid' ? '' : 'hover:bg-white/10'}`}
                  style={{ 
                    backgroundColor: viewMode === 'grid' ? '#9DB2BF' : 'transparent',
                    color: viewMode === 'grid' ? '#27374D' : '#DDE6ED'
                  }}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm font-medium rounded-r-md transition-colors border-l ${viewMode === 'list' ? '' : 'hover:bg-white/10'}`}
                  style={{ 
                    borderColor: '#9DB2BF',
                    backgroundColor: viewMode === 'list' ? '#9DB2BF' : 'transparent',
                    color: viewMode === 'list' ? '#27374D' : '#DDE6ED'
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
        <div className="border-b" style={{ backgroundColor: '#526D82', borderColor: '#27374D' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5" style={{ color: '#DDE6ED' }} />
              <select
                value={selectedPromptId}
                onChange={(e) => setSelectedPromptId(e.target.value)}
                className="border rounded-md shadow-sm focus:ring-1 focus:outline-none transition-colors font-medium"
                style={{ 
                  borderColor: '#9DB2BF', 
                  color: '#27374D',
                  backgroundColor: '#DDE6ED'
                }}
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
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#526D82' }}>
              <Eye className="w-10 h-10" style={{ color: '#DDE6ED' }} />
            </div>
            <h3 className="text-xl font-light mb-3" style={{ color: '#DDE6ED' }}>
              Noch keine Fotos
            </h3>
            <p className="mb-8 font-light" style={{ color: '#9DB2BF' }}>
              Fotos werden hier angezeigt, sobald Gäste sie hochladen
            </p>
            <Link
              href={`/event/${event?.slug}`}
              className="inline-flex items-center px-6 py-3 border rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
              style={{ borderColor: '#9DB2BF', color: '#DDE6ED' }}
            >
              Mit dem Hochladen von Fotos beginnen
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredUploads.map((upload) => (
              <div
                key={upload.id}
                className="rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer"
                style={{ backgroundColor: '#526D82' }}
                onClick={() => setSelectedImage(upload)}
              >
                <div className="aspect-square relative overflow-hidden" style={{ backgroundColor: '#27374D' }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: '#9DB2BF', borderTopColor: '#DDE6ED' }}></div>
                  </div>
                  <img
                    src={upload.r2Url}
                    alt={upload.caption || 'Event photo'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 relative z-10"
                    loading="lazy"
                    style={{ opacity: 0, transition: 'opacity 0.5s ease-in-out' }}
                    onLoad={(e) => (e.target as HTMLImageElement).style.opacity = '1'}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-90 transition-opacity duration-300" />
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm mb-1 truncate" style={{ color: '#9DB2BF' }}>{upload.prompt.text}</p>
                  {upload.caption && (
                    <p className="text-sm mb-2 line-clamp-2" style={{ color: '#DDE6ED' }}>{upload.caption}</p>
                  )}
                  <div className="flex justify-between items-center text-xs" style={{ color: '#9DB2BF' }}>
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
                className="rounded-lg shadow hover:shadow-md transition-shadow p-4 flex items-center space-x-6"
                style={{ backgroundColor: '#526D82' }}
              >
                <div className="w-24 h-24 rounded-md overflow-hidden relative flex-shrink-0" style={{ backgroundColor: '#27374D' }}>
                  <img
                    src={upload.r2Url}
                    alt={upload.caption || 'Event photo'}
                    className="w-full h-full object-cover cursor-pointer"
                    loading="lazy"
                    onClick={() => setSelectedImage(upload)}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate mb-1" style={{ color: '#9DB2BF' }}>{upload.prompt.text}</p>
                  {upload.caption && (
                    <p className="mb-2 truncate" style={{ color: '#DDE6ED' }}>{upload.caption}</p>
                  )}
                  <div className="flex justify-between items-center text-sm" style={{ color: '#9DB2BF' }}>
                    <span>Von {upload.uploaderName || 'Anonym'}</span>
                    <span>{formatDate(upload.createdAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => downloadImage(upload)}
                  className="p-2 rounded-md hover:bg-white/10 transition-colors"
                  style={{ color: '#DDE6ED' }}
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
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="max-w-4xl w-full rounded-lg overflow-hidden"
            style={{ backgroundColor: '#526D82' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative" style={{ backgroundColor: '#27374D' }}>
              <img
                src={selectedImage.r2Url}
                alt={selectedImage.caption || 'Event photo'}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-2 rounded-full transition-colors"
                style={{ backgroundColor: 'rgba(39, 55, 77, 0.7)', color: '#DDE6ED' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm mb-2" style={{ color: '#9DB2BF' }}>{selectedImage.prompt.text}</p>
              {selectedImage.caption && (
                <p className="mb-4" style={{ color: '#DDE6ED' }}>{selectedImage.caption}</p>
              )}
              <div className="flex justify-between items-center">
                <div className="text-sm" style={{ color: '#9DB2BF' }}>
                  <span>Von {selectedImage.uploaderName || 'Anonym'}</span>
                  <span className="mx-2">•</span>
                  <span>{formatDate(selectedImage.createdAt)}</span>
                </div>
                <button
                  onClick={() => downloadImage(selectedImage)}
                  className="inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium hover:opacity-90 transition-all"
                  style={{ backgroundColor: '#27374D', borderColor: '#9DB2BF', color: '#DDE6ED' }}
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
