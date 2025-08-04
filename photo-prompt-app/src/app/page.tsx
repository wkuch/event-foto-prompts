import Link from 'next/link'
import { Camera, Users, Sparkles, ArrowRight, Heart } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-center gap-2 text-rose-600 mb-6">
              <Sparkles className="w-6 h-6" />
              <span className="uppercase tracking-widest text-sm font-semibold">
                Wedding Moments
              </span>
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
              Haltet eure Hochzeitsmomente{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">
                für die Ewigkeit fest
              </span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-8">
              Verwandelt eure Hochzeitsgäste zu Fotografen, sammelt unvergessliche Momente 
              und erschafft gemeinsam ein einzigartiges Hochzeitsalbum - mit liebevoll kuratierten Foto-Aufgaben.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4 flex-col sm:flex-row">
              <Link
                href="/dashboard/create"
                className="inline-flex items-center px-6 py-3 border border-transparent text-lg font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors"
              >
Hochzeits-Fotomomente erstellen
                <Heart className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-lg font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors"
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
              Drei einfache Schritte zu unvergesslichen Hochzeits-Erinnerungen
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-rose-100 rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Hochzeits-Aufgaben erstellen
              </h3>
              <p className="mt-4 text-gray-600">
                Gestaltet romantische, persönliche Foto-Aufgaben für euren großen Tag. 
                Von ersten Küssen bis zu Tanzszenen - wir haben liebevolle Vorlagen für euch.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
                <Camera className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Gäste zum Mitmachen einladen
              </h3>
              <p className="mt-4 text-gray-600">
                Platziert QR-Codes auf Tischkarten oder im Programmheft. 
                Eure Gäste scannen, sehen die Aufgaben und werden zu euren persönlichen Hochzeitsfotografen.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-rose-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Momente für immer bewahren
              </h3>
              <p className="mt-4 text-gray-600">
                Betrachtet alle Hochzeitsfotos in einer wunderschönen Galerie. 
                Ladet sie herunter, teilt sie mit Familie und Freunden - eure Liebesgeschichte in Bildern.
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
                Warum Wedding Moments?
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-rose-600 rounded-full"></div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Gäste werden zu Geschichtenerzählern
                    </h3>
                    <p className="text-gray-600">
                      Verwandelt schüchterne Gäste in aktive Teilnehmer eurer Liebesgeschichte. 
                      Foto-Aufgaben schaffen Verbindungen und unvergessliche Momente.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Einfach für jeden Gast
                    </h3>
                    <p className="text-gray-600">
                      Keine App-Installation nötig. Eure Gäste brauchen nur ihr Smartphone - 
                      QR-Code scannen, Aufgabe lesen, Foto machen, fertig!
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-rose-600 rounded-full"></div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Euer komplettes Hochzeitsalbum
                    </h3>
                    <p className="text-gray-600">
                      Nie wieder verlorene Hochzeitsfotos! Alle Bilder landen automatisch 
                      in eurer privaten Galerie - für immer und überall verfügbar.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 lg:mt-0">
              <div className="bg-gradient-to-r from-rose-500 to-amber-500 rounded-lg p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">
                  Bereit für unvergessliche Hochzeitsfotos?
                </h3>
                <p className="text-rose-100 mb-6">
                  Erstellt in wenigen Minuten Foto-Aufgaben für eure Gäste und sammelt wunderschöne Erinnerungen. 
                  Macht eure Hochzeit unvergesslich - für alle.
                </p>
                <Link
                  href="/dashboard/create"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-rose-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-rose-600 focus:ring-white transition-colors"
                >
Foto-Aufgaben für eure Hochzeit
                  <Heart className="ml-2 w-5 h-5" />
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
            <div className="flex items-center justify-center gap-2 text-rose-600 mb-4">
              <Heart className="w-5 h-5" />
              <h3 className="text-lg font-semibold text-gray-900">
                Wedding Moments
              </h3>
              <Heart className="w-5 h-5" />
            </div>
            <p className="text-gray-600">
              Hochzeiten unvergesslicher machen - ein Herzensmoment nach dem anderen.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}