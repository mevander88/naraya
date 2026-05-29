import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Film, MessageCircle, Play } from 'lucide-react';
import { getComments, getSeriesDetail } from '../../data';
import { BookmarkButton, CommentComposer } from '../../internal-actions';
import { CollapsibleInfo, CollapsibleSynopsis } from '../collapsible-detail';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const detail = await getSeriesDetail(params.slug);
  if (!detail) {
    return { title: 'Series tidak ditemukan' };
  }
  const description = detail.description || `Nonton ${detail.title} di Naraya.`;
  return {
    title: detail.title,
    description,
    alternates: { canonical: `/series/${params.slug}` },
    openGraph: {
      title: `${detail.title} | Naraya`,
      description,
      url: `/series/${params.slug}`,
      images: detail.cover ? [{ url: detail.cover, alt: detail.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${detail.title} | Naraya`,
      description,
      images: detail.cover ? [detail.cover] : undefined,
    },
  };
}

export default async function SeriesDetailPage({ params }: { params: { slug: string } }) {
  const detail = await getSeriesDetail(params.slug);
  if (!detail) notFound();

  const comments = await getComments({ comicSlug: detail.slug });
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

  return (
    <section className="px-container-mobile pb-20 pt-28 md:px-container-desktop">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <div>
          {detail.cover ? (
            <img src={detail.cover} alt={detail.title} width={280} height={420} fetchPriority="high" decoding="async" className="reveal-soft aspect-[2/3] w-full rounded-2xl object-cover shadow-glow" />
          ) : (
            <div className="reveal-soft grid aspect-[2/3] w-full place-items-center rounded-2xl bg-primary/10 font-display text-5xl font-bold text-primary shadow-glow">
              {detail.title.slice(0, 1)}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Series Anime</p>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-6xl">{detail.title}</h1>
          <div className="mt-5 flex flex-wrap gap-2">
            {detail.genres.map((genre) => (
              <Link key={genre} href={`/explore?genre=${encodeURIComponent(genre)}`} className="rounded-full border border-white/10 bg-surface-container-high px-3 py-1 text-sm text-on-surface-variant transition hover:border-primary/50 hover:text-primary">
                {genre}
              </Link>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {latest ? (
              <Link href={`/nonton/${latest.slug}`} className="interactive-lift inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 font-semibold text-on-primary shadow-glow transition hover:brightness-110 active:scale-95">
                <Play size={18} fill="currentColor" />
                Nonton Episode Terbaru
              </Link>
            ) : null}
            <BookmarkButton comic={bookmarkSeries} variant="button" />
          </div>
        </div>
      </div>

      <CollapsibleInfo rows={detail.info} />
      <CollapsibleSynopsis text={detail.description || 'Sinopsis belum tersedia untuk series ini.'} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div id="episode-list">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Film size={20} className="text-primary" />
                <h2 className="font-display text-2xl font-semibold">Daftar Episode</h2>
              </div>
              <p className="mt-1 text-sm text-on-surface-variant">Pilih episode untuk mulai menonton.</p>
            </div>
            <span className="text-sm font-semibold text-primary">{detail.episodes.length} episode</span>
          </div>
          <div className="mt-5 grid gap-3">
            {detail.episodes.map((episode) => (
              <Link key={episode.slug} href={`/nonton/${episode.slug}`} className="group flex items-center justify-between gap-4 rounded-2xl bg-surface-container-low/80 p-4 shadow-lg shadow-black/10 ring-1 ring-white/6 transition hover:bg-primary/10 hover:ring-primary/30">
                <div>
                  <p className="font-semibold text-on-surface transition group-hover:text-primary">{episode.title}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">{[episode.number ? `Episode ${episode.number}` : '', episode.date].filter(Boolean).join(' - ') || 'Episode'}</p>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Play size={16} fill="currentColor" />
                </span>
              </Link>
            ))}
            {!detail.episodes.length ? (
              <div className="glass-panel rounded-2xl p-5 text-sm text-on-surface-variant">
                Belum ada episode yang tersedia.
              </div>
            ) : null}
          </div>
        </div>
        <aside>
          <div className="rounded-[2rem] bg-surface-container-low/82 p-5 shadow-xl shadow-black/20 ring-1 ring-white/8">
            <div className="flex items-center gap-3">
              <MessageCircle size={20} className="text-primary" />
              <h2 className="font-display text-2xl font-semibold">Komentar Anime</h2>
              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">{comments.length}</span>
            </div>
            <CommentComposer comicSlug={detail.slug} variant="embedded" />
            <div className="mt-5 grid max-h-[520px] gap-3 overflow-y-auto pr-1 [scrollbar-color:rgba(216,178,255,0.45)_transparent] [scrollbar-width:thin]">
              {comments.map((comment) => (
                <article key={comment.id} className="rounded-2xl bg-background/35 p-4">
                  <div className="flex items-center gap-3">
                    <img src={comment.avatarUrl || '/logo.svg'} alt={comment.displayName} width={40} height={40} loading="lazy" decoding="async" className="h-10 w-10 rounded-xl object-cover" />
                    <div>
                      <h3 className="font-semibold">{comment.displayName}</h3>
                      <p className="text-xs text-on-surface-variant">@{comment.username}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-on-surface-variant">{comment.body}</p>
                </article>
              ))}
              {!comments.length ? (
                <div className="rounded-2xl bg-background/35 p-5 text-sm text-on-surface-variant">
                  Belum ada komentar untuk anime ini.
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
