'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LoaderCircle, MessageCircle, RefreshCw, Reply, Send, X } from 'lucide-react';
import type { CommentItem } from './data';
import { AdminMark, isAdminRole } from './admin-mark';
import { apiCredentials, apiURL } from './lib/client-api';

type CommentThreadProps = {
  comicSlug?: string;
  chapterSlug?: string;
  initialComments?: CommentItem[];
  initialNextCursor?: string;
  initialHasMore?: boolean;
  title: string;
  emptyText: string;
  variant?: 'embedded' | 'panel' | 'reader';
};

function hasSessionHint() {
  return document.cookie
    .split('; ')
    .some((row) => row.startsWith('naraya_user='));
}

function formatCommentDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function commentTime(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

export function CommentThread({
  comicSlug = '',
  chapterSlug = '',
  initialComments = [],
  initialNextCursor = '',
  initialHasMore = false,
  title,
  emptyText,
  variant = 'embedded',
}: CommentThreadProps) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [body, setBody] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'loadingMore' | 'sending' | 'sent' | 'error'>('idle');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (chapterSlug) {
      params.set('chapterSlug', chapterSlug);
    } else if (comicSlug) {
      params.set('comicSlug', comicSlug);
    }
    return params.toString();
  }, [chapterSlug, comicSlug]);

  const commentTree = useMemo(() => {
    const rootComments = comments.filter((comment) => !comment.parentId);
    const rootIds = new Set(rootComments.map((comment) => comment.id));
    const repliesByParent = new Map<string, CommentItem[]>();
    const visibleRoots = [...rootComments];

    comments.forEach((comment) => {
      if (!comment.parentId) return;
      if (!rootIds.has(comment.parentId)) {
        visibleRoots.push(comment);
        return;
      }
      const replies = repliesByParent.get(comment.parentId) ?? [];
      replies.push(comment);
      repliesByParent.set(comment.parentId, replies);
    });

    visibleRoots.sort((a, b) => commentTime(b.createdAt) - commentTime(a.createdAt));
    repliesByParent.forEach((replies) => {
      replies.sort((a, b) => commentTime(a.createdAt) - commentTime(b.createdAt));
    });

    return { roots: visibleRoots, repliesByParent };
  }, [comments]);

  const loadComments = useCallback(async (mode: 'reset' | 'more' = 'reset') => {
    if (!query) return;
    const cursor = mode === 'more' ? nextCursor : '';
    if (mode === 'more' && (!hasMore || !cursor || status === 'loadingMore' || status === 'loading')) return;
    setStatus(mode === 'more' ? 'loadingMore' : 'loading');
    try {
      const nextQuery = new URLSearchParams(query);
      nextQuery.set('limit', '10');
      if (cursor) nextQuery.set('cursor', cursor);
      const response = await fetch(apiURL(`/comments?${nextQuery.toString()}`), {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('comments failed');
      const payload = (await response.json()) as { items?: CommentItem[]; nextCursor?: string; hasMore?: boolean };
      const items = payload.items ?? [];
      setComments((current) => (mode === 'more' ? mergeComments(current, items) : items));
      setNextCursor(payload.nextCursor ?? '');
      setHasMore(Boolean(payload.hasMore));
      if (mode === 'reset') setReplyingTo(null);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }, [hasMore, nextCursor, query, status]);

  useEffect(() => {
    setIsLoggedIn(hasSessionHint());
  }, []);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        void loadComments('more');
      }
    }, { rootMargin: '220px 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadComments]);

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
          parentId: replyingTo?.id ?? '',
          body: body.trim(),
        }),
      });
      if (!response.ok) throw new Error('comment send failed');
      setBody('');
      setReplyingTo(null);
      setStatus('sent');
      await loadComments('reset');
    } catch {
      setStatus('error');
    }
  }

  function startReply(comment: CommentItem) {
    if (!isLoggedIn) {
      setStatus('error');
      return;
    }
    setReplyingTo(comment);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function cancelReply() {
    setReplyingTo(null);
    inputRef.current?.focus();
  }

  function renderComment(comment: CommentItem, replies: CommentItem[] = [], isReply = false) {
    return (
      <article key={comment.id} className="min-w-0 rounded-2xl bg-background/35 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <img src={comment.avatarUrl || '/logo.svg'} alt={comment.displayName} width={40} height={40} loading="lazy" decoding="async" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="max-w-full truncate font-semibold">{comment.displayName}</h3>
              {isAdminRole(comment.role) ? (
                <AdminMark />
              ) : (
                <span className="shrink-0 rounded-full bg-primary/14 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-primary">{comment.role || 'reader'}</span>
              )}
            </div>
            <p className="truncate text-xs text-on-surface-variant">
              @{comment.username}{comment.createdAt ? ` - ${formatCommentDate(comment.createdAt)}` : ''}
            </p>
          </div>
        </div>
        <p className="mt-3 break-words text-sm leading-6 text-on-surface-variant">{comment.body}</p>
        {!isReply && isLoggedIn ? (
          <button
            type="button"
            onClick={() => startReply(comment)}
            className="mt-3 inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-white/10 bg-surface-container-high px-3 py-2 text-xs font-bold text-primary transition hover:border-primary/50 hover:bg-primary/10"
          >
            <Reply size={14} />
            Balas
          </button>
        ) : null}
        {replies.length ? (
          <div className="mt-4 grid min-w-0 gap-3 border-l border-white/10 pl-3 sm:pl-4">
            {replies.map((reply) => renderComment(reply, [], true))}
          </div>
        ) : null}
      </article>
    );
  }

  const content = (
    <>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <MessageCircle size={20} className="shrink-0 text-primary" />
          <h2 className="min-w-0 font-display text-2xl font-semibold">{title}</h2>
          <span className="shrink-0 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">{comments.length}</span>
        </div>
        <button
          type="button"
          onClick={() => void loadComments()}
          disabled={status === 'loading' || status === 'sending'}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-surface-container-high px-3 py-2 text-xs font-bold text-primary transition hover:border-primary/50 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {status === 'loading' ? <LoaderCircle size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          Reload
        </button>
      </div>

      <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        {!isLoggedIn ? (
          <p className="rounded-xl border border-white/10 bg-surface-container px-4 py-3 text-sm text-on-surface-variant md:col-span-2">
            Login terlebih dahulu untuk menulis komentar.
          </p>
        ) : null}
        {replyingTo ? (
          <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary md:col-span-2">
            <p className="min-w-0 truncate font-semibold">Membalas @{replyingTo.username}</p>
            <button type="button" onClick={cancelReply} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-surface-container-high">
              <X size={14} />
            </button>
          </div>
        ) : null}
        <input
          ref={inputRef}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          disabled={!isLoggedIn || status === 'sending'}
          className="min-h-11 min-w-0 rounded-xl border border-white/10 bg-surface-container px-4 text-sm outline-none placeholder:text-on-surface-variant/60 focus:border-primary disabled:opacity-55"
          placeholder={isLoggedIn ? (replyingTo ? `Balas @${replyingTo.username}` : 'Tulis komentar untuk Naraya') : 'Login untuk menulis komentar'}
        />
        <button
          disabled={!isLoggedIn || status === 'sending'}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-45"
          type="submit"
        >
          {status === 'sending' ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={17} />}
          {status === 'sending' ? 'Mengirim' : replyingTo ? 'Balas' : 'Kirim'}
        </button>
      </form>

      {status === 'sent' ? <p className="mt-2 text-sm text-primary">Komentar terkirim dan daftar sudah disinkronkan.</p> : null}
      {status === 'error' && isLoggedIn ? <p className="mt-2 text-sm text-tertiary">Komentar belum bisa disinkronkan. Coba reload.</p> : null}

      <div className="mt-5 grid gap-3">
        {commentTree.roots.map((comment) => renderComment(comment, commentTree.repliesByParent.get(comment.id) ?? []))}
        {status === 'loading' ? <div className="skeleton h-20 rounded-2xl" /> : null}
        {status !== 'loading' && !comments.length ? (
          <p className="rounded-2xl bg-background/35 p-4 text-sm text-on-surface-variant">{emptyText}</p>
        ) : null}
        {hasMore ? <div ref={sentinelRef} className="h-6" aria-hidden="true" /> : null}
        {status === 'loadingMore' ? <div className="skeleton h-16 rounded-2xl" /> : null}
      </div>
    </>
  );

  if (variant === 'panel') {
    return <div className="glass-panel mt-8 rounded-2xl p-4">{content}</div>;
  }

  if (variant === 'reader') {
    return <div className="mx-auto my-8 max-w-4xl rounded-[2rem] bg-surface-container-low/86 p-5 shadow-xl shadow-black/20 ring-1 ring-white/8">{content}</div>;
  }

  return <div>{content}</div>;
}

function mergeComments(current: CommentItem[], next: CommentItem[]) {
  const seen = new Set(current.map((comment) => comment.id));
  const merged = [...current];
  next.forEach((comment) => {
    if (seen.has(comment.id)) return;
    seen.add(comment.id);
    merged.push(comment);
  });
  return merged;
}
