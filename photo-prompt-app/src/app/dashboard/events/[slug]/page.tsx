'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, QrCode, Eye, Image, Users, Clock, Settings, X, Trash2 } from 'lucide-react'

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
        throw new Error('Event konnte nicht geladen werden')
      }
      
      const data = await response.json()
      setEvent(data.event)
    } catch (err) {
      setError('Event-Daten konnten nicht geladen werden')
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
        throw new Error('Aufgabe konnte nicht hinzugefügt werden')
      }
      
      const newPrompt = await response.json()
      
      // Add the new prompt to the existing state instead of refetching
      setEvent(prev => prev ? {
        ...prev,
        prompts: [...prev.prompts, {
          id: newPrompt.prompt.id,
          text: newPrompt.prompt.text,
          order: newPrompt.prompt.order,
          isActive: newPrompt.prompt.isActive,
          maxUploads: newPrompt.prompt.maxUploads,
          _count: { uploads: 0 }
        }],
        _count: {
          ...prev._count,
          prompts: prev._count.prompts + 1
        }
      } : null)
      
      setNewPromptText('')
    } catch (err) {
      setError('Aufgabe konnte nicht hinzugefügt werden')
    } finally {
      setIsAddingPrompt(false)
    }
  }

  const deletePrompt = async (promptId: string) => {
    if (!confirm('Bist du sicher, dass du diese Aufgabe löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return
    }
    
    try {
      const response = await fetch(`/api/events/${slug}/prompts/${promptId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Aufgabe konnte nicht gelöscht werden')
      }
      
      await fetchEventData() // Refresh the data
    } catch (err) {
      setError('Aufgabe konnte nicht gelöscht werden')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Event wird geladen...</p>
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
            Zurück zum Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const totalUploads = event._count.uploads
  const recentUploads = event.uploads

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center mb-4">
              <Link
                href="/dashboard"
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                    {event.name}
                  </h1>
                  <span className={`mt-1 sm:mt-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${
                    event.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {event.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  Hochzeits-Verwaltung und Statistiken
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Link
                href={`/gallery/${event.id}`}
                className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Image className="w-4 h-4 mr-2" />
                Galerie
              </Link>
              <Link
                href={`/event/${event.slug}`}
                className="inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-rose-600 hover:bg-rose-700"
              >
                <Eye className="w-4 h-4 mr-2" />
                Hochzeit anzeigen
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Image className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Fotos insgesamt
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
                    Aufgaben insgesamt
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {event.prompts.length}
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
                    Feier-Art
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 capitalize">
                    {event.type === 'wedding' ? 'Traumhochzeit' : 
                     event.type === 'engagement' ? 'Verlobung' :
                     event.type === 'anniversary' ? 'Hochzeitstag' :
                     event.type === 'rehearsal' ? 'Polterabend' :
                     'Andere Feier'}
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
              <h2 className="text-lg font-medium text-gray-900">Hochzeits-Einstellungen</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hochzeits-URL
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
                    Beschreibung
                  </label>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {event.description}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Hochzeits-Status</h3>
                  <p className="text-sm text-gray-500">
                    {event.isActive ? 'Gäste können Fotos hochladen' : 'Hochzeit ist für neue Uploads geschlossen'}
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
              <h2 className="text-lg font-medium text-gray-900">QR-Code</h2>
            </div>
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-32 h-32 bg-gray-100 rounded-lg mb-4">
                <QrCode className="w-16 h-16 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Teilt diesen QR-Code mit euren Gästen, damit sie an eurer Hochzeits-Foto-Challenge teilnehmen können.
              </p>
              <div className="space-y-2">
                <Link
                  href={`/api/events/${event.slug}/qr?format=png&download=true`}
                  className="block w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  PNG herunterladen
                </Link>
                <Link
                  href={`/api/events/${event.slug}/qr?format=svg&download=true`}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  SVG herunterladen
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Prompts Management */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Hochzeits-Fotomomente</h2>
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
                      {prompt._count.uploads} Fotos hochgeladen
                      {prompt.maxUploads && ` • Max: ${prompt.maxUploads}`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => deletePrompt(prompt.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Aufgabe löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Always visible inline Add Prompt Form */}
              <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {event.prompts.length + 1}
                </span>
                <div className="flex-1">
                  <textarea
                    value={newPromptText}
                    onChange={(e) => setNewPromptText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    placeholder="z.B. Mache ein Foto mit jemandem in Blau"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        addPrompt()
                      }
                    }}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={addPrompt}
                    disabled={!newPromptText.trim() || isAddingPrompt}
                    className="px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingPrompt ? 'Wird hinzugefügt...' : 'Hinzufügen'}
                  </button>
                  {newPromptText.trim() && (
                    <button
                      onClick={() => setNewPromptText('')}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Löschen
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Uploads */}
        {recentUploads.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Neueste Uploads</h2>
              <Link
                href={`/gallery/${event.id}`}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Alle anzeigen →
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
                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-200"><span class="text-gray-500 text-xs">Kein Bild</span></div>'
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
                          von {upload.uploaderName}
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

    </div>
  )
}