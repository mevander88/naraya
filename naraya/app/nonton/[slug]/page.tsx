import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react';
import { getComments, getEpisodeReader, getSeriesDetail, getSettings, titleFromSlug } from '../../data';
import { EpisodePlayer } from '../episode-player';
import { WatchBack } from '../watch-back';
import { CommentThread } from '../../comment-thread';
import { AutoBookmarkVisit } from '../../internal-actions';
import { ShareButton } from '../../share-button';

type PageProps = {
  params: Promise<{ slug: string }>;
};

function progressFromNewestFirst(index: number, total: number) {
  if (index < 0 || total <= 0) return 0;
  return Math.max(1, Math.min(100, Math.round(((total - index) / total) * 100)));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const reader = await getEpisodeReader(slug);
  const title = reader?.title || titleFromSlug(slug);
  const description = `Nonton ${title} di Naraya.`;
  const image = reader?.cover || '/opengraph-image';
  return {
    title,
    description,
    alternates: { canonical: `/nonton/${slug}` },
    openGraph: {
      title: `${title} | Naraya`,
      description,
      url: `/nonton/${slug}`,
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

export default async function WatchEpisodePage({ params }: PageProps) {
  const { slug } = await params;
  const reader = await getEpisodeReader(slug);
  if (!reader) notFound();
  const series = reader.seriesSlug ? await getSeriesDetail(reader.seriesSlug) : null;
  const episodeIndex = series?.episodes.findIndex((episode) => episode.slug === reader.slug || episode.slug === slug) ?? -1;
  const currentEpisode = series && episodeIndex >= 0 ? series.episodes[episodeIndex] : null;
  const previousEpisode = series && episodeIndex >= 0 && episodeIndex < series.episodes.length - 1 ? series.episodes[episodeIndex + 1] : null;
  const nextEpisode = series && episodeIndex > 0 ? series.episodes[episodeIndex - 1] : null;
  const currentEpisodeLabel = currentEpisode?.number ? `Episode ${currentEpisode.number}` : 'Episode';
  const previousEpisodeLabel = previousEpisode?.number ? `Episode ${previousEpisode.number}` : '';
  const nextEpisodeLabel = nextEpisode?.number ? `Episode ${nextEpisode.number}` : '';
  const progressPercent = progressFromNewestFirst(episodeIndex, series?.episodes.length ?? 0);
  const [comments, settings] = await Promise.all([
    getComments({ chapterSlug: reader.slug }),
    getSettings(),
  ]);

  return (
    <section className="px-container-mobile pb-20 pt-24 md:px-container-desktop md:pt-28">
      <WatchBack href={series ? `/series/${series.slug}` : '/komik'} label={series ? 'Detail Anime' : 'Indeks'} />
      {series ? (
        <AutoBookmarkVisit
          target={{
            enabled: Boolean(settings?.autoBookmark),
            slug: series.slug,
            title: series.title,
            kind: 'series',
            coverUrl: series.cover,
            latestChapterSlug: series.episodes[0]?.slug,
            lastChapterSlug: reader.slug,
            lastChapterTitle: reader.title,
            status: progressPercent >= 100 ? 'completed' : 'reading',
            progressPercent,
          }}
        />
      ) : null}

      <div className="mb-5 flex flex-wrap items-center gap-3 text-sm font-semibold text-on-surface-variant">
        <Link
          href={series ? `/series/${series.slug}` : '/komik'}
          className="inline-flex items-center gap-2 rounded-full bg-surface-container-high/78 px-4 py-2 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:bg-primary/12 hover:text-on-surface"
        >
          <ArrowLeft size={16} />
          {series ? 'Detail anime' : 'Indeks'}
        </Link>
        <span className="text-white/20">/</span>
        <span>Nonton episode</span>
        <span className="min-w-0 flex-1" />
        <ShareButton title={reader.title} path={`/nonton/${reader.slug}`} variant="icon" />
      </div>

      <div className="watch-video-panel relative -mx-container-mobile overflow-visible rounded-[1.6rem] bg-[linear-gradient(145deg,rgba(24,22,31,0.96),rgba(15,14,20,0.98))] p-2 shadow-2xl shadow-black/28 sm:p-4 md:mx-0 md:rounded-[2.4rem] md:p-6">
        <div className="watch-video-glow pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
        <div className="relative">
          <div className="min-w-0">
            <div className="mb-5 max-w-4xl px-2 sm:px-0">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                <PlayCircle size={16} />
                Naraya Watch
              </p>
              <h1 className="mt-3 line-clamp-2 break-words font-display text-3xl font-bold leading-tight md:text-5xl">{reader.title}</h1>
            </div>
            <EpisodePlayer title={reader.title} playerUrl={reader.playerUrl} servers={reader.servers} episodeLabel={currentEpisodeLabel} />
            {(previousEpisode || nextEpisode) ? (
              <div className="mt-5 border-t border-white/6 pt-4 md:mt-6 md:pt-5">
                <div className="flex w-full flex-col gap-2">
                  {previousEpisode ? (
                    <Link href={`/nonton/${previousEpisode.slug}`} className="group flex w-full min-w-0 min-h-14 items-center gap-2 rounded-2xl bg-background/30 px-3 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] transition hover:bg-primary/12 lg:min-h-20 lg:gap-3 lg:rounded-[1.35rem] lg:px-4 lg:py-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary transition group-hover:bg-primary/18 lg:h-11 lg:w-11 lg:rounded-2xl">
                        <ChevronLeft size={17} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[0.62rem] font-bold uppercase tracking-[0.16em] text-primary lg:text-[0.68rem] lg:tracking-[0.2em]">Sebelumnya</span>
                        <span className="mt-0.5 block truncate font-display text-sm font-semibold text-on-surface transition group-hover:text-primary lg:mt-1 lg:text-base">{previousEpisodeLabel}</span>
                      </span>
                    </Link>
                  ) : (
                    null
                  )}
                  {nextEpisode ? (
                    <Link href={`/nonton/${nextEpisode.slug}`} className="group flex w-full min-w-0 min-h-14 items-center gap-2 rounded-2xl bg-background/30 px-3 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] transition hover:bg-primary/12 lg:min-h-20 lg:gap-3 lg:rounded-[1.35rem] lg:px-4 lg:py-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary transition group-hover:bg-primary/18 lg:h-11 lg:w-11 lg:rounded-2xl">
                        <ChevronRight size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.62rem] font-bold uppercase tracking-[0.16em] text-primary lg:text-[0.68rem] lg:tracking-[0.2em]">Berikutnya</span>
                        <span className="mt-0.5 block truncate font-display text-sm font-semibold text-on-surface transition group-hover:text-primary lg:mt-1 lg:text-base">{nextEpisodeLabel}</span>
                      </span>
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-[2rem] bg-surface-container-low/72 p-5 shadow-xl shadow-black/18 md:p-6">
        <CommentThread
          comicSlug={series?.slug ?? reader.seriesSlug ?? reader.slug}
          chapterSlug={reader.slug}
          initialComments={comments.items}
          initialNextCursor={comments.nextCursor}
          initialHasMore={comments.hasMore}
          initialTotal={comments.total}
          title="Diskusi Penonton"
          emptyText="Belum ada komentar untuk episode ini."
        />
      </div>
    </section>
  );
}
