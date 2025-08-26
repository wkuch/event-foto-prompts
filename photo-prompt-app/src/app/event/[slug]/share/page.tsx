'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Camera, Sparkles } from 'lucide-react'

type ShareInfo = {
  success: boolean
  eventUrl: string
  eventName?: string
  qrCodes: {
    png: { small: string; medium: string; large: string }
    svg: { small: string; medium: string; large: string }
  }
}

export default function EventSharePage() {
  const params = useParams()
  const slug = params.slug as string

  const [info, setInfo] = useState<ShareInfo | null>(null)
  const [error, setError] = useState<string>('')

  const qrSvgUrl = useMemo(() => info?.qrCodes.svg.large ?? '', [info])
  const displayUrl = useMemo(() => {
    if (!info?.eventUrl) return ''
    try {
      const u = new URL(info.eventUrl)
      const hostPath = `${u.host}${u.pathname}`.replace(/\/$/, '')
      return hostPath
    } catch {
      return info.eventUrl.replace(/^https?:\/\//, '')
    }
  }, [info])

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        setError('')
        const res = await fetch(`/api/events/${slug}/qr`, { method: 'POST' })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'QR-Informationen konnten nicht geladen werden')
        }
        const data = (await res.json()) as ShareInfo
        setInfo(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Fehler beim Laden')
      }
    }
    fetchInfo()
  }, [slug])

  const bgGradient =
    'bg-[radial-gradient(1000px_600px_at_100%_-10%,rgba(244,114,182,0.12),transparent),radial-gradient(800px_500px_at_0%_-20%,rgba(251,191,36,0.08),transparent)]'

  return (
    <div
      className={`relative min-h-screen ${bgGradient} bg-stone-50`}
      style={{
        backgroundImage: "url('/background.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    > 
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] pointer-events-none" />
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-10 -right-10 h-60 w-60 rounded-full bg-rose-200 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-amber-200 blur-3xl" />
        </div>

        <div className="mx-auto w-full max-w-4xl px-6 pt-10 pb-8">
          <div className="flex items-center justify-center gap-2 text-rose-600">
            <Sparkles className="w-5 h-5" />
            <span className="uppercase tracking-widest text-xs font-semibold">Traumtag Momente</span>
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="mt-4 text-center text-3xl md:text-5xl font-serif tracking-tight text-stone-900">
            QR-Poster teilen
          </h1>
          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-3 py-1.5 text-stone-700 ring-1 ring-stone-200 shadow-sm">
              <Camera className="w-4 h-4 text-rose-500" />
              <span className="text-xs">Scannen, Fotos hochladen, Erinnerungen sammeln</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 pb-12">
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-rose-300/40 via-rose-400/40 to-amber-300/40 blur-xl" />
          <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl ring-1 ring-white/60 overflow-hidden">
            <div className="px-6 md:px-10 py-8 md:py-12 bg-gradient-to-br from-rose-50 to-rose-100 border-b border-rose-100">
              <div className="flex flex-col items-center text-center">
                <p className="text-sm text-stone-600">Traumtag Momente</p>
                <h2 className="mt-1 text-2xl md:text-3xl font-serif font-semibold tracking-tight text-stone-900">Teilt eure schönsten Augenblicke</h2>
                <p className="mt-1 text-sm text-stone-600">Scannen • Aufgabe ansehen • Lieblingsfoto hochladen</p>
              </div>
            </div>

            <div className="px-4 md:px-10 py-8 md:py-12">
              {error && (
                <div className="mx-auto max-w-2xl mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm">
                  {error}
                </div>
              )}

              {!info ? (
                <div className="mx-auto max-w-2xl flex items-center justify-center py-16 text-stone-600">
                  Lädt Poster …
                </div>
              ) : (
                <div className="mx-auto w-full glass-card p-0 overflow-hidden">
                  <div className="relative p-6 md:p-10">
                    <div
                      className="absolute inset-0 -z-10"
                      style={{
                        backgroundImage: "url('/background.png')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'saturate(1.35) contrast(1.08) brightness(1.02)'
                      }}
                    />
                    <div className="absolute inset-0 bg-white/55" />
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-center">
                      <div className="flex flex-col items-center">
                        <div className="p-4 md:p-6 bg-white rounded-2xl ring-1 ring-stone-200 shadow-sm">
                          <img
                            src={qrSvgUrl}
                            alt="QR Code"
                            className="w-full max-w-xs sm:max-w-sm md:max-w-md aspect-square object-contain"
                          />
                        </div>
                        <div className="mt-5 w-full text-center">
                          <p className="text-[11px] uppercase tracking-widest text-stone-500">Event‑Link</p>
                          <p className="mt-1 text-xl md:text-2xl font-serif text-stone-900 break-words decoration-rose-300/50 underline decoration-from-font underline-offset-4">
                            {displayUrl}
                          </p>
                        </div>
                      </div>
                      <div className="md:pl-2">
                        <div className="rounded-2xl bg-white/55 backdrop-blur-xl ring-1 ring-white/60 shadow-sm p-5 md:p-6">
                          <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-200 px-3 py-1 text-xs">
                            <span className="font-medium">{info?.eventName || slug}</span>
                          </div>
                          <h3 className="mt-4 text-3xl lg:text-4xl font-serif font-semibold tracking-tight text-stone-900">
                            Willkommen in unserem Foto‑Gästebuch
                          </h3>
                          <p className="mt-3 text-stone-700 leading-relaxed text-base lg:text-lg">
                            Scanne den QR‑Code, sieh dir eine kleine Foto‑Aufgabe an und
                            lade dein Lieblingsbild hoch. So sammeln wir alle
                            Erinnerungen an einem Ort.
                          </p>
                          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-stone-700">
                            <div className="rounded-xl bg-stone-50/80 backdrop-blur ring-1 ring-stone-200 p-3">
                              <p className="font-medium">1 · Scannen</p>
                              <p className="mt-1 text-stone-600">QR‑Code öffnen</p>
                            </div>
                            <div className="rounded-xl bg-stone-50/80 backdrop-blur ring-1 ring-stone-200 p-3">
                              <p className="font-medium">2 · Inspirieren</p>
                              <p className="mt-1 text-stone-600">Aufgabe lesen</p>
                            </div>
                            <div className="rounded-xl bg-stone-50/80 backdrop-blur ring-1 ring-stone-200 p-3">
                              <p className="font-medium">3 · Teilen</p>
                              <p className="mt-1 text-stone-600">Foto hochladen</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-xs text-stone-500">Mit Liebe gemacht • Powered by Traumtag Momente</p>
        </div>
      </div>
    </div>
  )
}


