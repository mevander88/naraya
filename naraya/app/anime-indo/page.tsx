import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getLatestSeries } from '../data';
import { ComicCard, TrendingRail, UpdatesGrid } from '../components';
import { JsonLd } from '../../seo/json-ld';
import { buildBreadcrumbSchema } from '../../seo/schema/breadcrumb';
import { buildItemListSchema } from '../../seo/schema/item-list';
import { buildOpenGraphMetadata, buildTwitterMetadata } from '../../seo/social';

export const dynamic = 'force-dynamic';

const description = 'Anime Indo terbaru di Naraya untuk nonton anime sub indo, streaming anime, rekomendasi anime, dan update episode terbaru dari katalog anime Indonesia.';

export const metadata: Metadata = {
  title: 'Anime Indo Terbaru',
  description,
  keywords: ['anime indo', 'nonton anime indo', 'anime sub indo', 'nonton anime sub indo', 'streaming anime indo', 'web anime indo', 'anime id', 'nonton anime id', 'rekomendasi anime indo', 'episode anime terbaru'],
  alternates: { canonical: '/anime-indo' },
  openGraph: buildOpenGraphMetadata({
    title: 'Anime Indo Terbaru | Naraya',
    description,
    path: '/anime-indo',
  }),
  twitter: buildTwitterMetadata({
    title: 'Anime Indo Terbaru | Naraya',
    description,
    path: '/anime-indo',
  }),
};

export default async function AnimeIndoPage() {
  const [firstPage, secondPage] = await Promise.all([getLatestSeries(1), getLatestSeries(2)]);
  const anime = [...firstPage, ...secondPage].filter((item, index, list) => (
    item.slug && list.findIndex((candidate) => candidate.slug === item.slug) === index
  ));
  const itemListSchema = buildItemListSchema({
    name: 'Anime Indo terbaru Naraya',
    path: '/anime-indo',
    description,
    items: anime.slice(0, 24).map((item) => ({
      name: item.title,
      path: `/series/${item.slug}`,
      image: item.image,
      description: [item.meta, item.episode].filter(Boolean).join(' - '),
      type: 'TVSeries',
    })),
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Naraya', path: '/' },
    { name: 'Anime Indo', path: '/anime-indo' },
  ]);

  return (
    <section className="px-container-mobile pb-24 pt-28 md:px-container-desktop">
      <JsonLd data={[itemListSchema, breadcrumbSchema]} />
      <div className="min-w-0">
        <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-primary">Anime Indo</p>
        <h1 className="mt-4 max-w-4xl break-words font-display text-4xl font-bold leading-tight text-on-background md:text-6xl">
          Anime Indo terbaru untuk nonton anime sub indo
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-on-surface-variant md:text-lg md:leading-8">
          Jelajahi update anime Indo, episode terbaru, anime sub indo, dan rekomendasi anime dari katalog Naraya.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/indeks?type=Anime" className="interactive-lift inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-on-primary shadow-glow transition hover:brightness-110 active:scale-95">
            Buka indeks anime
            <ArrowRight size={18} />
          </Link>
          <Link href="/explore?type=Anime" className="interactive-lift inline-flex items-center gap-2 rounded-xl border border-white/10 bg-surface-container-high px-6 py-3 font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/10 active:scale-95">
            Filter anime
          </Link>
        </div>
      </div>

      {anime.length ? (
        <div className="mt-12">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold text-on-background">Daftar anime Indo</h2>
            <Link href="/explore?type=Anime" className="text-sm font-semibold text-primary hover:underline">Explore anime</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {anime.slice(0, 24).map((item, index) => (
              <ComicCard key={`${item.slug}-${index}`} comic={item} priority={index < 4} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="-mx-container-mobile mt-8 md:-mx-container-desktop">
        <TrendingRail title="Anime Indo Populer" href="/indeks?type=Anime" comics={anime.slice(0, 18)} />
        <UpdatesGrid title="Update Anime Indo Terbaru" comics={anime.slice(0, 18)} />
      </div>
    </section>
  );
}
