import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Play } from 'lucide-react';
import { getComments, getFavoriteStatus, getLoveStatus, getSeriesDetail, titleFromSlug } from '../../data';
import { BookmarkButton, LoveButton } from '../../internal-actions';
import { CollapsibleInfo, CollapsibleSynopsis } from '../collapsible-detail';
import { CommentThread } from '../../comment-thread';
import { EpisodeList } from './episode-list';
import { ShareButton } from '../../share-button';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getSeriesDetail(slug);
  const title = detail?.title || titleFromSlug(slug);
  const description = detail?.description || `Nonton ${title} di Naraya.`;
  const image = detail?.cover || '/opengraph-image';
  return {
    title,
    description,
    alternates: { canonical: `/series/${slug}` },
    openGraph: {
      title: `${title} | Naraya`,
      description,
      url: `/series/${slug}`,
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Naraya`,
      description,
      images: [image],
    },
  };
}

export default async function SeriesDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const detail = await getSeriesDetail(slug);
  if (!detail) notFound();

  const [comments, favoriteStatus, loveStatus] = await Promise.all([
    getComments({ comicSlug: detail.slug }),
    getFavoriteStatus(detail.slug),
    getLoveStatus(detail.slug),
  ]);
  const latest = detail.episodes[0];
  const bookmarkSeries = {
    slug: detail.slug,
    title: detail.title,
    image: detail.cover,
    meta: 'Anime',
    episode: latest?.title ?? 'Belum ada episode',
    kind: 'series',
    latestChapterSlug: latest?.slug,
  };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: detail.title,
    url: `https://naraya.biz.id/series/${detail.slug}`,
    image: detail.cover,
    description: detail.description,
    genre: detail.genres,
    inLanguage: 'id',
    publisher: {
      '@type': 'Organization',
      name: 'Naraya',
      url: 'https://naraya.biz.id',
    },
    numberOfEpisodes: detail.episodes.length,
  };

  return (
    <section className="px-container-mobile pb-20 pt-28 md:px-container-desktop">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div>
          {detail.cover ? (
            <img src={detail.cover} alt={detail.title} width={280} height={420} fetchPriority="high" decoding="async" className="reveal-soft aspect-[2/3] w-full rounded-2xl object-cover shadow-glow" />
          ) : (
            <div className="reveal-soft grid aspect-[2/3] w-full place-items-center rounded-2xl bg-primary/10 font-display text-5xl font-bold text-primary shadow-glow">
              {detail.title.slice(0, 1)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Series Anime</p>
          <h1 className="mt-2 break-words font-display text-4xl font-bold md:text-6xl">{detail.title}</h1>
          <div className="mt-5 flex flex-wrap gap-2">
            {detail.genres.map((genre) => (
              <Link key={genre} href={`/explore?genre=${encodeURIComponent(genre)}`} className="rounded-full border border-white/10 bg-surface-container-high px-3 py-1 text-sm text-on-surface-variant transition hover:border-primary/50 hover:text-primary">
                {genre}
              </Link>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              {latest ? (
                <Link href={`/nonton/${latest.slug}`} className="interactive-lift inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 font-semibold text-on-primary shadow-glow transition hover:brightness-110 active:scale-95">
                  <Play size={18} fill="currentColor" />
                  Nonton Episode Terbaru
                </Link>
              ) : null}
              <BookmarkButton comic={bookmarkSeries} variant="button" initialStatus={favoriteStatus} />
            </div>
            <div className="flex flex-wrap gap-3 md:pt-1">
              <LoveButton
                target={{
                  slug: detail.slug,
                  title: detail.title,
                  kind: 'series',
                  coverUrl: detail.cover,
                  targetUrl: `/series/${detail.slug}`,
                }}
                initialStatus={loveStatus}
              />
              <ShareButton title={detail.title} path={`/series/${detail.slug}`} />
            </div>
          </div>
        </div>
      </div>

      <CollapsibleInfo rows={detail.info} />
      <CollapsibleSynopsis text={detail.description || 'Sinopsis belum tersedia untuk series ini.'} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div id="episode-list" className="min-w-0">
          <EpisodeList episodes={detail.episodes} />
        </div>
        <aside>
          <div className="rounded-[2rem] bg-surface-container-low/82 p-5 shadow-xl shadow-black/20 ring-1 ring-white/8">
            <CommentThread
              comicSlug={detail.slug}
              initialComments={comments.items}
              initialNextCursor={comments.nextCursor}
              initialHasMore={comments.hasMore}
              initialTotal={comments.total}
              title="Komentar Anime"
              emptyText="Belum ada komentar untuk anime ini."
            />
          </div>
        </aside>
      </div>
    </section>
  );
}
