import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookmarkButton, CommentComposer } from '../../internal-actions';
import { getComicDetail, getComments } from '../../data';
import type { Metadata } from 'next';
import { ChapterList } from './chapter-list';
import { CollapsibleInfo, CollapsibleSynopsis } from '../../series/collapsible-detail';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const detail = await getComicDetail(params.slug);
  if (!detail) {
    return { title: 'Komik tidak ditemukan' };
  }
  const description = detail.description || `Baca detail ${detail.title}, genre, status, dan daftar chapter di Naraya.`;
  return {
    title: detail.title,
    description,
    alternates: { canonical: `/komik/${params.slug}` },
    openGraph: {
      title: `${detail.title} | Naraya`,
      description,
      url: `/komik/${params.slug}`,
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: detail.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${detail.title} | Naraya`,
      description,
      images: ['/opengraph-image'],
    },
  };
}

export default async function ComicDetailPage({ params }: { params: { slug: string } }) {
  const detail = await getComicDetail(params.slug);
  if (!detail) notFound();

  const comments = await getComments({ comicSlug: detail.slug });
  const latest = detail.chapters[0];
  const bookmarkComic = {
    slug: detail.slug,
    title: detail.title,
    image: detail.cover,
    meta: [detail.type, detail.status].filter(Boolean).join(' - '),
    episode: latest?.title ?? 'Belum ada chapter',
  };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ComicSeries',
    name: detail.title,
    url: `https://naraya.biz.id/komik/${detail.slug}`,
    image: detail.cover,
    description: detail.description,
    genre: detail.genres,
    inLanguage: 'id',
    publisher: {
      '@type': 'Organization',
      name: 'Naraya',
      url: 'https://naraya.biz.id',
    },
  };

  return (
    <section className="px-container-mobile pb-20 pt-28 md:px-container-desktop">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <div>
          <img src={detail.cover} alt={detail.title} width={280} height={420} fetchPriority="high" decoding="async" className="reveal-soft aspect-[2/3] w-full rounded-2xl object-cover shadow-glow" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">{detail.type || 'Komik'} {detail.status ? `- ${detail.status}` : ''}</p>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-6xl">{detail.title}</h1>
          <div className="mt-5 flex flex-wrap gap-2">
            {detail.genres.map((genre) => (
              <Link key={genre} href={`/explore?genre=${encodeURIComponent(genre)}`} className="rounded-full border border-white/10 bg-surface-container-high px-3 py-1 text-sm text-on-surface-variant transition hover:border-primary/50 hover:text-primary">
                {genre}
              </Link>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {latest ? (
              <Link href={`/baca/${latest.slug}`} className="interactive-lift inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-7 py-3 font-semibold text-on-primary shadow-glow transition hover:brightness-110 active:scale-95">
                Baca {latest.number ? `Chapter ${latest.number}` : 'Chapter Terbaru'}
              </Link>
            ) : null}
            <BookmarkButton comic={bookmarkComic} variant="button" />
          </div>
        </div>
      </div>

      <CollapsibleInfo rows={detail.info} title="Info Komik" />
      <CollapsibleSynopsis text={detail.description || 'Sinopsis belum tersedia untuk komik ini.'} />

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold">Daftar Chapter</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Lanjut scroll untuk melihat chapter berikutnya.
              </p>
            </div>
            <span className="text-sm font-semibold text-primary">{detail.chapters.length} chapter</span>
          </div>
          <ChapterList chapters={detail.chapters} />
        </div>
        <aside>
          <div className="rounded-[2rem] bg-surface-container-low/82 p-5 shadow-xl shadow-black/20">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl font-semibold">Komentar Komik</h2>
              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">{comments.length}</span>
            </div>
            <CommentComposer comicSlug={detail.slug} variant="embedded" />
            <div className="mt-5 grid max-h-[520px] gap-3 overflow-y-auto pr-1 [scrollbar-color:rgba(216,178,255,0.45)_transparent] [scrollbar-width:thin]">
              {comments.map((comment) => (
                <article key={comment.id} className="rounded-2xl bg-background/35 p-4">
                  <div className="flex items-center gap-3">
                    <img src={comment.avatarUrl || '/logo.svg'} alt={comment.displayName} width={40} height={40} loading="lazy" decoding="async" className="h-10 w-10 rounded-xl object-cover" />
                    <div>
                      <h3 className="font-semibold">{comment.displayName}</h3>
                      <p className="text-xs text-on-surface-variant">@{comment.username}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-on-surface-variant">{comment.body}</p>
                </article>
              ))}
              {!comments.length ? (
                <div className="rounded-2xl bg-background/35 p-5 text-sm text-on-surface-variant">
                  Belum ada komentar untuk komik ini.
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
