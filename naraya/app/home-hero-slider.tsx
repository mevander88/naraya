'use client';

import { Info, Play } from 'lucide-react';
import Link from 'next/link';
import type { ComicCardData } from './data';

function detailLabel(item?: ComicCardData) {
  return item?.kind === 'series' ? 'Detail Anime' : 'Detail Komik';
}

export function HomeHeroSlider({ comics = [], activeIndex = 0 }: { comics?: ComicCardData[]; activeIndex?: number }) {
  const slides = comics.slice(0, 8);
  const hero = slides[activeIndex] ?? comics[0];
  const heroChapterHref = hero?.latestChapterSlug ? (hero.kind === 'series' ? `/nonton/${hero.latestChapterSlug}` : `/baca/${hero.latestChapterSlug}`) : hero ? (hero.kind === 'series' ? `/series/${hero.slug}` : `/komik/${hero.slug}`) : '/komik';

  return (
    <section className="relative h-[560px] overflow-hidden md:h-[660px]">
      {hero ? (
        <img
          key={hero.slug}
          src={hero.image}
          alt={hero.title}
          width={1440}
          height={720}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full animate-[hero-kenburns_900ms_ease-out_both] object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/25 to-transparent" />
      <div key={hero?.slug ?? 'empty'} className="relative flex h-full max-w-5xl animate-[hero-copy_620ms_cubic-bezier(0.25,1,0.5,1)_both] flex-col justify-end px-container-mobile pb-24 md:px-container-desktop md:pb-32">
        <span className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-primary">Update Naraya</span>
        <h2 className="line-clamp-3 max-w-3xl font-display text-[2.35rem] font-bold leading-[1.02] text-on-background md:line-clamp-none md:text-6xl">{hero?.title ?? 'Naraya Comic Feed'}</h2>
        <p className="mt-4 line-clamp-2 max-w-2xl text-base leading-7 text-on-surface-variant md:mt-5 md:text-lg md:leading-8">{hero?.episode ?? 'Jelajahi komik, anime, genre, chapter, dan episode dalam satu pengalaman yang rapi.'}</p>
        <div className="mt-6 flex flex-wrap gap-3 md:mt-8 md:gap-4">
          <Link href={heroChapterHref} className="interactive-lift inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3 font-semibold text-on-primary shadow-glow transition hover:brightness-110 active:scale-95">
            <Play size={20} fill="currentColor" />
            {hero?.latestChapterSlug ? (hero.kind === 'series' ? 'Nonton Episode Baru' : 'Baca Chapter Baru') : 'Buka Indeks'}
          </Link>
          <Link href={hero ? (hero.kind === 'series' ? `/series/${hero.slug}` : `/komik/${hero.slug}`) : '/komik'} className="interactive-lift inline-flex items-center gap-2 rounded-xl border border-white/10 bg-surface-variant/45 px-7 py-3 font-semibold text-on-surface transition hover:bg-surface-variant active:scale-95">
            <Info size={20} />
            {detailLabel(hero)}
          </Link>
        </div>
      </div>
    </section>
  );
}
