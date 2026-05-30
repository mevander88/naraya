'use client';

import { Bookmark, Heart, MessageSquare, X } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import type { ComicCardData, FavoriteStatus, LoveStatus } from './data';
import { apiCredentials, apiURL } from './lib/client-api';

function hasSessionHint() {
  return document.cookie
    .split('; ')
    .some((row) => row.startsWith('naraya_user='));
}

export function BookmarkButton({ comic, variant = 'icon', initialStatus }: { comic: ComicCardData; variant?: 'icon' | 'button'; initialStatus?: FavoriteStatus }) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>(initialStatus?.favorited ? 'saved' : 'idle');
  const [count, setCount] = useState(initialStatus?.count ?? 0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const shouldShowCount = typeof initialStatus !== 'undefined';

  useEffect(() => {
    setIsLoggedIn(hasSessionHint());
  }, []);

  async function save() {
    if (state === 'saved' || state === 'saving') return;
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    setState('saving');
    try {
      const response = await fetch(apiURL('/library'), {
        method: 'POST',
        credentials: apiCredentials(),
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comicSlug: comic.slug,
          comicTitle: comic.title,
          contentKind: comic.kind === 'series' ? 'series' : 'comic',
          coverUrl: comic.image,
          latestChapterSlug: comic.latestChapterSlug ?? '',
          lastChapterSlug: comic.latestChapterSlug ?? '',
          lastChapterTitle: comic.episode,
          status: 'planned',
          progressPercent: 0,
          isBookmarked: true,
        }),
      });
      if (!response.ok) throw new Error('bookmark failed');
      const statusResponse = await fetch(apiURL(`/library/${encodeURIComponent(comic.slug)}/status`), {
        credentials: apiCredentials(),
      });
      if (statusResponse.ok) {
        const payload = (await statusResponse.json()) as FavoriteStatus;
        setCount(payload.count);
      } else {
        setCount((current) => current + 1);
      }
      setState('saved');
    } catch {
      setState('error');
    }
  }

  return (
    <>
      <button
        onClick={save}
        disabled={state === 'saved' || state === 'saving'}
        className={variant === 'button'
          ? 'interactive-lift inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-surface-container-high px-5 py-3 font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/10 active:scale-95 disabled:cursor-default disabled:opacity-85'
          : 'rounded-lg bg-black/70 p-2 text-primary backdrop-blur transition hover:bg-primary hover:text-on-primary disabled:cursor-default disabled:opacity-85'}
        aria-label={`Simpan ${comic.title}`}
        title={!isLoggedIn ? 'Login dulu untuk memasukkan ke rak bacaan' : state === 'saved' ? 'Tersimpan' : 'Simpan ke rak bacaan'}
      >
        <Bookmark size={17} fill={state === 'saved' ? 'currentColor' : 'none'} />
        {variant === 'button' ? <span>{state === 'saved' ? 'Tersimpan' : state === 'saving' ? 'Menyimpan...' : 'Simpan'}</span> : null}
        {variant === 'button' && shouldShowCount ? <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold">{count}</span> : null}
      </button>
      {showLoginPrompt ? (
        <div className="fixed inset-x-3 bottom-[5.25rem] z-[80] mx-auto max-h-[calc(100dvh-7rem)] max-w-[min(24rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-white/10 bg-surface-container-high p-4 shadow-2xl md:bottom-8 md:inset-x-4">
          <button onClick={() => setShowLoginPrompt(false)} className="absolute right-3 top-3 rounded-lg p-1 text-on-surface-variant hover:bg-white/5 hover:text-primary" aria-label="Tutup popup login">
            <X size={16} />
          </button>
          <p className="pr-8 text-base font-semibold leading-6 text-on-surface">Login diperlukan</p>
          <p className="mt-1 pr-2 text-sm leading-6 text-on-surface-variant">Masuk dulu untuk menyimpan item ke rak bacaan akunmu.</p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link href="/login" className="rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-semibold text-on-primary">Login</Link>
            <Link href="/register" className="rounded-xl border border-white/10 px-4 py-2.5 text-center text-sm font-semibold text-on-surface-variant hover:text-primary">Daftar</Link>
          </div>
        </div>
      ) : null}
    </>
  );
}

type LoveTarget = {
  slug: string;
  title: string;
  kind?: string;
  coverUrl?: string;
  targetUrl?: string;
};

export function LoveButton({ target, initialStatus }: { target: LoveTarget; initialStatus: LoveStatus }) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'loved' | 'error'>(initialStatus.loved ? 'loved' : 'idle');
  const [count, setCount] = useState(initialStatus.count);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const loved = status === 'loved';

  useEffect(() => {
    setIsLoggedIn(hasSessionHint());
  }, []);

  async function love() {
    if (loved || status === 'saving') return;
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    setStatus('saving');
    try {
      const response = await fetch(apiURL('/loves'), {
        method: 'POST',
        credentials: apiCredentials(),
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetSlug: target.slug,
          targetTitle: target.title,
          contentKind: target.kind === 'series' ? 'series' : 'comic',
          coverUrl: target.coverUrl ?? '',
          targetUrl: target.targetUrl ?? '',
        }),
      });
      if (!response.ok) throw new Error('love failed');
      const payload = (await response.json()) as LoveStatus;
      setCount(payload.count);
      setStatus('loved');
    } catch {
      setStatus('error');
    }
  }

  return (
    <>
      <button
        onClick={love}
        disabled={loved || status === 'saving'}
        className="interactive-lift inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-rose-300/20 bg-rose-500/10 px-5 py-3 font-semibold text-rose-200 transition hover:border-rose-300/50 hover:bg-rose-500/16 active:scale-95 disabled:cursor-default disabled:opacity-80"
        aria-label={`Love ${target.title}`}
        title={!isLoggedIn ? 'Login dulu untuk memberi Love' : loved ? 'Sudah kamu Love' : 'Love'}
      >
        <Heart size={17} fill={loved ? 'currentColor' : 'none'} />
        <span>{status === 'saving' ? 'Menyimpan...' : loved ? 'Loved' : 'Love'}</span>
        <span className="rounded-full bg-rose-300/15 px-2 py-0.5 text-xs font-bold">{count}</span>
      </button>
      {status === 'error' ? <p className="basis-full text-sm text-tertiary">Love belum bisa disimpan. Coba lagi.</p> : null}
      {showLoginPrompt ? (
        <div className="fixed inset-x-3 bottom-[5.25rem] z-[80] mx-auto max-h-[calc(100dvh-7rem)] max-w-[min(24rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-white/10 bg-surface-container-high p-4 shadow-2xl md:bottom-8 md:inset-x-4">
          <button onClick={() => setShowLoginPrompt(false)} className="absolute right-3 top-3 rounded-lg p-1 text-on-surface-variant hover:bg-white/5 hover:text-primary" aria-label="Tutup popup login">
            <X size={16} />
          </button>
          <p className="pr-8 text-base font-semibold leading-6 text-on-surface">Login diperlukan</p>
          <p className="mt-1 pr-2 text-sm leading-6 text-on-surface-variant">Masuk dulu untuk memberi Love pada komik atau anime ini.</p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link href="/login" className="rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-semibold text-on-primary">Login</Link>
            <Link href="/register" className="rounded-xl border border-white/10 px-4 py-2.5 text-center text-sm font-semibold text-on-surface-variant hover:text-primary">Daftar</Link>
          </div>
        </div>
      ) : null}
    </>
  );
}

type AutoBookmarkTarget = {
  enabled: boolean;
  slug: string;
  title: string;
  kind?: string;
  coverUrl?: string;
  latestChapterSlug?: string;
  lastChapterSlug?: string;
  lastChapterTitle?: string;
  status?: string;
  progressPercent?: number;
};

export function AutoBookmarkVisit({ target }: { target: AutoBookmarkTarget }) {
  useEffect(() => {
    if (!target.enabled || !target.slug || !target.title || !hasSessionHint()) return;
    const key = `naraya-auto-bookmark:${target.slug}:${target.lastChapterSlug ?? ''}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, '1');

    void fetch(apiURL('/library'), {
      method: 'POST',
      credentials: apiCredentials(),
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comicSlug: target.slug,
        comicTitle: target.title,
        contentKind: target.kind === 'series' ? 'series' : 'comic',
        coverUrl: target.coverUrl ?? '',
        latestChapterSlug: target.latestChapterSlug ?? target.lastChapterSlug ?? '',
        lastChapterSlug: target.lastChapterSlug ?? target.latestChapterSlug ?? '',
        lastChapterTitle: target.lastChapterTitle ?? '',
        status: target.status ?? 'reading',
        progressPercent: clampProgress(target.progressPercent),
        isBookmarked: false,
      }),
    }).catch(() => {
      window.sessionStorage.removeItem(key);
    });
  }, [target]);

  return null;
}

function clampProgress(value?: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function CommentComposer({ comicSlug = '', chapterSlug = '', variant = 'panel' }: { comicSlug?: string; chapterSlug?: string; variant?: 'panel' | 'embedded' }) {
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(hasSessionHint());
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLoggedIn) {
      setStatus('error');
      return;
    }
    if (!body.trim()) return;
    setStatus('sending');
    try {
      const response = await fetch(apiURL('/comments'), {
        method: 'POST',
        credentials: apiCredentials(),
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comicSlug,
          chapterSlug,
          body,
        }),
      });
      if (!response.ok) throw new Error('failed');
      setBody('');
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  return (
    <form onSubmit={submit} className={variant === 'embedded' ? 'mt-5 rounded-2xl bg-background/35 p-4' : 'glass-panel mt-8 rounded-2xl p-4'}>
      <label className="text-sm font-semibold text-on-surface">Komentar komunitas</label>
      {!isLoggedIn ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
          Login terlebih dahulu untuk menulis komentar.
        </div>
      ) : null}
      <div className={variant === 'embedded' ? 'mt-3 flex flex-col gap-3' : 'mt-3 flex flex-col gap-3 md:flex-row'}>
        <input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          disabled={!isLoggedIn}
          className="min-h-11 flex-1 rounded-xl border border-white/10 bg-surface-container px-4 text-sm outline-none placeholder:text-on-surface-variant/60 focus:border-primary"
          placeholder="Tulis komentar untuk Naraya"
        />
        <button disabled={!isLoggedIn} className={`inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-45 ${variant === 'embedded' ? 'w-full' : 'w-full md:w-auto'}`} type="submit">
          <MessageSquare size={17} />
          {status === 'sending' ? 'Mengirim' : 'Kirim'}
        </button>
      </div>
      {status === 'sent' ? <p className="mt-2 text-sm text-primary">Komentar berhasil dikirim.</p> : null}
      {status === 'error' && isLoggedIn ? <p className="mt-2 text-sm text-tertiary">Komentar belum bisa dikirim. Coba lagi sebentar lagi.</p> : null}
    </form>
  );
}
