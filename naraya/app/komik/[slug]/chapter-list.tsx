'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { ChapterData } from '../../data';

export function ChapterList({ chapters }: { chapters: ChapterData[] }) {
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = chapters.length > 5;
  const visibleChapters = expanded || !shouldCollapse ? chapters : chapters.slice(0, 5);

  return (
    <div className="relative min-w-0 overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,rgba(29,26,35,0.98),rgba(21,18,27,0.96))] p-5 shadow-xl shadow-black/28 ring-1 ring-white/8 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-semibold">Daftar Chapter</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {shouldCollapse && !expanded ? 'Menampilkan 5 chapter terbaru.' : 'Pilih chapter untuk mulai membaca.'}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-primary">{chapters.length} chapter</span>
          {shouldCollapse ? <ToggleButton expanded={expanded} onClick={() => setExpanded((value) => !value)} /> : null}
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        {visibleChapters.map((chapter) => (
          <Link key={chapter.slug} href={`/baca/${chapter.slug}`} className="glass-panel interactive-lift reveal-soft flex min-w-0 items-center justify-between gap-3 rounded-2xl p-4 transition hover:border-primary/40">
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
      {!expanded && shouldCollapse ? <FadeOverlay /> : null}
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
