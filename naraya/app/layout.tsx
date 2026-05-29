import type { Metadata } from 'next';
import { Manrope, Sora } from 'next/font/google';
import { NavShell } from './nav-shell';
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

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Naraya',
  url: 'https://naraya.biz.id',
  description: 'Platform baca komik dan nonton anime dengan katalog genre, update chapter, episode terbaru, reader gambar, dan player yang nyaman.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://naraya.biz.id/explore?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export const metadata: Metadata = {
  metadataBase: new URL('https://naraya.biz.id'),
  title: {
    default: 'Naraya - Baca Komik dan Nonton Anime',
    template: '%s | Naraya',
  },
  description: 'Naraya adalah platform baca komik dan nonton anime dengan katalog genre, update chapter, episode terbaru, detail lengkap, reader gambar, dan player yang nyaman.',
  keywords: ['Naraya', 'komik online', 'baca komik', 'nonton anime', 'anime subtitle indonesia', 'reader komik', 'chapter komik', 'episode anime'],
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
    title: 'Naraya - Baca Komik dan Nonton Anime',
    description: 'Jelajahi komik, anime, genre, chapter terbaru, episode terbaru, reader gambar, dan player dalam pengalaman Naraya yang fokus.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Naraya' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Naraya - Baca Komik dan Nonton Anime',
    description: 'Katalog komik dan anime, detail chapter, episode, reader gambar, dan player.',
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <NavShell>{children}</NavShell>
      </body>
    </html>
  );
}
