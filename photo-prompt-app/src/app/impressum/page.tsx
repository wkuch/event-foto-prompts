import Link from "next/link";

export const metadata = {
  title: "Impressum – Traumtag Momente",
  description: "Impressum und gesetzliche Pflichtangaben für Traumtag Momente.",
};

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-stone-900">Impressum</h1>
        <p className="mt-2 text-stone-600 text-sm">Gültig für die Website traumtag-momente.de</p>

        <div className="mt-8 space-y-6 text-stone-800">
          <section className="rounded-2xl bg-amber-50 text-amber-900 ring-1 ring-amber-200 p-4">
            <h2 className="text-sm font-semibold">Hinweis: Beta</h2>
            <p className="mt-1 text-sm">Dieses Angebot befindet sich in einer Beta‑Phase. Funktionen können sich ändern; Verfügbarkeit und Support sind eingeschränkt.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-stone-900">Angaben gemäß § 5 TMG</h2>
            <p className="mt-2 whitespace-pre-line">
              {`Wanja Mensch\nIm Haberacker 3a\n76227 Karlsruhe\nDeutschland`}
            </p>
            <p className="mt-2">E‑Mail: <a className="underline" href="mailto:wanjamensch@gmail.com">wanjamensch@gmail.com</a></p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">Vertreten durch</h2>
            <p className="mt-2">Wanja Mensch</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">Umsatzsteuer‑ID</h2>
            <p className="mt-2">Falls vorhanden: wird nachgereicht.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p className="mt-2">Wanja Mensch, Anschrift wie oben</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">Haftung für Inhalte</h2>
            <p className="mt-2 text-stone-700">
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen
              Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet,
              übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf
              eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
              Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch
              erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden
              Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">Haftung für Links</h2>
            <p className="mt-2 text-stone-700">
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb
              können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets
              der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der
              Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht
              erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer
              Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend
              entfernen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">Urheberrecht</h2>
            <p className="mt-2 text-stone-700">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
              Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen
              des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und
              Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf
              dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet.
            </p>
          </section>

          <div className="pt-4 text-sm flex items-center gap-3">
            <Link href="/" className="underline">Zur Startseite</Link>
            <span className="text-stone-400">•</span>
            <Link href="/datenschutz" className="underline">Zur Datenschutzerklärung</Link>
          </div>
        </div>
      </div>
    </div>
  );
}


