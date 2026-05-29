import { Bell } from 'lucide-react';
import Link from 'next/link';
import { getLatestComics } from '../data';

export default async function NotificationsPage() {
  const updates = await getLatestComics();

  return (
    <section className="px-container-mobile pt-28 md:px-container-desktop">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Alerts</p>
      <h2 className="mt-2 font-display text-4xl font-bold">Notifikasi</h2>
      <p className="mt-3 max-w-2xl text-on-surface-variant">Pantau chapter, episode, dan pembaruan favoritmu di Naraya.</p>
      <div className="mt-8 grid gap-3">
        {updates.slice(0, 12).map((comic) => (
          <Link key={comic.slug} href={comic.latestChapterSlug ? `/baca/${comic.latestChapterSlug}` : `/komik/${comic.slug}`} className="glass-panel flex items-center gap-4 rounded-2xl p-4 transition hover:border-primary/40">
            <div className="rounded-xl bg-primary/15 p-3 text-primary">
              <Bell size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{comic.title}</h3>
              <p className="text-sm text-on-surface-variant">{comic.episode}</p>
            </div>
          </Link>
        ))}
        {!updates.length ? <div className="glass-panel rounded-2xl p-6 text-on-surface-variant">Belum ada update.</div> : null}
      </div>
    </section>
  );
}
