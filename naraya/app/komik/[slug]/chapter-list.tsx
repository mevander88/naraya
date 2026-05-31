'use client';

import Link from 'next/link';
import { ArrowDownUp, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ChapterData } from '../../data';

type SortOrder = 'newest' | 'oldest';

export function ChapterList({ chapters }: { chapters: ChapterData[] }) {
  const [expanded, setExpanded] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const sortedChapters = useMemo(() => sortList(chapters, sortOrder), [chapters, sortOrder]);
  const shouldCollapse = sortedChapters.length > 5;
  const visibleChapters = expanded || !shouldCollapse ? sortedChapters : sortedChapters.slice(0, 5);
  const sortLabel = sortOrder === 'newest' ? 'terbaru' : 'terlama';

  return (
    <div className="relative min-w-0 overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,rgba(29,26,35,0.98),rgba(21,18,27,0.96))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_24px_64px_rgba(0,0,0,0.32)] md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-semibold">Daftar Chapter</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {shouldCollapse && !expanded ? `Menampilkan 5 chapter ${sortLabel}.` : 'Pilih chapter untuk mulai membaca.'}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <SortToggle value={sortOrder} onChange={setSortOrder} />
          <span className="inline-flex w-fit max-w-full flex-col items-end gap-1 text-sm font-semibold text-primary">
            <span>{sortedChapters.length} chapter</span>
            <span className="h-px w-full rounded-full bg-primary/65 shadow-[0_0_14px_rgba(216,178,255,0.24)]" />
          </span>
        </div>
      </div>
      <div className="mt-5 grid gap-2.5">
        {visibleChapters.map((chapter) => (
          <Link key={chapter.slug} href={`/baca/${chapter.slug}`} className="interactive-lift reveal-soft flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-background/34 px-3 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_12px_30px_rgba(0,0,0,0.16)] transition hover:bg-primary/10 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_16px_34px_rgba(0,0,0,0.22)] sm:px-4">
            <div className="min-w-0 flex-1">
              <h3 className="break-words font-semibold">{chapter.title}</h3>
              <p className="text-sm text-on-surface-variant">{chapter.date || 'Tanggal tidak tersedia'}</p>
            </div>
            <span className="shrink-0 rounded-lg bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">{chapter.number || 'Read'}</span>
          </Link>
        ))}
        {!chapters.length ? (
          <div className="glass-panel rounded-2xl p-5 text-sm text-on-surface-variant">
            Belum ada chapter yang tersedia.
          </div>
        ) : null}
      </div>
      {shouldCollapse ? (
        <div className="relative z-10 mt-5 flex justify-center">
          <ToggleButton expanded={expanded} onClick={() => setExpanded((value) => !value)} />
        </div>
      ) : null}
      {!expanded && shouldCollapse ? <FadeOverlay /> : null}
    </div>
  );
}

function SortToggle({ value, onChange }: { value: SortOrder; onChange: (value: SortOrder) => void }) {
  return (
    <div className="inline-flex min-w-0 items-center rounded-full bg-background/34 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <button
        type="button"
        onClick={() => onChange(value === 'newest' ? 'oldest' : 'newest')}
        className="grid h-9 w-9 place-items-center rounded-full bg-primary text-on-primary shadow-glow transition hover:brightness-110"
        aria-label={`Ubah urutan ke ${value === 'newest' ? 'terlama' : 'terbaru'}`}
        title={`Saat ini ${value === 'newest' ? 'terbaru' : 'terlama'}`}
      >
        <ArrowDownUp size={16} />
      </button>
    </div>
  );
}

function ToggleButton({ expanded, onClick }: { expanded: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-extrabold text-on-primary shadow-glow transition hover:brightness-110"
    >
      {expanded ? 'Tutup' : 'View all'}
      <ChevronDown size={14} className={`transition ${expanded ? 'rotate-180' : ''}`} />
    </button>
  );
}

function FadeOverlay() {
  return <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1d1a23] via-[#1d1a23]/94 to-transparent" />;
}

function sortList<T extends { number: string; title: string; slug: string }>(items: T[], order: SortOrder) {
  return items
    .map((item, index) => ({ item, index, value: extractNumber(item) }))
    .sort((left, right) => {
      if (left.value !== null && right.value !== null && left.value !== right.value) {
        return order === 'newest' ? right.value - left.value : left.value - right.value;
      }
      if (left.value !== null && right.value === null) return -1;
      if (left.value === null && right.value !== null) return 1;
      return order === 'newest' ? left.index - right.index : right.index - left.index;
    })
    .map(({ item }) => item);
}

function extractNumber(item: { number: string; title: string; slug: string }) {
  const text = [item.number, item.title, item.slug].filter(Boolean).join(' ');
  const matches = text.match(/\d+(?:[.,]\d+)?/g);
  if (!matches?.length) return null;
  const value = Number(matches[matches.length - 1].replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}
