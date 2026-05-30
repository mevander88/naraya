'use client';

import Link from 'next/link';
import { ChevronDown, LoaderCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CommentItem, CommentPageData, LibraryItem, LoveItem } from '../data';
import { apiCredentials, apiURL } from '../lib/client-api';

export function LoveHistorySection({ loves, total }: { loves: LoveItem[]; total: number }) {
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = loves.length > 3;
  const visibleLoves = expanded || !shouldCollapse ? loves : loves.slice(0, 3);

  return (
    <section className="relative mt-8 max-w-full overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,rgba(29,26,35,0.98),rgba(21,18,27,0.96))] p-5 shadow-xl shadow-black/28 md:p-6">
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-200">Riwayat Love</p>
          <h2 className="mt-2 break-words font-display text-2xl font-semibold">Komik dan anime yang kamu Love</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {shouldCollapse && !expanded ? 'Menampilkan 3 Love terbaru.' : 'Semua Love tersimpan di akun ini.'}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-rose-200">{total} Love</p>
          {shouldCollapse ? <ToggleButton expanded={expanded} onClick={() => setExpanded((value) => !value)} /> : null}
        </div>
      </div>
      <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
        {visibleLoves.map((love) => (
          <Link key={love.id} href={loveTargetHref(love)} className="flex min-w-0 max-w-full gap-3 overflow-hidden rounded-2xl bg-background/35 p-3 transition hover:bg-rose-500/10">
            <img src={love.coverUrl || '/logo.svg'} alt={love.targetTitle} width={56} height={84} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.src = '/logo.svg'; }} className="aspect-[2/3] h-20 w-14 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 break-words text-sm font-bold text-on-surface">{love.targetTitle}</p>
              <p className="mt-1 text-xs font-semibold text-rose-200">{love.contentKind === 'series' ? 'Anime' : 'Komik'}</p>
              <time className="mt-2 block text-xs text-on-surface-variant" dateTime={love.createdAt}>{formatProfileDate(love.createdAt)}</time>
            </div>
          </Link>
        ))}
        {!loves.length ? (
          <div className="rounded-2xl bg-background/35 p-5 text-sm text-on-surface-variant sm:col-span-2">
            Belum ada Love di akun ini.
          </div>
        ) : null}
      </div>
      {!expanded && shouldCollapse ? <FadeOverlay /> : null}
    </section>
  );
}

export function CommentHistorySection({ initialPage, library }: { initialPage: CommentPageData; library: LibraryItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState(initialPage.items);
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor ?? '');
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const total = initialPage.total;
  const shouldCollapse = comments.length > 3 || hasMore;
  const visibleComments = expanded || !shouldCollapse ? comments : comments.slice(0, 3);

  const loadMore = useCallback(async () => {
    if (!expanded || !hasMore || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await fetch(apiURL(`/comments/me?limit=10&cursor=${encodeURIComponent(nextCursor)}`), {
        cache: 'no-store',
        credentials: apiCredentials(),
      });
      if (!response.ok) throw new Error('comments failed');
      const payload = (await response.json()) as CommentPageData;
      setComments((current) => mergeComments(current, payload.items ?? []));
      setNextCursor(payload.nextCursor ?? '');
      setHasMore(Boolean(payload.hasMore));
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [expanded, hasMore, loadingMore, nextCursor]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!expanded || !hasMore || !node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        void loadMore();
      }
    }, { rootMargin: '220px 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [expanded, hasMore, loadMore]);

  return (
    <section className="relative mt-8 max-w-full overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,rgba(29,26,35,0.98),rgba(21,18,27,0.96))] p-5 shadow-xl shadow-black/28 md:p-6">
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Riwayat Komentar</p>
          <h2 className="mt-2 break-words font-display text-2xl font-semibold">Komentar terbarumu</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {shouldCollapse && !expanded ? 'Menampilkan 3 komentar terbaru.' : 'Scroll untuk memuat riwayat komentar berikutnya.'}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-primary">{total} komentar</p>
          {shouldCollapse ? <ToggleButton expanded={expanded} onClick={() => setExpanded((value) => !value)} /> : null}
        </div>
      </div>
      <div className="mt-5 grid min-w-0 gap-3">
        {visibleComments.map((comment) => {
          const target = commentTarget(comment, library);
          const detail = commentHistoryDetail(comment);
          return (
            <Link key={comment.id} href={target.href} className="block min-w-0 max-w-full overflow-hidden rounded-2xl bg-background/35 p-4 transition hover:bg-primary/10">
              <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="min-w-0 max-w-full sm:flex-1">
                  <p className="break-words text-sm font-bold text-on-surface sm:truncate">{target.title}</p>
                  <p className="mt-1 max-w-full break-words text-xs font-semibold text-primary [overflow-wrap:anywhere]">{target.kind} - {target.part}</p>
                </div>
                <time className="max-w-full break-words text-xs font-semibold text-on-surface-variant sm:shrink-0 sm:whitespace-nowrap" dateTime={comment.createdAt}>
                  {formatProfileDate(comment.createdAt)}
                </time>
              </div>
              {detail.isReply ? (
                <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
                  <span className="shrink-0 rounded-full bg-sky-500/14 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-sky-200 ring-1 ring-sky-300/25">
                    Reply
                  </span>
                  <p className="min-w-0 break-words text-xs font-semibold text-on-surface-variant [overflow-wrap:anywhere]">{detail.context}</p>
                </div>
              ) : null}
              {detail.parentBody ? (
                <div className="mt-3 max-w-full rounded-xl bg-surface-container/70 p-3">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-sky-200">{detail.parentLabel}</p>
                  <p className="mt-1 line-clamp-2 max-w-full break-words text-xs leading-5 text-on-surface-variant [overflow-wrap:anywhere]">{detail.parentBody}</p>
                </div>
              ) : null}
              {detail.isReply ? (
                <div className="mt-3 max-w-full rounded-xl bg-background/30 p-3">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-primary">Balasan kamu</p>
                  <p className="mt-1 max-w-full break-words text-sm leading-6 text-on-surface-variant [overflow-wrap:anywhere]">{comment.body}</p>
                </div>
              ) : (
                <p className="mt-3 max-w-full break-words text-sm leading-6 text-on-surface-variant [overflow-wrap:anywhere]">{comment.body}</p>
              )}
            </Link>
          );
        })}
        {!comments.length ? (
          <div className="rounded-2xl bg-background/35 p-5 text-sm text-on-surface-variant">
            Belum ada riwayat komentar di akun ini.
          </div>
        ) : null}
        {expanded && hasMore ? <div ref={sentinelRef} className="h-6" aria-hidden="true" /> : null}
        {expanded && loadingMore ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-background/35 p-4 text-sm font-semibold text-primary">
            <LoaderCircle size={16} className="animate-spin" />
            Memuat komentar lain
          </div>
        ) : null}
      </div>
      {!expanded && shouldCollapse ? <FadeOverlay /> : null}
    </section>
  );
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
  return <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1d1a23] via-[#1d1a23]/94 to-transparent" />;
}

function formatProfileDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tanggal tidak tersedia';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function commentTarget(comment: CommentItem, library: LibraryItem[]) {
  const libraryItem = library.find((item) => item.comicSlug === comment.comicSlug);
  const inferredSlug = comment.comicSlug || inferParentSlug(comment.chapterSlug);
  const title = libraryItem?.comicTitle || (inferredSlug ? titleFromSlug(inferredSlug) : 'Naraya');
  const isEpisode = comment.chapterSlug.includes('-episode-') || libraryItem?.contentKind === 'series';
  const kind = isEpisode ? 'Anime' : 'Komik';
  const part = inferPartLabel(comment.chapterSlug);
  const href = comment.chapterSlug
    ? isEpisode ? `/nonton/${comment.chapterSlug}` : `/baca/${comment.chapterSlug}`
    : inferredSlug
      ? libraryItem?.contentKind === 'series' ? `/series/${inferredSlug}` : `/komik/${inferredSlug}`
      : '/profile';
  return { title, kind, part, href };
}

function loveTargetHref(love: LoveItem) {
  if (love.targetUrl) return love.targetUrl;
  return love.contentKind === 'series' ? `/series/${love.targetSlug}` : `/komik/${love.targetSlug}`;
}

function commentHistoryDetail(comment: CommentItem) {
  const isReply = Boolean(comment.parentId);
  const parentName = comment.parentDisplayName || (comment.parentUsername ? `@${comment.parentUsername}` : '');
  return {
    isReply,
    context: parentName ? `Membalas ${parentName}` : 'Membalas komentar lain',
    parentLabel: parentName ? `Komentar ${parentName}` : 'Komentar yang dibalas',
    parentBody: isReply ? comment.parentBody : '',
  };
}

function inferParentSlug(slug: string) {
  if (!slug) return '';
  const chapterIndex = slug.indexOf('-chapter-');
  if (chapterIndex > 0) return slug.slice(0, chapterIndex);
  const episodeIndex = slug.indexOf('-episode-');
  if (episodeIndex > 0) return slug.slice(0, episodeIndex);
  return slug;
}

function inferPartLabel(slug: string) {
  if (!slug) return 'Detail';
  const chapter = slug.match(/chapter-([0-9.]+)/i);
  if (chapter?.[1]) return `Chapter ${chapter[1]}`;
  const episode = slug.match(/episode-([0-9.]+)/i);
  if (episode?.[1]) return `Episode ${episode[1]}`;
  return titleFromSlug(slug);
}

function titleFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
