import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, ExternalLink, MessageCircle, PlayCircle } from 'lucide-react';
import { getComments, getEpisodeReader, getSeriesDetail } from '../../data';
import { CommentComposer } from '../../internal-actions';
import { EpisodePlayer } from '../episode-player';
import { WatchBack } from '../watch-back';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const reader = await getEpisodeReader(params.slug);
  if (!reader) {
    return { title: 'Episode tidak ditemukan' };
  }
  return {
    title: reader.title,
    description: `Nonton ${reader.title} di Naraya.`,
    alternates: { canonical: `/nonton/${params.slug}` },
    openGraph: {
      title: `${reader.title} | Naraya`,
      description: `Nonton ${reader.title} di Naraya.`,
      url: `/nonton/${params.slug}`,
      images: reader.cover ? [{ url: reader.cover, alt: reader.title }] : undefined,
    },
  };
}

export default async function WatchEpisodePage({ params }: { params: { slug: string } }) {
  const reader = await getEpisodeReader(params.slug);
  if (!reader) notFound();
  const series = reader.seriesSlug ? await getSeriesDetail(reader.seriesSlug) : null;
  const episodeIndex = series?.episodes.findIndex((episode) => episode.slug === reader.slug || episode.slug === params.slug) ?? -1;
  const currentEpisode = series && episodeIndex >= 0 ? series.episodes[episodeIndex] : null;
  const previousEpisode = series && episodeIndex >= 0 && episodeIndex < series.episodes.length - 1 ? series.episodes[episodeIndex + 1] : null;
  const nextEpisode = series && episodeIndex > 0 ? series.episodes[episodeIndex - 1] : null;
  const currentEpisodeLabel = currentEpisode?.number ? `Episode ${currentEpisode.number}` : 'Episode';
  const previousEpisodeLabel = previousEpisode?.number ? `Episode ${previousEpisode.number}` : '';
  const nextEpisodeLabel = nextEpisode?.number ? `Episode ${nextEpisode.number}` : '';
  const comments = await getComments({ comicSlug: series?.slug ?? reader.seriesSlug ?? reader.slug, chapterSlug: reader.slug });

  return (
    <section className="px-container-mobile pb-20 pt-24 md:px-container-desktop md:pt-28">
      <WatchBack href={series ? `/series/${series.slug}` : '/komik'} label={series ? 'Detail Anime' : 'Indeks'} />

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
      </div>

      <div className="relative overflow-visible rounded-[2.4rem] bg-[linear-gradient(145deg,rgba(24,22,31,0.96),rgba(15,14,20,0.98))] p-4 shadow-2xl shadow-black/28 md:p-6">
        <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
        <div className="relative">
          <div className="min-w-0">
            <div className="mb-5 max-w-4xl">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                <PlayCircle size={16} />
                Naraya Watch
              </p>
              <h1 className="mt-3 line-clamp-2 font-display text-3xl font-bold leading-tight md:text-5xl">{reader.title}</h1>
            </div>
            <EpisodePlayer title={reader.title} playerUrl={reader.playerUrl} servers={reader.servers} episodeLabel={currentEpisodeLabel} />
            {(previousEpisode || nextEpisode) ? (
              <div className="mt-6 border-t border-white/6 pt-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  {previousEpisode ? (
                    <Link href={`/nonton/${previousEpisode.slug}`} className="group flex min-h-20 items-center gap-3 rounded-[1.35rem] bg-background/30 px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] transition hover:bg-primary/12">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary transition group-hover:bg-primary/18">
                        <ChevronLeft size={19} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[0.68rem] font-bold uppercase tracking-[0.2em] text-primary">Sebelumnya</span>
                        <span className="mt-1 block truncate font-display text-base font-semibold text-on-surface transition group-hover:text-primary">{previousEpisodeLabel}</span>
                      </span>
                    </Link>
                  ) : (
                    <div className="hidden sm:block" />
                  )}
                  {nextEpisode ? (
                    <Link href={`/nonton/${nextEpisode.slug}`} className="group flex min-h-20 items-center justify-between gap-3 rounded-[1.35rem] bg-background/30 px-4 py-3 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] transition hover:bg-primary/12">
                      <span className="min-w-0">
                        <span className="block text-[0.68rem] font-bold uppercase tracking-[0.2em] text-primary">Berikutnya</span>
                        <span className="mt-1 block truncate font-display text-base font-semibold text-on-surface transition group-hover:text-primary">{nextEpisodeLabel}</span>
                      </span>
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary transition group-hover:bg-primary/18">
                        <ChevronRight size={19} />
                      </span>
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="relative mt-8 overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,rgba(27,24,35,0.78),rgba(16,14,22,0.9))] p-5 shadow-xl shadow-black/18 md:p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-primary/8 blur-3xl" />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="relative">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <Download size={16} />
              Download
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold">Pilihan resolusi</h2>
          </div>
          <p className="relative rounded-full bg-background/28 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">{reader.downloads.length ? `${reader.downloads.length} kualitas` : 'Belum tersedia'}</p>
        </div>
        <div className="relative mt-5 divide-y divide-white/6">
          {reader.downloads.map((download) => (
            <div key={download.resolution} className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[140px_1fr] md:items-center">
              <div>
                <p className="font-display text-lg font-semibold leading-none text-on-surface">{download.resolution}</p>
                <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-primary/80">{download.links.length} link</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {download.links.map((link) => (
                  <a key={`${download.resolution}-${link.label}-${link.value}`} href={link.value} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-background/34 px-3.5 py-2 text-center text-xs font-bold text-on-surface-variant shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] transition hover:bg-primary/14 hover:text-primary active:scale-95">
                    <span className="truncate">{link.label}</span>
                    <ExternalLink size={13} />
                  </a>
                ))}
              </div>
            </div>
          ))}
          {!reader.downloads.length ? (
            <div className="py-4 text-sm text-on-surface-variant">
              Link download belum tersedia.
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-8 rounded-[2rem] bg-surface-container-low/72 p-5 shadow-xl shadow-black/18 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <MessageCircle size={16} />
              Komentar Episode
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold">Diskusi penonton</h2>
          </div>
          <p className="text-sm text-on-surface-variant">{comments.length} komentar</p>
        </div>
        <CommentComposer comicSlug={series?.slug ?? reader.seriesSlug ?? reader.slug} chapterSlug={reader.slug} initialComments={comments} variant="embedded" />
      </div>
    </section>
  );
}
