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

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
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
        setEvent({
          id: data.prompt.eventId,
          name: slug,
          slug,
          isActive: true,
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

  // Elegant wedding palette
  // Primary: rose-600, Secondary: rose-200/300, Accent: amber-500, Neutral: stone-50/100/600
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
            Powered by Wedding Moments
          </p>
        </div>
      </div>
    )
  }

  if (uploadSuccess) {
    return (
      <div className={`min-h-screen ${bgGradient} bg-stone-50 p-6`}>
        <div className="mx-auto max-w-lg">
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-rose-300/40 via-rose-400/40 to-amber-300/40 blur-xl" />
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl ring-1 ring-white/60 text-center">
              <div className="mx-auto mb-5 h-16 w-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <CheckCircle className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-semibold text-stone-800 tracking-tight">
                Foto hochgeladen – Danke!
              </h2>
              <p className="mt-2 text-stone-600">
                Ihr habt einen Moment für die Ewigkeit geteilt.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-rose-700 ring-1 ring-rose-200">
                <Loader className="w-4 h-4 animate-spin" />
                Nächste Aufgabe wird geladen ...
              </div>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-stone-500">
            Mit Liebe gesammelt
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${bgGradient} bg-stone-50`}>
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
              Wedding Moments
            </span>
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="mt-4 text-center text-3xl md:text-5xl font-serif tracking-tight text-stone-900">
            Teile eure schönsten Augenblicke
          </h1>
          <p className="mt-3 text-center text-stone-600 max-w-2xl mx-auto">
            Lade Fotos zu liebevoll kuratierten Aufgaben hoch und helft uns,
            ein einzigartiges Album voller Herzensmomente zu gestalten.
          </p>

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
          <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl ring-1 ring-white/60 overflow-hidden">
            {/* Prompt Banner */}
            <div className="px-6 md:px-10 py-8 md:py-12 bg-gradient-to-br from-rose-50 to-rose-100 border-b border-rose-100">
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
              </div>
            </div>

            {/* Content */}
            {currentPrompt && (
              <div className="px-4 md:px-10 py-8 md:py-10">
                <div
                  className={`mx-auto max-w-2xl ${
                    selectedFile ? 'mb-6' : 'mb-10'
                  }`}
                >
                  <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-white to-rose-50 p-6 md:p-8 shadow-sm">
                    <p className="text-lg md:text-xl leading-relaxed text-stone-800 text-center font-medium">
                      {currentPrompt.text}
                    </p>
                    {currentPrompt.maxUploads && (
                      <p className="mt-4 text-center text-xs text-stone-500">
                        {currentPrompt._count.uploads} von{' '}
                        {currentPrompt.maxUploads} Fotos für diese Aufgabe
                        hochgeladen
                      </p>
                    )}
                    {!selectedFile && (
                      <div className="mt-6 flex justify-center">
                        <button
                          onClick={fetchEventAndPrompt}
                          disabled={isLoading}
                          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.99] transition-all disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${
                              isLoading ? 'animate-spin' : ''
                            }`}
                          />
                          Neue Aufgabe
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Section */}
                <div className="mx-auto max-w-2xl">
                  {!selectedFile ? (
                    <div className="text-center py-6">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
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
            Mit Liebe gemacht • Powered by Wedding Moments
          </p>
        </div>
      </div>
    </div>
  )
}