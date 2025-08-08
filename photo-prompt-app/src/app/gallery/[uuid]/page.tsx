'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  Eye,
  Filter,
  Grid,
  List,
  Loader,
  RefreshCw,
  X,
  Sparkles,
  Heart,
} from 'lucide-react'

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
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
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
      setFilteredUploads(
        uploads.filter((upload) => upload.prompt.id === selectedPromptId)
      )
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

  useEffect(() => {
    const updateIsMobile = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640)
    updateIsMobile()
    window.addEventListener('resize', updateIsMobile)
    return () => window.removeEventListener('resize', updateIsMobile)
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const handleDownloadAll = () => {
    if (filteredUploads.length === 0) return
    // Optional warn for very large sets
    if (filteredUploads.length > 500) {
      const proceed = confirm('Große Datei – Download kann länger dauern. Fortfahren?')
      if (!proceed) return
    }
    setIsDownloadingAll(true)
    const url = `/api/galleries/${uuid}/download-all${selectedPromptId !== 'all' ? `?promptId=${selectedPromptId}` : ''}`
    // Use location change so browser shows download dialog
    window.location.href = url
    // Re-enable after a short time window; the stream continues independently
    setTimeout(() => setIsDownloadingAll(false), 8000)
  }

  // Elegant wedding palette and soft glow background
  const bgGradient =
    'bg-[radial-gradient(1000px_600px_at_100%_-10%,rgba(244,114,182,0.15),transparent),radial-gradient(800px_500px_at_0%_-20%,rgba(251,191,36,0.10),transparent)]'

  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${bgGradient} bg-stone-50`}
      >
        <div className="relative w-full max-w-sm">
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-rose-300/40 via-rose-400/40 to-amber-300/40 blur-xl" />
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl ring-1 ring-white/60">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <Loader className="w-6 h-6 animate-spin" />
            </div>
            <p className="text-center text-stone-700 font-medium tracking-wide">
              Galerie wird vorbereitet ...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen ${bgGradient} bg-stone-50 p-6`}>
        <div className="mx-auto max-w-lg">
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-rose-300/40 via-rose-400/40 to-amber-300/40 blur-xl" />
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl ring-1 ring-white/60 text-center">
              <div className="mx-auto mb-5 h-14 w-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <RefreshCw className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-semibold text-stone-800 tracking-tight">
                Galerie konnte nicht geladen werden
              </h2>
              <p className="mt-2 text-stone-600">{error}</p>
              <div className="mt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.99] transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Erneut versuchen
                </button>
              </div>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-stone-500">
            Powered by Wedding Moments
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${bgGradient} bg-stone-50`}>
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-10 -right-10 h-60 w-60 rounded-full bg-rose-200 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-amber-200 blur-3xl" />
        </div>

        <div className="mx-auto w-full max-w-6xl px-6 pt-10 pb-6">
          <div className="flex items-center justify-center gap-2 text-rose-600">
            <Sparkles className="w-5 h-5" />
            <span className="uppercase tracking-widest text-xs font-semibold">
              Wedding Moments
            </span>
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="mt-4 text-center text-3xl md:text-5xl font-serif tracking-tight text-stone-900">
            Galerie der Herzensmomente
          </h1>
          <p className="mt-3 text-center text-stone-600 max-w-2xl mx-auto">
            Stöbert durch alle hochgeladenen Fotos. Filtert nach Aufgaben oder
            wählt eure Lieblingsansicht.
          </p>

          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-3 py-1.5 text-stone-700 ring-1 ring-stone-200 shadow-sm">
              <Heart className="w-4 h-4 text-rose-500" />
              <span className="text-xs">
                Danke an alle Gäste fürs Mitmachen
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar Card */}
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="relative mb-8">
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-rose-300/40 via-rose-400/40 to-amber-300/40 blur-xl" />
          <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl ring-1 ring-white/60 overflow-hidden">
            <div className="px-4 md:px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Link
                  href={`/event/${event?.slug}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-200 hover:bg-rose-100 transition"
                  aria-label="Zurück"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-stone-900">
                    {event?.name} – Galerie
                  </h2>
                  <p className="text-sm text-stone-600">
                    {filteredUploads.length}{' '}
                    {filteredUploads.length === 1 ? 'Foto' : 'Fotos'}
                    {selectedPromptId !== 'all' && ' für diese Aufgabe'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {prompts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 ring-1 ring-stone-200">
                      <Filter className="w-4 h-4 text-stone-600" />
                    </span>
                    <select
                      value={selectedPromptId}
                      onChange={(e) => setSelectedPromptId(e.target.value)}
                      className="h-10 rounded-xl border border-stone-200 bg-white/80 px-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
                    >
                      <option value="all">
                        Alle Aufgaben ({uploads.length})
                      </option>
                      {prompts.map((prompt) => {
                        const count = uploads.filter(
                          (u) => u.prompt.id === prompt.id
                        ).length
                        return (
                          <option key={prompt.id} value={prompt.id}>
                            {prompt.text} ({count})
                          </option>
                        )
                      })}
                    </select>
                  </div>
                )}

                <div className="flex rounded-2xl overflow-hidden ring-1 ring-stone-200 bg-white/80">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-2 text-sm font-medium transition ${
                      viewMode === 'grid'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 text-sm font-medium transition border-l border-stone-200 ${
                      viewMode === 'list'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleDownloadAll}
                  disabled={filteredUploads.length === 0 || isDownloadingAll}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 ring-1 transition ${
                    filteredUploads.length === 0 || isDownloadingAll
                      ? 'bg-stone-100 text-stone-400 ring-stone-200 cursor-not-allowed'
                      : 'bg-rose-50 text-rose-700 ring-rose-200 hover:bg-rose-100'
                  }`}
                >
                  {isDownloadingAll ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Wird vorbereitet …
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Alle herunterladen
                    </>
                  )}
                </button>
              </div>
              {isMobile && filteredUploads.length > 500 && (
                <p className="mt-1 text-xs text-stone-500 text-right">
                  Große Datei – Download kann länger dauern.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 pb-12">
        {filteredUploads.length === 0 ? (
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-rose-300/40 via-rose-400/40 to-amber-300/40 blur-xl" />
            <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl ring-1 ring-white/60 overflow-hidden">
              <div className="px-6 md:px-10 py-14 text-center">
                <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Eye className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-semibold text-stone-900">
                  Noch keine Fotos
                </h3>
                <p className="mt-2 text-stone-600">
                  Fotos werden hier angezeigt, sobald Gäste sie hochladen.
                </p>
                <div className="mt-6">
                  <Link
                    href={`/event/${event?.slug}`}
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.99] transition-all"
                  >
                    Jetzt Foto hochladen
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredUploads.map((upload) => (
              <div
                key={upload.id}
                className="group relative rounded-2xl border border-stone-200 bg-white/80 backdrop-blur shadow-sm hover:shadow-md transition"
              >
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={upload.r2Url}
                    alt={upload.caption || 'Event photo'}
                    className="block w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 z-0 select-none"
                    loading="lazy"
                  />
                  {/* Hover overlay */}
                  <div
                    onClick={() => setSelectedImage(upload)}
                    className="pointer-events-none absolute inset-0 z-10 bg-black/0 group-hover:bg-black/30 transition"
                    aria-hidden
                  />
                  {/* Action buttons layer */}
                  <div className="absolute inset-0 z-20">
                    {/* Top-right preview button */}
                    <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedImage(upload) }}
                        aria-label="Bild ansehen"
                        className="rounded-full bg-white/90 backdrop-blur-xl shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-rose-300"
                      >
                        <Eye className="h-5 w-5 text-stone-900" />
                      </button>
                    </div>
                    {/* Bottom-left download button */}
                    <div className="absolute left-3 bottom-3 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => { e.stopPropagation(); downloadImage(upload) }}
                        className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 px-3 py-1 text-xs ring-1 ring-rose-200 hover:bg-rose-100 transition"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Herunterladen
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-stone-500 mb-1 truncate">
                    {upload.prompt.text}
                  </p>
                  {upload.caption && (
                    <p className="text-sm text-stone-800 line-clamp-2 mb-2">
                      {upload.caption}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-stone-500">
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
                className="rounded-2xl border border-stone-200 bg-white/80 backdrop-blur p-4 shadow-sm hover:shadow-md transition flex items-center gap-5"
              >
                <button
                  className="relative w-28 h-28 overflow-hidden rounded-xl ring-1 ring-stone-200"
                  onClick={() => setSelectedImage(upload)}
                  aria-label="Foto ansehen"
                >
                  <img
                    src={upload.r2Url}
                    alt={upload.caption || 'Event photo'}
                    className="block w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-stone-500 mb-1 truncate">
                    {upload.prompt.text}
                  </p>
                  {upload.caption && (
                    <p className="text-stone-800 mb-2 truncate">
                      {upload.caption}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                    <span>Von {upload.uploaderName || 'Anonym'}</span>
                    <span className="opacity-50">•</span>
                    <span>{formatDate(upload.createdAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => downloadImage(upload)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-200 hover:bg-rose-100 transition"
                  aria-label="Herunterladen"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative w-full max-w-5xl rounded-3xl overflow-hidden bg-white/90 backdrop-blur ring-1 ring-white/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-stone-900">
              <img
                src={selectedImage.r2Url}
                alt={selectedImage.caption || 'Event photo'}
                className="w-full h-auto max-h-[75vh] object-contain bg-black/5"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 hover:bg-white transition shadow"
                aria-label="Schließen"
              >
                <X className="w-5 h-5 text-stone-700" />
              </button>
            </div>
            <div className="px-5 md:px-8 py-5">
              <p className="text-xs text-stone-500 mb-1">
                {selectedImage.prompt.text}
              </p>
              {selectedImage.caption && (
                <p className="text-stone-800 mb-3">{selectedImage.caption}</p>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-sm text-stone-600">
                  <span>Von {selectedImage.uploaderName || 'Anonym'}</span>
                  <span className="mx-2 opacity-50">•</span>
                  <span>{formatDate(selectedImage.createdAt)}</span>
                </div>
                <button
                  onClick={() => downloadImage(selectedImage)}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.99] transition-all"
                >
                  <Download className="w-4 h-4" />
                  Herunterladen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-10 pb-10 text-center">
        <p className="text-xs text-stone-500">
          Mit Liebe gemacht • Powered by Wedding Moments
        </p>
      </div>
    </div>
  )
}