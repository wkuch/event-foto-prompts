import Link from "next/link";

export const metadata = {
  title: "Datenschutzerklärung – Traumtag Momente",
  description: "Informationen zur Verarbeitung personenbezogener Daten (DSGVO).",
};

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-stone-900">Datenschutzerklärung</h1>
        <p className="mt-2 text-stone-600 text-sm">Gültig für die Website traumtag-momente.de</p>

        <div className="mt-8 space-y-8 text-stone-800">
          <section className="rounded-2xl bg-amber-50 text-amber-900 ring-1 ring-amber-200 p-4">
            <h2 className="text-sm font-semibold">Hinweis: Beta</h2>
            <p className="mt-1 text-sm">Dieses Angebot befindet sich in einer Beta‑Phase. Es können sich kurzfristig Änderungen ergeben; Verfügbarkeit und Support sind eingeschränkt.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-stone-900">Verantwortlicher</h2>
            <p className="mt-2 whitespace-pre-line">
              {`Wanja Mensch\nIm Haberacker 3a\n76227 Karlsruhe\nDeutschland\nE‑Mail: wanjamensch@gmail.com`}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">Zwecke der Datenverarbeitung</h2>
            <ul className="mt-2 list-disc pl-6 space-y-1 text-stone-700">
              <li>Bereitstellung der Website und Grundfunktionen</li>
              <li>Erstellung und Verwaltung von Events (Foto‑Aufgaben)</li>
              <li>Ermöglichung von Foto‑Uploads durch Gäste</li>
              <li>Authentifizierung von Veranstalter‑Konten per Magic‑Link</li>
              <li>Darstellung und Verwaltung der gemeinsamen Galerie</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">Verarbeitete Datenkategorien</h2>
            <div className="mt-2 space-y-4 text-stone-700">
              <div>
                <h3 className="font-medium text-stone-900">Nutzungsdaten/Server‑Log</h3>
                <p className="mt-1">Bei Aufruf werden technisch notwendige Daten verarbeitet (z. B. IP‑Adresse, Zeitpunkt, User‑Agent) zur Bereitstellung und Sicherheit der Website. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.</p>
              </div>
              <div>
                <h3 className="font-medium text-stone-900">Account‑ und Sitzungsdaten (Veranstalter)</h3>
                <p className="mt-1">Für die Anmeldung nutzen wir NextAuth mit E‑Mail‑Magic‑Link. Dabei werden E‑Mail‑Adresse, ggf. Name und Sitzungsdaten gespeichert. Rechtsgrundlage: Vertragserfüllung/Anbahnung Art. 6 Abs. 1 lit. b DSGVO.</p>
                <p className="mt-1">E‑Mails werden über den Dienst „Resend“ versendet. Dabei wird Ihre E‑Mail‑Adresse an Resend übermittelt.</p>
              </div>
              <div>
                <h3 className="font-medium text-stone-900">Event‑Daten</h3>
                <p className="mt-1">Titel, Beschreibung und Einstellungen des Events werden in einer Datenbank (PostgreSQL via Prisma) gespeichert.</p>
              </div>
              <div>
                <h3 className="font-medium text-stone-900">Upload‑Daten (Gäste)</h3>
                <p className="mt-1">Bei Foto‑Uploads werden die Bilddatei, Dateiname, Dateigröße, MIME‑Type, optional eine Bild‑Beschriftung sowie optional der Name der hochladenden Person verarbeitet. Zusätzlich speichern wir technische Metadaten wie den User‑Agent und Upload‑Zeitpunkt. Fotos werden in Cloudflare R2 gespeichert; die URL wird in der Datenbank hinterlegt.</p>
                <p className="mt-1">Optional können Uploads einer konkreten Foto‑Aufgabe (Prompt) zugeordnet werden. Es können Beschränkungen pro Aufgabe bestehen.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">Speicherdauer</h2>
            <p className="mt-2 text-stone-700">Daten werden grundsätzlich solange gespeichert, wie dies für die Bereitstellung des Dienstes erforderlich ist. Uploads bleiben bis zur Löschung des Events oder einer individuellen Löschung gespeichert. Sitzungs- und Verifizierungstoken haben eine begrenzte Gültigkeit gemäß NextAuth‑Standardeinstellungen.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">Empfänger und Drittanbieter</h2>
            <ul className="mt-2 list-disc pl-6 space-y-1 text-stone-700">
              <li>E‑Mail Versand: Resend (USA). Übermittlung Ihrer E‑Mail‑Adresse zur Zustellung des Magic‑Links.</li>
              <li>Speicher: Cloudflare R2 (Cloudflare, ggf. außerhalb der EU). Speicherung und Auslieferung von Bilddateien.</li>
              <li>Hosting/DB: PostgreSQL‑Datenbank; Zugriff erfolgt ausschließlich durch die Anwendung.</li>
            </ul>
            <p className="mt-2 text-stone-700">Mit allen Dienstleistern bestehen, soweit erforderlich, Verträge zur Auftragsverarbeitung; Übermittlungen in Drittländer erfolgen auf Basis geeigneter Garantien (z. B. EU‑Standardvertragsklauseln).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">Cookies</h2>
            <p className="mt-2 text-stone-700">Für die Anmeldung werden technisch notwendige Cookies von NextAuth gesetzt (Sitzungs‑Cookies). Es werden keine Tracking‑ oder Marketing‑Cookies verwendet.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">Rechtsgrundlagen</h2>
            <ul className="mt-2 list-disc pl-6 space-y-1 text-stone-700">
              <li>Art. 6 Abs. 1 lit. b DSGVO (Vertrag/Anbahnung) für Veranstalter‑Accounts und Event‑Verwaltung</li>
              <li>Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse) für technische Bereitstellung, Sicherheit und Missbrauchsvermeidung</li>
              <li>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung), soweit Gäste freiwillig Namen/Grüße angeben</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">Ihre Rechte</h2>
            <p className="mt-2 text-stone-700">Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie Widerspruch gegen Verarbeitungsvorgänge im Rahmen der gesetzlichen Vorgaben. Zudem haben Sie das Recht, erteilte Einwilligungen jederzeit mit Wirkung für die Zukunft zu widerrufen.</p>
            <p className="mt-2 text-stone-700">Wenden Sie sich hierfür an: <a className="underline" href="mailto:wanjamensch@gmail.com">wanjamensch@gmail.com</a></p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">Hinweise zu Foto‑Uploads</h2>
            <ul className="mt-2 list-disc pl-6 space-y-1 text-stone-700">
              <li>Uploads sollen nur Inhalte enthalten, die Sie selbst erstellt haben oder zu denen Sie berechtigt sind.</li>
              <li>Personenbezogene Daten Dritter auf Bildern (Abbildungen) werden durch die hochladende Person erhoben. Veranstalter sind für die Rechtmäßigkeit der Veröffentlichungen in ihrer Galerie verantwortlich.</li>
              <li>Auf Anfrage entfernen wir Inhalte zeitnah, sofern Rechte verletzt werden.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">Kontakt Datenschutz</h2>
            <p className="mt-2 text-stone-700">Fragen zum Datenschutz richten Sie bitte an <a className="underline" href="mailto:wanjamensch@gmail.com">wanjamensch@gmail.com</a>.</p>
          </section>

          <div className="pt-4 text-sm flex items-center gap-3">
            <Link href="/" className="underline">Zur Startseite</Link>
            <span className="text-stone-400">•</span>
            <Link href="/impressum" className="underline">Zum Impressum</Link>
          </div>
        </div>
      </div>
    </div>
  );
}


