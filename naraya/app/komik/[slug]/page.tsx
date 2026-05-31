import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookmarkButton, LoveButton } from '../../internal-actions';
import { getComicDetail, getComments, getFavoriteStatus, getLoveStatus, titleFromSlug } from '../../data';
import type { Metadata } from 'next';
import { ChapterList } from './chapter-list';
import { CollapsibleInfo, CollapsibleSynopsis } from '../../series/collapsible-detail';
import { CommentThread } from '../../comment-thread';
import { ShareButton } from '../../share-button';
import { JsonLd } from '../../../seo/json-ld';
import { buildBreadcrumbSchema } from '../../../seo/schema/breadcrumb';
import { buildComicSeriesSchema } from '../../../seo/schema/comic-series';
import { buildOpenGraphMetadata, buildTwitterMetadata, trimSocialDescription } from '../../../seo/social';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getComicDetail(slug);
  const title = detail?.title || titleFromSlug(slug);
  const description = detail?.description || `Baca komik ${title} bahasa Indonesia, komik online dengan genre, status, dan daftar chapter di Naraya.`;
  const socialTitle = `${title} | Naraya`;
  const socialDescription = trimSocialDescription(description);
  return {
    title,
    description: socialDescription,
    keywords: [title, `baca ${title}`, `baca komik ${title}`, `komik ${title} bahasa indonesia`, 'komik online', 'baca komik', 'baca komik bahasa indonesia', 'manga bahasa indonesia'],
    alternates: { canonical: `/komik/${slug}` },
    openGraph: buildOpenGraphMetadata({ title: socialTitle, description, path: `/komik/${slug}`, type: 'article', imageAlt: title }),
    twitter: buildTwitterMetadata({ title: socialTitle, description, path: `/komik/${slug}`, imageAlt: title }),
  };
}

export default async function ComicDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const detail = await getComicDetail(slug);
  if (!detail) notFound();

  const [comments, favoriteStatus, loveStatus] = await Promise.all([
    getComments({ comicSlug: detail.slug }),
    getFavoriteStatus(detail.slug),
    getLoveStatus(detail.slug),
  ]);
  const latest = detail.chapters[0];
  const bookmarkComic = {
    slug: detail.slug,
    title: detail.title,
    image: detail.cover,
    meta: [detail.type, detail.status].filter(Boolean).join(' - '),
    episode: latest?.title ?? 'Belum ada chapter',
    contentStatus: detail.status,
    latestChapterSlug: latest?.slug,
  };
  const description = detail.description || `Baca komik ${detail.title} bahasa Indonesia, komik online dengan genre, status, dan daftar chapter di Naraya.`;
  const comicSchema = buildComicSeriesSchema({
    slug: detail.slug,
    title: detail.title,
    description,
    image: detail.cover,
    genres: detail.genres,
    info: detail.info,
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Naraya', path: '/' },
    { name: 'Komik', path: '/indeks' },
    { name: detail.title, path: `/komik/${detail.slug}` },
  ]);

  return (
    <section className="px-container-mobile pb-20 pt-28 md:px-container-desktop">
      <JsonLd data={[comicSchema, breadcrumbSchema]} />
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
              <BookmarkButton comic={bookmarkComic} variant="button" initialStatus={favoriteStatus} />
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

      <div className="mt-12 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
        <div id="chapter-list" className="min-w-0">
          <ChapterList chapters={detail.chapters} />
        </div>
        <aside>
          <div className="rounded-[2rem] bg-surface-container-low/82 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_20px_54px_rgba(0,0,0,0.24)] sm:p-5">
            <CommentThread
              comicSlug={detail.slug}
              initialComments={comments.items}
              initialNextCursor={comments.nextCursor}
              initialHasMore={comments.hasMore}
              initialTotal={comments.total}
              title="Komentar Komik"
              emptyText="Belum ada komentar untuk komik ini."
            />
          </div>
        </aside>
      </div>
    </section>
  );
}
