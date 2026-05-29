'use client';

import Link from 'next/link';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChapterData } from '../../data';

export function ChapterList({ chapters }: { chapters: ChapterData[] }) {
  const [visibleCount, setVisibleCount] = useState(40);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const visibleChapters = chapters.slice(0, visibleCount);
  const hasMore = visibleCount < chapters.length;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisibleCount((count) => Math.min(count + 40, chapters.length));
      }
    }, { rootMargin: '460px 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [chapters.length, hasMore]);

  return (
    <>
      <div className="mt-5 grid gap-3">
        {visibleChapters.map((chapter) => (
          <Link key={chapter.slug} href={`/baca/${chapter.slug}`} className="glass-panel interactive-lift reveal-soft flex items-center justify-between rounded-2xl p-4 transition hover:border-primary/40">
            <div>
              <h3 className="font-semibold">{chapter.title}</h3>
              <p className="text-sm text-on-surface-variant">{chapter.date || 'Tanggal tidak tersedia'}</p>
            </div>
            <span className="rounded-lg bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">{chapter.number || 'Read'}</span>
          </Link>
        ))}
      </div>
      <div ref={sentinelRef} className="flex min-h-20 items-center justify-center py-6 text-sm font-semibold text-on-surface-variant">
        {hasMore ? <span className="inline-flex items-center gap-2"><LoaderCircle size={18} className="animate-spin" /> Memuat chapter...</span> : null}
      </div>
    </>
  );
}
