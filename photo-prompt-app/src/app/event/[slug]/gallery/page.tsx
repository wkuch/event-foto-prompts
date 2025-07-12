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

export default function EventGalleryPage() {
  const params = useParams()
  const slug = params.slug as string
  
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
  }, [slug])

  useEffect(() => {
    if (selectedPromptId === 'all') {
      setFilteredUploads(uploads)
    } else {
      setFilteredUploads(uploads.filter(upload => upload.prompt.id === selectedPromptId))
    }
  }, [uploads, selectedPromptId])

  const fetchEventData = async () => {
    try {
      // For now, we'll create a minimal event object
      // In a real app, you'd fetch this from an endpoint
      setEvent({
        id: slug,
        name: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        slug,
        isActive: true
      })
    } catch (err) {
      setError('Failed to load event information')
    }
  }

  const fetchUploads = async () => {
    try {
      const response = await fetch(`/api/events/${slug}/uploads`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch uploads')
      }

      const data = await response.json()
      if (data.success) {
        setUploads(data.uploads)
      }
    } catch (err) {
      setError('Failed to load photos')
    }
  }

  const fetchPrompts = async () => {
    try {
      const response = await fetch(`/api/events/${slug}/prompts`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch prompts')
      }

      const data = await response.json()
      if (data.success) {
        setPrompts(data.prompts)
      }
    } catch (err) {
      console.warn('Failed to load prompts for filtering')
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
      const response = await fetch(upload.r2Url)
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
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Gallery
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                href={`/event/${slug}`}
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {event?.name} Gallery
                </h1>
                <p className="text-sm text-gray-600">
                  {filteredUploads.length} {filteredUploads.length === 1 ? 'photo' : 'photos'}
                  {selectedPromptId !== 'all' && ' for this prompt'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                    viewMode === 'grid'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                    viewMode === 'list'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
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
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedPromptId}
                onChange={(e) => setSelectedPromptId(e.target.value)}
                className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Prompts ({uploads.length})</option>
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
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <Eye className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No photos yet
            </h3>
            <p className="text-gray-600 mb-6">
              Photos will appear here as guests upload them
            </p>
            <Link
              href={`/event/${slug}`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Start Uploading Photos
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredUploads.map((upload) => (
              <div
                key={upload.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden group cursor-pointer"
                onClick={() => setSelectedImage(upload)}
              >
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={upload.r2Url}
                    alt={upload.caption || 'Event photo'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-1">{upload.prompt.text}</p>
                  {upload.caption && (
                    <p className="text-sm text-gray-900 mb-2 line-clamp-2">{upload.caption}</p>
                  )}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{upload.uploaderName || 'Anonymous'}</span>
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
                <img
                  src={upload.r2Url}
                  alt={upload.caption || 'Event photo'}
                  className="w-20 h-20 object-cover rounded-md cursor-pointer"
                  onClick={() => setSelectedImage(upload)}
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{upload.prompt.text}</p>
                  {upload.caption && (
                    <p className="text-gray-900 mb-2">{upload.caption}</p>
                  )}
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>By {upload.uploaderName || 'Anonymous'}</span>
                    <span>{formatDate(upload.createdAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => downloadImage(upload)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
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
            <div className="relative">
              <img
                src={selectedImage.r2Url}
                alt={selectedImage.caption || 'Event photo'}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-2">{selectedImage.prompt.text}</p>
              {selectedImage.caption && (
                <p className="text-gray-900 mb-4">{selectedImage.caption}</p>
              )}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  <span>By {selectedImage.uploaderName || 'Anonymous'}</span>
                  <span className="mx-2">•</span>
                  <span>{formatDate(selectedImage.createdAt)}</span>
                </div>
                <button
                  onClick={() => downloadImage(selectedImage)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}