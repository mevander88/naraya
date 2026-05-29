import { getAZCatalogItems } from '../data';
import type { Metadata } from 'next';
import { KomikIndexClient } from './infinite-catalog';

export const metadata: Metadata = {
  title: 'Indeks Komik dan Anime',
  description: 'Daftar komik dan anime Naraya dengan halaman indeks, cover, genre, dan akses langsung ke detail.',
  alternates: { canonical: '/komik' },
  openGraph: {
    title: 'Indeks Komik dan Anime | Naraya',
    description: 'Buka katalog komik dan anime Naraya lalu lanjutkan ke detail, chapter, atau episode.',
    url: '/komik',
  },
};

export default async function KomikIndexPage() {
  const catalog = await getAZCatalogItems(1);

  return (
    <section className="px-container-mobile pb-24 pt-28 md:px-container-desktop">
      <KomikIndexClient initialItems={catalog.items} initialPage={catalog.page} totalPages={catalog.totalPages} totalItems={catalog.totalItems} />
    </section>
  );
}
