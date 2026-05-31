'use client';

import { Check, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComicCardData, LibraryItem, LibraryPageData } from '../data';
import { apiCredentials, apiURL } from '../lib/client-api';

type LibraryClientProps = {
  initialPage: LibraryPageData;
  suggestions: ComicCardData[];
};

type LibrarySection = 'favorites' | 'history';
type TypeFilter = 'All' | 'Anime' | 'Komik';
type StatusFilter = 'all' | 'ongoing' | 'reading' | 'completed';
type DropdownOption<T extends string> = { id: T; label: string };

const librarySections: Array<{ id: LibrarySection; label: string }> = [
  { id: 'favorites', label: 'Favorit' },
  { id: 'history', label: 'Riwayat' },
];
const typeFilters: Array<DropdownOption<TypeFilter>> = [
  { id: 'All', label: 'Semua tipe' },
  { id: 'Anime', label: 'Anime' },
  { id: 'Komik', label: 'Komik' },
];
const favoriteStatusFilters: Array<DropdownOption<StatusFilter>> = [
  { id: 'all', label: 'Semua status' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'completed', label: 'Complete' },
];
const historyStatusFilters: Array<DropdownOption<StatusFilter>> = [
  { id: 'all', label: 'Semua status' },
  { id: 'reading', label: 'Berjalan' },
  { id: 'completed', label: 'Selesai' },
];

function itemKind(item: LibraryItem) {
  return item.contentKind === 'series' ? 'Anime' : 'Komik';
}

function detailHref(item: LibraryItem) {
  return item.contentKind === 'series' ? `/series/${item.comicSlug}` : `/komik/${item.comicSlug}`;
}

function historyHref(item: LibraryItem) {
  if (item.contentKind === 'series') {
    return item.lastChapterSlug ? `/nonton/${item.lastChapterSlug}` : item.latestChapterSlug ? `/nonton/${item.latestChapterSlug}` : `/series/${item.comicSlug}`;
  }
  return item.lastChapterSlug ? `/baca/${item.lastChapterSlug}` : item.latestChapterSlug ? `/baca/${item.latestChapterSlug}` : `/komik/${item.comicSlug}`;
}

function itemHref(item: LibraryItem, section: LibrarySection) {
  return section === 'favorites' ? detailHref(item) : historyHref(item);
}

function itemProgressLabel(item: LibraryItem) {
  if (item.status === 'completed') return 'Selesai';
  if (item.progressTotal && item.progressCompleted) {
    const unit = item.contentKind === 'series' ? 'episode' : 'chapter';
    return `${item.progressCompleted}/${item.progressTotal} ${unit}`;
  }
  if (item.progressPercent > 0) return `Progress ${item.progressPercent}%`;
  return item.contentKind === 'series' ? 'Belum ditonton' : 'Belum dibaca';
}

function favoriteLabel(item: LibraryItem) {
  return item.contentKind === 'series' ? 'Buka detail anime' : 'Buka detail komik';
}

function contentStatusLabel(value?: string) {
  const normalized = (value ?? '').toLowerCase();
  if (normalized.includes('on-going') || normalized.includes('ongoing')) return 'Ongoing';
  if (normalized.includes('completed') || normalized.includes('complete')) return 'Complete';
  return '';
}

function typeQuery(value: TypeFilter) {
  if (value === 'Anime') return 'series';
  if (value === 'Komik') return 'comic';
  return '';
}

export function LibraryClient({ initialPage, suggestions }: LibraryClientProps) {
  const [activeSection, setActiveSection] = useState<LibrarySection>('favorites');
  const [activeType, setActiveType] = useState<TypeFilter>('All');
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('all');
  const [items, setItems] = useState<LibraryItem[]>(initialPage.items);
  const [counts, setCounts] = useState(initialPage.counts);
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor ?? '');
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [coverOverrides, setCoverOverrides] = useState<Record<string, string>>({});
  const coverRefreshAttempts = useRef(new Set<string>());
  const initialLoadSkipped = useRef(false);

  const fetchLibrary = useCallback(async (mode: 'reset' | 'more' = 'reset') => {
    if (mode === 'more' && (!hasMore || !nextCursor || loadingMore)) return;
    if (mode === 'reset') setLoading(true);
    if (mode === 'more') setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      params.set('section', activeSection);
      params.set('limit', '24');
      const kind = typeQuery(activeType);
      if (kind) params.set('type', kind);
      if (activeStatus !== 'all') params.set('status', activeStatus);
      if (mode === 'more' && nextCursor) params.set('cursor', nextCursor);
      const response = await fetch(apiURL(`/library?${params.toString()}`), {
        cache: 'no-store',
        credentials: apiCredentials(),
      });
      if (!response.ok) throw new Error('library failed');
      const payload = (await response.json()) as LibraryPageData;
      setItems((current) => (mode === 'more' ? [...current, ...(payload.items ?? [])] : payload.items ?? []));
      setCounts(payload.counts ?? { favorites: 0, history: 0 });
      setNextCursor(payload.nextCursor ?? '');
      setHasMore(Boolean(payload.hasMore));
    } catch {
      if (mode === 'reset') {
        setItems([]);
        setNextCursor('');
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeSection, activeStatus, activeType, hasMore, loadingMore, nextCursor]);

  useEffect(() => {
    if (!initialLoadSkipped.current) {
      initialLoadSkipped.current = true;
      return;
    }
    void fetchLibrary('reset');
  }, [activeSection, activeStatus, activeType]);

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
          contentStatus: item.contentStatus ?? '',
          coverUrl,
          latestChapterSlug: item.latestChapterSlug,
          lastChapterSlug: item.lastChapterSlug,
          lastChapterTitle: item.lastChapterTitle,
          status: item.status,
          progressPercent: item.progressPercent,
          progressCompleted: item.progressCompleted ?? 0,
          progressTotal: item.progressTotal ?? 0,
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
            const total = section.id === 'favorites' ? counts.favorites : counts.history;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  setActiveSection(section.id);
                  setActiveStatus('all');
                }}
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
        <div className="flex min-w-0 flex-wrap gap-3">
          <FilterDropdown
            label="Tipe"
            value={activeType}
            options={typeFilters}
            onChange={setActiveType}
          />
          <FilterDropdown
            label="Status"
            value={activeStatus}
            options={activeSection === 'favorites' ? favoriteStatusFilters : historyStatusFilters}
            onChange={setActiveStatus}
          />
        </div>
      </div>

      <div className="mt-9 grid gap-4 md:gap-5">
        {loading ? (
          <>
            <div className="skeleton h-36 rounded-2xl" />
            <div className="skeleton h-36 rounded-2xl" />
          </>
        ) : null}
        {!loading && items.map((item) => (
          <Link
            key={item.id}
            href={itemHref(item, activeSection)}
            className="glass-panel interactive-lift reveal-soft group flex min-w-0 gap-4 rounded-2xl p-4 transition hover:border-primary/40 md:items-center md:p-5"
            aria-label={`${activeSection === 'favorites' ? favoriteLabel(item) : item.contentKind === 'series' ? 'Lanjut nonton' : 'Lanjut baca'} ${item.comicTitle}`}
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
                {activeSection === 'favorites' && contentStatusLabel(item.contentStatus) ? (
                  <span className="inline-flex rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-on-surface-variant">
                    {contentStatusLabel(item.contentStatus)}
                  </span>
                ) : null}
                {activeSection === 'history' ? (
                  <span className="inline-flex rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-on-surface-variant">
                    {item.status === 'completed' ? 'Selesai' : 'Berjalan'}
                  </span>
                ) : null}
              </div>
              <h3 className="truncate text-xl font-semibold">{item.comicTitle}</h3>
              {activeSection === 'favorites' ? (
                <p className="mt-1 break-words text-sm text-on-surface-variant">{favoriteLabel(item)}</p>
              ) : (
                <>
                  <p className="mt-1 break-words text-sm text-on-surface-variant">{item.lastChapterTitle || item.latestChapterSlug || (item.contentKind === 'series' ? 'Belum ditonton' : 'Belum dibaca')} - {itemProgressLabel(item)}</p>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${item.progressPercent}%` }} />
                  </div>
                </>
              )}
            </div>
            <span className="hidden rounded-xl border border-white/10 px-5 py-3 font-semibold text-primary transition group-hover:border-primary/50 group-hover:bg-primary/10 md:block">
              {activeSection === 'favorites' ? 'Detail' : item.contentKind === 'series' ? 'Tonton' : 'Lanjut'}
            </span>
          </Link>
        ))}
        {!loading && (activeSection === 'favorites' ? counts.favorites : counts.history) > 0 && !items.length ? (
          <div className="glass-panel rounded-2xl p-6 text-on-surface-variant">
            Belum ada item untuk filter ini.
          </div>
        ) : null}
        {!loading && hasMore ? (
          <button
            type="button"
            onClick={() => void fetchLibrary('more')}
            disabled={loadingMore}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-surface-container-high px-5 py-3 text-sm font-bold text-primary transition hover:border-primary/50 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {loadingMore ? 'Memuat...' : 'Muat lagi'}
          </button>
        ) : null}
        {!loading && !counts.favorites && !counts.history ? (
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

function FilterDropdown<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Array<DropdownOption<T>>; onChange: (value: T) => void }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.id === value) ?? options[0];

  return (
    <div className="relative min-w-[10.5rem] max-w-full">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`group flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 text-left text-sm font-semibold transition active:scale-[0.98] ${
          open
            ? 'border-primary/45 bg-surface-container-highest text-primary'
            : 'border-outline-variant bg-surface-container-high text-on-surface hover:border-primary/45 hover:bg-surface-variant hover:text-primary'
        }`}
        aria-expanded={open}
      >
        <span className="min-w-0">
          <span className={`block text-[10px] font-bold uppercase tracking-[0.14em] ${open ? 'text-primary/85' : 'text-on-surface-variant'}`}>{label}</span>
          <span className="block truncate">{selected.label}</span>
        </span>
        <ChevronDown size={16} className={`shrink-0 transition ${open ? 'rotate-180 text-primary' : 'text-primary/75'}`} />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-40 w-full overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-high p-1.5 shadow-xl shadow-black/30">
          {options.map((option) => {
            const active = option.id === value;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                  active
                    ? 'bg-surface-variant text-primary ring-1 ring-primary/25'
                    : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {active ? <Check size={15} className="shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
