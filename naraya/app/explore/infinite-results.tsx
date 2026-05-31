'use client';

import { LoaderCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ComicCard } from '../components';
import type { CatalogItem } from '../data';
import { apiURL, mediaURL } from '../lib/client-api';

type InfiniteExploreResultsProps = {
  initialItems: CatalogItem[];
  initialPage: number;
  totalPages: number;
  filters: {
    genre: string;
    type: string;
    status: string;
    query: string;
  };
};

function sanitizeCatalogItem(item: CatalogItem): CatalogItem {
  return {
    slug: item.slug,
    title: item.title,
    cover: mediaURL(item.cover),
    type: item.type,
    status: item.status,
    genres: item.genres,
    description: '',
    lastMod: item.lastMod,
    kind: item.kind,
    count: item.count,
    latestChapterSlug: item.latestChapterSlug,
  };
}

export function InfiniteExploreResults({ initialItems, initialPage, totalPages, filters }: InfiniteExploreResultsProps) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const requestedPagesRef = useRef(new Set<number>());
  const hasMore = page < totalPages;

  useEffect(() => {
    setItems(initialItems);
    setPage(initialPage);
    setLoading(false);
    loadingRef.current = false;
    requestedPagesRef.current = new Set<number>();
  }, [filters.genre, filters.query, filters.status, filters.type, initialItems, initialPage]);

  const visibleItems = useMemo(() => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.slug)) return false;
      seen.add(item.slug);
      if (!filters.query) return true;
      const searchable = [item.title ?? item.slug, item.type ?? '', item.status ?? '', ...(item.genres ?? [])].join(' ').toLowerCase();
      return searchable.includes(filters.query.toLowerCase());
    });
  }, [filters.query, items]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting || loadingRef.current) return;
      const nextPage = page + 1;
      if (requestedPagesRef.current.has(nextPage)) return;
      const query = new URLSearchParams({ page: String(nextPage) });
      if (filters.genre !== 'All') query.set('genre', filters.genre);
      if (filters.type !== 'All') query.set('type', filters.type);
      if (filters.status !== 'All') query.set('status', filters.status);

      loadingRef.current = true;
      requestedPagesRef.current.add(nextPage);
      setLoading(true);
      try {
        const response = await fetch(apiURL(`/comics/catalog?${query.toString()}`));
        if (response.ok) {
          const payload = (await response.json()) as { items?: CatalogItem[] };
          setItems((current) => [...current, ...(payload.items ?? []).map(sanitizeCatalogItem)]);
          setPage(nextPage);
        }
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    }, { rootMargin: '260px 0px', threshold: 0.1 });

    observer.observe(node);
    return () => observer.disconnect();
  }, [filters.genre, filters.status, filters.type, hasMore, page]);

  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4 lg:grid-cols-5">
        {visibleItems.map((item, index) => (
          <ComicCard
            key={`${item.slug}-${index}`}
            comic={{
              slug: item.slug,
              title: item.title || item.slug.replaceAll('-', ' '),
              image: item.cover || '/logo.svg',
              meta: [item.type, item.status, ...(item.genres ?? []).slice(0, 2)].filter(Boolean).join(' - '),
              kind: item.kind,
              latestChapterSlug: item.latestChapterSlug,
              episode: (item.genres ?? []).slice(0, 3).join(' - ') || (item.kind === 'series' ? 'Buka detail untuk daftar episode.' : 'Buka detail untuk daftar chapter.'),
            }}
          />
        ))}
      </div>
      {!visibleItems.length ? (
        <div className="glass-panel mt-8 rounded-2xl p-6">
          <h3 className="font-display text-2xl font-semibold">Belum ada hasil</h3>
          <p className="mt-2 text-on-surface-variant">Coba kata kunci lain atau buka indeks lengkap komik.</p>
        </div>
      ) : null}
      <div ref={sentinelRef} className="flex min-h-20 items-center justify-center py-8 text-sm font-semibold text-on-surface-variant">
        {loading ? <LoaderCircle size={20} className="animate-spin text-primary" /> : null}
      </div>
    </>
  );
}
