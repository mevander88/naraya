import type { Metadata } from 'next';
import { Manrope, Sora } from 'next/font/google';
import { NavShell } from './nav-shell';
import { ScrollRevealActivator } from './scroll-reveal-activator';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://naraya.biz.id'),
  title: {
    default: 'Naraya - Web Anime Indo dan Komik Online',
    template: '%s | Naraya',
  },
  description: 'Naraya adalah web anime indo dan komik online untuk nonton anime, streaming anime sub indo, nonton anime id, baca komik bahasa Indonesia, update episode terbaru, chapter terbaru, dan rekomendasi anime.',
  keywords: ['Naraya', 'anime', 'komik', 'nonton anime', 'anime indo', 'anime sub indo', 'anime id', 'nonton anime id', 'streaming anime', 'nonton anime sub indo', 'web anime', 'web anime indo', 'web anime gratis', 'nonton anime gratis', 'anime watch', 'download anime', 'rekomendasi anime', 'anime romance', 'anime harem', 'anime bl', 'gachiakuta anime', 'nukitashi anime', 'kurama anime', 'komik online', 'baca komik', 'baca komik bahasa indonesia', 'manga bahasa indonesia', 'anime subtitle indonesia', 'reader komik', 'chapter komik', 'episode anime'],
  applicationName: 'Naraya',
  authors: [{ name: 'Naraya' }],
  creator: 'Naraya',
  publisher: 'Naraya',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: '/',
    siteName: 'Naraya',
    title: 'Naraya - Web Anime Indo dan Komik Online',
    description: 'Jelajahi web anime indo untuk nonton anime, streaming anime sub indo, nonton anime id, komik online, rekomendasi anime, genre, chapter terbaru, dan episode terbaru.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Naraya' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Naraya - Web Anime Indo dan Komik Online',
    description: 'Katalog nonton anime, anime indo sub indo, streaming anime, komik online, detail chapter, episode, reader gambar, dan player.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning className={`dark ${manrope.variable} ${sora.variable}`}>
      <body suppressHydrationWarning className="bg-background font-body text-on-background">
        <ScrollRevealActivator />
        <NavShell>{children}</NavShell>
      </body>
    </html>
  );
}
