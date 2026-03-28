// app/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import RevealOnScroll from "@/components/RevealOnScroll";
import {
  Camera,
  CheckCircle2,
  Heart,
} from "lucide-react";


export default async function HomePage() {
  const session = await getServerSession(authOptions);
  return (
    <div className="min-h-screen bg-stone-50 antialiased">
      {/* Watercolor background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/background.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'top center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.18,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/80" />
      </div>

      {/* Header / Nav */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/60 border-b border-stone-200/60">
        <div className="container mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Heart className="h-4 w-4 text-rose-500 transition-transform group-hover:scale-110" />
            <span className="font-serif text-lg font-semibold text-stone-900">
              Traumtag Momente
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-stone-700">
            <a
              href="#funktionen"
              className="hover:text-stone-900 transition-colors"
            >
              Funktionen
            </a>
            <a
              href="#wie-es-funktioniert"
              className="hover:text-stone-900 transition-colors"
            >
              Ablauf
            </a>
            <a
              href="#galerie"
              className="hover:text-stone-900 transition-colors"
            >
              Galerie
            </a>
          </nav>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
            {session?.user?.id ? (
              <Link
                href="/dashboard"
                className="rounded-full px-4 py-2 text-sm bg-white/80 ring-1 ring-stone-200 hover:bg-white transition text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300 w-full sm:w-auto text-center"
              >
                Zum Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                className="rounded-full px-4 py-2 text-sm bg-white/80 ring-1 ring-stone-200 hover:bg-white transition text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300 w-full sm:w-auto text-center"
              >
                Anmelden
              </Link>
            )}
            <Link
              href="/dashboard/create"
              className="inline-flex items-center gap-2 rounded-full px-4 sm:px-5 py-2.5 bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-rose-300 w-full sm:w-auto justify-center"
            >
              <span className="sm:hidden">Event erstellen</span>
              <span className="hidden sm:inline">Jetzt Hochzeits‑Event erstellen</span>
              <Heart className="h-4 w-4 hidden sm:inline" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          {/* Hero image */}
          <div className="absolute inset-0 z-0" aria-hidden>
            <img
              src="/hero.png"
              alt=""
              className="h-full w-full object-cover object-[center_30%] animate-fade-in"
              style={{ filter: 'saturate(1.1) brightness(1.05)' }}
            />
            {/* Gradient overlays for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/75 to-white/30 md:from-white/95 md:via-white/80 md:to-white/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/50" />
          </div>

          <div className="relative z-10 container mx-auto max-w-6xl px-4 pt-20 pb-16 md:pt-32 md:pb-28 lg:pt-40 lg:pb-36">
            <div className="max-w-2xl">
              <div className="animate-fade-up stagger-1 mb-5">
                <div className="inline-flex items-center gap-3">
                  <div className="h-px w-8 bg-rose-300/70" />
                  <span className="text-xs font-medium tracking-[0.2em] uppercase text-stone-500">
                    Foto-Gästebuch
                  </span>
                  <div className="h-px w-8 bg-rose-300/70" />
                </div>
              </div>
              <h1 className="animate-fade-up stagger-2 font-serif text-4xl leading-[1.08] md:text-6xl lg:text-7xl font-bold tracking-tight text-stone-900">
                Eure Gäste erzählen{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-rose-500 to-amber-400">
                  eure Geschichte
                </span>
              </h1>
              <p className="animate-fade-up stagger-3 mt-6 max-w-lg text-base md:text-lg text-stone-600 leading-relaxed">
                Romantische Foto‑Aufgaben, die eure Gäste zu Geschichtenerzählern
                machen. Alle Bilder in einer gemeinsamen Galerie&nbsp;–
                ohne App, einfach per QR‑Code.
              </p>

              {/* CTA group */}
              <div className="animate-fade-up stagger-4 mt-10 flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <Link
                  href="/dashboard/create"
                  className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-[0_8px_24px_-8px_rgba(28,25,23,0.45)]"
                >
                  Kostenlos starten
                  <Heart className="h-4 w-4 transition-transform group-hover:scale-110" />
                </Link>
                <a
                  href="#wie-es-funktioniert"
                  className="rounded-full ring-1 ring-stone-200 bg-white/80 hover:bg-white transition px-6 py-3.5 text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
                >
                  So funktioniert's
                </a>
              </div>

              <p className="animate-fade-up stagger-5 mt-5 text-xs text-stone-400">
                Kostenlos &middot; Keine App nötig &middot; In 2 Minuten startklar
              </p>
            </div>
          </div>
        </section>

        {/* Three-step How It Works */}
        <RevealOnScroll>
        <section
          id="wie-es-funktioniert"
          className="container mx-auto max-w-6xl px-4 py-16 md:py-20"
        >
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-stone-900">
              In drei Schritten zur magischen Galerie
            </h2>
            <p className="mt-4 text-stone-700">
              Einfach, schnell und für alle Gäste zugänglich – ohne App.
            </p>
          </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch">
            <div className="relative group h-full">
              <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-rose-300/0 via-rose-400/0 to-amber-300/0 blur-xl group-hover:from-rose-300/30 group-hover:via-rose-400/30 group-hover:to-amber-300/30 transition" />
              <div className="relative glass-card p-6 h-full flex flex-col">
                <div className="h-12 w-12 bg-rose-100 rounded-full flex items-center justify-center">
                  <Heart className="h-6 w-6 text-rose-600" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-stone-900">
                  Foto-Aufgaben erstellen
                </h3>
                <p className="mt-2 text-stone-700">
                  Wählt romantische Prompts aus oder schreibt eigene Ideen –
                  perfekt für euren Tag.
                </p>
              </div>
            </div>

            <div className="relative group h-full">
              <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-rose-300/0 via-rose-400/0 to-amber-300/0 blur-xl group-hover:from-rose-300/30 group-hover:via-rose-400/30 group-hover:to-amber-300/30 transition" />
              <div className="relative glass-card p-6 h-full flex flex-col">
                <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Camera className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-stone-900">
                  Gäste einladen
                </h3>
                <p className="mt-2 text-stone-700">
                  Teilt QR-Codes – Gäste scannen, fotografieren und laden direkt hoch.
                </p>
              </div>
            </div>

            <div className="relative group h-full">
              <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-rose-300/0 via-rose-400/0 to-amber-300/0 blur-xl group-hover:from-rose-300/30 group-hover:via-rose-400/30 group-hover:to-amber-300/30 transition" />
              <div className="relative glass-card p-6 h-full flex flex-col">
                <div className="h-12 w-12 bg-rose-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-rose-600" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-stone-900">
                  Erinnerungen genießen
                </h3>
                <p className="mt-2 text-stone-700">
                  Alle Bilder in eurer eleganten Galerie ansehen, teilen und
                  herunterladen.
                </p>
              </div>
            </div>
          </div>
        </section>
        </RevealOnScroll>

        {/* Feature Split: Why Traumtag Momente */}
        <RevealOnScroll>
        <section
          id="funktionen"
          className="container mx-auto max-w-6xl px-4 py-16 md:py-20"
        >
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Copy */}
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-stone-900">
                Warum Traumtag Momente?
              </h2>
              <div className="mt-8 space-y-6">
                <FeaturePoint
                  title="Gäste werden zu Geschichtenerzählern"
                  description="Foto-Aufgaben schaffen Verbindung und motivieren zu ehrlichen, herzlichen Momenten – fernab der Standardposen."
                />
                <FeaturePoint
                  title="Einfach für alle – ohne App"
                  description="Smartphone genügt. QR-Code scannen, Aufgabe lesen, Foto machen, fertig."
                  tone="amber"
                />
                <FeaturePoint
                  title="Alles an einem Ort"
                  description="Alle Bilder landen automatisch in einer gemeinsamen, wunderschönen Galerie – jederzeit abrufbar."
                />
              </div>
            </div>

            {/* Accent card */}
            <div className="relative">
              <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-rose-300/40 via-rose-400/40 to-amber-300/40 blur-xl" />
              <div className="relative glass-card p-8">
                <h3 className="font-serif text-2xl font-semibold text-stone-900">
                  3 Schritte zu unvergesslichen Hochzeitsfotos
                </h3>
                <p className="mt-3 text-stone-700">
                  So einfach geht's: Foto-Aufgaben erstellen, Gäste fotografieren lassen, automatische Galerie genießen.
                </p>

                {/* Simple step flow */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-3">
                      <span className="text-lg font-bold text-rose-600">1</span>
                    </div>
                    <h4 className="font-semibold text-stone-900 text-sm">Aufgaben erstellen</h4>
                    <p className="text-xs text-stone-600 mt-1">In 2 Minuten fertig</p>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                      <span className="text-lg font-bold text-amber-600">2</span>
                    </div>
                    <h4 className="font-semibold text-stone-900 text-sm">Gäste fotografieren</h4>
                    <p className="text-xs text-stone-600 mt-1">QR-Code scannen & hochladen</p>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-3">
                      <span className="text-lg font-bold text-rose-600">3</span>
                    </div>
                    <h4 className="font-semibold text-stone-900 text-sm">Automatische Galerie</h4>
                    <p className="text-xs text-stone-600 mt-1">Alle Fotos an einem Ort</p>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <Link
                    href="/dashboard/create"
                    className="inline-flex items-center gap-2 rounded-full px-6 py-3 bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-lg"
                  >
                    Jetzt Hochzeits-Event starten
                    <Heart className="h-5 w-5" />
                  </Link>
                  <p className="mt-2 text-xs text-stone-600">Kostenlos • Keine Anmeldung für Gäste</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        </RevealOnScroll>

        {/* Gallery Teaser */}
        <RevealOnScroll>
        <section
          id="galerie"
          className="container mx-auto max-w-6xl px-4 py-16 md:py-20"
        >
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-stone-900">
              Eine Galerie, die eure Liebe widerspiegelt
            </h2>
            <p className="mt-4 text-stone-700">
              Eine klare, elegante Galerie – damit eure schönsten Momente im Mittelpunkt stehen.
            </p>
          </div>

            {/* Grid */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[ 
              { src: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1200&auto=format&fit=crop", alt: "Lächeln beim First Look" },
              { src: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop", alt: "Der erste Tanz" },
              { src: "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?q=80&w=1200&auto=format&fit=crop", alt: "Toast der Trauzeugen" },
              { src: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=1200&auto=format&fit=crop", alt: "Freunde auf der Tanzfläche" },
              { src: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop", alt: "Kuss im Sonnenuntergang" },
              { src: "https://images.unsplash.com/photo-1530808773500-f697df4bf53d?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", alt: "Lachen am Tisch" },
            ].map((img, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl shadow-sm"
              >
                <div className="aspect-[4/3] bg-stone-100">
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />
                <div className="absolute left-4 bottom-4 right-4 opacity-0 group-hover:opacity-100 transition duration-300">
                  <p className="text-sm font-medium text-white drop-shadow-sm">{img.alt}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        </RevealOnScroll>

        {/* CTA Banner */}
        <RevealOnScroll>
        <section className="container mx-auto max-w-6xl px-4 pb-24">
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-rose-300/40 via-rose-400/40 to-amber-300/40 blur-xl" />
            <div className="relative glass-card p-8 md:p-12 text-center">
              <h3 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-stone-900">
                Bereit für unvergessliche Momente?
              </h3>
              <p className="mt-3 text-stone-600 max-w-xl mx-auto">
                In 2 Minuten erstellt. Gäste scannen den QR‑Code und eure
                gemeinsame Galerie füllt sich von selbst.
              </p>
              <div className="mt-8">
                <Link
                  href="/dashboard/create"
                  className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-[0_8px_24px_-8px_rgba(28,25,23,0.45)]"
                >
                  Jetzt starten
                  <Heart className="h-4 w-4 transition-transform group-hover:scale-110" />
                </Link>
              </div>
            </div>
          </div>
        </section>
        </RevealOnScroll>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-xs h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" />
        <div className="container mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <span className="font-serif text-base font-semibold text-stone-800">
                Traumtag Momente
              </span>
            </div>
            <p className="text-sm text-stone-500">
              Erinnerungen, die bleiben.
            </p>
            <div className="mt-2 text-xs text-stone-500 flex flex-wrap items-center justify-center gap-2">
              <a href="#funktionen" className="hover:text-stone-700">
                Funktionen
              </a>
              <span>•</span>
              <a href="#wie-es-funktioniert" className="hover:text-stone-700">
                Ablauf
              </a>
              <span>•</span>
              <a href="#galerie" className="hover:text-stone-700">
                Galerie
              </a>
              <span>•</span>
              <Link href="/impressum" className="hover:text-stone-700">
                Impressum
              </Link>
              <span>•</span>
              <Link href="/datenschutz" className="hover:text-stone-700">
                Datenschutz
              </Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

function FeaturePoint({
  title,
  description,
  tone = "rose",
}: {
  title: string;
  description: string;
  tone?: "rose" | "amber";
}) {
  const dot =
    tone === "amber" ? (
      <div className="flex-shrink-0 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mt-1">
        <div className="w-2 h-2 bg-amber-500 rounded-full" />
      </div>
    ) : (
      <div className="flex-shrink-0 w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center mt-1">
        <div className="w-2 h-2 bg-rose-600 rounded-full" />
      </div>
    );

  return (
    <div className="flex items-start">
      {dot}
      <div className="ml-4">
        <h4 className="text-base md:text-lg font-semibold text-stone-900">
          {title}
        </h4>
        <p className="text-stone-700">{description}</p>
      </div>
    </div>
  );
}

