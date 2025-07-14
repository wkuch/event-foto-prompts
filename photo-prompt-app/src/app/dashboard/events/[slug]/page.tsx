'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, QrCode, Eye, Image, Users, Clock, Settings, Plus, X, Trash2 } from 'lucide-react'

interface Event {
  id: string
  name: string
  slug: string
  description?: string
  type: string
  isActive: boolean
  createdAt: string
  prompts: Prompt[]
  uploads: Upload[]
  _count: {
    prompts: number
    uploads: number
  }
}

interface Prompt {
  id: string
  text: string
  order: number
  isActive: boolean
  maxUploads?: number
  _count: {
    uploads: number
  }
}

interface Upload {
  id: string
  r2Url: string
  caption?: string
  uploaderName?: string
  createdAt: string
  prompt?: {
    text: string
  }
}

export default function EventManagePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddPrompt, setShowAddPrompt] = useState(false)
  const [newPromptText, setNewPromptText] = useState('')
  const [isAddingPrompt, setIsAddingPrompt] = useState(false)

  useEffect(() => {
    fetchEventData()
  }, [slug])

  const fetchEventData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/events/${slug}`)
      
      if (response.status === 401) {
        router.push('/auth/signin')
        return
      }
      
      if (!response.ok) {
        throw new Error('Failed to load event')
      }
      
      const data = await response.json()
      setEvent(data.event)
    } catch (err) {
      setError('Failed to load event data')
    } finally {
      setIsLoading(false)
    }
  }

  const addPrompt = async () => {
    if (!newPromptText.trim()) return
    
    setIsAddingPrompt(true)
    try {
      const response = await fetch(`/api/events/${slug}/prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newPromptText.trim() })
      })
      
      if (!response.ok) {
        throw new Error('Failed to add prompt')
      }
      
      setNewPromptText('')
      setShowAddPrompt(false)
      await fetchEventData() // Refresh the data
    } catch (err) {
      setError('Failed to add prompt')
    } finally {
      setIsAddingPrompt(false)
    }
  }

  const deletePrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      return
    }
    
    try {
      const response = await fetch(`/api/events/${slug}/prompts/${promptId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete prompt')
      }
      
      await fetchEventData() // Refresh the data
    } catch (err) {
      setError('Failed to delete prompt')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Event not found'}
          </h2>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const totalUploads = event._count.uploads
  const activePrompts = event.prompts.filter(p => p.isActive).length
  const recentUploads = event.uploads

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              href="/dashboard"
              className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  {event.name}
                </h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  event.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {event.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Event management and statistics
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/event/${event.slug}/gallery`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Image className="w-4 h-4 mr-2" />
                Gallery
              </Link>
              <Link
                href={`/event/${event.slug}`}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Event
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Image className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Photos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalUploads}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Settings className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Prompts
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {activePrompts} of {event.prompts.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Event Type
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 capitalize">
                    {event.type}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Created
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Event Settings */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Event Settings</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event URL
                </label>
                <div className="flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    /event/
                  </span>
                  <input
                    type="text"
                    value={event.slug}
                    readOnly
                    className="flex-1 block w-full border-gray-300 rounded-none rounded-r-md bg-gray-50 text-gray-500 sm:text-sm"
                  />
                </div>
              </div>

              {event.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {event.description}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Event Status</h3>
                  <p className="text-sm text-gray-500">
                    {event.isActive ? 'Guests can upload photos' : 'Event is closed to new uploads'}
                  </p>
                </div>
                <button
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    event.isActive ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      event.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">QR Code</h2>
            </div>
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-32 h-32 bg-gray-100 rounded-lg mb-4">
                <QrCode className="w-16 h-16 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Share this QR code with guests to let them participate in your photo challenge.
              </p>
              <div className="space-y-2">
                <Link
                  href={`/api/events/${event.slug}/qr?format=png&download=true`}
                  className="block w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Download PNG
                </Link>
                <Link
                  href={`/api/events/${event.slug}/qr?format=svg&download=true`}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Download SVG
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Prompts Management */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Photo Prompts</h2>
            <button 
              onClick={() => setShowAddPrompt(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Prompt
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {event.prompts.map((prompt, index) => (
                <div key={prompt.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{prompt.text}</p>
                    <p className="text-xs text-gray-500">
                      {prompt._count.uploads} photos uploaded
                      {prompt.maxUploads && ` • Max: ${prompt.maxUploads}`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      prompt.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {prompt.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button 
                      onClick={() => deletePrompt(prompt.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Delete prompt"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Uploads */}
        {recentUploads.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Recent Uploads</h2>
              <Link
                href={`/event/${event.slug}/gallery`}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                View all →
              </Link>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {recentUploads.map((upload) => (
                  <div key={upload.id} className="relative">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                      {/* Loading placeholder */}
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                      
                      <img
                        src={upload.r2Url}
                        alt={upload.caption || 'Upload'}
                        className="w-full h-full object-cover relative z-10"
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
                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-200"><span class="text-gray-500 text-xs">No image</span></div>'
                          }
                        }}
                        style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                      />
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 truncate">
                        {upload.prompt?.text}
                      </p>
                      {upload.uploaderName && (
                        <p className="text-xs text-gray-500 truncate">
                          by {upload.uploaderName}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Prompt Modal */}
      {showAddPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Add New Prompt</h3>
              <button
                onClick={() => setShowAddPrompt(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label htmlFor="promptText" className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt Text
                </label>
                <textarea
                  id="promptText"
                  rows={3}
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="e.g., Take a photo with someone wearing blue"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddPrompt(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addPrompt}
                  disabled={!newPromptText.trim() || isAddingPrompt}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingPrompt ? 'Adding...' : 'Add Prompt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}