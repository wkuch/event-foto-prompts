'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowLeft, Loader, CheckCircle, AlertCircle, Sparkles, Heart } from 'lucide-react'

export default function SignInClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')
  
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push(callbackUrl)
      }
    })
  }, [callbackUrl, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('email', {
        email: email.trim(),
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        setError('Magic Link konnte nicht gesendet werden. Bitte versuche es erneut.')
      } else {
        setEmailSent(true)
      }
    } catch (err) {
      setError('Etwas ist schief gelaufen. Bitte versuche es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-stone-50 antialiased flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-rose-300/40 via-rose-400/40 to-amber-300/40 blur-xl" />
            <div className="relative glass-card p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-rose-600" />
                </div>

                <h1 className="font-serif text-2xl font-bold text-stone-900 mb-3">
                  Prüfe dein Postfach
                </h1>

                <p className="text-stone-700 mb-4">
                  Wir haben dir einen Login‑Link an <strong>{email}</strong> gesendet.
                </p>

                <div className="rounded-2xl ring-1 ring-stone-200 bg-white/80 p-4 mb-6">
                  <p className="text-sm text-stone-700">
                    Öffne die E‑Mail und klicke auf den Link, um dich anzumelden. Der Link läuft in 24 Stunden ab.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setEmailSent(false)}
                    className="inline-flex justify-center items-center rounded-full px-6 py-3 bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-rose-300"
                  >
                    Andere E‑Mail eingeben
                  </button>

                  <Link
                    href="/"
                    className="inline-flex justify-center items-center rounded-full px-6 py-3 bg-white/80 ring-1 ring-stone-200 hover:bg-white transition text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  >
                    Zur Startseite
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 antialiased flex items-center justify-center p-4">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(800px 400px at 20% 10%, rgba(244,114,182,0.15), transparent 60%), radial-gradient(700px 300px at 80% 20%, rgba(251,191,36,0.10), transparent 60%)',
        }}
      />
      <div className="max-w-md w-full animate-scale-fade">
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-rose-300/40 via-rose-400/40 to-amber-300/40 blur-xl" />
          <div className="relative glass-card p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 text-rose-600 mb-4">
                <Sparkles className="w-5 h-5" />
                <span className="uppercase tracking-widest text-xs font-semibold">Traumtag Momente</span>
                <Sparkles className="w-5 h-5" />
              </div>
              <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">
                Willkommen zurück
              </h1>
              <p className="text-stone-600 text-sm">
                Meldet euch an, um eure Hochzeits-Foto-Aufgaben zu verwalten
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">
                  E-Mail-Adresse
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-stone-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="eure@email.de"
                    className="block w-full pl-10 pr-3 py-2.5 rounded-xl ring-1 ring-stone-200 bg-white/80 backdrop-blur leading-5 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-center">
                  <AlertCircle className="w-5 h-5 text-rose-500 mr-2 flex-shrink-0" />
                  <p className="text-sm text-rose-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full inline-flex justify-center items-center gap-2 rounded-full px-6 py-3 bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Magic Link wird gesendet...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Magic Link senden
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-stone-200">
              <p className="text-xs text-stone-500 text-center">
                Noch keine Foto-Aufgaben erstellt?{' '}
                <Link href="/dashboard/create" className="text-rose-600 hover:text-rose-500 font-medium">
                  Jetzt erstellen
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Zur Startseite
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}