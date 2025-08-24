import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-wedding-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Traumtag Momente – Romantische Foto‑Aufgaben für eure Hochzeit",
  description:
    "Verwandelt eure Gäste in Geschichtenerzähler: liebevolle Foto‑Aufgaben, QR‑Codes und eine elegante gemeinsame Galerie.",
  metadataBase: new URL("https://traumtag-momente.de"),
  openGraph: {
    title: "Traumtag Momente – Romantische Foto‑Aufgaben für eure Hochzeit",
    description:
      "Verwandelt eure Gäste in Geschichtenerzähler: liebevolle Foto‑Aufgaben, QR‑Codes und eine elegante gemeinsame Galerie.",
    type: "website",
    siteName: "Traumtag Momente",
    images: [
      {
        url: "https://traumtag-momente.de/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Traumtag Momente – Romantische Foto‑Aufgaben für eure Hochzeit",
    description:
      "Verwandelt eure Gäste in Geschichtenerzähler: liebevolle Foto‑Aufgaben, QR‑Codes und eine elegante gemeinsame Galerie.",
    images: ["https://traumtag-momente.de/twitter-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" }
    ],
    apple: "/apple-touch-icon.png"
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
