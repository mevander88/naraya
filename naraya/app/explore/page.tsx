import { getCatalogItems, getGenresFromApi, getSettings } from '../data';
import type { Metadata } from 'next';
import { ExploreClient } from './explore-client';
import { JsonLd } from '../../seo/json-ld';
import { buildBreadcrumbSchema } from '../../seo/schema/breadcrumb';
import { buildItemListSchema } from '../../seo/schema/item-list';
import { buildOpenGraphMetadata, buildTwitterMetadata } from '../../seo/social';

type ExploreSearchParams = {
  q?: string | string[];
  genre?: string | string[];
  type?: string | string[];
  status?: string | string[];
  order?: string | string[];
  page?: string | string[];
};

type ExplorePageProps = {
  searchParams: ExploreSearchParams | Promise<ExploreSearchParams>;
};

const TYPE_FILTER_OPTIONS = ['All', 'Anime', 'MANGA', 'MANHUA', 'MANHWA', 'ONE-SHOT'];

export const metadata: Metadata = {
  title: 'Explore Nonton Anime Indo dan Komik',
  description: 'Cari nonton anime, anime indo, anime sub indo, streaming anime, nonton anime id, rekomendasi anime, dan komik Naraya berdasarkan judul, tipe, status, dan genre.',
  keywords: ['nonton anime', 'anime indo', 'anime sub indo', 'anime id', 'nonton anime id', 'streaming anime', 'nonton anime sub indo', 'anime watch', 'rekomendasi anime', 'anime romance', 'anime harem', 'anime bl', 'gachiakuta anime', 'nukitashi anime', 'kurama anime', 'web anime', 'web anime gratis', 'komik', 'baca komik'],
  alternates: { canonical: '/explore' },
  openGraph: buildOpenGraphMetadata({
    title: 'Explore Nonton Anime Indo dan Komik | Naraya',
    description: 'Temukan nonton anime, anime indo sub indo, rekomendasi anime, komik, filter genre, lalu buka detail di Naraya.',
    path: '/explore',
  }),
  twitter: buildTwitterMetadata({
    title: 'Explore Nonton Anime Indo dan Komik | Naraya',
    description: 'Temukan nonton anime, anime indo sub indo, rekomendasi anime, komik, filter genre, lalu buka detail di Naraya.',
    path: '/explore',
  }),
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeParam(value?: string | string[]) {
  return firstParam(value)?.trim() ?? '';
}

function normalizeOption(value: string, options: string[]) {
  if (!value) return 'All';
  return options.find((option) => option.toLowerCase() === value.toLowerCase()) ?? value;
}

function withActiveOption(options: string[], active: string) {
  if (active === 'All' || options.some((option) => option.toLowerCase() === active.toLowerCase())) {
    return options;
  }
  return ['All', active, ...options.filter((option) => option !== 'All')];
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const query = normalizeParam(params.q);
  const rawGenre = normalizeParam(params.genre);
  const rawType = normalizeParam(params.type);
  const rawStatus = normalizeParam(params.status);
  const [availableGenres, settings] = await Promise.all([getGenresFromApi(), getSettings()]);
  const genreOptions = ['All', ...availableGenres];
  const activeGenre = normalizeOption(rawGenre, genreOptions);
  const activeType = normalizeOption(rawType, TYPE_FILTER_OPTIONS);
  const activeStatus = normalizeOption(rawStatus, ['All', 'On-Going', 'Completed']);
  const catalogPage = await getCatalogItems(1, { genre: activeGenre, type: activeType, status: activeStatus });
  const genres = withActiveOption(genreOptions, activeGenre);
  const pagePath = `/explore${query ? `?q=${encodeURIComponent(query)}` : ''}`;
  const schemaItems = query
    ? catalogPage.items.filter((item) => {
      const searchable = [item.title ?? item.slug, item.type ?? '', item.status ?? '', ...(item.genres ?? [])].join(' ').toLowerCase();
      return searchable.includes(query.toLowerCase());
    })
    : catalogPage.items;
  const itemListSchema = buildItemListSchema({
    name: query ? `Hasil pencarian ${query}` : 'Explore nonton anime indo dan komik Naraya',
    path: pagePath,
    description: query ? `Hasil pencarian komik, nonton anime, anime indo, streaming anime, dan sub indo untuk ${query}.` : 'Daftar komik, nonton anime, anime indo, streaming anime sub indo, nonton anime id, dan anime sub indo Naraya berdasarkan genre, tipe, dan status.',
    items: schemaItems.map((item) => {
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
    { name: 'Explore', path: '/explore' },
  ]);

  return (
    <>
      <JsonLd data={[itemListSchema, breadcrumbSchema]} />
      <ExploreClient
        initialItems={catalogPage.items}
        initialPage={catalogPage.page}
        totalPages={catalogPage.totalPages}
        genres={genres}
        initialFilters={{ genre: activeGenre, type: activeType, status: activeStatus, query }}
        matureFilter={settings?.matureFilter ?? false}
      />
    </>
  );
}
