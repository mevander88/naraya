import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { CommentComposer } from '../../internal-actions';
import { getComicDetail, getComments, getReader } from '../../data';
import type { Metadata } from 'next';
import { ReaderSurface } from '../reader-surface';
import { ReaderBack } from '../reader-back';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const reader = await getReader(params.slug);
  if (!reader) {
    return { title: 'Chapter tidak ditemukan' };
  }
  return {
    title: reader.title,
    description: `Baca ${reader.title} di Naraya dengan reader gambar yang fokus dan nyaman.`,
    alternates: { canonical: `/baca/${params.slug}` },
    openGraph: {
      title: `${reader.title} | Naraya`,
      description: `Baca ${reader.title} di Naraya.`,
      url: `/baca/${params.slug}`,
    },
  };
}

export default async function ReaderPage({ params }: { params: { slug: string } }) {
  const reader = await getReader(params.slug);
  if (!reader) notFound();

  const comicSlug = reader.comicSlug ?? '';
  const [comments, detail] = await Promise.all([
    getComments({ chapterSlug: reader.slug }),
    comicSlug ? getComicDetail(comicSlug) : Promise.resolve(null),
  ]);
  const chapterIndex = detail?.chapters.findIndex((chapter) => chapter.slug === reader.slug) ?? -1;
  const continuousChapters = chapterIndex >= 0 ? detail?.chapters.slice(0, chapterIndex + 1).reverse() : detail?.chapters;

  return (
    <section className="pb-20 pt-24">
      <ReaderBack href={comicSlug ? `/komik/${comicSlug}` : '/komik'} label={comicSlug ? 'Detail Komik' : 'Indeks'} />
      <div className="px-container-mobile md:px-container-desktop">
        <Link href={comicSlug ? `/komik/${comicSlug}` : '/komik'} className="text-sm font-semibold text-primary hover:underline">
          {comicSlug ? 'Kembali ke Detail Komik' : 'Kembali ke Indeks Komik'}
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold md:text-5xl">{reader.title}</h1>
        <p className="mt-2 text-on-surface-variant">{reader.images.length} halaman tersedia.</p>
      </div>
      <ReaderSurface title={reader.title} slug={reader.slug} images={reader.images} chapters={continuousChapters} />
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-0">
        {!reader.images.length ? (
          <div className="glass-panel mx-container-mobile rounded-2xl p-6 text-center">
            <h2 className="text-xl font-semibold">Gambar reader belum ditemukan</h2>
            <p className="mt-2 text-on-surface-variant">Chapter ini belum memiliki halaman gambar yang dapat ditampilkan.</p>
          </div>
        ) : null}
      </div>
      <div className="mx-auto mt-10 max-w-4xl px-container-mobile md:px-0">
        <CommentComposer comicSlug="" chapterSlug={reader.slug} />
        <div className="mt-8 flex items-center gap-3">
          <MessageCircle size={20} className="text-primary" />
          <h2 className="font-display text-2xl font-semibold">Komentar Chapter</h2>
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">{comments.length}</span>
        </div>
        <div className="mt-5 grid gap-3">
          {comments.map((comment) => (
            <article key={comment.id} className="glass-panel rounded-2xl p-4">
              <h3 className="font-semibold">{comment.displayName}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">{comment.body}</p>
            </article>
          ))}
          {!comments.length ? (
            <div className="glass-panel rounded-2xl p-5 text-sm text-on-surface-variant">
              Belum ada komentar untuk chapter ini.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
