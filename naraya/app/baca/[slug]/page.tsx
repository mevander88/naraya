import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getComicDetail, getComments, getReader, getSettings, titleFromSlug } from '../../data';
import type { Metadata } from 'next';
import { ReaderSurface } from '../reader-surface';
import { ReaderBack } from '../reader-back';
import { CommentThread } from '../../comment-thread';
import { AutoBookmarkVisit } from '../../internal-actions';
import { ShareButton } from '../../share-button';

type PageProps = {
  params: Promise<{ slug: string }>;
};

function progressFromNewestFirst(index: number, total: number) {
  if (index < 0 || total <= 0) return 0;
  return Math.max(1, Math.min(100, Math.round(((total - index) / total) * 100)));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const reader = await getReader(slug);
  const detail = reader?.comicSlug ? await getComicDetail(reader.comicSlug) : null;
  const title = reader?.title || titleFromSlug(slug);
  const description = `Baca ${title} di Naraya dengan reader gambar yang fokus dan nyaman.`;
  const image = detail?.cover || '/opengraph-image';
  return {
    title,
    description,
    alternates: { canonical: `/baca/${slug}` },
    openGraph: {
      title: `${title} | Naraya`,
      description,
      url: `/baca/${slug}`,
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
  const continuousChapters = chapterIndex >= 0 ? detail?.chapters.slice(0, chapterIndex + 1).reverse() : detail?.chapters;
  const progressPercent = progressFromNewestFirst(chapterIndex, detail?.chapters.length ?? 0);

  return (
    <section className="pb-20 pt-24">
      <ReaderBack href={comicSlug ? `/komik/${comicSlug}` : '/komik'} label={comicSlug ? 'Detail Komik' : 'Indeks'} />
      <div className="px-container-mobile md:px-container-desktop">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={comicSlug ? `/komik/${comicSlug}` : '/komik'} className="text-sm font-semibold text-primary hover:underline">
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
            latestChapterSlug: detail.chapters[0]?.slug,
            lastChapterSlug: reader.slug,
            lastChapterTitle: reader.title,
            status: progressPercent >= 100 ? 'completed' : 'reading',
            progressPercent,
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
          title="Komentar Chapter"
          emptyText="Belum ada komentar untuk chapter ini."
          variant="panel"
        />
      </div>
    </section>
  );
}
