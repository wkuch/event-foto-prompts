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
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="glass-card text-center">
          <div className="w-8 h-8 border-4 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-stone-700">Event wird geladen …</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-xl font-serif font-semibold text-stone-900 mb-2">{error || 'Event nicht gefunden'}</h2>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 bg-stone-900 text-white hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
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
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-5">
            <div className="flex items-center mb-4">
              <Link href="/dashboard" className="mr-3 p-2 rounded-md text-stone-500 hover:text-stone-800 hover:bg-white/70 ring-1 ring-transparent hover:ring-stone-200">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 truncate">{event.name}</h1>
                  <span className={`mt-1 sm:mt-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${event.isActive ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' : 'bg-stone-100 text-stone-700'}`}>{event.isActive ? 'Aktiv' : 'Inaktiv'}</span>
                </div>
                <p className="mt-1 text-sm text-stone-700">Verwaltung und Übersicht eures Hochzeits‑Events</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href={`/gallery/${event.id}`} className="inline-flex items-center justify-center rounded-xl px-3 py-2 ring-1 ring-stone-200 bg-white/80 text-stone-800 hover:bg-white">
                <Image className="w-4 h-4 mr-2" />
                Galerie
              </Link>
              <Link href={`/event/${event.slug}`} className="inline-flex items-center justify-center rounded-xl px-3 py-2 bg-stone-900 text-white hover:bg-stone-800">
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
          <div className="glass-card">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center">
                <Image className="h-5 w-5 text-stone-800" />
              </div>
              <div>
                <p className="text-xs text-stone-600">Fotos insgesamt</p>
                <p className="text-lg font-semibold text-stone-900">{totalUploads}</p>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center">
                <Settings className="h-5 w-5 text-stone-800" />
              </div>
              <div>
                <p className="text-xs text-stone-600">Aufgaben insgesamt</p>
                <p className="text-lg font-semibold text-stone-900">{event.prompts.length}</p>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-stone-800" />
              </div>
              <div>
                <p className="text-xs text-stone-600">Feier‑Art</p>
                <p className="text-lg font-semibold text-stone-900 capitalize">{event.type === 'wedding' ? 'Hochzeit' : event.type === 'engagement' ? 'Verlobung' : event.type === 'anniversary' ? 'Jahrestag' : event.type === 'rehearsal' ? 'Polterabend' : 'Andere Feier'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Event Settings */}
          <div className="glass-card p-0">
            <div className="px-6 py-4 border-b border-stone-200/70">
              <h2 className="text-lg font-semibold text-stone-900">Event‑Einstellungen</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-stone-800 mb-2">Event‑Link</label>
                <div className="flex items-center rounded-xl ring-1 ring-stone-200 bg-white/80 overflow-hidden">
                  <span className="inline-flex items-center px-3 text-stone-600 text-sm">/event/</span>
                  <input readOnly value={event.slug} className="flex-1 block w-full px-3 py-2 bg-transparent text-stone-700" />
                </div>
              </div>

              {event.description && (
                <div>
                  <label className="block text-sm font-medium text-stone-800 mb-2">Beschreibung</label>
                  <p className="text-sm text-stone-700 bg-white/70 ring-1 ring-stone-200 p-3 rounded-xl">{event.description}</p>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-white/70 ring-1 ring-stone-200 rounded-xl">
                <div>
                  <h3 className="text-sm font-medium text-stone-900">Status</h3>
                  <p className="text-sm text-stone-600">{event.isActive ? 'Gäste können Fotos hochladen' : 'Für neue Uploads geschlossen'}</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/events/${slug}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isActive: !event.isActive })
                      })
                      if (!res.ok) throw new Error('Update fehlgeschlagen')
                      const data = await res.json()
                      setEvent(prev => prev ? { ...prev, isActive: data.event.isActive } : prev)
                    } catch (e) {
                      setError('Status konnte nicht aktualisiert werden')
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${event.isActive ? 'bg-stone-900' : 'bg-stone-300'}`}
                  aria-pressed={event.isActive}
                  aria-label="Event-Status umschalten"
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${event.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="glass-card p-0 text-center">
            <div className="px-6 py-4 border-b border-stone-200/70 text-left">
              <h2 className="text-lg font-semibold text-stone-900">QR‑Code</h2>
            </div>
            <div className="p-6">
              <div className="inline-flex items-center justify-center w-32 h-32 bg-white/70 ring-1 ring-stone-200 rounded-2xl mb-4">
                <QrCode className="w-16 h-16 text-stone-600" />
              </div>
              <p className="text-sm text-stone-700 mb-4">Teilt diesen QR‑Code mit euren Gästen, um Foto‑Aufgaben und Uploads zu starten.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Link href={`/api/events/${event.slug}/qr?format=png&download=true`} className="rounded-xl px-4 py-2 bg-stone-900 text-white hover:bg-stone-800">PNG herunterladen</Link>
                <Link href={`/api/events/${event.slug}/qr?format=svg&download=true`} className="rounded-xl px-4 py-2 ring-1 ring-stone-200 bg-white/80 text-stone-800 hover:bg-white">SVG herunterladen</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Prompts Management */}
        <div className="mt-8 glass-card p-0">
          <div className="px-6 py-4 border-b border-stone-200/70">
            <h2 className="text-lg font-semibold text-stone-900">Foto‑Aufgaben</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {event.prompts.map((prompt, index) => (
                <div key={prompt.id} className="flex items-center gap-3 p-3 rounded-xl ring-1 ring-stone-200 bg-white/80">
                  <span className="flex-shrink-0 w-7 h-7 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center text-xs font-semibold">{index + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-900">{prompt.text}</p>
                    <p className="text-xs text-stone-600">{prompt._count.uploads} Fotos hochgeladen{prompt.maxUploads && ` • Max: ${prompt.maxUploads}`}</p>
                  </div>
                  <button onClick={() => deletePrompt(prompt.id)} className="p-1 text-stone-500 hover:text-rose-600" title="Aufgabe löschen">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Inline Add Prompt */}
              <div className="flex items-center gap-3 p-3 ring-1 ring-rose-200 bg-rose-50 rounded-xl">
                <span className="flex-shrink-0 w-7 h-7 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center text-xs font-semibold">{event.prompts.length + 1}</span>
                <div className="flex-1">
                  <textarea
                    value={newPromptText}
                    onChange={(e) => setNewPromptText(e.target.value)}
                    className="w-full px-3 py-2.5 leading-6 ring-1 ring-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white/80 resize-none text-sm"
                    placeholder="Zum Beispiel: Ein Foto mit jemandem, den ihr heute kennengelernt habt"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        addPrompt();
                      }
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={addPrompt} disabled={!newPromptText.trim() || isAddingPrompt} className="rounded-xl px-3 py-2 bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed">{isAddingPrompt ? 'Wird hinzugefügt …' : 'Hinzufügen'}</button>
                  {newPromptText.trim() && <button onClick={() => setNewPromptText('')} className="rounded-xl px-3 py-2 ring-1 ring-stone-200 bg-white/80 text-stone-800 hover:bg-white">Löschen</button>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Uploads */}
        {recentUploads.length > 0 && (
          <div className="mt-8 glass-card p-0">
            <div className="px-6 py-4 border-b border-stone-200/70 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Neueste Uploads</h2>
              <Link href={`/gallery/${event.id}`} className="text-sm text-rose-700 hover:text-rose-600">Alle anzeigen →</Link>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {recentUploads.map((upload) => (
                  <div key={upload.id} className="relative">
                    <div className="aspect-square bg-white/70 ring-1 ring-stone-200 rounded-2xl overflow-hidden relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin"></div>
                      </div>
                      <img
                        src={upload.r2Url}
                        alt={upload.caption || 'Upload'}
                        className="w-full h-full object-cover relative z-10"
                        loading="lazy"
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.opacity = '1'
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
                            parent.innerHTML = '<div class=\"w-full h-full flex items-center justify-center bg-stone-100\"><span class=\"text-stone-500 text-xs\">Kein Bild</span></div>'
                          }
                        }}
                        style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                      />
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-stone-700 truncate">{upload.prompt?.text}</p>
                      {upload.uploaderName && <p className="text-xs text-stone-500 truncate">von {upload.uploaderName}</p>}
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