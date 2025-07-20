'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react'

const EVENT_TYPES = [
  { value: 'wedding', label: 'Hochzeit', description: 'Halte besondere Momente des großen Tages fest' },
  { value: 'birthday', label: 'Geburtstagsfeier', description: 'Spaßige Feier-Fotos' },
  { value: 'corporate', label: 'Firmenevent', description: 'Professionelles Networking und Teambuilding' },
  { value: 'conference', label: 'Konferenz', description: 'Bildungs- und Networking-Event' },
  { value: 'general', label: 'Allgemeines Event', description: 'Jede andere Art von Veranstaltung' },
]

const DEFAULT_PROMPTS = {
  wedding: [
    'Mache ein Foto mit jemandem in deiner Lieblingsfarbe',
    'Halte einen spontanen Lachmoment fest',
    'Foto mit dem glücklichen Paar',
    'Bild von eurem Tisch beim Spaß haben',
    'Schnapp den besten Tanzschritt des Abends'
  ],
  birthday: [
    'Foto mit dem Geburtstagskind',
    'Halte jemanden beim Wünschen fest',
    'Bild vom besten Party-Outfit',
    'Schnapp ein Gruppen-Selfie',
    'Foto vom Kuchen oder den Leckereien'
  ],
  corporate: [
    'Professionelles Porträt mit einem Kollegen',
    'Bild von deinem Arbeitsplatz oder Setup',
    'Foto, das Teamwork zeigt',
    'Halte einen Networking-Moment fest',
    'Bild vom Event-Veranstaltungsort'
  ],
  conference: [
    'Foto mit einem Sprecher oder Referenten',
    'Bild einer interessanten Präsentationsfolie',
    'Networking-Foto mit neuen Kontakten',
    'Halte einen Lernmoment fest',
    'Foto von den Konferenz-Goodies oder Materialien'
  ],
  general: [
    'Mache ein Foto mit jemandem Neuem',
    'Halte einen spontanen Moment fest',
    'Bild vom Veranstaltungsort oder Setup',
    'Schnapp ein Gruppenfoto',
    'Foto, das die Event-Atmosphäre zeigt'
  ]
}

export default function CreateEventPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'general',
    description: '',
    email: '',
  })
  const [prompts, setPrompts] = useState<string[]>(DEFAULT_PROMPTS.general)
  const [newPrompt, setNewPrompt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [promptErrors, setPromptErrors] = useState<string[]>([])


  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({ ...prev, type }))
    // Only reset prompts if they are still the default prompts for the current type
    const currentDefaults = DEFAULT_PROMPTS[formData.type as keyof typeof DEFAULT_PROMPTS] || DEFAULT_PROMPTS.general
    const isStillDefaults = JSON.stringify(prompts) === JSON.stringify(currentDefaults)
    
    if (isStillDefaults) {
      setPrompts(DEFAULT_PROMPTS[type as keyof typeof DEFAULT_PROMPTS] || DEFAULT_PROMPTS.general)
    }
    // If user has customized prompts, don't reset them
  }

  const addPrompt = () => {
    if (newPrompt.trim() && !prompts.includes(newPrompt.trim())) {
      setPrompts(prev => [...prev, newPrompt.trim()])
      setNewPrompt('')
    }
  }

  const removePrompt = (index: number) => {
    setPrompts(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsSubmitting(true)

    try {
      // Create event with prompts in single request
      const eventResponse = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          email: formData.email.trim(),
          prompts: prompts, // Send prompts with the event creation
        }),
      })

      if (!eventResponse.ok) {
        const errorData = await eventResponse.json()
        throw new Error(errorData.error || 'Failed to create event')
      }

      const { event } = await eventResponse.json()

      // Check if all prompts were created successfully
      const expectedPromptCount = prompts.length
      const actualPromptCount = event.prompts?.length || 0
      
      if (actualPromptCount < expectedPromptCount) {
        const failedPrompts = prompts.slice(actualPromptCount)
        setPromptErrors(failedPrompts)
      }

      // Show success message
      setSuccess(true)
      
      // Redirect after ensuring session is properly set, with fallback for mobile
      const redirectToUrl = `/dashboard/events/${event.slug}`
      
      // Check if we can access the dashboard first, with multiple attempts for mobile
      let redirectAttempts = 0
      const maxAttempts = 3
      
      const attemptRedirect = async () => {
        redirectAttempts++
        
        try {
          // Test if the session is working by checking dashboard access
          const testResponse = await fetch('/api/events', {
            method: 'GET',
            credentials: 'include'
          })
          
          if (testResponse.ok) {
            router.push(redirectToUrl)
          } else if (redirectAttempts < maxAttempts) {
            // Session not ready yet, wait longer and try again
            setTimeout(attemptRedirect, 1500)
          } else {
            // Fall back to regular dashboard if all attempts failed
            router.push('/dashboard')
          }
        } catch (err) {
          if (redirectAttempts < maxAttempts) {
            setTimeout(attemptRedirect, 1500)
          } else {
            router.push('/dashboard')
          }
        }
      }
      
      // Start the redirect process after initial delay
      setTimeout(attemptRedirect, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="w-8 h-8 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Event erfolgreich erstellt! 🎉
          </h1>
          
          <p className="text-gray-600 mb-6">
            Dein Event ist bereit! Du kannst es jetzt von diesem Gerät aus verwalten. 
            Nutze deine E-Mail, um von anderen Geräten darauf zuzugreifen.
          </p>

          {promptErrors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 font-medium mb-2">
                ⚠️ Einige Foto-Aufgaben konnten nicht erstellt werden:
              </p>
              <ul className="text-xs text-yellow-700 space-y-1">
                {promptErrors.map((prompt, index) => (
                  <li key={index}>• {prompt}</li>
                ))}
              </ul>
              <p className="text-xs text-yellow-700 mt-2">
                Du kannst sie später im Event-Dashboard manuell hinzufügen.
              </p>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Weiterleitung zu deinem Dashboard...</strong>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              href="/"
              className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Neues Event erstellen
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Richte ein neues Foto-Aufgaben-Event für deine Gäste ein
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Event-Informationen
            </h2>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Event-Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Mein tolles Event"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  Event-Link *
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/event/
                  </span>
                  <input
                    type="text"
                    id="slug"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="flex-1 block w-full border-gray-300 rounded-none rounded-r-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="mein-tolles-event"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Dies wird die Web-Adresse für dein Event. Gäste können sie direkt aufrufen oder über QR-Code scannen.
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten
                </p>
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Event-Art
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {EVENT_TYPES.find(t => t.value === formData.type)?.description}
                </p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Deine E-Mail-Adresse *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="deine@email.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                  <strong>Wichtig:</strong> Speichere diese E-Mail! Du brauchst sie, um von anderen Geräten auf dein Event zuzugreifen.
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Beschreibung (Optional)
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Erzähle deinen Gästen von diesem Event..."
                />
              </div>
            </div>
          </div>

          {/* Photo Prompts */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Foto-Aufgaben
            </h2>
            
            
            <div className="space-y-4 mb-6">
              {prompts.map((prompt, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm text-gray-900">{prompt}</span>
                  <button
                    type="button"
                    onClick={() => removePrompt(index)}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <input
                type="text"
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="Neue Foto-Aufgabe hinzufügen..."
                className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPrompt())}
              />
              <button
                type="button"
                onClick={addPrompt}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-3">
            <Link
              href="/"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.slug || !formData.email}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSubmitting ? 'Erstelle...' : 'Event erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}