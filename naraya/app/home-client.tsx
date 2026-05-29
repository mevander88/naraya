'use client';

import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import Link from 'next/link';
import { HomeHeroSlider } from './home-hero-slider';
import { GenreChips, TrendingRail, UpdatesGrid } from './components';
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

export function HomeClient({ heroItems = [], comics = [], series = [], genres = [] }: { heroItems?: ComicCardData[]; comics?: ComicCardData[]; series?: ComicCardData[]; genres?: string[] }) {
  const slides = heroItems.slice(0, 8);
  const slideCount = slides.length;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex((index) => (slideCount ? index % slideCount : 0));
  }, [slideCount]);

  useEffect(() => {
    if (slideCount < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slideCount);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [slideCount]);

  return (
    <>
      <HomeHeroSlider comics={heroItems} activeIndex={activeIndex} />
      <HeroControlRail slides={slides} activeIndex={activeIndex} onSelect={setActiveIndex} />
      <TrendingRail title="Sorotan Utama" href="/komik" comics={heroItems.slice(0, 18)} />
      <GenreChips genres={genres} />
      <TrendingRail title="Anime Terbaru" href="/komik" comics={series} />
      <TrendingRail title="Komik Trending" href="/explore" comics={comics.slice(0, 18)} />
      <UpdatesGrid title="Update Komik Terbaru" comics={comics} />
      <UpdatesGrid title="Update Anime Terbaru" comics={series} />
    </>
  );
}

function HeroControlRail({
  slides,
  activeIndex,
  onSelect,
}: {
  slides: ComicCardData[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const activeComic = slides[activeIndex] ?? slides[0];
  const railRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const rail = railRef.current;
    const card = cardRefs.current[activeIndex];
    if (!rail || !card) return;
    if (!rail.contains(card)) return;
    if (activeIndex === 0) {
      animateRailScroll(rail, 0);
      return;
    }
    const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const firstCard = cardRefs.current[0];
    const secondCard = cardRefs.current[1];
    const cardStep = firstCard && secondCard ? secondCard.offsetLeft - firstCard.offsetLeft : card.offsetWidth + 8;
    const cardLeft = firstCard ? firstCard.offsetLeft + activeIndex * cardStep : card.offsetLeft;
    const safeGap = 28;
    const cardRight = cardLeft + card.offsetWidth;
    const visibleLeft = rail.scrollLeft + safeGap;
    const visibleRight = rail.scrollLeft + rail.clientWidth - safeGap;
    let nextLeft = rail.scrollLeft;
    if (cardLeft < visibleLeft) {
      nextLeft = Math.max(0, cardLeft - safeGap);
    } else if (cardRight > visibleRight) {
      nextLeft = Math.min(maxScroll, cardRight - rail.clientWidth + safeGap);
    }
    if (nextLeft === rail.scrollLeft) return;

    return animateRailScroll(rail, nextLeft);
  }, [activeIndex]);

  if (!activeComic) return null;

  const activeHref = latestHref(activeComic);

  return (
    <section className="relative z-10 -mt-10 px-container-mobile md:-mt-12 md:px-container-desktop">
      <div className="reveal-soft overflow-hidden rounded-[2rem] border border-white/10 bg-background/78 shadow-2xl shadow-black/25 backdrop-blur-xl">
        <div className="grid gap-0 md:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.7fr)]">
          <div
            key={activeComic.slug}
            className="relative min-h-44 overflow-hidden p-5 transition duration-500 ease-out animate-in fade-in slide-in-from-bottom-4 md:border-r md:border-white/10"
          >
            <img
              src={activeComic.image}
              alt={activeComic.title}
              loading="lazy"
              decoding="async"
              className="absolute right-0 top-0 h-full w-36 object-cover opacity-25 blur-[1px] md:w-44"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/14 via-background/10 to-transparent" />
            <div className="relative max-w-[72%]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Sedang tampil</p>
              <h3 className="mt-3 line-clamp-2 font-display text-2xl font-bold leading-tight text-on-surface">
                {activeComic.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-on-surface-variant">{activeComic.episode}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={activeHref}
                  className="interactive-lift inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:brightness-110 active:scale-95"
                >
                  <Play size={16} fill="currentColor" />
                  {activeComic.kind === 'series' ? 'Nonton episode' : 'Buka chapter'}
                </Link>
                {activeComic.kind === 'series' ? null : <BookmarkButton comic={activeComic} />}
              </div>
            </div>
          </div>

          <div ref={railRef} className="flex gap-2 overflow-x-auto overflow-y-visible overscroll-x-contain px-3 pb-3 pt-6 [scrollbar-width:none] md:px-4 md:pb-4 md:pt-7 [&::-webkit-scrollbar]:hidden">
            {slides.map((comic, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={comic.slug}
                  ref={(node) => {
                    cardRefs.current[index] = node;
                  }}
                  type="button"
                  onClick={() => onSelect(index)}
                  aria-label={`Tampilkan ${comic.title}`}
                  aria-pressed={isActive}
                  className={`group relative min-w-[170px] overflow-hidden rounded-2xl text-left transition duration-500 ease-out active:scale-95 md:min-w-[200px] ${
                    isActive
                      ? '-translate-y-1 scale-[1.02] bg-primary/14 shadow-glow'
                      : 'translate-y-0 bg-white/[0.035] opacity-70 hover:-translate-y-1 hover:bg-white/[0.07] hover:opacity-100'
                  }`}
                >
                  <div className="relative h-28 overflow-hidden">
                    <img
                      src={comic.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className={`h-full w-full object-cover transition duration-700 ease-out ${
                        isActive ? 'scale-105 saturate-110' : 'scale-100 saturate-75 group-hover:scale-105 group-hover:saturate-100'
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/82 via-transparent to-transparent" />
                    <span className="absolute bottom-2 left-2 rounded-full bg-background/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface backdrop-blur">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="px-3 pb-3 pt-3">
                    <h4 className="line-clamp-2 text-sm font-semibold leading-5 text-on-surface">{comic.title}</h4>
                    <p className="mt-1 line-clamp-1 text-xs text-on-surface-variant">{comic.episode}</p>
                  </div>
                  <span
                    className={`absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-primary transition duration-500 ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function animateRailScroll(rail: HTMLDivElement, nextLeft: number) {
  if (nextLeft === rail.scrollLeft) return;
  const startLeft = rail.scrollLeft;
  const distance = nextLeft - startLeft;
  const duration = 360;
  const startTime = performance.now();
  let frame = 0;
  const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);
  const step = (time: number) => {
    const progress = Math.min(1, (time - startTime) / duration);
    rail.scrollLeft = startLeft + distance * easeOutCubic(progress);
    if (progress < 1) {
      frame = requestAnimationFrame(step);
    }
  };
  frame = requestAnimationFrame(step);
  return () => {
    cancelAnimationFrame(frame);
  };
}
