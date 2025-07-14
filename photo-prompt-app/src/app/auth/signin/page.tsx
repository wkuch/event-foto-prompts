'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowLeft, Loader, CheckCircle, AlertCircle } from 'lucide-react'

export default function SignInPage() {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Prüfe deine E-Mails
            </h1>
            
            <p className="text-gray-600 mb-6">
              Wir haben einen Magic Link an <strong>{email}</strong> gesendet
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                {process.env.NODE_ENV === 'development' ? (
                  <>
                    <strong>Entwicklungsmodus:</strong> Schaue in dein Terminal/Konsole für den Magic Link anstatt in deine E-Mails.
                  </>
                ) : (
                  <>
                    Klicke den Link in der E-Mail zum Einloggen. Der Link läuft in 24 Stunden ab.
                  </>
                )}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setEmailSent(false)}
                className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Andere E-Mail versuchen
              </button>
              
              <Link
                href="/"
                className="block w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-center"
              >
                Zurück zur Startseite
              </Link>
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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white text-center">
          <h1 className="text-2xl font-bold mb-2">Willkommen zurück</h1>
          <p className="text-blue-100">
            Melde dich an, um deine Events zu verwalten
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
                Zugang zu deinen Events
              </h2>
              <p className="text-sm text-gray-600">
                Gib deine E-Mail ein, um einen Magic Link zu erhalten
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
                  placeholder="Gib die E-Mail ein, mit der du Events erstellt hast"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
              Noch kein Account?{' '}
              <Link href="/dashboard/create" className="text-blue-600 hover:text-blue-500 font-medium">
                Erstelle dein erstes Event
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}