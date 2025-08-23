// app/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  Camera,
  CheckCircle2,
  Download,
  Eye,
  Heart,
  Sparkles,
  X,
} from "lucide-react";


export default async function HomePage() {
  const session = await getServerSession(authOptions);
  return (
    <div className="min-h-screen bg-stone-50 antialiased">
      {/* Background glow layers */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(800px 400px at 20% 10%, rgba(244,114,182,0.15), transparent 60%), radial-gradient(700px 300px at 80% 20%, rgba(251,191,36,0.10), transparent 60%)",
        }}
      />

      {/* Header / Nav */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/60 border-b border-stone-200/60">
        <div className="container mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-rose-600" />
            <span className="text-sm font-semibold uppercase tracking-widest text-rose-600">
              Traumtag Momente
            </span>
          </div>
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
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
            {session?.user?.id ? (
              <Link
                href="/dashboard"
                className="rounded-full px-4 py-2 text-sm bg-white/80 ring-1 ring-stone-200 hover:bg-white transition text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                Zum Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                className="rounded-full px-4 py-2 text-sm bg-white/80 ring-1 ring-stone-200 hover:bg-white transition text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                Anmelden
              </Link>
            )}
            <Link
              href="/dashboard/create"
              className="inline-flex items-center gap-2 rounded-full px-4 sm:px-5 py-2.5 bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              Jetzt Hochzeits‑Event erstellen
              <Heart className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative">
          <div className="container mx-auto max-w-6xl px-4 pt-16 pb-10 md:pt-24 md:pb-16">
            <div className="mx-auto max-w-4xl text-center">
              <div className="flex items-center justify-center gap-2 text-rose-600 mb-5">
                <Sparkles className="w-6 h-6" />
                <span className="uppercase tracking-widest text-xs md:text-sm font-semibold">
                  Traumtag Momente
                </span>
                <Sparkles className="w-6 h-6" />
              </div>
              <h1 className="font-serif text-4xl leading-[1.1] md:text-6xl font-bold tracking-tight text-stone-900">
                Romantische Foto-Aufgaben für eure Hochzeit –{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-400">
                  echte Momente, gemeinsam gesammelt
                </span>
              </h1>
              <p className="mt-6 text-base md:text-xl text-stone-700 leading-relaxed">
                Verwandelt eure Gäste in Geschichtenerzähler. Mit liebevollen
                Foto‑Aufgaben, sofortigen Uploads und einer gemeinsamen, eleganten
                Galerie für alle unvergesslichen Augenblicke.
              </p>

              {/* Soft badge */}
              <div className="mt-6 inline-flex items-center gap-2 rounded-full ring-1 ring-stone-200 bg-white/80 px-4 py-1.5 text-sm text-stone-700 backdrop-blur-xl">
                <Heart className="h-4 w-4 text-rose-600" />
                Für Paare, die Erinnerungen feiern
              </div>

              {/* CTA group */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link
                  href="/dashboard/create"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-[0_6px_20px_-6px_rgba(28,25,23,0.4)]"
                >
                  Hochzeits‑Event starten
                  <Heart className="h-5 w-5" />
                </Link>
                <a
                  href="#wie-es-funktioniert"
                  className="rounded-2xl ring-1 ring-stone-200 bg-white/80 hover:bg-white transition px-5 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300 w-full sm:w-auto text-center"
                >
                  Mehr erfahren
                </a>
              </div>
            </div>

            {/* Glass Feature / Prompt Card */}
            <div className="relative mx-auto mt-16 max-w-2xl">
              <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-rose-300/40 via-rose-400/40 to-amber-300/40 blur-xl" />
              <div className="relative glass-card">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="h-12 w-12 rounded-full bg-rose-600 shadow-lg shadow-rose-600/20 flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-stone-800 font-medium">
                      Beispiel‑Aufgabe: „Ein Foto vom ersten Tanz“
                    </p>
                    <p className="text-sm text-stone-600">
                      Gäste laden mobil hoch – mit Namen und kleinem Gruß.
                    </p>
                  </div>
                  <div className="hidden sm:flex">
                    <a
                      href="#funktionen"
                      className="rounded-full px-4 py-2 text-sm bg-white/80 ring-1 ring-stone-200 hover:bg-white transition text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
                    >
                      Zu den Funktionen
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Three-step How It Works */}
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

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="relative group">
              <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-rose-300/0 via-rose-400/0 to-amber-300/0 blur-xl group-hover:from-rose-300/30 group-hover:via-rose-400/30 group-hover:to-amber-300/30 transition" />
              <div className="relative glass-card p-6">
                <div className="h-12 w-12 bg-rose-100 rounded-full flex items-center justify-center">
                  <Heart className="h-6 w-6 text-rose-600" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-stone-900">
                  1) Foto-Aufgaben erstellen
                </h3>
                <p className="mt-2 text-stone-700">
                  Wählt romantische Prompts aus oder schreibt eigene Ideen –
                  perfekt für euren Tag.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-rose-300/0 via-rose-400/0 to-amber-300/0 blur-xl group-hover:from-rose-300/30 group-hover:via-rose-400/30 group-hover:to-amber-300/30 transition" />
              <div className="relative glass-card p-6">
                <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Camera className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-stone-900">
                  2) Gäste einladen
                </h3>
                <p className="mt-2 text-stone-700">
                  Teilt QR-Codes – Gäste scannen, fotografieren und laden direkt hoch.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-rose-300/0 via-rose-400/0 to-amber-300/0 blur-xl group-hover:from-rose-300/30 group-hover:via-rose-400/30 group-hover:to-amber-300/30 transition" />
              <div className="relative glass-card p-6">
                <div className="h-12 w-12 bg-rose-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-rose-600" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-stone-900">
                  3) Erinnerungen genießen
                </h3>
                <p className="mt-2 text-stone-700">
                  Alle Bilder in eurer eleganten Galerie ansehen, teilen und
                  herunterladen.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Split: Why Traumtag Momente */}
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

        {/* Gallery Teaser */}
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
                className="group relative overflow-hidden rounded-3xl bg-white/80 ring-1 ring-stone-200 backdrop-blur-xl shadow-sm"
              >
                <div className="aspect-[4/3] bg-stone-200">
                  {/* Use next/image in real app */}
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition duration-300" />
                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition">
                  <button
                    aria-label="Bild ansehen"
                    className="rounded-full bg-white/90 backdrop-blur-xl shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  >
                    <Eye className="h-5 w-5 text-stone-900" />
                  </button>
                </div>
                <div className="absolute left-3 bottom-3 flex items-center gap-2">
                  <a
                    href={`/api/download?url=${encodeURIComponent(img.src)}`}
                    className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 px-3 py-1 text-xs ring-1 ring-rose-200 hover:bg-rose-100 transition"
                    download
                  >
                    <Download className="h-3.5 w-3.5" />
                    Herunterladen
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="container mx-auto max-w-6xl px-4 pb-24">
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-rose-300/40 via-rose-400/40 to-amber-300/40 blur-xl" />
            <div className="relative glass-card p-8 md:p-12 text-center">
              <div className="mx-auto inline-flex items-center gap-2 text-rose-600">
                <Sparkles className="h-5 w-5" />
                <span className="uppercase tracking-widest text-xs font-semibold">
                  Startet jetzt
                </span>
              </div>
              <h3 className="mt-4 font-serif text-3xl md:text-4xl font-bold tracking-tight text-stone-900">
                Erstellt eure Hochzeits-Foto-Aufgaben in Minuten
              </h3>
              <p className="mt-3 text-stone-700">
                Intuitive Erstellung, QR-Codes zum Teilen, elegante Galerie –
                alles an einem Ort.
              </p>
              <div className="mt-8">
                <Link
                  href="/dashboard/create"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-rose-300"
                >
                  Zum Erstellen
                  <Heart className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="flex items-center justify-center gap-2 text-rose-600">
              <Heart className="w-5 h-5" />
              <h3 className="text-base font-semibold text-stone-900">
                Traumtag Momente
              </h3>
              <Heart className="w-5 h-5" />
            </div>
            <p className="text-sm text-stone-600">
              Hochzeiten unvergesslicher machen – ein Herzensmoment nach dem
              anderen.
            </p>
            <div className="mt-2 text-xs text-stone-500">
              <a href="#funktionen" className="hover:text-stone-700">
                Funktionen
              </a>{" "}
              •{" "}
              <a href="#wie-es-funktioniert" className="hover:text-stone-700">
                Ablauf
              </a>{" "}
              •{" "}
              <a href="#galerie" className="hover:text-stone-700">
                Galerie
              </a>
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

