import Link from 'next/link'
import { Camera, Users, Sparkles, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
              Mache Eventfotografie zu einem{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                interaktiven Spiel
              </span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-8">
              Ermutige Gäste zum Networken, halte spontane Momente fest und hilf 
              Veranstaltern mühelos unvergessliche Fotos zu sammeln - mit spaßigen Foto-Aufgaben.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4 flex-col sm:flex-row">
              <Link
                href="/dashboard/create"
                className="inline-flex items-center px-6 py-3 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Events erstellen
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-lg font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Mehr erfahren
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              So funktioniert's
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Einfache Schritte, um jedes Event in ein spannendes Foto-Erlebnis zu verwandeln
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Foto-Aufgaben erstellen
              </h3>
              <p className="mt-4 text-gray-600">
                Gestalte spaßige, anpassbare Aufgaben für dein Event. 
                Von Hochzeiten bis Firmenevents - wir haben Vorlagen für den Start.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                <Camera className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                QR-Codes teilen
              </h3>
              <p className="mt-4 text-gray-600">
                Erstelle QR-Codes für Tischkarten oder Armbänder. 
                Gäste scannen, sehen Aufgaben und laden sofort Fotos hoch - keine App nötig.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Sammeln & Teilen
              </h3>
              <p className="mt-4 text-gray-600">
                Betrachte alle Fotos in einer einheitlichen Galerie. 
                Downloade, teile und erlebe die Erinnerungen mit organisierten Sammlungen.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">
                Warum Event-Foto-Aufgaben?
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Eisbrecher-Mechanik
                    </h3>
                    <p className="text-gray-600">
                      Ermutige Gäste, auf neue Leute zuzugehen und durch gemeinsame Foto-Aktivitäten bedeutungsvolle Verbindungen zu schaffen.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Mobile-First Erlebnis
                    </h3>
                    <p className="text-gray-600">
                      Nahtloser Ablauf ohne App-Installation. Funktioniert auf jedem Smartphone mit nur Kamera und Browser.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Zentrale Foto-Sammlung
                    </h3>
                    <p className="text-gray-600">
                      Schluss mit der Jagd nach verstreuten Bilddateien. Eine zentrale Galerie für alle Event-Fotos.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 lg:mt-0">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">
                  Bereit loszulegen?
                </h3>
                <p className="text-blue-100 mb-6">
                  Erstelle dein erstes Event in Minuten und sieh zu, wie sich deine Gäste 
                  engagieren wie nie zuvor.
                </p>
                <Link
                  href="/dashboard/create"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-600 focus:ring-white transition-colors"
                >
                  Dein erstes Event erstellen
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Event-Foto-Aufgaben
            </h3>
            <p className="text-gray-600">
              Events unvergesslicher machen - ein Foto nach dem anderen.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}