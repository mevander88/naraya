'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';

type ReaderSurfaceProps = {
  title: string;
  slug: string;
  images: string[];
  chapters?: {
    slug: string;
    title: string;
    number: string;
  }[];
};

type ReaderChapter = {
  slug: string;
  title: string;
  images: string[];
};

type ChapterComment = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  role?: string;
  body: string;
};

function apiBaseURL() {
  return process.env.NEXT_PUBLIC_NARAYA_API_URL ?? (process.env.NODE_ENV === 'production' ? 'https://naraya.biz.id/api' : 'http://127.0.0.1:4000/api');
}

function apiOrigin() {
  return apiBaseURL().replace(/\/api\/?$/, '');
}

function mediaURL(value: string) {
  return value.startsWith('/api/') ? `${apiOrigin()}${value}` : value;
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

export function ReaderSurface({ title, slug, images, chapters = [] }: ReaderSurfaceProps) {
  const [chromeVisible, setChromeVisible] = useState(true);
  const [renderedChapters, setRenderedChapters] = useState<ReaderChapter[]>([{ slug, title, images }]);
  const [loadingNext, setLoadingNext] = useState(false);
  const [finished, setFinished] = useState(false);
  const chapterRefs = useRef<Record<string, HTMLElement | null>>({});
  const loadingNextRef = useRef(false);
  const requestedSlugsRef = useRef(new Set<string>());

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('naraya-reader-chrome', { detail: { visible: chromeVisible } }));
  }, [chromeVisible]);

  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('naraya-reader-chrome', { detail: { visible: true } }));
    };
  }, []);

  function toggleChrome() {
    setChromeVisible((visible) => !visible);
  }

  const lastRenderedSlug = renderedChapters[renderedChapters.length - 1]?.slug;
  const lastRenderedIndex = chapters.findIndex((chapter) => chapter.slug === lastRenderedSlug);
  const nextChapter = lastRenderedIndex >= 0 ? chapters[lastRenderedIndex + 1] : undefined;

  useEffect(() => {
    const sentinel = document.getElementById('naraya-reader-sentinel');
    if (!sentinel || finished) return;

    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting || loadingNextRef.current || !nextChapter || requestedSlugsRef.current.has(nextChapter.slug)) {
        if (!nextChapter) setFinished(true);
        return;
      }

      loadingNextRef.current = true;
      requestedSlugsRef.current.add(nextChapter.slug);
      setLoadingNext(true);
      try {
        const response = await fetch(`${apiBaseURL()}/chapters/${nextChapter.slug}`);
        if (response.ok) {
          const payload = (await response.json()) as { slug: string; title: string; images?: string[] };
          setRenderedChapters((current) => [
            ...current,
            {
              slug: payload.slug,
              title: payload.title || nextChapter.title,
              images: (payload.images ?? []).map(mediaURL),
            },
          ]);
        } else {
          setFinished(true);
        }
      } catch {
        setFinished(true);
      } finally {
        loadingNextRef.current = false;
        setLoadingNext(false);
      }
    }, { rootMargin: '220px 0px', threshold: 0.15 });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [finished, nextChapter]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      const activeSlug = visible?.target.getAttribute('data-chapter-slug');
      if (activeSlug && window.location.pathname !== `/baca/${activeSlug}`) {
        window.history.replaceState(null, '', `/baca/${activeSlug}`);
      }
    }, { threshold: [0.45, 0.65, 0.85] });

    renderedChapters.forEach((chapter) => {
      const node = chapterRefs.current[chapter.slug];
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [renderedChapters]);

  return (
    <div className="relative mx-auto mt-8 max-w-5xl">
      <div
        role="button"
        tabIndex={0}
        onClick={toggleChrome}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleChrome();
          }
        }}
        className={`mx-auto flex max-w-4xl cursor-pointer flex-col items-center gap-0 outline-none transition duration-300 ${
          chromeVisible ? 'pt-2' : 'pt-0'
        }`}
        aria-label="Klik untuk sembunyikan atau tampilkan navigasi reader"
      >
        {renderedChapters.map((chapter, chapterIndex) => (
          <section
            key={chapter.slug}
            ref={(node) => {
              chapterRefs.current[chapter.slug] = node;
            }}
            data-chapter-slug={chapter.slug}
            className="w-full"
          >
            {chapterIndex > 0 ? (
              <>
                <ChapterComments chapterSlug={renderedChapters[chapterIndex - 1].slug} />
                <div className="mx-auto my-8 max-w-4xl rounded-2xl border border-white/10 bg-surface-container px-5 py-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Chapter berikutnya</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold">{chapter.title}</h2>
                </div>
              </>
            ) : null}
            {chapter.images.map((image, index) => (
              <img
                key={`${chapter.slug}-${image}`}
                src={image}
                alt={`${chapter.title} page ${index + 1}`}
                loading={chapterIndex === 0 && index < 2 ? 'eager' : 'lazy'}
                fetchPriority={chapterIndex === 0 && index < 2 ? 'high' : 'auto'}
                decoding="async"
                className="w-full max-w-4xl select-none object-contain"
              />
            ))}
          </section>
        ))}
      </div>
      <div id="naraya-reader-sentinel" className="flex min-h-28 items-center justify-center py-8 text-sm font-semibold text-on-surface-variant">
        {loadingNext ? 'Menyiapkan chapter berikutnya...' : finished ? 'Kamu sudah sampai chapter terakhir.' : 'Lanjut scroll untuk chapter berikutnya.'}
      </div>
    </div>
  );
}

function ChapterComments({ chapterSlug }: { chapterSlug: string }) {
  const [comments, setComments] = useState<ChapterComment[]>([]);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sending' | 'sent' | 'error'>('loading');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(sessionToken()));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetch(`${apiBaseURL()}/comments?chapterSlug=${encodeURIComponent(chapterSlug)}`)
      .then((response) => (response.ok ? response.json() : { items: [] }))
      .then((payload: { items?: ChapterComment[] }) => {
        if (!cancelled) {
          setComments(payload.items ?? []);
          setStatus('idle');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [chapterSlug]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLoggedIn || !body.trim()) return;
    setStatus('sending');
    try {
      const response = await fetch(`${apiBaseURL()}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...sessionHeaders(),
        },
        body: JSON.stringify({ chapterSlug, body }),
      });
      if (!response.ok) throw new Error('failed');
      const created = (await response.json()) as ChapterComment;
      setComments((current) => [created, ...current]);
      setBody('');
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="mx-auto my-8 max-w-4xl rounded-[2rem] bg-surface-container-low/86 p-5 shadow-xl shadow-black/20 ring-1 ring-white/8">
      <div className="flex items-center gap-3">
        <MessageCircle size={20} className="text-primary" />
        <h2 className="font-display text-2xl font-semibold">Komentar Chapter</h2>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">{comments.length}</span>
      </div>
      <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          disabled={!isLoggedIn}
          className="min-h-11 rounded-xl bg-background/45 px-4 text-sm outline-none placeholder:text-on-surface-variant/60 focus:ring-2 focus:ring-primary/30 disabled:opacity-55"
          placeholder={isLoggedIn ? 'Tulis komentar untuk chapter ini' : 'Login untuk menulis komentar'}
        />
        <button disabled={!isLoggedIn || status === 'sending'} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-45" type="submit">
          <Send size={16} />
          {status === 'sending' ? 'Mengirim' : 'Kirim'}
        </button>
      </form>
      <div className="mt-5 grid gap-3">
        {comments.map((comment) => (
          <article key={comment.id} className="rounded-2xl bg-background/35 p-4">
            <div className="flex items-center gap-3">
              <img src={comment.avatarUrl || '/logo.svg'} alt={comment.displayName} width={44} height={44} loading="lazy" decoding="async" className="h-11 w-11 rounded-2xl object-cover shadow-[0_10px_24px_rgba(0,0,0,0.22)]" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">{comment.displayName}</h3>
                  <span className="rounded-full bg-primary/14 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-primary">{comment.role || 'reader'}</span>
                </div>
                <p className="text-xs text-on-surface-variant">@{comment.username}</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">{comment.body}</p>
          </article>
        ))}
        {status === 'loading' ? <div className="skeleton h-20 rounded-2xl" /> : null}
        {status !== 'loading' && !comments.length ? (
          <p className="rounded-2xl bg-background/35 p-4 text-sm text-on-surface-variant">Belum ada komentar untuk chapter ini.</p>
        ) : null}
      </div>
    </div>
  );
}
