import { memo } from 'react';
import { ArrowRight, Filter } from 'lucide-react';
import Link from 'next/link';
import type { ComicCardData } from './data';
import { BookmarkButton } from './internal-actions';

function detailHref(item: ComicCardData) {
  return item.kind === 'series' ? `/series/${item.slug}` : `/komik/${item.slug}`;
}

function latestHref(item: ComicCardData) {
  if (item.latestChapterSlug) {
    return item.kind === 'series' ? `/nonton/${item.latestChapterSlug}` : `/baca/${item.latestChapterSlug}`;
  }
  return detailHref(item);
}

function detailLabel(item: ComicCardData) {
  return item.kind === 'series' ? 'Detail Anime' : 'Detail Komik';
}

export function ContinueReading({ comic }: { comic?: ComicCardData }) {
  if (!comic) return null;
  const href = latestHref(comic);

  return (
    <section data-scroll-reveal className="scroll-reveal relative z-10 -mt-10 px-container-mobile md:px-container-desktop">
      <div className="glass-panel flex flex-col gap-6 rounded-2xl p-5 md:flex-row md:items-center md:p-6">
        <img src={comic.image} alt={comic.title} width={96} height={128} loading="lazy" decoding="async" className="h-32 w-24 rounded-xl object-cover shadow-2xl" />
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-on-surface">{comic.kind === 'series' ? 'Episode terbaru' : 'Chapter terbaru'}</h3>
          <p className="mt-1 text-on-surface-variant">{comic.title}: {comic.episode}</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-full rounded-full bg-primary" />
          </div>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Update katalog Naraya</p>
        </div>
        <Link href={href} className="interactive-lift rounded-xl bg-primary-container px-6 py-3 text-center font-semibold text-on-primary-container transition hover:brightness-110 active:scale-95">
          {comic.kind === 'series' ? 'Nonton Episode' : 'Buka Chapter'}
        </Link>
      </div>
    </section>
  );
}

export const GenreChips = memo(function GenreChips({ activeGenre = 'All', genres = [] }: { activeGenre?: string; genres?: string[] }) {
  if (!genres.length) return null;

  return (
    <section data-scroll-reveal className="scroll-reveal content-visibility-auto mt-14 px-container-mobile md:px-container-desktop">
      <h2 className="font-display text-2xl font-semibold text-on-background">Genre Populer</h2>
      <div className="hide-scrollbar mt-6 flex gap-3 overflow-x-auto pb-2">
        {genres.slice(0, 18).map((genre) => (
          <Link
            key={genre}
            href={`/explore?genre=${encodeURIComponent(genre)}`}
            className={`interactive-lift shrink-0 rounded-full px-5 py-2 text-sm font-medium transition ${
              activeGenre === genre ? 'bg-primary text-on-primary' : 'border border-white/5 bg-surface-container-high text-on-surface-variant hover:bg-surface-variant hover:text-primary'
            }`}
          >
            {genre}
          </Link>
        ))}
      </div>
    </section>
  );
});

export const TrendingRail = memo(function TrendingRail({ title = 'Trending Hari Ini', href = '/explore', comics = [] }: { title?: string; href?: string; comics?: ComicCardData[] }) {
  return (
    <section data-scroll-reveal className="scroll-reveal content-visibility-auto mt-14 px-container-mobile md:px-container-desktop">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="min-w-0 font-display text-2xl font-semibold text-on-background">{title}</h2>
        <Link href={href} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-surface-container-high px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/10">
          Lihat semua
          <ArrowRight size={16} />
        </Link>
      </div>
      <div className="hide-scrollbar flex snap-x gap-4 overflow-x-auto pb-3">
        {comics.map((comic, index) => (
          <div key={comic.title} className="w-44 shrink-0 snap-start md:w-56">
            <ComicCard comic={comic} priority={index < 2} />
          </div>
        ))}
      </div>
    </section>
  );
});

export const ComicCard = memo(function ComicCard({ comic, priority = false }: { comic: ComicCardData; priority?: boolean }) {
  const href = detailHref(comic);

  return (
    <article className="group relative w-full min-w-0 shrink-0 snap-start cursor-pointer">
      <Link href={href} className="relative mb-3 block aspect-[2/3] overflow-hidden rounded-xl border border-white/5">
          <img src={comic.image} alt={comic.title} width={224} height={336} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" sizes="(max-width: 768px) 44vw, 224px" className="card-scroll-media image-render-safe h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          {comic.badge ? <span className="absolute left-2 top-2 rounded bg-black/65 px-2 py-1 text-xs font-semibold text-primary backdrop-blur">{comic.badge}</span> : null}
      </Link>
      <div className="absolute right-2 top-2 z-10 opacity-100 md:opacity-0 md:transition md:group-hover:opacity-100">
        <BookmarkButton comic={comic} deferSessionCheck />
      </div>
      <Link href={href} className="block truncate text-lg font-semibold text-on-surface transition group-hover:text-primary">{comic.title}</Link>
      <p className="text-sm text-on-surface-variant">{comic.meta || detailLabel(comic)}</p>
    </article>
  );
});

export const UpdatesGrid = memo(function UpdatesGrid({ title = 'Update Terbaru', comics = [] }: { title?: string; comics?: ComicCardData[] }) {
  const liveUpdates = comics.slice(0, 18);
  const lead = liveUpdates[0];
  const secondaryUpdates = liveUpdates.slice(1);

  return (
    <section data-scroll-reveal className="scroll-reveal content-visibility-auto mt-20 px-container-mobile pb-16 md:px-container-desktop">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="min-w-0 font-display text-2xl font-semibold text-on-background">{title}</h2>
        <Link href="/indeks" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-surface-container-high px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/10" aria-label="Buka indeks komik dan anime">
          <Filter size={18} />
          Indeks
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-7 md:grid-cols-4 md:gap-x-6 lg:grid-cols-6">
        {lead ? <Link href={latestHref(lead)} className="interactive-lift group col-span-2 row-span-2 min-h-[360px] cursor-pointer overflow-hidden rounded-2xl border border-white/5">
          <div className="relative h-full">
            <img src={lead.image} alt={lead.title} width={520} height={780} loading="lazy" decoding="async" sizes="(max-width: 768px) 92vw, 520px" className="card-scroll-media image-render-safe h-full w-full object-cover transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-on-primary">{lead.kind === 'series' ? 'Episode Baru' : 'Chapter Baru'}</span>
              <h3 className="mt-3 font-display text-2xl font-semibold text-white">{lead.title}</h3>
              <p className="text-sm text-white/70">{lead.episode}</p>
            </div>
          </div>
        </Link> : null}
        {secondaryUpdates.map((comic) => (
          <Link key={`${comic.kind || 'comic'}-${comic.slug || comic.title}`} href={latestHref(comic)} className="interactive-lift group cursor-pointer">
            <div className="mb-3 aspect-[2/3] overflow-hidden rounded-xl border border-white/5">
              <img src={comic.image} alt={comic.title} width={180} height={270} loading="lazy" decoding="async" sizes="(max-width: 768px) 44vw, 180px" className="card-scroll-media image-render-safe h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            </div>
            <h4 className="truncate font-semibold text-on-surface">{comic.title}</h4>
            <p className="text-xs text-on-surface-variant">{comic.episode || detailLabel(comic)}</p>
          </Link>
        ))}
        {!liveUpdates.length ? <div className="glass-panel col-span-full rounded-2xl p-6 text-on-surface-variant">Belum ada update saat ini.</div> : null}
      </div>
    </section>
  );
});
