'use client';

import Link from 'next/link';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { ComicCardData, LibraryItem } from '../data';
import { apiCredentials, apiURL } from '../lib/client-api';

type LibraryClientProps = {
  library: LibraryItem[];
  suggestions: ComicCardData[];
};

type LibrarySection = 'favorites' | 'history';
type StatusFilter = 'all' | 'reading' | 'completed';

const librarySections: Array<{ id: LibrarySection; label: string }> = [
  { id: 'favorites', label: 'Favorit' },
  { id: 'history', label: 'Riwayat' },
];
const typeFilters = ['All', 'Anime', 'Komik'];
const statusFilters: Array<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: 'Semua status' },
  { id: 'reading', label: 'Berjalan' },
  { id: 'completed', label: 'Selesai' },
];

function itemKind(item: LibraryItem) {
  return item.contentKind === 'series' ? 'Anime' : 'Komik';
}

function itemHref(item: LibraryItem) {
  if (item.contentKind === 'series') {
    return item.lastChapterSlug ? `/nonton/${item.lastChapterSlug}` : item.latestChapterSlug ? `/nonton/${item.latestChapterSlug}` : `/series/${item.comicSlug}`;
  }
  return item.lastChapterSlug ? `/baca/${item.lastChapterSlug}` : item.latestChapterSlug ? `/baca/${item.latestChapterSlug}` : `/komik/${item.comicSlug}`;
}

function isHistoryItem(item: LibraryItem) {
  return item.status !== 'planned' || item.progressPercent > 0;
}

function itemProgressLabel(item: LibraryItem) {
  if (item.status === 'completed') return 'Selesai';
  if (item.progressPercent > 0) return `Progress ${item.progressPercent}%`;
  return item.contentKind === 'series' ? 'Belum ditonton' : 'Belum dibaca';
}

export function LibraryClient({ library, suggestions }: LibraryClientProps) {
  const [activeSection, setActiveSection] = useState<LibrarySection>('favorites');
  const [activeType, setActiveType] = useState('All');
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('all');
  const [coverOverrides, setCoverOverrides] = useState<Record<string, string>>({});
  const coverRefreshAttempts = useRef(new Set<string>());
  const favoriteItems = useMemo(() => library.filter((item) => item.isBookmarked), [library]);
  const historyItems = useMemo(() => library.filter(isHistoryItem), [library]);
  const currentItems = activeSection === 'favorites' ? favoriteItems : historyItems;
  const visibleItems = useMemo(() => {
    return currentItems.filter((item) => {
      const matchesType = activeType === 'All' || itemKind(item) === activeType;
      const matchesStatus = activeSection !== 'history' || activeStatus === 'all' || item.status === activeStatus;
      return matchesType && matchesStatus;
    });
  }, [activeSection, activeStatus, activeType, currentItems]);
  const refreshCover = useCallback(async (item: LibraryItem) => {
    if (coverRefreshAttempts.current.has(item.id)) return;
    coverRefreshAttempts.current.add(item.id);
    try {
      const detailPath = item.contentKind === 'series' ? `/series/${item.comicSlug}` : `/comics/${item.comicSlug}`;
      const detailResponse = await fetch(apiURL(detailPath), {
        cache: 'no-store',
        credentials: apiCredentials(),
      });
      if (!detailResponse.ok) return;
      const detail = (await detailResponse.json()) as { cover?: string };
      const coverUrl = detail.cover?.trim();
      if (!coverUrl) return;
      setCoverOverrides((current) => ({ ...current, [item.id]: coverUrl }));
      await fetch(apiURL('/library'), {
        method: 'POST',
        credentials: apiCredentials(),
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comicSlug: item.comicSlug,
          comicTitle: item.comicTitle,
          contentKind: item.contentKind === 'series' ? 'series' : 'comic',
          coverUrl,
          latestChapterSlug: item.latestChapterSlug,
          lastChapterSlug: item.lastChapterSlug,
          lastChapterTitle: item.lastChapterTitle,
          status: item.status,
          progressPercent: item.progressPercent,
          isBookmarked: item.isBookmarked,
        }),
      });
    } catch {
      // The visual fallback remains in place if the cover cannot be refreshed.
    }
  }, []);

  return (
    <section className="px-container-mobile pt-28 md:px-container-desktop">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Rak Bacaan</p>
      <h2 className="mt-2 break-words font-display text-4xl font-bold">Rak bacaanmu</h2>
      <p className="mt-3 max-w-2xl text-on-surface-variant">
        Pisahkan item yang kamu simpan sebagai favorit dari aktivitas baca dan nonton terakhir.
      </p>

      <div className="mt-7 grid gap-3">
        <div className="flex min-w-0 flex-wrap gap-2">
          {librarySections.map((section) => {
            const total = section.id === 'favorites' ? favoriteItems.length : historyItems.length;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 ${
                  activeSection === section.id
                    ? 'bg-primary text-on-primary shadow-glow'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-primary/12 hover:text-primary'
                }`}
              >
                {section.label} <span className="ml-1 opacity-80">{total}</span>
              </button>
            );
          })}
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          {typeFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveType(filter)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 ${
                activeType === filter
                  ? 'bg-primary/18 text-primary ring-1 ring-primary/40'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-primary/12 hover:text-primary'
              }`}
            >
              {filter === 'All' ? 'Semua tipe' : filter}
            </button>
          ))}
        </div>
        {activeSection === 'history' ? (
          <div className="flex min-w-0 flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveStatus(filter.id)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 ${
                  activeStatus === filter.id
                    ? 'bg-primary/18 text-primary ring-1 ring-primary/40'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-primary/12 hover:text-primary'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-9 grid gap-4 md:gap-5">
        {visibleItems.map((item) => (
          <Link
            key={item.id}
            href={itemHref(item)}
            className="glass-panel interactive-lift reveal-soft group flex min-w-0 gap-4 rounded-2xl p-4 transition hover:border-primary/40 md:items-center md:p-5"
            aria-label={`${item.contentKind === 'series' ? 'Buka anime' : 'Buka komik'} ${item.comicTitle}`}
          >
            <img
              src={coverOverrides[item.id] || item.coverUrl || '/logo.svg'}
              alt={item.comicTitle}
              width={80}
              height={112}
              loading="lazy"
              decoding="async"
              onError={(event) => {
                event.currentTarget.src = '/logo.svg';
                void refreshCover(item);
              }}
              className="h-28 w-20 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex min-w-0 flex-wrap gap-2">
                <span className="inline-flex rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary">
                  {itemKind(item)}
                </span>
                {activeSection === 'history' ? (
                  <span className="inline-flex rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-on-surface-variant">
                    {item.status === 'completed' ? 'Selesai' : 'Berjalan'}
                  </span>
                ) : null}
              </div>
              <h3 className="truncate text-xl font-semibold">{item.comicTitle}</h3>
              <p className="mt-1 break-words text-sm text-on-surface-variant">{item.lastChapterTitle || item.latestChapterSlug || (item.contentKind === 'series' ? 'Belum ditonton' : 'Belum dibaca')} - {itemProgressLabel(item)}</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-primary" style={{ width: `${item.progressPercent}%` }} />
              </div>
            </div>
            <span className="hidden rounded-xl border border-white/10 px-5 py-3 font-semibold text-primary transition group-hover:border-primary/50 group-hover:bg-primary/10 md:block">
              {item.contentKind === 'series' ? 'Tonton' : 'Lanjut'}
            </span>
          </Link>
        ))}
        {library.length && !currentItems.length ? (
          <div className="glass-panel rounded-2xl p-6 text-on-surface-variant">
            {activeSection === 'favorites' ? 'Belum ada favorit yang disimpan.' : 'Belum ada riwayat baca atau tonton.'}
          </div>
        ) : null}
        {currentItems.length > 0 && !visibleItems.length ? (
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
                  <img src={comic.image} alt={comic.title} width={180} height={270} loading="lazy" decoding="async" className="aspect-[2/3] w-full rounded-xl object-cover" />
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
