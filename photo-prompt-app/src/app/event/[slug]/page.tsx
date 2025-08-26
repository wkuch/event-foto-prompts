'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader,
  RefreshCw,
  X,
  Sparkles,
  Heart,
  List,
} from 'lucide-react'

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
  const [nextPrompts, setNextPrompts] = useState<Prompt[]>([])
  const [isPrefetching, setIsPrefetching] = useState(false)

  // Browse prompts UI (mocked data)
  const [isBrowseOpen, setIsBrowseOpen] = useState(false)
  const [browseLoading, setBrowseLoading] = useState(false)
  const [seenPromptIds, setSeenPromptIds] = useState<string[]>([])
  const [browsePrompts, setBrowsePrompts] = useState<Prompt[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Initialize seen prompts from local storage for this event
    try {
      const key = `seen_prompts_${slug}`
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null
      const parsed = raw ? (JSON.parse(raw) as string[]) : []
      setSeenPromptIds(Array.isArray(parsed) ? parsed : [])
    } catch {}

    fetchEventAndPrompt()
  }, [slug])

  const fetchEventAndPrompt = async () => {
    setIsLoading(true)
    setError('')

    try {
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
        // Mark prompt as seen locally
        addSeenPromptId(data.prompt.id)
        setEvent({
          id: data.prompt.eventId,
          name: slug,
          slug,
          isActive: true,
        })
        void prefetchNextPrompts(3)
      } else {
        setError('Keine Aufgaben für dieses Event verfügbar')
      }
    } catch (err) {
      setError('Verbindung zum Event fehlgeschlagen')
    } finally {
      setIsLoading(false)
    }
  }

  const addSeenPromptId = (id: string) => {
    setSeenPromptIds((prev) => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      try {
        const key = `seen_prompts_${slug}`
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, JSON.stringify(next))
        }
      } catch {}
      return next
    })
  }

  const prefetchNextPrompts = async (desiredQueueSize: number = 3) => {
    try {
      const missing = Math.max(0, desiredQueueSize - nextPrompts.length)
      if (missing === 0) return

      setIsPrefetching(true)
      const response = await fetch(`/api/events/${slug}/prompts`)
      if (!response.ok) return
      const data = await response.json()
      if (!data.success || !Array.isArray(data.prompts)) return

      const excludeIds = new Set<string>([
        ...seenPromptIds,
        ...(currentPrompt ? [currentPrompt.id] : []),
        ...nextPrompts.map((p) => p.id),
      ])

      const available: Prompt[] = data.prompts.filter((p: Prompt) => {
        const hasCapacity = !p.maxUploads || p._count.uploads < p.maxUploads
        return hasCapacity && !excludeIds.has(p.id)
      })

      for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const t = available[i]
        available[i] = available[j]
        available[j] = t
      }

      const toAdd = available.slice(0, missing)
      if (toAdd.length > 0) {
        setNextPrompts((prev) => [...prev, ...toAdd])
      }
    } catch {}
    finally {
      setIsPrefetching(false)
    }
  }

  const handleOpenBrowse = async () => {
    setIsBrowseOpen(true)
    setBrowseLoading(true)
    try {
      const response = await fetch(`/api/events/${slug}/prompts`)
      if (!response.ok) throw new Error('Failed to load prompts')
      const data = await response.json()
      if (data.success && Array.isArray(data.prompts)) {
        // Show only prompts that are in the local seen list, verifying against server
        const seenSet = new Set(seenPromptIds)
        const verifiedSeen: Prompt[] = data.prompts.filter((p: Prompt) =>
          seenSet.has(p.id)
        )
        setBrowsePrompts(verifiedSeen)
      } else {
        setBrowsePrompts([])
      }
    } catch (e) {
      setBrowsePrompts([])
    } finally {
      setBrowseLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Bitte wähle eine Bilddatei aus')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Dateigröße muss unter 10MB liegen')
      return
    }

    setSelectedFile(file)
    setError('')

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleUpload = async () => {
    if (!selectedFile || !currentPrompt) return

    setIsUploading(true)
    setError('')

    try {
      const uploadUrlResponse = await fetch(
        `/api/events/${slug}/upload-url`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            fileSize: selectedFile.size,
            promptId: currentPrompt.id,
          }),
        }
      )

      if (!uploadUrlResponse.ok) {
        const errorData = await uploadUrlResponse.json()
        throw new Error(errorData.error || 'Failed to prepare upload')
      }

      const { presignedUrl, publicUrl, fileName, r2Key } =
        await uploadUrlResponse.json()

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

      const completeResponse = await fetch(
        `/api/events/${slug}/upload-complete`,
        {
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
        }
      )

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json()
        throw new Error(errorData.error || 'Failed to save upload')
      }

      setUploadSuccess(true)
      setSelectedFile(null)
      setPreviewUrl(null)
      setCaption('')
      const nextItem = nextPrompts[0]
      if (nextItem) {
        setNextPrompts((prev) => prev.slice(1))
        setCurrentPrompt(nextItem)
        addSeenPromptId(nextItem.id)
        void prefetchNextPrompts(3)
      } else {
        void fetchEventAndPrompt()
      }
      setTimeout(() => {
        setUploadSuccess(false)
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

  // Elegant wedding palette
  // Primary: rose-600, Secondary: rose-200/300, Accent: amber-500, Neutral: stone-50/100/600
  const bgGradient =
    'bg-[radial-gradient(1000px_600px_at_100%_-10%,rgba(244,114,182,0.15),transparent),radial-gradient(800px_500px_at_0%_-20%,rgba(251,191,36,0.10),transparent)]'

  if (isLoading && !currentPrompt) {
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
              Einen Moment, wir bereiten die Magie vor ...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !currentPrompt) {
    return (
      <div className={`min-h-screen ${bgGradient} bg-stone-50 p-6`}>
        <div className="mx-auto max-w-lg">
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-rose-300/40 via-rose-400/40 to-amber-300/40 blur-xl" />
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl ring-1 ring-white/60">
              <div className="mx-auto mb-5 h-14 w-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h2 className="text-center text-xl font-semibold text-stone-800 tracking-tight">
                Event konnte nicht geladen werden
              </h2>
              <p className="mt-3 text-center text-stone-600">{error}</p>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={fetchEventAndPrompt}
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

  // uploadSuccess is now shown inline within the main card instead of full-screen

  return (
    <div className={`relative min-h-screen ${bgGradient} bg-stone-50`}>
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          filter: 'saturate(1.25) contrast(1.05) brightness(1.02)'
        }}
      />
      <div className="absolute inset-0 z-0 bg-white/30 backdrop-blur-[1px]" />
      <div className="relative z-10">
        {/* Hero / Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute -top-10 -right-10 h-60 w-60 rounded-full bg-rose-200 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-amber-200 blur-3xl" />
          </div>

          <div className="mx-auto w-full max-w-4xl px-6 pt-10 pb-8">
            <div className="flex items-center justify-center gap-2 text-rose-600">
              <Sparkles className="w-5 h-5" />
              <span className="uppercase tracking-widest text-xs font-semibold">
                Traumtag Momente
              </span>
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="mt-4 text-center text-3xl md:text-5xl font-serif tracking-tight text-stone-900">
              Teile eure schönsten Augenblicke
            </h1>
            

            <div className="mt-6 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-3 py-1.5 text-stone-700 ring-1 ring-stone-200 shadow-sm">
                <Heart className="w-4 h-4 text-rose-500" />
                <span className="text-xs">
                  Liebe, Lachen und Fotos – alles an einem Ort
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="mx-auto w-full max-w-4xl px-4 md:px-6 pb-12">
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-rose-300/40 via-rose-400/40 to-amber-300/40 blur-xl" />
            <div className="relative bg-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl ring-1 ring-white/60 overflow-hidden">
              {/* Prompt Banner */}
              <div className="px-6 md:px-10 py-8 md:py-12">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-5 h-14 w-14 rounded-full bg-rose-600 text-rose-50 flex items-center justify-center shadow-lg shadow-rose-600/20">
                    <Camera className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-stone-900">
                    Eure Foto-Aufgabe
                  </h2>
                  <p className="mt-2 text-sm text-stone-600">
                    Lasst euch inspirieren und fangt den Moment ein.
                  </p>
                  {/* Browse prompts entry */}
                  <div className="mt-4">
                    <button
                      onClick={handleOpenBrowse}
                      className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-white/80 backdrop-blur text-stone-700 ring-1 ring-stone-200 shadow-sm hover:bg-white"
                      title="Öffnet die Liste aller Aufgaben"
                    >
                      <List className="w-4 h-4 text-rose-500" />
                      Aufgabenliste öffnen
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              {currentPrompt && (
                <div className="px-4 md:px-10 py-8 md:py-10">
                  {uploadSuccess && (
                    <div className="mx-auto max-w-2xl mb-4">
                      <div className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
                        <CheckCircle className="w-5 h-5" />
                        <span>Foto hochgeladen – danke! Nächste Aufgabe ist bereit.</span>
                        {isPrefetching && <Loader className="w-4 h-4 animate-spin" />}
                      </div>
                    </div>
                  )}
                  {!selectedFile && (
                    <div className="sm:hidden mb-4">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="group w-full inline-flex items-center justify-center gap-3 rounded-2xl px-6 py-4 bg-stone-900 text-white shadow-lg shadow-stone-900/20 hover:shadow-xl hover:shadow-stone-900/25 transition-all"
                      >
                        <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                          <Camera className="w-5 h-5" />
                        </span>
                        <div className="text-left">
                          <div className="font-semibold">Foto auswählen</div>
                          <div className="text-xs text-stone-300">
                            JPG, PNG, WebP oder GIF bis 10MB
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                  <div
                    className={`mx-auto max-w-2xl ${
                      selectedFile ? 'mb-6' : 'mb-10'
                    }`}
                  >
                    <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-white to-rose-50 p-6 md:p-8 shadow-sm">
                      <p className="text-lg md:text-xl leading-relaxed text-stone-800 text-center font-medium">
                        {currentPrompt.text}
                      </p>
                      <p className="mt-4 text-center text-xs text-stone-500">
                        {currentPrompt._count.uploads > 0 ? (
                          <span>{currentPrompt._count.uploads} Fotos für diese Aufgabe hochgeladen</span>
                        ) : (
                          <span>Noch keine Fotos</span>
                        )}
                      </p>
                      {!selectedFile && (
                        <div className="mt-6 flex justify-center">
                          <button
                            onClick={fetchEventAndPrompt}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.99] transition-all disabled:opacity-50"
                            title="Gibt dir eine neue zufällige Aufgabe"
                          >
                            <RefreshCw
                              className={`w-4 h-4 ${
                                isLoading ? 'animate-spin' : ''
                              }`}
                            />
                            Zufällige Aufgabe
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Section */}
                  <div className="mx-auto max-w-2xl">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {!selectedFile ? (
                      <div className="text-center py-6 hidden sm:block">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="group inline-flex items-center gap-3 rounded-2xl px-6 py-4 bg-stone-900 text-white shadow-lg shadow-stone-900/20 hover:shadow-xl hover:shadow-stone-900/25 transition-all"
                        >
                          <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                            <Camera className="w-5 h-5" />
                          </span>
                          <div className="text-left">
                            <div className="font-semibold">Foto auswählen</div>
                            <div className="text-xs text-stone-300">
                              JPG, PNG, WebP oder GIF bis 10MB
                            </div>
                          </div>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {/* Image Preview */}
                        {previewUrl && (
                          <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="w-full max-h-[60vh] object-contain bg-white"
                            />
                            <button
                              onClick={clearSelection}
                              className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur shadow-md hover:bg-white transition"
                              aria-label="Auswahl löschen"
                            >
                              <X className="w-4 h-4 text-stone-700" />
                            </button>
                          </div>
                        )}

                        {/* Upload Form */}
                        <div className="grid grid-cols-1 gap-4 md:gap-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-1">
                              <label
                                htmlFor="uploaderName"
                                className="block text-sm font-medium mb-2 text-stone-700"
                              >
                                Dein Name (Optional)
                              </label>
                              <input
                                type="text"
                                id="uploaderName"
                                value={uploaderName}
                                onChange={(e) => setUploaderName(e.target.value)}
                                placeholder="z. B. Anna & Ben"
                                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white/80 backdrop-blur focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition"
                              />
                            </div>

                            <div className="col-span-1">
                              <label
                                htmlFor="caption"
                                className="block text-sm font-medium mb-2 text-stone-700"
                              >
                                Bildunterschrift (Optional)
                              </label>
                              <input
                                type="text"
                                id="caption"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Ein Satz, der den Moment beschreibt ..."
                                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white/80 backdrop-blur focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition"
                              />
                            </div>
                          </div>

                          {error && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
                              <p className="text-sm text-rose-700">{error}</p>
                            </div>
                          )}

                          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                            <button
                              onClick={clearSelection}
                              className="flex-1 rounded-xl px-4 py-2.5 border border-stone-200 text-stone-700 bg-white hover:bg-stone-50 transition"
                            >
                              Abbrechen
                            </button>
                            <button
                              onClick={handleUpload}
                              disabled={isUploading}
                              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-rose-600 text-white hover:bg-rose-600/90 active:scale-[0.99] transition disabled:opacity-60"
                            >
                              {isUploading ? (
                                <>
                                  <Loader className="w-4 h-4 animate-spin" />
                                  Wird hochgeladen ...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4" />
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
          </div>

          {/* Footer */}
          <div className="mt-10 text-center">
            <p className="text-xs text-stone-500">
              Mit Liebe gemacht • Powered by Traumtag Momente
            </p>
          </div>
        </div>

        {/* Browse Prompts Modal (mocked) */}
        {isBrowseOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div
              className="absolute inset-0 bg-stone-900/40"
              onClick={() => setIsBrowseOpen(false)}
            />
            <div className="relative w-full max-w-lg rounded-2xl overflow-hidden bg-white shadow-2xl ring-1 ring-stone-200">
              <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-semibold text-stone-800">Aufgaben durchsuchen</h3>
                </div>
                <button
                  onClick={() => setIsBrowseOpen(false)}
                  className="p-2 rounded-lg hover:bg-stone-100"
                  aria-label="Schließen"
                >
                  <X className="w-4 h-4 text-stone-600" />
                </button>
              </div>
              <div className="px-5 py-3 text-sm italic text-stone-700 bg-stone-50/60">
                Diese Liste zeigt Aufgaben, die du bereits gesehen hast. Mit „Zufällige Aufgabe“ erhältst du eine neue Aufgabe.
              </div>
              <div className="max-h-[70vh] overflow-y-auto">
                {browseLoading ? (
                  <div className="p-8 flex items-center justify-center text-stone-600 text-sm">
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Lädt gesehene Aufgaben ...
                  </div>
                ) : browsePrompts.length === 0 ? (
                  <div className="p-8 text-center text-stone-600 text-sm">
                    Noch keine gesehenen Aufgaben.
                  </div>
                ) : (
                <ul className="divide-y divide-stone-100">
                  {browsePrompts.map((p) => {
                    const isZero = p._count.uploads === 0
                    return (
                      <li key={p.id} className="p-4">
                        <button
                          onClick={() => {
                            // Demo: set as current prompt locally and close
                            setCurrentPrompt({
                              id: p.id,
                              text: p.text,
                              order: p.order,
                              maxUploads: p.maxUploads,
                              _count: { uploads: p._count.uploads },
                            })
                            setIsBrowseOpen(false)
                          }}
                          className="w-full text-left"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1 h-8 w-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                              <Camera className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-medium text-stone-800 line-clamp-3">
                                  {p.text}
                                </p>
                                {isZero && (
                                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ring-1 bg-rose-50 text-rose-700 ring-rose-200">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Noch keine Fotos
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 text-xs text-stone-500">
                                <span>
                                  {p._count.uploads} Fotos
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                )}
              </div>
              <div className="px-5 py-4 border-t border-stone-200 flex items-center justify-end">
                <button
                  onClick={() => setIsBrowseOpen(false)}
                  className="rounded-xl px-4 py-2.5 border border-stone-200 text-stone-700 bg-white hover:bg-stone-50"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}