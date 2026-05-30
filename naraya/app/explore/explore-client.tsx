'use client';

import { ChevronDown, LoaderCircle, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ComicCard } from '../components';
import type { CatalogItem } from '../data';
import { apiURL, mediaURL } from '../lib/client-api';

type ExploreFilters = {
  genre: string;
  type: string;
  status: string;
  query: string;
};

type CatalogPayload = {
  page: number;
  totalPages: number;
  items: CatalogItem[];
};

type ExploreClientProps = {
  initialItems: CatalogItem[];
  initialPage: number;
  totalPages: number;
  genres: string[];
  initialFilters: ExploreFilters;
  matureFilter?: boolean;
};

function normalizeItems(items: CatalogItem[]) {
  return items.map((item) => ({ ...item, cover: mediaURL(item.cover), description: '' }));
}

function buildQuery(filters: ExploreFilters, page: number) {
  const query = new URLSearchParams({ page: String(page) });
  if (filters.genre !== 'All') query.set('genre', filters.genre);
  if (filters.type !== 'All') query.set('type', filters.type);
  if (filters.status !== 'All') query.set('status', filters.status);
  if (filters.query) query.set('q', filters.query);
  return query;
}

function buildExploreURL(filters: ExploreFilters) {
  const query = buildQuery(filters, 1);
  query.delete('page');
  const value = query.toString();
  return value ? `/explore?${value}` : '/explore';
}

function itemMatchesActiveFilters(item: CatalogItem, filters: ExploreFilters) {
  if (filters.genre !== 'All' && !(item.genres ?? []).some((genre) => genre.toLowerCase() === filters.genre.toLowerCase())) {
    return false;
  }
  if (filters.type !== 'All' && (item.type ?? '').toLowerCase() !== filters.type.toLowerCase()) {
    return false;
  }
  if (filters.status !== 'All' && (item.status ?? '').toLowerCase() !== filters.status.toLowerCase()) {
    return false;
  }
  return true;
}

function isMatureItem(item: CatalogItem) {
  const values = [
    item.title,
    item.slug,
    item.type,
    item.status,
    item.description,
    ...(item.genres ?? []),
  ].join(' ').toLowerCase();
  return ['mature', 'adult', '18+', 'ecchi', 'harem', 'smut', 'seinen'].some((term) => values.includes(term));
}

function applyMatureFilter(items: CatalogItem[], enabled: boolean) {
  return enabled ? items.filter((item) => !isMatureItem(item)) : items;
}

function CardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-[2/3] rounded-xl" />
      <div className="skeleton mt-3 h-5 w-4/5" />
      <div className="skeleton mt-2 h-4 w-2/3" />
    </div>
  );
}

export function ExploreClient({ initialItems, initialPage, totalPages, genres, initialFilters, matureFilter = false }: ExploreClientProps) {
  const initialVisibleItems = useMemo(() => applyMatureFilter(normalizeItems(initialItems), matureFilter), [initialItems, matureFilter]);
  const [filters, setFilters] = useState(initialFilters);
  const [searchValue, setSearchValue] = useState(initialFilters.query);
  const [items, setItems] = useState<CatalogItem[]>(() => initialVisibleItems);
  const [page, setPage] = useState(initialPage);
  const [maxPage, setMaxPage] = useState(totalPages);
  const [loadingFirstPage, setLoadingFirstPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchPending, setSearchPending] = useState(false);
  const [emptyAfterResponse, setEmptyAfterResponse] = useState(() => initialVisibleItems.length === 0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const requestedPagesRef = useRef(new Set<number>());

  async function fetchCatalog(nextFilters: ExploreFilters, nextPage: number): Promise<CatalogPayload | null> {
    if (nextFilters.query) {
      const query = new URLSearchParams({ q: nextFilters.query });
      const response = await fetch(apiURL(`/search?${query.toString()}`));
      if (!response.ok) return null;
      const payload = (await response.json()) as CatalogPayload;
      const items = applyMatureFilter(normalizeItems(payload.items ?? []).filter((item) => itemMatchesActiveFilters(item, nextFilters)), matureFilter);
      return { page: 1, totalPages: 1, items };
    }

    const response = await fetch(apiURL(`/comics/catalog?${buildQuery(nextFilters, nextPage).toString()}`));
    if (!response.ok) return null;
    const payload = (await response.json()) as CatalogPayload;
    return { ...payload, items: applyMatureFilter(normalizeItems(payload.items ?? []), matureFilter) };
  }

  async function changeFilter(partial: Partial<ExploreFilters>, options: { pushHistory?: boolean } = {}) {
    const pushHistory = options.pushHistory ?? true;
    const nextFilters = { ...filters, ...partial };
    setFilters(nextFilters);
    setItems([]);
    setPage(1);
    setMaxPage(1);
    setLoadingFirstPage(true);
    setEmptyAfterResponse(false);
    requestedPagesRef.current = new Set<number>();
    if (pushHistory) {
      window.history.pushState(null, '', buildExploreURL(nextFilters));
    }

    try {
      const payload = await fetchCatalog(nextFilters, 1);
      if (payload) {
        setItems(payload.items);
        setPage(payload.page);
        setMaxPage(payload.items.length ? payload.totalPages : 1);
        setEmptyAfterResponse(payload.items.length === 0);
      } else {
        setMaxPage(1);
        setEmptyAfterResponse(true);
      }
    } finally {
      setLoadingFirstPage(false);
      setSearchPending(false);
    }
  }

  useEffect(() => {
    if (searchValue === filters.query) {
      setSearchPending(false);
      return;
    }
    setSearchPending(true);
    const timer = window.setTimeout(() => {
      void changeFilter({ query: searchValue.trim() });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    function handlePopState() {
      const params = new URLSearchParams(window.location.search);
      const nextFilters = {
        genre: params.get('genre') ?? 'All',
        type: params.get('type') ?? 'All',
        status: params.get('status') ?? 'All',
        query: params.get('q')?.trim() ?? '',
      };
      setSearchValue(nextFilters.query);
      void changeFilter(nextFilters, { pushHistory: false });
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [filters]);

  const visibleItems = useMemo(() => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.slug)) return false;
      seen.add(item.slug);
      return true;
    });
  }, [items]);

  useEffect(() => {
    const node = sentinelRef.current;
    const hasMore = page < maxPage;
    if (!node || !hasMore || loadingFirstPage || !items.length) return;

    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting || loadingRef.current) return;
      const nextPage = page + 1;
      if (requestedPagesRef.current.has(nextPage)) return;

      loadingRef.current = true;
      requestedPagesRef.current.add(nextPage);
      setLoadingMore(true);
      try {
        const payload = await fetchCatalog(filters, nextPage);
        if (payload) {
          setItems((current) => [...current, ...payload.items]);
          setPage(payload.page);
          setMaxPage(payload.totalPages);
        }
      } finally {
        loadingRef.current = false;
        setLoadingMore(false);
      }
    }, { rootMargin: '260px 0px', threshold: 0.1 });

    observer.observe(node);
    return () => observer.disconnect();
  }, [filters, items.length, loadingFirstPage, maxPage, page]);

  return (
    <section className="px-container-mobile pb-8 pt-28 md:px-container-desktop">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Explore</p>
      <h1 className="mt-2 font-display text-4xl font-bold">Temukan serial baru</h1>
      <p className="mt-3 max-w-2xl text-on-surface-variant">
        {filters.query ? `Hasil pencarian untuk "${filters.query}"` : 'Jelajahi update terbaru dan daftar genre pilihan Naraya.'}
      </p>

      <div className="mt-7 grid gap-3 lg:grid-cols-[1.1fr_0.8fr_0.8fr]">
        <FilterSearch value={searchValue} onChange={setSearchValue} />
        <FilterSelect
          label="Status"
          value={filters.status}
          values={['All', 'On-Going', 'Completed']}
          optionLabel={(status) => (status === 'All' ? 'Semua Status' : status)}
          onChange={(status) => void changeFilter({ status })}
        />
        <FilterSelect
          label="Tipe"
          value={filters.type}
          values={['All', 'MANGA', 'MANHUA', 'MANHWA', 'ONE-SHOT']}
          optionLabel={(type) => (type === 'All' ? 'Semua Tipe' : type)}
          onChange={(type) => void changeFilter({ type })}
        />
      </div>
      <FilterRow className="mt-4" values={genres} active={filters.genre} label={(genre) => genre} onSelect={(genre) => void changeFilter({ genre })} />

      {loadingFirstPage ? (
        <div className="mt-9 grid grid-cols-2 gap-x-5 gap-y-7 md:grid-cols-4 md:gap-x-6 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => <CardSkeleton key={index} />)}
        </div>
      ) : (
        <div className="mt-9 grid grid-cols-2 gap-x-5 gap-y-7 md:grid-cols-4 md:gap-x-6 lg:grid-cols-5">
          {visibleItems.map((item, index) => (
            <ComicCard
              key={`${item.slug}-${index}`}
              comic={{
                slug: item.slug,
                title: item.title || item.slug.replaceAll('-', ' '),
                image: item.cover || '/logo.svg',
                kind: item.kind,
                latestChapterSlug: item.latestChapterSlug,
                meta: [item.kind === 'series' ? 'Anime' : item.type, item.status, ...(item.genres ?? []).slice(0, 2)].filter(Boolean).join(' - '),
                episode: (item.genres ?? []).slice(0, 3).join(' - ') || (item.kind === 'series' ? 'Buka detail untuk daftar episode.' : 'Buka detail untuk daftar chapter.'),
              }}
            />
          ))}
        </div>
      )}

      {!loadingFirstPage && !searchPending && emptyAfterResponse ? (
        <div className="glass-panel mt-8 rounded-2xl p-6">
          <h3 className="font-display text-2xl font-semibold">Belum ada hasil</h3>
          <p className="mt-2 text-on-surface-variant">Coba filter lain atau buka indeks lengkap Naraya.</p>
        </div>
      ) : null}
      {items.length ? (
        <div ref={sentinelRef} className="flex min-h-20 items-center justify-center py-8 text-sm font-semibold text-on-surface-variant">
          {loadingMore ? <LoaderCircle size={20} className="animate-spin text-primary" /> : null}
        </div>
      ) : null}
    </section>
  );
}

function FilterRow({
  values,
  active,
  label,
  onSelect,
  className = '',
}: {
  values: string[];
  active: string;
  label: (value: string) => string;
  onSelect: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={`hide-scrollbar flex gap-3 overflow-x-auto pb-2 ${className}`}>
      {values.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(value)}
          className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition active:scale-95 ${
            active === value ? 'bg-primary text-on-primary' : 'border border-white/5 bg-surface-container-high text-on-surface-variant hover:bg-surface-variant hover:text-primary'
          }`}
        >
          {label(value)}
        </button>
      ))}
    </div>
  );
}

function FilterSelect({
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
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{label}</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex h-12 w-full items-center justify-between rounded-2xl bg-gradient-to-br from-surface-container-high/95 via-background/58 to-primary/8 px-4 text-left text-sm font-bold text-on-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_34px_rgba(0,0,0,0.2)] transition hover:from-surface-container-high hover:to-primary/12 focus:outline-none focus-visible:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_0_3px_rgba(216,178,255,0.12)]"
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

function FilterSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="group grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Search</span>
      <span className="relative block overflow-hidden rounded-2xl bg-surface-container-high/86 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-white/10 transition group-focus-within:ring-2 group-focus-within:ring-primary/35">
        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full bg-transparent pl-11 pr-4 text-sm font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/55"
          placeholder="Cari judul..."
          autoComplete="off"
        />
      </span>
    </label>
  );
}
