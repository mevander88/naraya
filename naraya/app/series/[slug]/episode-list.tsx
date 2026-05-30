'use client';

import Link from 'next/link';
import { ChevronDown, Film, Play } from 'lucide-react';
import { useState } from 'react';
import type { SeriesEpisodeData } from '../../data';

export function EpisodeList({ episodes }: { episodes: SeriesEpisodeData[] }) {
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = episodes.length > 5;
  const visibleEpisodes = expanded || !shouldCollapse ? episodes : episodes.slice(0, 5);

  return (
    <div className="relative min-w-0 overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,rgba(29,26,35,0.98),rgba(21,18,27,0.96))] p-5 shadow-xl shadow-black/28 ring-1 ring-white/8 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-3">
            <Film size={20} className="shrink-0 text-primary" />
            <h2 className="min-w-0 break-words font-display text-2xl font-semibold">Daftar Episode</h2>
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">
            {shouldCollapse && !expanded ? 'Menampilkan 5 episode terbaru.' : 'Pilih episode untuk mulai menonton.'}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-primary">{episodes.length} episode</span>
          {shouldCollapse ? <ToggleButton expanded={expanded} onClick={() => setExpanded((value) => !value)} /> : null}
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        {visibleEpisodes.map((episode) => (
          <Link key={episode.slug} href={`/nonton/${episode.slug}`} className="group flex min-w-0 items-center justify-between gap-4 rounded-2xl bg-surface-container-low/80 p-4 shadow-lg shadow-black/10 ring-1 ring-white/6 transition hover:bg-primary/10 hover:ring-primary/30">
            <div className="min-w-0 flex-1">
              <p className="break-words font-semibold text-on-surface transition group-hover:text-primary">{episode.title}</p>
              <p className="mt-1 text-xs text-on-surface-variant">{[episode.number ? `Episode ${episode.number}` : '', episode.date].filter(Boolean).join(' - ') || 'Episode'}</p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Play size={16} fill="currentColor" />
            </span>
          </Link>
        ))}
        {!episodes.length ? (
          <div className="glass-panel rounded-2xl p-5 text-sm text-on-surface-variant">
            Belum ada episode yang tersedia.
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
