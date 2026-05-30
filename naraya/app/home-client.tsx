'use client';

import { memo, useEffect, useState } from 'react';
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
  const motionBudget = useMotionBudget();

  useEffect(() => {
    setActiveIndex((index) => (slideCount ? index % slideCount : 0));
  }, [slideCount]);

  useEffect(() => {
    if (slideCount < 2 || motionBudget.reduced || motionBudget.saveData) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slideCount);
    }, motionBudget.mobile ? 6500 : 4200);
    return () => window.clearInterval(timer);
  }, [motionBudget.mobile, motionBudget.reduced, motionBudget.saveData, slideCount]);

  useScrollReveal([heroItems.length, comics.length, series.length, genres.length]);

  return (
    <>
      <HomeHeroSlider comics={heroItems} activeIndex={activeIndex} />
      <HeroControlRail slides={slides} activeIndex={activeIndex} onSelect={setActiveIndex} />
      <HomeStaticSections heroItems={heroItems} comics={comics} series={series} genres={genres} />
    </>
  );
}

function useMotionBudget() {
  const [budget, setBudget] = useState({ mobile: false, reduced: false, saveData: false });

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;

    function sync() {
      setBudget({
        mobile: mobileQuery.matches,
        reduced: reduceQuery.matches,
        saveData: Boolean(connection?.saveData),
      });
    }

    sync();
    mobileQuery.addEventListener('change', sync);
    reduceQuery.addEventListener('change', sync);
    return () => {
      mobileQuery.removeEventListener('change', sync);
      reduceQuery.removeEventListener('change', sync);
    };
  }, []);

  return budget;
}

function useScrollReveal(dependencies: unknown[]) {
  useEffect(() => {
    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-scroll-reveal]'));
    if (!nodes.length) return;

    if (reduceQuery.matches) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.12,
    });

    nodes.forEach((node, index) => {
      if (!node.style.getPropertyValue('--reveal-delay')) {
        node.style.setProperty('--reveal-delay', `${Math.min(index % 3, 2) * 60}ms`);
      }
      observer.observe(node);
    });

    return () => observer.disconnect();
  }, dependencies);
}

const HomeStaticSections = memo(function HomeStaticSections({ heroItems, comics, series, genres }: { heroItems: ComicCardData[]; comics: ComicCardData[]; series: ComicCardData[]; genres: string[] }) {
  return (
    <>
      <TrendingRail title="Sorotan Utama" href="/komik" comics={heroItems.slice(0, 18)} />
      <GenreChips genres={genres} />
      <TrendingRail title="Anime Terbaru" href="/komik" comics={series} />
      <TrendingRail title="Komik Trending" href="/explore" comics={comics.slice(0, 18)} />
      <UpdatesGrid title="Update Komik Terbaru" comics={comics} />
      <UpdatesGrid title="Update Anime Terbaru" comics={series} />
    </>
  );
});

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
  if (!activeComic) return null;

  const activeHref = latestHref(activeComic);

  return (
    <section className="relative z-10 -mt-10 px-container-mobile md:-mt-12 md:px-container-desktop">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-background/78 shadow-2xl shadow-black/25 backdrop-blur-xl">
        <div className="grid gap-0 md:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.7fr)]">
          <div className="relative min-h-44 overflow-hidden p-5 md:border-r md:border-white/10">
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
              <h2 className="mt-3 line-clamp-2 break-words font-display text-2xl font-bold leading-tight text-on-surface">
                {activeComic.title}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-on-surface-variant">{activeComic.episode}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={activeHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:brightness-110"
                >
                  <Play size={16} fill="currentColor" />
                  {activeComic.kind === 'series' ? 'Nonton episode' : 'Buka chapter'}
                </Link>
                {activeComic.kind === 'series' ? null : <BookmarkButton comic={activeComic} />}
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto overflow-y-visible overscroll-x-contain px-3 pb-3 pt-6 [scrollbar-width:none] md:px-4 md:pb-4 md:pt-7 [&::-webkit-scrollbar]:hidden">
            {slides.map((comic, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={`${comic.kind || 'item'}-${comic.slug}-${index}`}
                  type="button"
                  onClick={() => onSelect(index)}
                  aria-label={`Tampilkan ${comic.title}`}
                  aria-pressed={isActive}
                  className={`group relative min-w-[170px] overflow-hidden rounded-2xl text-left md:min-w-[200px] ${
                    isActive ? 'bg-primary/14 shadow-glow' : 'bg-white/[0.035] opacity-70 hover:bg-white/[0.07] hover:opacity-100'
                  }`}
                >
                  <div className="relative h-28 overflow-hidden">
                    <img
                      src={comic.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className={`image-render-safe h-full w-full object-cover ${isActive ? 'saturate-110' : 'saturate-75 group-hover:saturate-100'}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/82 via-transparent to-transparent" />
                    <span className="absolute bottom-2 left-2 rounded-full bg-background/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface backdrop-blur">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="px-3 pb-3 pt-3">
                    <h4 className="line-clamp-2 break-words text-sm font-semibold leading-5 text-on-surface">{comic.title}</h4>
                    <p className="mt-1 line-clamp-1 text-xs text-on-surface-variant">{comic.episode}</p>
                  </div>
                  <span className={`absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-primary ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
