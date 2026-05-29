'use client';

import Link from 'next/link';
import { ChevronDown, LoaderCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogItem } from '../data';

type InfiniteCatalogProps = {
  initialItems: CatalogItem[];
  initialPage: number;
  totalPages: number;
  totalItems?: string;
};

const letters = ['All', '&', '0', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

function apiBaseURL() {
  return process.env.NEXT_PUBLIC_NARAYA_API_URL ?? (process.env.NODE_ENV === 'production' ? 'https://naraya.biz.id/api' : 'http://127.0.0.1:4000/api');
}

function apiOrigin() {
  return apiBaseURL().replace(/\/api\/?$/, '');
}

function mediaURL(value?: string) {
  if (!value) return value;
  return value.startsWith('/api/') ? `${apiOrigin()}${value}` : value;
}

function titleFromSlug(slug: string) {
  return slug.split('-').filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function KomikIndexClient({ initialItems, initialPage, totalPages, totalItems }: InfiniteCatalogProps) {
  const [activeLetter, setActiveLetter] = useState('All');
  const [overallTotalItems] = useState(totalItems);
  const [initialState, setInitialState] = useState({ items: initialItems, page: initialPage, totalPages, totalItems });
  const [loadedItems, setLoadedItems] = useState(initialItems);
  const [loadingLetter, setLoadingLetter] = useState(false);
  const [filters, setFilters] = useState({ status: 'All', type: 'All', genre: 'All' });

  async function selectLetter(letter: string) {
    if (letter === activeLetter || loadingLetter) return;
    setActiveLetter(letter);
    setLoadingLetter(true);
    window.history.pushState(null, '', letter === 'All' ? '/komik' : `/komik?letter=${encodeURIComponent(letter)}`);
    try {
      const query = new URLSearchParams({ page: '1' });
      if (letter !== 'All') query.set('letter', letter);
      const response = await fetch(`${apiBaseURL()}/comics/az?${query.toString()}`);
      if (response.ok) {
        const payload = (await response.json()) as { page: number; totalPages: number; totalItems?: string; items?: CatalogItem[] };
        setInitialState({
          items: (payload.items ?? []).map((item) => ({ ...item, cover: mediaURL(item.cover) })),
          page: payload.page,
          totalPages: payload.totalPages,
          totalItems: overallTotalItems,
        });
        setLoadedItems((payload.items ?? []).map((item) => ({ ...item, cover: mediaURL(item.cover) })));
      } else {
        setInitialState({ items: [], page: 1, totalPages: 1, totalItems: overallTotalItems });
        setLoadedItems([]);
      }
    } finally {
      setLoadingLetter(false);
    }
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-[2rem] bg-surface-container-low p-6 shadow-2xl shadow-black/25 md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/12 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Naraya Index</p>
            <h1 className="mt-2 font-display text-4xl font-bold md:text-6xl">Indeks Komik & Anime</h1>
            <p className="mt-3 max-w-2xl text-on-surface-variant">
              Daftar komik dan anime A-Z dengan cover, genre, status, dan akses langsung ke detail.
            </p>
          </div>
          <div className="rounded-2xl bg-primary/12 px-4 py-3 text-sm font-semibold text-primary">
            {overallTotalItems ? `${overallTotalItems} item A-Z` : 'Item A-Z'}
          </div>
        </div>
        <div className="relative mt-6 h-px bg-gradient-to-r from-primary/30 via-white/8 to-transparent" />
        <div className="relative mt-7">
          <div className="flex flex-wrap justify-center gap-2">
          {letters.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => void selectLetter(letter)}
              className={`h-10 min-w-10 rounded-xl px-3 text-sm font-extrabold transition active:scale-95 ${
                activeLetter === letter
                  ? 'bg-primary text-on-primary shadow-glow'
                  : 'bg-background/45 text-on-surface-variant hover:bg-primary/12 hover:text-primary'
              }`}
            >
              {letter}
            </button>
          ))}
          </div>
        </div>
      </div>
      <IndexFilters items={loadedItems} filters={filters} onChange={setFilters} />
      <InfiniteCatalog key={activeLetter} initialItems={initialState.items} initialPage={initialState.page} totalPages={initialState.totalPages} letter={activeLetter} loadingFirstPage={loadingLetter} filters={filters} onItemsChange={setLoadedItems} />
    </>
  );
}

function InfiniteCatalog({ initialItems, initialPage, totalPages, letter, loadingFirstPage, filters, onItemsChange }: InfiniteCatalogProps & { letter: string; loadingFirstPage: boolean; filters: { status: string; type: string; genre: string }; onItemsChange: (items: CatalogItem[]) => void }) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(initialPage);
  const [maxPage, setMaxPage] = useState(totalPages);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const requestedPagesRef = useRef(new Set<number>());
  const hasMore = page < maxPage;

  useEffect(() => {
    setItems(initialItems);
    setPage(initialPage);
    setMaxPage(totalPages);
    setLoading(false);
    loadingRef.current = false;
    requestedPagesRef.current = new Set<number>();
  }, [initialItems, initialPage, totalPages, letter]);

  const uniqueItems = useMemo(() => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.slug)) return false;
      seen.add(item.slug);
      if (filters.status !== 'All' && item.status !== filters.status) return false;
      if (filters.type !== 'All') {
        const expectedKind = filters.type === 'Anime' ? 'series' : 'comic';
        if (item.kind !== expectedKind) return false;
      }
      if (filters.genre !== 'All' && !(item.genres ?? []).includes(filters.genre)) return false;
      return true;
    });
  }, [filters.genre, filters.status, filters.type, items]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting || loadingRef.current) return;
      const nextPage = page + 1;
      if (requestedPagesRef.current.has(nextPage)) return;
      loadingRef.current = true;
      requestedPagesRef.current.add(nextPage);
      setLoading(true);
      try {
        const query = new URLSearchParams({ page: String(nextPage) });
        if (letter !== 'All') query.set('letter', letter);
        const response = await fetch(`${apiBaseURL()}/comics/az?${query.toString()}`);
        if (response.ok) {
          const payload = (await response.json()) as { page?: number; totalPages?: number; items?: CatalogItem[] };
          const nextItems = (payload.items ?? []).map((item) => ({ ...item, cover: mediaURL(item.cover) }));
          if (nextItems.length) {
            setItems((current) => {
              const merged = [...current, ...nextItems];
              onItemsChange(merged);
              return merged;
            });
          }
          setPage(payload.page ?? nextPage);
          setMaxPage(payload.totalPages ?? maxPage);
        } else {
          setMaxPage(page);
        }
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    }, { rootMargin: '260px 0px', threshold: 0.1 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, letter, maxPage, page]);

  return (
    <>
      {loadingFirstPage ? (
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-7 md:grid-cols-4 md:gap-x-6 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="skeleton aspect-[2/3] rounded-2xl" />
          ))}
        </div>
      ) : null}
      {!loadingFirstPage ? (
      <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-7 md:grid-cols-4 md:gap-x-6 lg:grid-cols-5 xl:grid-cols-6">
        {uniqueItems.map((item) => (
          <Link key={`${item.kind}-${item.slug}`} href={item.kind === 'series' ? `/series/${item.slug}` : `/komik/${item.slug}`} className="group block">
            <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-surface-container-high shadow-xl shadow-black/20 ring-1 ring-white/5">
              {item.cover ? (
                <img src={item.cover} alt={item.title || titleFromSlug(item.slug)} width={220} height={330} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              ) : (
                <div className="grid h-full place-items-center bg-primary/10 px-4 text-center font-display text-3xl font-bold text-primary">
                  {(item.title || titleFromSlug(item.slug)).slice(0, 1)}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-90" />
              {item.status ? (
                <span className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.1em] shadow-[0_10px_28px_rgba(0,0,0,0.5)] ring-1 ${
                  item.status.toLowerCase().includes('completed')
                    ? 'bg-[#B8F3D0] text-[#07351F] ring-emerald-950/25'
                    : 'bg-[#FFD58A] text-[#3B2102] ring-amber-950/25'
                }`}>
                  {item.status}
                </span>
              ) : null}
              <div className="absolute bottom-3 left-3 right-3">
                <span className={`mb-1.5 inline-flex rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.1em] shadow-[0_10px_28px_rgba(0,0,0,0.48)] ring-1 ${
                  item.kind === 'series'
                    ? 'bg-[#9EDCFF] text-[#06273A] ring-sky-950/25'
                    : 'bg-[#E7D5FF] text-[#25143F] ring-violet-950/25'
                }`}>
                  {item.kind === 'series' ? 'Anime' : 'Komik'}
                </span>
                <p className="truncate text-sm font-semibold leading-5 text-white">{item.title || titleFromSlug(item.slug)}</p>
                <p className="mt-1 line-clamp-1 text-xs text-white/65">{[item.kind === 'series' ? 'Anime' : item.type, ...(item.genres ?? []).slice(0, 1)].filter(Boolean).join(' - ') || (item.kind === 'series' ? 'Anime' : 'Komik')}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      ) : null}
      {!loadingFirstPage && !uniqueItems.length ? (
        <div className="mt-8 rounded-[2rem] bg-surface-container-low p-6 text-center shadow-xl shadow-black/20 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Tidak ada data</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-on-surface">Belum ada data untuk huruf {letter}.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-on-surface-variant">
            Coba pilih huruf lain atau kembali ke daftar semua katalog.
          </p>
        </div>
      ) : null}
      <div ref={sentinelRef} className="flex min-h-24 items-center justify-center py-8 text-sm font-semibold text-on-surface-variant">
        {loading ? <LoaderCircle size={20} className="animate-spin text-primary" /> : null}
      </div>
    </>
  );
}

function IndexFilters({
  items,
  filters,
  onChange,
}: {
  items: CatalogItem[];
  filters: { status: string; type: string; genre: string };
  onChange: (filters: { status: string; type: string; genre: string }) => void;
}) {
  const genres = useMemo(() => {
    const seen = new Set<string>();
    items.forEach((item) => {
      (item.genres ?? []).forEach((genre) => {
        if (genre) seen.add(genre);
      });
    });
    return ['All', ...Array.from(seen).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  return (
    <div className="relative mt-5 overflow-visible rounded-[2rem] bg-surface-container-low/82 p-4 shadow-2xl shadow-black/20 md:p-5">
      <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative grid gap-3 md:grid-cols-3">
      <IndexSelect
        label="Status"
        value={filters.status}
        values={['All', 'On-Going', 'Completed']}
        optionLabel={(value) => (value === 'All' ? 'Semua Status' : value)}
        onChange={(status) => onChange({ ...filters, status })}
      />
      <IndexSelect
        label="Tipe"
        value={filters.type}
        values={['All', 'Anime', 'Komik']}
        optionLabel={(value) => (value === 'All' ? 'Semua Tipe' : value)}
        onChange={(type) => onChange({ ...filters, type })}
      />
      <IndexSelect
        label="Genre"
        value={filters.genre}
        values={genres}
        optionLabel={(value) => (value === 'All' ? 'Semua Genre' : value)}
        onChange={(genre) => onChange({ ...filters, genre })}
      />
      </div>
    </div>
  );
}

function IndexSelect({
  label,
  value,
  values,
  optionLabel,
  onChange,
}: {
  label: string;
  value: string;
  values: string[];
  optionLabel: (value: string) => string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <label className="group grid gap-2">
      <span className="pl-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary/90">{label}</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="relative flex h-12 w-full items-center justify-between rounded-2xl bg-gradient-to-br from-background/72 via-background/46 to-primary/8 px-4 text-left text-sm font-bold text-on-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_34px_rgba(0,0,0,0.2)] transition hover:from-background/82 hover:to-primary/12 focus:outline-none focus-visible:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_0_3px_rgba(216,178,255,0.12)]"
        >
          <span className="truncate pr-3">{optionLabel(value)}</span>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-primary/16 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
            <ChevronDown size={16} className={`transition ${open ? 'rotate-180' : ''}`} />
          </span>
        </button>
        {open ? (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 max-h-72 overflow-y-auto rounded-[1.35rem] bg-[linear-gradient(145deg,rgba(25,20,34,0.98),rgba(15,13,21,0.98))] p-2 shadow-2xl shadow-black/45 backdrop-blur-2xl [scrollbar-color:rgba(216,178,255,0.45)_transparent] [scrollbar-width:thin]">
            {values.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  onChange(item);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                  item === value
                    ? 'bg-primary text-on-primary shadow-[0_12px_30px_rgba(216,178,255,0.2)]'
                    : 'text-on-surface-variant hover:bg-white/[0.075] hover:text-on-surface'
                }`}
              >
                <span className="truncate">{optionLabel(item)}</span>
                {item === value ? <span className="ml-3 h-1.5 w-1.5 shrink-0 rounded-full bg-on-primary" /> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </label>
  );
}
