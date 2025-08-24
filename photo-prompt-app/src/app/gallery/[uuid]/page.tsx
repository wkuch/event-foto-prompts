'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  Eye,
  Grid,
  List,
  Loader,
  RefreshCw,
  X,
  Sparkles,
  Heart,
  Trash2,
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

type SortOrder = 'new' | 'old'
type ViewMode = 'grid' | 'list'

export default function GalleryPage() {
  const params = useParams()
  const uuid = params.uuid as string

  const [event, setEvent] = useState<Event | null>(null)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [filteredUploads, setFilteredUploads] = useState<Upload[]>([])
  const [viewMode, setViewMode] = useState('grid' as ViewMode)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState<Upload | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [isOwner, setIsOwner] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set())
  const [visibleCount, setVisibleCount] = useState<number>(24)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)

  const markLoaded = (id: string) => {
    setLoadedIds((prev) => new Set(prev).add(id))
  }

  // Infinite scroll
  useEffect(() => {
    const sentinel = document.getElementById('load-more-sentinel')
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsLoadingMore(true)
          setTimeout(() => {
            setVisibleCount((c) => Math.min(c + 24, filteredUploads.length))
            setIsLoadingMore(false)
          }, 150)
        }
      })
    }, { rootMargin: '600px 0px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [filteredUploads.length])

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchEventData(), fetchUploads()])
      setIsLoading(false)
    }
    load()
  }, [uuid])

  useEffect(() => {
    setFilteredUploads(uploads)
  }, [uploads])

  // Preload images for currently visible items and mark as loaded before rendering cards
  useEffect(() => {
    const targets = filteredUploads.slice(0, visibleCount)
    targets.forEach((u) => {
      if (loadedIds.has(u.id)) return
      const img = new Image()
      img.onload = () => markLoaded(u.id)
      // Do not mark as loaded on error; keep card hidden if it fails
      img.src = u.r2Url
    })
  }, [filteredUploads, visibleCount, loadedIds])

  const fetchEventData = async () => {
    try {
      const response = await fetch(`/api/galleries/${uuid}`)

      if (!response.ok) {
        throw new Error('Event nicht gefunden')
      }

      const data = await response.json()
      if (data.success) {
        setEvent(data.event)
        setIsOwner(!!data.isOwner)
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

  // Lightbox helpers
  const openAtIndex = (index: number) => {
    if (index < 0 || index >= filteredUploads.length) return
    setSelectedIndex(index)
    setSelectedImage(filteredUploads[index])
  }

  const closeLightbox = () => {
    setSelectedImage(null)
    setSelectedIndex(-1)
  }

  const showNext = () => {
    if (filteredUploads.length === 0) return
    const next = (selectedIndex + 1) % filteredUploads.length
    openAtIndex(next)
  }

  const showPrev = () => {
    if (filteredUploads.length === 0) return
    const prev = (selectedIndex - 1 + filteredUploads.length) % filteredUploads.length
    openAtIndex(prev)
  }

  useEffect(() => {
    if (!selectedImage) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') showNext()
      if (e.key === 'ArrowLeft') showPrev()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedImage, selectedIndex, filteredUploads])

  // Touch swipe for lightbox
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (touchStartX.current == null || touchStartY.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    // Horizontal swipe if dominant
    if (absDx > 50 && absDx > absDy) {
      if (dx < 0) showNext()
      else showPrev()
    } else if (absDy > 80 && absDy > absDx && dy > 0) {
      // Swipe down to close
      closeLightbox()
    }
    touchStartX.current = null
    touchStartY.current = null
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
    const url = `/api/galleries/${uuid}/download-all`
    // Use location change so browser shows download dialog
    window.location.href = url
    // Re-enable after a short time window; the stream continues independently
    setTimeout(() => setIsDownloadingAll(false), 8000)
  }

  const deleteUpload = async (upload: Upload) => {
    if (!event) return
    if (!confirm('Foto wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return
    const previous = uploads
    setDeletingId(upload.id)
    // Optimistic remove
    setUploads((prev) => prev.filter((u) => u.id !== upload.id))
    setFilteredUploads((prev) => prev.filter((u) => u.id !== upload.id))
    try {
      const res = await fetch(`/api/events/${event.slug}/uploads/${upload.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
    } catch (e) {
      // Revert on error
      setUploads(previous)
      setFilteredUploads(previous)
      alert('Foto konnte nicht gelöscht werden')
    } finally {
      setDeletingId(null)
    }
  }

  // Elegant wedding palette and soft glow background
  const bgGradient =
    'bg-[radial-gradient(1000px_600px_at_100%_-10%,rgba(244,114,182,0.15),transparent),radial-gradient(800px_500px_at_0%_-20%,rgba(251,191,36,0.10),transparent)]'

  // Basic client-side filter/search/sort (UI only; data already in memory)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('new' as SortOrder)

  useEffect(() => {
    const q = query.trim().toLowerCase()
    let next = uploads
    if (q.length > 0) {
      next = uploads.filter((u) =>
        (u.prompt?.text || '').toLowerCase().includes(q) ||
        (u.caption || '').toLowerCase().includes(q) ||
        (u.uploaderName || '').toLowerCase().includes(q)
      )
    }
    next = [...next].sort((a, b) =>
      sort === 'new'
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    setFilteredUploads(next)
    setVisibleCount(24)
  }, [query, sort, uploads])

  // Count of images in the current visible window that are still loading
  const pendingVisibleCount = filteredUploads
    .slice(0, visibleCount)
    .filter((u) => !loadedIds.has(u.id)).length

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
            Powered by Traumtag Momente
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
              Traumtag Momente
            </span>
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="mt-4 text-center text-3xl md:text-5xl font-serif tracking-tight text-stone-900">
            Galerie der Herzensmomente
          </h1>
          <p className="mt-3 text-center text-stone-600 max-w-2xl mx-auto">
          Eure Erinnerungen, gesammelt an einem Ort – viel Freude beim Stöbern.
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
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex w-full sm:w-auto rounded-2xl overflow-hidden ring-1 ring-stone-200 bg-white/80 divide-x divide-stone-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 h-10 text-sm font-medium transition flex-1 ${
                      viewMode === 'grid'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 h-10 text-sm font-medium transition flex-1 ${
                      viewMode === 'list'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
                {/* Search input */}
                <div className="relative flex-1 min-w-[200px]">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Suchen (Aufgabe, Beschreibung, Name)"
                    className="w-full h-10 rounded-2xl border border-stone-200 bg-white/80 px-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
                    aria-label="Galerie durchsuchen"
                  />
                </div>
                {/* Sort */}
                <div className="flex rounded-2xl overflow-hidden ring-1 ring-stone-200 bg-white/80 divide-x divide-stone-200">
                  <button
                    onClick={() => setSort('new')}
                    className={`px-3 h-10 text-sm ${sort === 'new' ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-50'}`}
                    aria-pressed={sort === 'new'}
                  >
                    Neueste
                  </button>
                  <button
                    onClick={() => setSort('old')}
                    className={`px-3 h-10 text-sm ${sort === 'old' ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-50'}`}
                    aria-pressed={sort === 'old'}
                  >
                    Älteste
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
        {pendingVisibleCount > 0 && filteredUploads.length > 0 && (
          <div className="flex items-center justify-center gap-2 text-stone-600 text-sm mb-4">
            <Loader className="w-4 h-4 animate-spin" />
            <span>
              Lade {pendingVisibleCount} {pendingVisibleCount === 1 ? 'Foto' : 'Fotos'} …
            </span>
          </div>
        )}
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
          <>
            <ul className="columns-2 sm:columns-3 lg:columns-4 gap-x-4 [column-gap:1rem]" role="list">
              {filteredUploads.slice(0, visibleCount).map((upload) => (
                loadedIds.has(upload.id) && (
                <li
                  key={upload.id}
                  className="group relative mb-4 break-inside-avoid rounded-2xl border border-stone-200 bg-white/80 backdrop-blur shadow-sm hover:shadow-md transition"
                  role="listitem"
                >
                  <div
                    className="relative overflow-hidden cursor-zoom-in"
                    onClick={() => openAtIndex(filteredUploads.findIndex((u) => u.id === upload.id))}
                    aria-label="Foto ansehen"
                  >
                    <img
                      src={upload.r2Url}
                      alt={upload.prompt.text || upload.caption || 'Event photo'}
                      className={`block w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02] z-0 select-none transition-opacity ${loadedIds.has(upload.id) ? 'opacity-100' : 'opacity-0'}`}
                      loading="lazy"
                      decoding="async"
                      onLoad={() => markLoaded(upload.id)}
                      onError={(e) => {
                        const imgEl = e.currentTarget as HTMLImageElement
                        if (!(imgEl as any)._retried) {
                          ;(imgEl as any)._retried = true
                          imgEl.src = `${upload.r2Url}?v=${Date.now()}`
                          return
                        }
                        markLoaded(upload.id)
                      }}
                    />
                    {/* Overlay tint on hover (desktop) */}
                    <div
                      className="absolute inset-0 z-10 bg-black/0 sm:group-hover:bg-black/20 transition"
                      aria-hidden
                    />
                    {/* Action buttons layer */}
                    <div className="absolute inset-0 z-20">
                      {/* Top-right actions */}
                      <div className="absolute right-3 top-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openAtIndex(filteredUploads.findIndex((u) => u.id === upload.id)) }}
                          aria-label="Bild ansehen"
                          className="rounded-full bg-white/90 backdrop-blur-xl shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-rose-300"
                        >
                          <Eye className="h-5 w-5 text-stone-900" />
                        </button>
                        {isOwner && (
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteUpload(upload) }}
                            aria-label="Löschen"
                            title="Foto löschen"
                            className="rounded-full bg-white/90 backdrop-blur-xl shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-rose-300 hover:bg-white"
                            disabled={deletingId === upload.id}
                          >
                            <Trash2 className="h-5 w-5 text-rose-600" />
                          </button>
                        )}
                      </div>
                      {/* Bottom-left download button */}
                      <div className="absolute left-3 bottom-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
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
                </li>)
              ))}
            </ul>
            {visibleCount < filteredUploads.length && (
              <div className="flex justify-center py-6">
                <div id="load-more-sentinel" className="h-8 w-8 rounded-full bg-stone-200 animate-pulse" aria-hidden />
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            {filteredUploads.map((upload) => (
              loadedIds.has(upload.id) && (
              <div
                key={upload.id}
                className="rounded-2xl border border-stone-200 bg-white/80 backdrop-blur p-4 shadow-sm hover:shadow-md transition flex items-center gap-5"
              >
                <button
                  className="relative w-28 h-28 overflow-hidden rounded-xl ring-1 ring-stone-200"
                  onClick={() => openAtIndex(filteredUploads.findIndex((u) => u.id === upload.id))}
                  aria-label="Foto ansehen"
                >
                  <img
                    src={upload.r2Url}
                    alt={upload.prompt.text || upload.caption || 'Event photo'}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
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
                <div className="flex items-center gap-2">
                  {isOwner && (
                    <button
                      onClick={() => deleteUpload(upload)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50 transition disabled:opacity-50"
                      aria-label="Löschen"
                      disabled={deletingId === upload.id}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => downloadImage(upload)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-200 hover:bg-rose-100 transition"
                    aria-label="Herunterladen"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>)
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && loadedIds.has(selectedImage.id) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => closeLightbox()}
        >
          <div
            className="relative w-full max-w-5xl rounded-3xl overflow-hidden bg-white/90 backdrop-blur ring-1 ring-white/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-stone-900" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              <div className="relative h-[75vh] w-full bg-black/5">
                <img
                  src={selectedImage.r2Url}
                  alt={selectedImage.prompt.text || selectedImage.caption || 'Event photo'}
                  className="absolute inset-0 w-full h-full object-contain"
                  loading="eager"
                  decoding="async"
                />
              </div>
              {/* Lightbox nav */}
              <div className="hidden sm:flex absolute inset-y-0 left-0 items-center">
                <button
                  onClick={showPrev}
                  className="ml-2 rounded-full bg-white/80 hover:bg-white p-2 shadow"
                  aria-label="Vorheriges Bild"
                >
                  <ArrowLeft className="w-5 h-5 text-stone-800" />
                </button>
              </div>
              <div className="hidden sm:flex absolute inset-y-0 right-0 items-center">
                <button
                  onClick={showNext}
                  className="mr-2 rounded-full bg-white/80 hover:bg-white p-2 shadow"
                  aria-label="Nächstes Bild"
                >
                  <ArrowLeft className="w-5 h-5 rotate-180 text-stone-800" />
                </button>
              </div>
              <button
                onClick={() => closeLightbox()}
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
          Mit Liebe gemacht • Powered by Traumtag Momente
        </p>
      </div>
    </div>
  )
}