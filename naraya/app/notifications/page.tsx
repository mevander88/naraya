import { Bell } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getLatestComics } from '../data';

export const metadata: Metadata = {
  title: 'Notifikasi',
  description: 'Notifikasi personal Naraya untuk update chapter, episode, dan aktivitas favorit.',
  alternates: { canonical: '/notifications' },
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  const updates = await getLatestComics();

  return (
    <section className="px-container-mobile pt-28 md:px-container-desktop">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Alerts</p>
      <h1 className="mt-2 break-words font-display text-4xl font-bold">Notifikasi</h1>
      <p className="mt-3 max-w-2xl text-on-surface-variant">Pantau chapter, episode, dan pembaruan favoritmu di Naraya.</p>
      <div className="mt-8 grid gap-3">
        {updates.slice(0, 12).map((comic) => (
          <Link key={comic.slug} href={comic.latestChapterSlug ? `/baca/${comic.latestChapterSlug}` : `/komik/${comic.slug}`} className="glass-panel flex min-w-0 items-center gap-4 rounded-2xl p-4 transition hover:border-primary/40">
            <div className="shrink-0 rounded-xl bg-primary/15 p-3 text-primary">
              <Bell size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold">{comic.title}</h3>
              <p className="truncate text-sm text-on-surface-variant">{comic.episode}</p>
            </div>
          </Link>
        ))}
        {!updates.length ? <div className="glass-panel rounded-2xl p-6 text-on-surface-variant">Belum ada update.</div> : null}
      </div>
    </section>
  );
}
