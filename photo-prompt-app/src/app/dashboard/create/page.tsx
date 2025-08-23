'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { ArrowLeft, Plus, X, Loader2, Heart, Sparkles, Camera } from 'lucide-react'
import { BulkPromptsDialog, BulkPromptsTrigger } from '@/components/BulkPromptsDialog'
import { useBulkPrompts } from '@/hooks/useBulkPrompts'

const EVENT_TYPES = [
  { value: 'wedding', label: 'Hochzeit', description: 'Euer großer Tag – romantische Aufgaben für unvergessliche Momente' },
  { value: 'engagement', label: 'Verlobung', description: 'Feiert den Antrag und die Vorfreude' },
  { value: 'anniversary', label: 'Jahrestag', description: 'Erinnerungen neu aufleben lassen' },
  { value: 'rehearsal', label: 'Polterabend', description: 'Locker und fröhlich – die Generalprobe' },
  { value: 'general', label: 'Andere Feier', description: 'Passend für jede besondere Gelegenheit' },
]

const DEFAULT_PROMPTS = {
  wedding: [
    'Macht ein Foto mit dem Brautpaar - fangt ihre Freude ein',
    'Haltet den ersten Tanz oder einen romantischen Tanzmoment fest',
    'Fotografiert euch mit jemandem, den ihr heute zum ersten Mal getroffen habt',
    'Macht ein Bild von den schönsten Blumen oder der Dekoration',
    'Fangt einen Moment der Freudentränen ein',
    'Fotografiert das Brautpaar beim Kuchenanschnitt',
    'Macht ein Selfie mit eurer schönsten Hochzeitsoutfit-Details',
    'Haltet einen Moment beim Gratulieren oder Anstoßen fest'
  ],
  engagement: [
    'Fotografiert den wunderschönen Verlobungsring',
    'Macht ein Foto beim Anstoßen auf die Verlobung',
    'Haltet die Reaktion der Familie beim Verkünden fest',
    'Fotografiert das glückliche Paar beim Kuscheln',
    'Macht ein Bild von den Glückwunschkarten oder Geschenken'
  ],
  anniversary: [
    'Fotografiert das Paar bei einem zärtlichen Moment',
    'Macht ein Bild vom Hochzeitsfoto aus vergangenen Jahren',
    'Haltet einen Toast auf die Liebe fest',
    'Fotografiert romantische Details oder Erinnerungsstücke',
    'Macht ein Gruppenfoto aller Anwesenden'
  ],
  rehearsal: [
    'Fotografiert die Aufregung vor der Hochzeit',
    'Macht ein lustiges Gruppenfoto mit den Trauzeugen',
    'Haltet spontane Lachmomente fest',
    'Fotografiert beim Proben der Zeremonie',
    'Macht ein Bild vom gemeinsamen Anstoßen'
  ],
  general: [
    'Macht ein Foto mit jemandem Besonderen',
    'Haltet einen unvergesslichen Moment fest',
    'Fotografiert die schönste Dekoration oder Details',
    'Macht ein Gruppenfoto mit euren Liebsten',
    'Fangt die Atmosphäre der Feier ein'
  ]
}

export default function CreateEventPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'wedding',
    description: '',
    email: '',
  })
  const [prompts, setPrompts] = useState<string[]>(DEFAULT_PROMPTS.wedding)
  const [newPrompt, setNewPrompt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [promptErrors, setPromptErrors] = useState<string[]>([])

  // Bulk prompts hook
  const bulkPrompts = useBulkPrompts({
    existingPrompts: prompts,
    onPromptsAdded: (newPrompts) => {
      setPrompts(prev => [...prev, ...newPrompts])
    },
    onError: setError
  })

  // Derived validation state
  const slugValid = useMemo(() => /^[a-z0-9-]+$/.test(formData.slug) && formData.slug.length >= 3, [formData.slug])
  const emailValid = useMemo(() => /.+@.+\..+/.test(formData.email), [formData.email])
  const nameValid = useMemo(() => formData.name.trim().length >= 3, [formData.name])


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

      const { event, requiresSignIn } = await eventResponse.json()

      // Check if all prompts were created successfully
      const expectedPromptCount = prompts.length
      const actualPromptCount = event.prompts?.length || 0
      
      if (actualPromptCount < expectedPromptCount) {
        const failedPrompts = prompts.slice(actualPromptCount)
        setPromptErrors(failedPrompts)
      }

      // Show success message
      setSuccess(true)
      
      // Auto-trigger NextAuth email signin (same as /auth/signin page)
      if (requiresSignIn) {
        console.log('Event created, auto-triggering email signin...')
        try {
          await signIn('email', {
            email: formData.email.trim(),
            redirect: false,
            callbackUrl: '/dashboard',
          })
          console.log('✅ Magic link sent successfully')
        } catch (signInError) {
          console.error('Failed to send magic link:', signInError)
          // Don't break the flow if signin fails
        }
        return
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-rose-600" />
          </div>

          <h1 className="text-2xl font-serif font-semibold text-stone-900 mb-3">
            Foto‑Aufgaben erfolgreich erstellt 💕
          </h1>

          <p className="text-stone-700 mb-6">
            Eure Foto‑Aufgaben sind bereit! <strong>Bitte prüft eure E‑Mails</strong> für den Anmelde‑Link, um eure Events zu verwalten.
          </p>

          {promptErrors.length > 0 && (
            <div className="bg-amber-50 ring-1 ring-amber-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-amber-800 font-medium mb-2">
                Einige Foto‑Aufgaben konnten nicht erstellt werden:
              </p>
              <ul className="text-xs text-amber-800 space-y-1">
                {promptErrors.map((prompt, index) => (
                  <li key={index}>• {prompt}</li>
                ))}
              </ul>
              <p className="text-xs text-amber-800 mt-2">
                Ihr könnt sie später im Event‑Dashboard manuell hinzufügen.
              </p>
            </div>
          )}

          <div className="bg-rose-50 ring-1 ring-rose-200 rounded-xl p-4">
            <p className="text-sm text-rose-800">
              <strong>📧 E‑Mail mit Anmelde‑Link wurde versendet</strong>
            </p>
            <p className="text-xs text-rose-700 mt-1">
              Klickt auf den Link in eurer E‑Mail, um euch anzumelden und eure Events zu verwalten.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 border-b border-stone-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4 gap-3">
            <Link href="/" className="p-2 rounded-md text-stone-500 hover:text-stone-800 hover:bg-white/70 ring-1 ring-transparent hover:ring-stone-200">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2 text-rose-600">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-widest">Traumtag Momente</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-stone-900">
            Foto‑Aufgaben für euer Hochzeits‑Event
          </h1>
          <p className="mt-2 text-stone-700">
            Erstellt euren Link, wählt die Feier und startet mit liebevollen Foto‑Aufgaben.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="ring-1 ring-red-200 bg-red-50 rounded-xl p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-6">Eventdetails</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-stone-800">Event‑Name *</label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="mt-1 block w-full rounded-xl border-stone-300 focus:ring-rose-300 focus:border-rose-400 bg-white/80 px-3 py-2.5 leading-6 appearance-none"
                  placeholder="Anna & Ben – Hochzeit"
                />
                {!nameValid && (
                  <p className="mt-1 text-xs text-red-600">Bitte gebt mindestens 3 Zeichen ein.</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="slug" className="block text-sm font-medium text-stone-800">Hochzeits‑Link *</label>
                <div className="mt-1 flex items-center rounded-xl ring-1 ring-stone-200 bg-white/80 overflow-hidden">
                  <span className="inline-flex items-center px-3 text-stone-600 text-sm whitespace-nowrap max-w-[50%] truncate">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://traumtag-momente.de'}/event/
                  </span>
                  <input
                    type="text"
                    id="slug"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="flex-1 block w-full focus:outline-none px-3 py-2.5 leading-6 bg-transparent appearance-none min-h-[44px] min-w-0"
                    placeholder="anna-ben-hochzeit"
                    aria-invalid={!slugValid}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-stone-600">Gäste rufen den Link direkt auf oder scannen euren QR‑Code.</p>
                  {!slugValid && (
                    <p className="text-xs text-red-600">Nur Kleinbuchstaben, Zahlen und Bindestriche, mind. 3 Zeichen.</p>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <p className="block text-sm font-medium text-stone-800 mb-2">Feier auswählen</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {EVENT_TYPES.map((type) => {
                    const isActive = formData.type === type.value
                    return (
                      <button
                        type="button"
                        key={type.value}
                        onClick={() => handleTypeChange(type.value)}
                        className={`text-left rounded-xl ring-1 p-4 transition ${
                          isActive
                            ? 'ring-rose-300 bg-rose-50'
                            : 'ring-stone-200 bg-white/80 hover:bg-white'
                        }`}
                        aria-pressed={isActive}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isActive ? 'bg-rose-100' : 'bg-stone-100'}`}>
                            {type.value === 'wedding' ? (
                              <Heart className={`w-5 h-5 ${isActive ? 'text-rose-600' : 'text-stone-700'}`} />
                            ) : type.value === 'engagement' ? (
                              <Sparkles className={`w-5 h-5 ${isActive ? 'text-rose-600' : 'text-stone-700'}`} />
                            ) : type.value === 'rehearsal' ? (
                              <Camera className={`w-5 h-5 ${isActive ? 'text-rose-600' : 'text-stone-700'}`} />
                            ) : (
                              <Sparkles className={`w-5 h-5 ${isActive ? 'text-rose-600' : 'text-stone-700'}`} />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-stone-900">{type.label}</p>
                            <p className="text-xs text-stone-600">{type.description}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-stone-800">E‑Mail‑Adresse *</label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full rounded-xl border-stone-300 focus:ring-rose-300 focus:border-rose-400 bg-white/80 px-3 py-2.5 leading-6 appearance-none"
                  placeholder="anna@beispiel.de"
                  aria-invalid={!emailValid}
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-stone-600">Merkt euch diese E‑Mail‑Adresse – damit könnt ihr später auch von anderen Geräten auf euer Event zugreifen.</p>
                  {!emailValid && <p className="text-xs text-red-600">Bitte gebt eine gültige E‑Mail ein.</p>}
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-stone-800">Beschreibung (optional)</label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full rounded-xl border-stone-300 focus:ring-rose-300 focus:border-rose-400 bg-white/80 px-3 py-2.5 leading-6 appearance-none"
                  placeholder="Ein Satz zu eurer Feier …"
                />
              </div>
            </div>
          </div>

          {/* Foto‑Aufgaben */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-stone-900">Foto‑Aufgaben</h2>
              <div className="flex items-center gap-3">
                <p className="text-xs text-stone-600">{prompts.length} Aufgaben</p>
                <BulkPromptsTrigger onClick={bulkPrompts.openDialog} />
              </div>
            </div>

            <p className="text-sm text-stone-700 mb-4">Startet mit Vorschlägen passend zu eurer Feier. Ihr könnt jederzeit anpassen.</p>

            <div className="space-y-3 mb-6">
              {prompts.map((prompt, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-xl ring-1 ring-stone-200 bg-white/80">
                  <span className="flex-shrink-0 w-6 h-6 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm text-stone-900">{prompt}</span>
                  <button
                    type="button"
                    onClick={() => removePrompt(index)}
                    className="flex-shrink-0 p-1 text-stone-500 hover:text-rose-600"
                    aria-label="Aufgabe entfernen"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="Neue Foto‑Aufgabe hinzufügen …"
                className="flex-1 rounded-xl ring-1 ring-stone-200 bg-white/80 px-3 py-2.5 leading-6 focus:outline-none focus:ring-2 focus:ring-rose-300 appearance-none"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPrompt())}
              />
              <button
                type="button"
                onClick={addPrompt}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 bg-stone-900 text-white hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                <Plus className="w-4 h-4" />
                Hinzufügen
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl ring-1 ring-stone-200 bg-white/80 text-stone-800 hover:bg-white focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !nameValid || !slugValid || !emailValid}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-stone-900 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Erstelle …' : 'Foto‑Aufgaben erstellen'}
            </button>
          </div>
        </form>

        {/* Bulk Prompts Dialog */}
        <BulkPromptsDialog
          isOpen={bulkPrompts.isDialogOpen}
          onOpenChange={bulkPrompts.closeDialog}
          bulkText={bulkPrompts.bulkText}
          onBulkTextChange={bulkPrompts.setBulkText}
          onFileUpload={bulkPrompts.handleFileUpload}
          parsedPrompts={bulkPrompts.parsedPrompts}
          isProcessing={bulkPrompts.isProcessing}
          results={bulkPrompts.results}
          onSubmit={bulkPrompts.processBulkPrompts}
        />
      </div>
    </div>
  )
}