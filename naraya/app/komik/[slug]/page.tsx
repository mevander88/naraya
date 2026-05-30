import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookmarkButton, LoveButton } from '../../internal-actions';
import { getComicDetail, getComments, getLoveStatus, titleFromSlug } from '../../data';
import type { Metadata } from 'next';
import { ChapterList } from './chapter-list';
import { CollapsibleInfo, CollapsibleSynopsis } from '../../series/collapsible-detail';
import { CommentThread } from '../../comment-thread';
import { ShareButton } from '../../share-button';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getComicDetail(slug);
  const title = detail?.title || titleFromSlug(slug);
  const description = detail?.description || `Baca detail ${title}, genre, status, dan daftar chapter di Naraya.`;
  const image = detail?.cover || '/opengraph-image';
  return {
    title,
    description,
    alternates: { canonical: `/komik/${slug}` },
    openGraph: {
      title: `${title} | Naraya`,
      description,
      url: `/komik/${slug}`,
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Naraya`,
      description,
      images: [image],
    },
  };
}

export default async function ComicDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const detail = await getComicDetail(slug);
  if (!detail) notFound();

  const [comments, loveStatus] = await Promise.all([
    getComments({ comicSlug: detail.slug }),
    getLoveStatus(detail.slug),
  ]);
  const latest = detail.chapters[0];
  const bookmarkComic = {
    slug: detail.slug,
    title: detail.title,
    image: detail.cover,
    meta: [detail.type, detail.status].filter(Boolean).join(' - '),
    episode: latest?.title ?? 'Belum ada chapter',
    latestChapterSlug: latest?.slug,
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
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div>
          <img src={detail.cover} alt={detail.title} width={280} height={420} fetchPriority="high" decoding="async" className="reveal-soft aspect-[2/3] w-full rounded-2xl object-cover shadow-glow" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">{detail.type || 'Komik'} {detail.status ? `- ${detail.status}` : ''}</p>
          <h1 className="mt-2 break-words font-display text-4xl font-bold md:text-6xl">{detail.title}</h1>
          <div className="mt-5 flex flex-wrap gap-2">
            {detail.genres.map((genre) => (
              <Link key={genre} href={`/explore?genre=${encodeURIComponent(genre)}`} className="rounded-full border border-white/10 bg-surface-container-high px-3 py-1 text-sm text-on-surface-variant transition hover:border-primary/50 hover:text-primary">
                {genre}
              </Link>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              {latest ? (
                <Link href={`/baca/${latest.slug}`} className="interactive-lift inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-7 py-3 font-semibold text-on-primary shadow-glow transition hover:brightness-110 active:scale-95">
                  Baca {latest.number ? `Chapter ${latest.number}` : 'Chapter Terbaru'}
                </Link>
              ) : null}
              <BookmarkButton comic={bookmarkComic} variant="button" />
            </div>
            <div className="flex flex-wrap gap-3 md:pt-1">
              <LoveButton
                target={{
                  slug: detail.slug,
                  title: detail.title,
                  kind: 'comic',
                  coverUrl: detail.cover,
                  targetUrl: `/komik/${detail.slug}`,
                }}
                initialStatus={loveStatus}
              />
              <ShareButton title={detail.title} path={`/komik/${detail.slug}`} />
            </div>
          </div>
        </div>
      </div>

      <CollapsibleInfo rows={detail.info} title="Info Komik" />
      <CollapsibleSynopsis text={detail.description || 'Sinopsis belum tersedia untuk komik ini.'} />

      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div id="chapter-list" className="min-w-0">
          <ChapterList chapters={detail.chapters} />
        </div>
        <aside>
          <div className="rounded-[2rem] bg-surface-container-low/82 p-5 shadow-xl shadow-black/20">
            <CommentThread
              comicSlug={detail.slug}
              initialComments={comments.items}
              initialNextCursor={comments.nextCursor}
              initialHasMore={comments.hasMore}
              title="Komentar Komik"
              emptyText="Belum ada komentar untuk komik ini."
            />
          </div>
        </aside>
      </div>
    </section>
  );
}
