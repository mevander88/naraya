import { getAZCatalogItems } from '../data';
import type { Metadata } from 'next';
import { KomikIndexClient } from '../komik/infinite-catalog';
import { JsonLd } from '../../seo/json-ld';
import { buildBreadcrumbSchema } from '../../seo/schema/breadcrumb';
import { buildItemListSchema } from '../../seo/schema/item-list';
import { buildOpenGraphMetadata, buildTwitterMetadata } from '../../seo/social';

export const metadata: Metadata = {
  title: 'Indeks Nonton Anime Indo dan Komik',
  description: 'Daftar indeks komik, nonton anime, anime indo, anime sub indo, streaming anime, nonton anime id, dan web anime gratis Naraya dengan cover, genre, dan akses langsung ke detail.',
  keywords: ['indeks anime', 'indeks komik', 'nonton anime', 'anime indo', 'anime sub indo', 'anime id', 'nonton anime id', 'streaming anime', 'nonton anime sub indo', 'anime watch', 'rekomendasi anime', 'web anime', 'web anime gratis', 'komik', 'sub indo', 'baca komik'],
  alternates: { canonical: '/indeks' },
  openGraph: buildOpenGraphMetadata({
    title: 'Indeks Nonton Anime Indo dan Komik | Naraya',
    description: 'Buka katalog komik, nonton anime, anime indo sub indo, dan rekomendasi anime Naraya lalu lanjutkan ke detail, chapter, atau episode.',
    path: '/indeks',
  }),
  twitter: buildTwitterMetadata({
    title: 'Indeks Nonton Anime Indo dan Komik | Naraya',
    description: 'Buka katalog komik, nonton anime, anime indo sub indo, dan rekomendasi anime Naraya lalu lanjutkan ke detail, chapter, atau episode.',
    path: '/indeks',
  }),
};

export default async function IndeksPage() {
  const catalog = await getAZCatalogItems(1);
  const itemListSchema = buildItemListSchema({
    name: 'Indeks komik dan nonton anime indo Naraya',
    path: '/indeks',
    description: 'Daftar awal indeks komik, nonton anime, anime indo, streaming anime, nonton anime id, dan anime sub indo Naraya.',
    items: catalog.items.map((item) => {
      const isSeries = item.kind === 'series';
      return {
        name: item.title || item.slug.replaceAll('-', ' '),
        path: isSeries ? `/series/${item.slug}` : `/komik/${item.slug}`,
        image: item.cover,
        description: [item.type, item.status, ...(item.genres ?? []).slice(0, 3)].filter(Boolean).join(' - '),
        type: isSeries ? 'TVSeries' as const : 'ComicSeries' as const,
      };
    }),
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Naraya', path: '/' },
    { name: 'Indeks', path: '/indeks' },
  ]);

  return (
    <section className="px-container-mobile pb-24 pt-28 md:px-container-desktop">
      <JsonLd data={[itemListSchema, breadcrumbSchema]} />
      <KomikIndexClient initialItems={catalog.items} initialPage={catalog.page} totalPages={catalog.totalPages} totalItems={catalog.totalItems} />
    </section>
  );
}
