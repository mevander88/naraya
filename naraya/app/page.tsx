import { HomeClient } from './home-client';
import { getHomeData } from './data';
import type { Metadata } from 'next';
import { JsonLd } from '../seo/json-ld';
import { buildItemListSchema } from '../seo/schema/item-list';
import { buildOrganizationSchema } from '../seo/schema/organization';
import { buildWebSiteSchema } from '../seo/schema/website';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Nonton Anime Indo dan Komik Online',
  description: 'Naraya menyajikan nonton anime, anime indo, anime sub indo, nonton anime id, streaming anime, web anime gratis, komik online, update episode, chapter terbaru, dan katalog genre.',
  keywords: ['nonton anime', 'anime indo', 'anime sub indo', 'anime id', 'nonton anime id', 'streaming anime', 'nonton anime sub indo', 'web anime', 'web anime gratis', 'anime watch', 'download anime', 'rekomendasi anime', 'anime romance', 'anime harem', 'anime bl', 'gachiakuta anime', 'nukitashi anime', 'kurama anime', 'komik online', 'baca komik'],
  alternates: { canonical: '/' },
};

export default async function Page() {
  const home = await getHomeData();
  const heroItems = home.featured.length ? home.featured : [...home.series.slice(0, 8), ...home.comics.slice(0, 8)];
  const genres = home.genres
    .map((genre) => ({
      title: genre.title || genre.slug.replaceAll('-', ' '),
      count: Number(String(genre.count ?? '0').replace(/[^\d]/g, '')) || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .map((genre) => genre.title);

  const latestAnimeSchema = buildItemListSchema({
    name: 'Nonton anime indo terbaru Naraya',
    path: '/',
    description: 'Daftar nonton anime, anime indo terbaru, anime sub indo, streaming anime, nonton anime id, rekomendasi anime, dan sorotan utama yang tersedia di Naraya.',
    items: home.series.slice(0, 12).map((item) => ({
      name: item.title,
      path: `/series/${item.slug}`,
      image: item.image,
      description: item.episode,
      type: 'TVSeries',
    })),
  });

  return (
    <>
      <JsonLd data={[buildOrganizationSchema(), buildWebSiteSchema(), latestAnimeSchema]} />
      <HomeClient heroItems={heroItems} comics={home.comics} series={home.series} genres={genres} />
    </>
  );
}
