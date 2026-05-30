'use client';

import { useEffect, useRef, useState } from 'react';
import { apiURL, mediaURL } from '../lib/client-api';
import { CommentThread } from '../comment-thread';

type ReaderSurfaceProps = {
  title: string;
  slug: string;
  comicSlug?: string;
  images: string[];
  chapters?: {
    slug: string;
    title: string;
    number: string;
  }[];
  immersiveMode?: boolean;
  highQualityImages?: boolean;
};

type ReaderChapter = {
  slug: string;
  title: string;
  images: string[];
};

export function ReaderSurface({ title, slug, comicSlug = '', images, chapters = [], immersiveMode = true, highQualityImages = true }: ReaderSurfaceProps) {
  const [chromeVisible, setChromeVisible] = useState(immersiveMode);
  const [renderedChapters, setRenderedChapters] = useState<ReaderChapter[]>([{ slug, title, images }]);
  const [loadingNext, setLoadingNext] = useState(false);
  const [finished, setFinished] = useState(false);
  const chapterRefs = useRef<Record<string, HTMLElement | null>>({});
  const loadingNextRef = useRef(false);
  const requestedSlugsRef = useRef(new Set<string>());

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('naraya-reader-chrome', { detail: { visible: immersiveMode ? chromeVisible : true } }));
  }, [chromeVisible, immersiveMode]);

  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('naraya-reader-chrome', { detail: { visible: true } }));
    };
  }, []);

  function toggleChrome() {
    if (!immersiveMode) return;
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
        const response = await fetch(apiURL(`/chapters/${nextChapter.slug}`));
        if (response.ok) {
          const payload = (await response.json()) as { slug: string; title: string; images?: string[] };
          const images = (payload.images ?? []).reduce<string[]>((items, image) => {
            const url = mediaURL(image);
            if (url) items.push(url);
            return items;
          }, []);
          setRenderedChapters((current) => [
            ...current,
            {
              slug: payload.slug,
              title: payload.title || nextChapter.title,
              images,
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
        onContextMenu={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleChrome();
          }
        }}
        className={`mx-auto flex max-w-4xl cursor-pointer flex-col items-center gap-0 outline-none transition duration-300 ${
          immersiveMode && !chromeVisible ? 'pt-0' : 'pt-2'
        }`}
        aria-label={immersiveMode ? 'Klik untuk sembunyikan atau tampilkan navigasi reader' : 'Reader'}
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
                <CommentThread
                  comicSlug={comicSlug}
                  chapterSlug={renderedChapters[chapterIndex - 1].slug}
                  title="Komentar Chapter"
                  emptyText="Belum ada komentar untuk chapter ini."
                  variant="reader"
                />
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
                loading={highQualityImages && chapterIndex === 0 && index < 2 ? 'eager' : 'lazy'}
                fetchPriority={highQualityImages && chapterIndex === 0 && index < 2 ? 'high' : 'auto'}
                decoding="async"
                draggable={false}
                referrerPolicy="same-origin"
                onContextMenu={(event) => event.preventDefault()}
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
