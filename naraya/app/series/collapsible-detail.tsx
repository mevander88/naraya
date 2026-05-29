'use client';

import { BookOpen, CalendarDays, ChevronDown, CircleDot, Clapperboard, Clock, Languages, PenLine, Radio, Star, Tags, UserRound } from 'lucide-react';
import { useState } from 'react';
import type { InfoRowData } from '../data';

export function CollapsibleInfo({ rows, title = 'Info Anime' }: { rows: InfoRowData[]; title?: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative mt-12 overflow-hidden rounded-[1.5rem] bg-[linear-gradient(145deg,rgba(29,26,35,0.9),rgba(21,18,27,0.88))] p-4 shadow-lg shadow-black/15">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold">{title}</h2>
        {rows.length > 4 ? <ToggleButton expanded={expanded} onClick={() => setExpanded((value) => !value)} /> : null}
      </div>
      <div className={`mt-3 grid gap-2 overflow-hidden transition-[max-height,opacity] duration-500 ease-out md:grid-cols-3 xl:grid-cols-4 ${expanded ? 'max-h-[720px] opacity-100' : 'max-h-[112px] opacity-95'}`}>
        {rows.map((row) => {
          const Icon = iconForInfo(row.label);
          return (
            <div key={`${row.label}-${row.value}`} className="flex gap-2.5 rounded-xl bg-background/42 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                <Icon size={14} />
              </span>
              <span className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-primary">{row.label}</p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-on-surface-variant">{row.value}</p>
              </span>
            </div>
          );
        })}
        {!rows.length ? <p className="text-sm text-on-surface-variant">Info tambahan belum tersedia.</p> : null}
      </div>
      {!expanded && rows.length > 4 ? <FadeOverlay /> : null}
    </div>
  );
}

export function CollapsibleSynopsis({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = text.length > 280;

  return (
    <div className="relative mt-5 overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,rgba(29,26,35,0.92),rgba(21,18,27,0.9))] p-5 shadow-xl shadow-black/20 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Sinopsis</p>
        {shouldCollapse ? <ToggleButton expanded={expanded} onClick={() => setExpanded((value) => !value)} /> : null}
      </div>
      <div className={`mt-3 overflow-hidden transition-[max-height,opacity] duration-700 ease-out ${!expanded && shouldCollapse ? 'max-h-32 opacity-95' : 'max-h-[900px] opacity-100'}`}>
        <p className="text-base leading-8 text-on-surface-variant">{text}</p>
      </div>
      {!expanded && shouldCollapse ? <FadeOverlay /> : null}
    </div>
  );
}

function iconForInfo(label: string) {
  const value = label.toLowerCase();
  if (value.includes('status')) return CircleDot;
  if (value.includes('type') || value.includes('tipe')) return BookOpen;
  if (value.includes('genre')) return Tags;
  if (value.includes('author') || value.includes('penulis')) return PenLine;
  if (value.includes('artist') || value.includes('studio')) return UserRound;
  if (value.includes('rilis') || value.includes('release') || value.includes('tahun')) return CalendarDays;
  if (value.includes('episode')) return Clapperboard;
  if (value.includes('duration') || value.includes('durasi')) return Clock;
  if (value.includes('rating') || value.includes('score')) return Star;
  if (value.includes('season')) return Radio;
  if (value.includes('language') || value.includes('bahasa')) return Languages;
  return BookOpen;
}

function ToggleButton({ expanded, onClick }: { expanded: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative z-10 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-extrabold text-on-primary shadow-glow transition hover:brightness-110"
    >
      {expanded ? 'Tutup' : 'View all'}
      <ChevronDown size={14} className={`transition ${expanded ? 'rotate-180' : ''}`} />
    </button>
  );
}

function FadeOverlay() {
  return <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#1d1a23] via-[#1d1a23]/86 to-transparent" />;
}
