import Link from 'next/link';
import { BookOpen, Compass, Home, Search } from 'lucide-react';

const quickLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/indeks', label: 'Indeks', icon: BookOpen },
  { href: '/explore', label: 'Explore', icon: Compass },
];

export default function NotFound() {
  return (
    <section className="relative isolate min-h-[calc(100dvh-8rem)] overflow-hidden px-container-mobile pb-24 pt-28 md:px-container-desktop md:pb-20 md:pt-32">
      <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/4 top-1/2 h-40 w-40 rounded-full bg-tertiary/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.75fr)] lg:items-center">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface-container-high/78 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            <Search size={15} />
            404
          </p>
          <h1 className="mt-6 max-w-3xl break-words font-display text-4xl font-bold leading-tight text-on-background md:text-6xl">
            Halaman tidak ditemukan
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant md:text-lg">
            Link yang kamu buka mungkin sudah berubah, belum tersedia, atau tidak ada di katalog Naraya.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/explore" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary shadow-glow transition hover:brightness-110 active:scale-95">
              <Search size={18} />
              Cari judul
            </Link>
            <Link href="/indeks" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-surface-container-high px-5 py-3 font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/10 active:scale-95">
              <BookOpen size={18} />
              Buka indeks
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,rgba(28,25,36,0.88),rgba(13,12,18,0.96))] p-5 shadow-2xl shadow-black/28 ring-1 ring-white/8 md:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/12 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <img src="/logo.svg" alt="Naraya" width="64" height="64" className="h-16 w-16 shrink-0 rounded-2xl bg-background/42 p-2" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Naraya</p>
              <p className="mt-1 truncate font-display text-2xl font-semibold text-on-surface">Arahkan ulang</p>
            </div>
          </div>

          <div className="relative mt-6 grid gap-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="group flex min-w-0 items-center gap-3 rounded-2xl bg-background/34 px-4 py-3 text-on-surface-variant shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] transition hover:bg-primary/12 hover:text-primary">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary transition group-hover:bg-primary/18">
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 truncate font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
