'use client';

import { ArrowLeft, Bell, BookOpen, Compass, Download, Home, Library, Maximize2, Minimize2, Search, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { AuthMenu } from './auth-client';
import { apiOrigin, apiURL } from './lib/client-api';

type SearchResult = {
  slug: string;
  title?: string;
  cover?: string;
  type?: string;
  status?: string;
  genres?: string[];
  kind?: string;
};

const mobileItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/indeks', icon: BookOpen, label: 'Indeks' },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: '/library', icon: Library, label: 'Rak' },
];

const desktopItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/indeks', icon: BookOpen, label: 'Indeks' },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: '/library', icon: Library, label: 'Rak' },
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/download', icon: Download, label: 'Install' },
  { href: '/notifications', icon: Bell, label: 'Alerts' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

function readCookie(name: string) {
  if (typeof document === 'undefined') return '';
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1] ?? '';
}

export function NavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authName, setAuthName] = useState('');
  const [showTopbar, setShowTopbar] = useState(false);
  const [readerChromeVisible, setReaderChromeVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchState, setSearchState] = useState<'idle' | 'waiting' | 'loading' | 'done' | 'error'>('idle');
  const [readerBack, setReaderBack] = useState<{ href: string; label: string } | null>(null);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const topbarRef = useRef(false);
  const scrollFrameRef = useRef<number | null>(null);
  const isReaderRoute = pathname.startsWith('/baca/') || pathname.startsWith('/nonton/');

  useEffect(() => {
    function syncAuth() {
      setAuthName(decodeURIComponent(readCookie('naraya_user')));
    }

    syncAuth();
    window.addEventListener('focus', syncAuth);
    window.addEventListener('naraya-auth-changed', syncAuth);
    return () => {
      window.removeEventListener('focus', syncAuth);
      window.removeEventListener('naraya-auth-changed', syncAuth);
    };
  }, [pathname]);

  useEffect(() => {
    setReaderChromeVisible(true);
    setReaderBack(null);
  }, [pathname]);

  useEffect(() => {
    function handleReaderChrome(event: Event) {
      const customEvent = event as CustomEvent<{ visible?: boolean }>;
      setReaderChromeVisible(customEvent.detail?.visible !== false);
    }

    window.addEventListener('naraya-reader-chrome', handleReaderChrome);
    return () => window.removeEventListener('naraya-reader-chrome', handleReaderChrome);
  }, []);

  useEffect(() => {
    function handleReaderBack(event: Event) {
      const customEvent = event as CustomEvent<{ href?: string; label?: string }>;
      const href = customEvent.detail?.href;
      if (!href) return;
      setReaderBack({ href, label: customEvent.detail?.label || 'Kembali' });
    }

    window.addEventListener('naraya-reader-back', handleReaderBack);
    return () => window.removeEventListener('naraya-reader-back', handleReaderBack);
  }, []);

  useEffect(() => {
    const supported = Boolean(document.documentElement.requestFullscreen) && Boolean(document.exitFullscreen);
    setFullscreenSupported(supported);

    function syncFullscreen() {
      setFullscreenActive(Boolean(document.fullscreenElement));
    }

    syncFullscreen();
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  useEffect(() => {
    function handleScroll() {
      if (scrollFrameRef.current !== null) return;
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        const next = window.scrollY > 28;
        if (topbarRef.current === next) return;
        topbarRef.current = next;
        setShowTopbar(next);
      });
    }

    const initial = window.scrollY > 28;
    topbarRef.current = initial;
    setShowTopbar(initial);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearchState('idle');
      return;
    }

    setSearchState('waiting');
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchState('loading');
      try {
        const response = await fetch(apiURL(`/search?q=${encodeURIComponent(query)}`), {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('search failed');
        const payload = (await response.json()) as { items?: SearchResult[] };
        setSearchResults(payload.items ?? []);
        setSearchState('done');
      } catch {
        if (!controller.signal.aborted) {
          setSearchResults([]);
          setSearchState('error');
        }
      }
    }, 2000);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  async function toggleFullscreen() {
    if (!fullscreenSupported) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      setFullscreenActive(Boolean(document.fullscreenElement));
    }
  }

  const activeTitle = desktopItems.find((item) => (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)))?.label ?? 'Home';
  const chromeHidden = isReaderRoute && !readerChromeVisible;
  const isHomeRoute = pathname === '/';
  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const showFooter = !pathname.startsWith('/nonton/');
  const topbarVisible = isReaderRoute ? readerChromeVisible : isHomeRoute ? showTopbar : true;
  const mobileAuthItem = authName ? { href: '/profile', icon: User, label: 'Profile' } : { href: '/login', icon: User, label: 'Login' };
  const bottomItems = [...mobileItems, mobileAuthItem];

  if (isAuthRoute) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
      <main className={`flex min-h-screen flex-col ${chromeHidden ? 'pb-0 md:pl-0' : 'pb-24 md:pb-0 md:pl-20'}`}>
      <header
        className={`fixed left-0 top-0 z-50 flex w-full items-center justify-between border-b px-container-mobile py-4 transition duration-300 md:left-20 md:w-[calc(100%-5rem)] md:px-container-desktop ${
          topbarVisible && !chromeHidden
            ? 'translate-y-0 border-transparent bg-[#121019]/95 opacity-100 shadow-2xl shadow-black/35 backdrop-blur-2xl'
            : 'pointer-events-none -translate-y-5 border-transparent bg-transparent opacity-0'
        }`}
      >
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3 font-display text-3xl font-bold text-primary">
            <img src="/logo.svg" alt="" width={36} height={36} className="h-9 w-9" />
            <span className="truncate">Naraya</span>
          </Link>
          <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-on-surface-variant md:inline-flex">
            {activeTitle}
          </span>
        </div>
        <form onSubmit={submitSearch} className="relative hidden w-full max-w-sm items-center gap-2 rounded-xl border border-white/10 bg-surface-container/70 px-4 py-2 text-on-surface-variant md:flex">
          <Search size={18} />
          <input
            name="q"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60"
            placeholder="Cari komik atau anime..."
            autoComplete="off"
          />
          {searchQuery.trim().length >= 2 ? (
            <div className="absolute left-0 top-[calc(100%+0.75rem)] w-full overflow-hidden rounded-2xl border border-white/10 bg-surface-container-high shadow-2xl">
              <div className="border-b border-white/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Hasil Pencarian</p>
              </div>
              {searchState === 'waiting' || searchState === 'loading' ? (
                <div className="grid gap-3 p-4">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="flex gap-3">
                      <div className="skeleton h-14 w-10 rounded-lg" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="skeleton h-3 w-4/5" />
                        <div className="skeleton h-3 w-2/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              {searchState === 'done' && searchResults.length ? (
                <div className="max-h-[420px] overflow-y-auto p-2">
                  {searchResults.map((item) => {
                    const cover = item.cover?.startsWith('/api/') ? `${apiOrigin()}${item.cover}` : item.cover;
                    return (
                      <Link key={`${item.kind || 'comic'}-${item.slug}`} href={item.kind === 'series' ? `/series/${item.slug}` : `/komik/${item.slug}`} onClick={() => setSearchQuery('')} className="flex gap-3 rounded-xl p-2 transition hover:bg-white/5">
                        {cover ? <img src={cover} alt={item.title || item.slug} width={44} height={62} loading="lazy" decoding="async" className="image-render-safe h-16 w-11 rounded-lg object-cover" /> : <div className="h-16 w-11 rounded-lg bg-primary/15" />}
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold text-on-surface">{item.title || item.slug.replaceAll('-', ' ')}</h3>
                          <p className="mt-1 truncate text-xs text-on-surface-variant">{[item.kind === 'series' ? 'Anime' : item.type, item.status, ...(item.genres ?? []).slice(0, 2)].filter(Boolean).join(' - ') || 'Naraya'}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
              {searchState === 'done' && !searchResults.length ? (
                <div className="p-4 text-sm text-on-surface-variant">Tidak ada hasil yang cocok.</div>
              ) : null}
              {searchState === 'error' ? (
                <div className="p-4 text-sm text-tertiary">Search belum tersedia. Coba ulang sebentar lagi.</div>
              ) : null}
            </div>
          ) : null}
        </form>
        <div className="flex shrink-0 items-center gap-3">
          <AuthMenu />
          <Link href="/explore" className="rounded-lg p-2 text-on-surface-variant transition hover:bg-white/5 hover:text-primary md:hidden" aria-label="Search">
            <Search size={22} />
          </Link>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            disabled={!fullscreenSupported}
            className="grid h-9 w-9 place-items-center rounded-full border border-primary/25 bg-surface-container-high text-primary transition hover:border-primary/50 hover:bg-primary/12 disabled:cursor-not-allowed disabled:opacity-45"
            aria-label={fullscreenActive ? 'Keluar fullscreen' : 'Masuk fullscreen'}
            title={fullscreenActive ? 'Keluar fullscreen' : 'Masuk fullscreen'}
          >
            {fullscreenActive ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </header>

      <aside className={`fixed left-0 top-0 z-50 hidden h-full w-20 flex-col items-center border-r border-transparent bg-surface-container-low py-8 transition duration-300 md:flex ${chromeHidden ? 'pointer-events-none -translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}>
        <Link href="/" className="mb-12 rounded-xl p-2 transition hover:bg-white/5" aria-label="Open home">
          <img src="/logo.svg" alt="Naraya" width={40} height={40} decoding="async" className="h-10 w-10" />
        </Link>
        {readerBack ? (
          <Link href={readerBack.href} className="mb-5 rounded-xl bg-primary p-3 text-on-primary shadow-glow transition hover:brightness-110" aria-label={readerBack.label} title={readerBack.label}>
            <ArrowLeft size={24} />
          </Link>
        ) : null}
        <div className="flex flex-col gap-5">
          {desktopItems.map(({ href, icon: Icon, label }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-xl p-3 transition ${active ? 'bg-primary text-on-primary shadow-glow' : 'text-on-surface-variant hover:bg-white/5 hover:text-primary'}`}
                aria-label={label}
                title={label}
              >
                <Icon size={25} />
              </Link>
            );
          })}
        </div>
      </aside>

      <div className="flex-1">
        {children}
      </div>

      {showFooter ? (
        <footer className="relative mt-12 overflow-hidden px-container-mobile pb-28 pt-14 md:px-container-desktop md:pb-12">
          <div className="pointer-events-none absolute inset-x-container-mobile top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent md:inset-x-container-desktop" />
          <div className="pointer-events-none absolute -right-24 top-8 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative rounded-[2rem] bg-surface-container-low/42 p-5 md:p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <Link href="/" className="inline-flex min-w-0 items-center gap-3">
                <img src="/logo.svg" alt="" width={40} height={40} decoding="async" className="h-10 w-10" />
                <span className="min-w-0">
                  <span className="block font-display text-2xl font-bold text-on-background">Naraya</span>
                  <span className="block text-sm font-medium text-on-surface-variant">Baca komik dan nonton anime tanpa distraksi.</span>
                </span>
              </Link>

              <div className="flex flex-col gap-4 md:items-end">
                <div className="flex flex-wrap gap-3">
                  <Link href="/anime-indo" className="text-sm font-semibold text-on-surface-variant transition hover:text-primary">Anime Indo</Link>
                  <Link href="/indeks" className="text-sm font-semibold text-on-surface-variant transition hover:text-primary">Indeks</Link>
                  <Link href="/explore" className="text-sm font-semibold text-on-surface-variant transition hover:text-primary">Explore</Link>
                  <Link href="/library" className="text-sm font-semibold text-on-surface-variant transition hover:text-primary">Rak</Link>
                  <Link href="/download" className="text-sm font-semibold text-on-surface-variant transition hover:text-primary">Download</Link>
                  <Link href="/login" className="text-sm font-semibold text-on-surface-variant transition hover:text-primary">Login</Link>
                </div>
                <div className="flex flex-wrap gap-3">
                <Link href="/explore" className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-glow transition hover:brightness-110 active:scale-95">
                  Mulai jelajah
                </Link>
                <Link href="/indeks" className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-surface-container-high px-5 py-3 text-sm font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/10 active:scale-95">
                  Indeks
                </Link>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2 border-t border-white/8 pt-4 text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
              <span>© {new Date().getFullYear()} Naraya</span>
              <span>Ruang baca dan nonton yang fokus.</span>
            </div>
          </div>
        </footer>
      ) : null}

      <nav className={`fixed bottom-0 left-0 z-50 flex h-16 w-full items-stretch justify-around border-t border-transparent bg-[#121019]/95 shadow-[0_-18px_45px_rgba(0,0,0,0.42)] backdrop-blur-2xl transition duration-300 md:hidden ${chromeHidden ? 'pointer-events-none translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        {readerBack ? (
          <Link href={readerBack.href} className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs font-semibold text-primary">
            <ArrowLeft size={22} />
            <span className="max-w-full truncate">Kembali</span>
          </Link>
        ) : null}
        {bottomItems.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link key={href} href={href} prefetch={false} className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs font-semibold transition ${active ? 'text-primary' : 'text-on-surface-variant'}`}>
              <Icon size={22} />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
