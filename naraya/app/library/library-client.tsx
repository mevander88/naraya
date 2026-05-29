'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ComicCardData, LibraryItem } from '../data';

type LibraryClientProps = {
  library: LibraryItem[];
  suggestions: ComicCardData[];
};

const filters = ['All', 'Anime', 'Komik'];

function itemKind(item: LibraryItem) {
  return item.contentKind === 'series' ? 'Anime' : 'Komik';
}

function itemHref(item: LibraryItem) {
  if (item.contentKind === 'series') {
    return item.lastChapterSlug ? `/nonton/${item.lastChapterSlug}` : item.latestChapterSlug ? `/nonton/${item.latestChapterSlug}` : `/series/${item.comicSlug}`;
  }
  return item.lastChapterSlug ? `/baca/${item.lastChapterSlug}` : item.latestChapterSlug ? `/baca/${item.latestChapterSlug}` : `/komik/${item.comicSlug}`;
}

export function LibraryClient({ library, suggestions }: LibraryClientProps) {
  const [activeType, setActiveType] = useState('All');
  const visibleItems = useMemo(() => {
    if (activeType === 'All') return library;
    return library.filter((item) => itemKind(item) === activeType);
  }, [activeType, library]);

  return (
    <section className="px-container-mobile pt-28 md:px-container-desktop">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Rak Bacaan</p>
      <h2 className="mt-2 font-display text-4xl font-bold">Rak bacaanmu</h2>
      <p className="mt-3 max-w-2xl text-on-surface-variant">
        Bookmark, progress baca, dan status rak bacaan disimpan aman di akun Naraya.
      </p>

      <div className="mt-7 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveType(filter)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 ${
              activeType === filter
                ? 'bg-primary text-on-primary shadow-glow'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-primary/12 hover:text-primary'
            }`}
          >
            {filter === 'All' ? 'Semua' : filter}
          </button>
        ))}
      </div>

      <div className="mt-9 grid gap-4 md:gap-5">
        {visibleItems.map((item) => (
          <article key={item.id} className="glass-panel interactive-lift reveal-soft flex gap-4 rounded-2xl p-4 md:items-center md:p-5">
            <img src={item.coverUrl} alt={item.comicTitle} width={80} height={112} loading="lazy" decoding="async" className="h-28 w-20 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <div className="mb-2 inline-flex rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary">
                {itemKind(item)}
              </div>
              <h3 className="truncate text-xl font-semibold">{item.comicTitle}</h3>
              <p className="mt-1 text-sm text-on-surface-variant">{item.lastChapterTitle || item.latestChapterSlug || (item.contentKind === 'series' ? 'Belum ditonton' : 'Belum dibaca')} - progress {item.progressPercent}%</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-primary" style={{ width: `${item.progressPercent}%` }} />
              </div>
            </div>
            <Link
              href={itemHref(item)}
              className="hidden rounded-xl border border-white/10 px-5 py-3 font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/10 md:block"
            >
              {item.contentKind === 'series' ? 'Tonton' : 'Lanjut'}
            </Link>
          </article>
        ))}
        {library.length && !visibleItems.length ? (
          <div className="glass-panel rounded-2xl p-6 text-on-surface-variant">
            Belum ada item untuk filter ini.
          </div>
        ) : null}
        {!library.length ? (
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-xl font-semibold">Rak bacaan masih kosong</h3>
            <p className="mt-2 text-on-surface-variant">Tambahkan komik atau anime ke rak bacaan dari katalog. Di bawah ini rekomendasi terbaru dari Naraya.</p>
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
              {suggestions.slice(0, 4).map((comic) => (
                <article key={comic.slug} className="interactive-lift">
                  <img src={comic.image} alt={comic.title} width={180} height={270} loading="lazy" decoding="async" className="aspect-[2/3] rounded-xl object-cover" />
                  <h4 className="mt-2 truncate font-semibold">{comic.title}</h4>
                  <p className="text-xs text-on-surface-variant">{comic.episode}</p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
