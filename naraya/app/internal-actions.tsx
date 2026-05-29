'use client';

import { Bookmark, MessageSquare, X } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import type { ComicCardData } from './data';

function apiBaseURL() {
  return process.env.NEXT_PUBLIC_NARAYA_API_URL ?? (process.env.NODE_ENV === 'production' ? 'https://naraya.biz.id/api' : 'http://127.0.0.1:4000/api');
}

function sessionToken() {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('naraya_session='))
    ?.split('=')[1] ?? '';
}

function sessionHeaders(): Record<string, string> {
  const token = sessionToken();
  return token ? { 'X-Naraya-Session': decodeURIComponent(token) } : {};
}

export function BookmarkButton({ comic, variant = 'icon' }: { comic: ComicCardData; variant?: 'icon' | 'button' }) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(sessionToken()));
  }, []);

  async function save() {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    setState('saving');
    try {
      const response = await fetch(`${apiBaseURL()}/library`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...sessionHeaders(),
        },
        body: JSON.stringify({
          comicSlug: comic.slug,
          comicTitle: comic.title,
          contentKind: comic.kind === 'series' ? 'series' : 'comic',
          coverUrl: comic.image,
          latestChapterSlug: '',
          lastChapterTitle: comic.episode,
          status: 'planned',
          progressPercent: 0,
          isBookmarked: true,
        }),
      });
      setState(response.ok ? 'saved' : 'error');
    } catch {
      setState('error');
    }
  }

  return (
    <>
      <button
        onClick={save}
        className={variant === 'button'
          ? 'interactive-lift inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-surface-container-high px-5 py-3 font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/10 active:scale-95'
          : 'rounded-lg bg-black/70 p-2 text-primary backdrop-blur transition hover:bg-primary hover:text-on-primary'}
        aria-label={`Simpan ${comic.title}`}
        title={!isLoggedIn ? 'Login dulu untuk memasukkan ke rak bacaan' : state === 'saved' ? 'Tersimpan' : 'Simpan ke rak bacaan'}
      >
        <Bookmark size={17} fill={state === 'saved' ? 'currentColor' : 'none'} />
        {variant === 'button' ? <span>{state === 'saved' ? 'Tersimpan' : state === 'saving' ? 'Menyimpan...' : 'Simpan'}</span> : null}
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

export function CommentComposer({ comicSlug = '', chapterSlug = '', variant = 'panel' }: { comicSlug?: string; chapterSlug?: string; variant?: 'panel' | 'embedded' }) {
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(sessionToken()));
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
      const response = await fetch(`${apiBaseURL()}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...sessionHeaders(),
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
