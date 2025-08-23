'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowLeft, Loader, CheckCircle, AlertCircle } from 'lucide-react'

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-amber-500 px-6 py-8 text-white text-center">
          <h1 className="text-2xl font-bold mb-2">Willkommen zurück</h1>
          <p className="text-rose-100">
Meldet euch an, um eure Hochzeits-Foto-Aufgaben zu verwalten
          </p>
        </div>

        {/* Form */}
        <div className="px-6 py-8">
          <div className="flex items-center mb-6">
            <Link
              href="/"
              className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Zugang zu euren Foto-Aufgaben
              </h2>
              <p className="text-sm text-gray-600">
                Gebt eure E-Mail ein, um einen Magic Link zu erhalten
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-Mail-Adresse
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
placeholder="Gebt die E-Mail ein, mit der ihr eure Foto-Aufgaben erstellt habt"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Magic Link wird gesendet...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 mr-2" />
                  Magic Link senden
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Noch keine Foto-Aufgaben erstellt?{' '}
              <Link href="/dashboard/create" className="text-rose-600 hover:text-rose-500 font-medium">
                Erstellt Hochzeits-Foto-Aufgaben
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}