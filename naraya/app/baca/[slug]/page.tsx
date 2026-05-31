import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getComicDetail, getComments, getReader, getSettings, titleFromSlug } from '../../data';
import type { Metadata } from 'next';
import { ReaderSurface } from '../reader-surface';
import { ReaderBack } from '../reader-back';
import { CommentThread } from '../../comment-thread';
import { AutoBookmarkVisit } from '../../internal-actions';
import { ShareButton } from '../../share-button';
import { JsonLd } from '../../../seo/json-ld';
import { buildBreadcrumbSchema } from '../../../seo/schema/breadcrumb';
import { buildChapterSchema } from '../../../seo/schema/chapter';
import { buildOpenGraphMetadata, buildTwitterMetadata } from '../../../seo/social';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const reader = await getReader(slug);
  const detail = reader?.comicSlug ? await getComicDetail(reader.comicSlug) : null;
  const title = reader?.title || titleFromSlug(slug);
  const description = `Baca komik ${title} bahasa Indonesia di Naraya, komik online dengan reader gambar yang fokus dan nyaman.`;
  const socialTitle = `${title} | Naraya`;
  return {
    title,
    description,
    keywords: [title, `baca ${title}`, `baca komik ${title}`, `komik ${title} bahasa indonesia`, 'komik online', 'baca komik', 'baca komik bahasa indonesia', 'manga bahasa indonesia'],
    alternates: { canonical: `/baca/${slug}` },
    openGraph: buildOpenGraphMetadata({ title: socialTitle, description, path: `/baca/${slug}`, type: 'article', imageAlt: title }),
    twitter: buildTwitterMetadata({ title: socialTitle, description, path: `/baca/${slug}`, imageAlt: title }),
  };
}

export default async function ReaderPage({ params }: PageProps) {
  const { slug } = await params;
  const reader = await getReader(slug);
  if (!reader) notFound();

  const comicSlug = reader.comicSlug ?? '';
  const [comments, detail, settings] = await Promise.all([
    getComments({ chapterSlug: reader.slug }),
    comicSlug ? getComicDetail(comicSlug) : Promise.resolve(null),
    getSettings(),
  ]);
  const chapterIndex = detail?.chapters.findIndex((chapter) => chapter.slug === reader.slug) ?? -1;
  const currentChapter = detail && chapterIndex >= 0 ? detail.chapters[chapterIndex] : null;
  const continuousChapters = chapterIndex >= 0 ? detail?.chapters.slice(0, chapterIndex + 1).reverse() : detail?.chapters;
  const description = `Baca komik ${reader.title} bahasa Indonesia di Naraya, komik online dengan reader gambar yang fokus dan nyaman.`;
  const chapterSchema = buildChapterSchema({
    slug: reader.slug,
    title: reader.title,
    description,
    image: detail?.cover || reader.images[0],
    chapterNumber: currentChapter?.number,
    publishedDate: currentChapter?.date,
    comic: detail ? { slug: detail.slug, title: detail.title } : null,
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Naraya', path: '/' },
    { name: 'Komik', path: '/indeks' },
    ...(detail ? [{ name: detail.title, path: `/komik/${detail.slug}` }] : []),
    { name: reader.title, path: `/baca/${reader.slug}` },
  ]);

  return (
    <section className="pb-20 pt-24">
      <JsonLd data={[chapterSchema, breadcrumbSchema]} />
      <ReaderBack href={comicSlug ? `/komik/${comicSlug}` : '/indeks'} label={comicSlug ? 'Detail Komik' : 'Indeks'} />
      <div className="px-container-mobile md:px-container-desktop">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={comicSlug ? `/komik/${comicSlug}` : '/indeks'} className="text-sm font-semibold text-primary hover:underline">
            {comicSlug ? 'Kembali ke Detail Komik' : 'Kembali ke Indeks Komik'}
          </Link>
          <ShareButton title={reader.title} path={`/baca/${reader.slug}`} variant="icon" />
        </div>
        <h1 className="mt-3 break-words font-display text-3xl font-bold md:text-5xl">{reader.title}</h1>
        <p className="mt-2 text-on-surface-variant">{reader.images.length} halaman tersedia.</p>
      </div>
      {detail ? (
        <AutoBookmarkVisit
          target={{
            enabled: Boolean(settings?.autoBookmark),
            slug: detail.slug,
            title: detail.title,
            kind: 'comic',
            coverUrl: detail.cover,
            contentStatus: detail.status,
            latestChapterSlug: detail.chapters[0]?.slug,
            lastChapterSlug: reader.slug,
            lastChapterTitle: reader.title,
            status: 'reading',
            progressPercent: 0,
            progressTotal: detail.chapters.length,
          }}
        />
      ) : null}
      <ReaderSurface title={reader.title} slug={reader.slug} comicSlug={comicSlug} images={reader.images} chapters={continuousChapters} highQualityImages={settings?.highQualityImages ?? true} />
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-0">
        {!reader.images.length ? (
          <div className="glass-panel mx-container-mobile max-w-full rounded-2xl p-6 text-center">
            <h2 className="text-xl font-semibold">Gambar reader belum ditemukan</h2>
            <p className="mt-2 text-on-surface-variant">Chapter ini belum memiliki halaman gambar yang dapat ditampilkan.</p>
          </div>
        ) : null}
      </div>
      <div className="mx-auto mt-10 max-w-4xl px-container-mobile md:px-0">
        <CommentThread
          comicSlug={comicSlug}
          chapterSlug={reader.slug}
          initialComments={comments.items}
          initialNextCursor={comments.nextCursor}
          initialHasMore={comments.hasMore}
          initialTotal={comments.total}
          title="Komentar Chapter"
          emptyText="Belum ada komentar untuk chapter ini."
          variant="panel"
        />
      </div>
    </section>
  );
}
