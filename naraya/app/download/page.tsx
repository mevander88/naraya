import type { Metadata } from 'next';
import { BookOpen, Download, MessageCircle, RefreshCw, Smartphone } from 'lucide-react';
import { stat } from 'node:fs/promises';

export const metadata: Metadata = {
  title: 'Install Naraya Android Beta',
  description: 'Download aplikasi Android Beta Naraya untuk baca komik, nonton anime, komentar, love, favorite, dan update langsung dari aplikasi.',
  alternates: { canonical: '/download' },
  robots: { index: true, follow: true },
};

export const dynamic = 'force-dynamic';

const APK_PATH = process.env.NARAYA_ANDROID_APK_PATH || '/var/www/naraya/naraya-android/app/build/outputs/apk/web/debug/app-web-debug.apk';
const ANDROID_VERSION_CODE = process.env.NARAYA_ANDROID_VERSION_CODE || '38';
const ANDROID_VERSION_NAME = process.env.NARAYA_ANDROID_VERSION_NAME || '1.0.37-beta';

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function DownloadPage() {
  const apkInfo = await stat(/* turbopackIgnore: true */ APK_PATH).catch(() => null);
  const available = Boolean(apkInfo?.isFile());
  const highlights = [
    {
      icon: RefreshCw,
      title: 'Update langsung dari aplikasi',
      body: 'Naraya akan memberi tahu saat versi baru tersedia.',
    },
    {
      icon: BookOpen,
      title: 'Baca dan nonton native',
      body: 'Reader komik, video player, rak, love, dan komentar berjalan di aplikasi Android.',
    },
    {
      icon: MessageCircle,
      title: 'Akun tetap tersinkron',
      body: 'Riwayat baca, tontonan, komentar, favorite, dan love mengikuti akun Naraya.',
    },
  ];

  return (
    <section className="relative isolate min-h-[calc(100dvh-8rem)] overflow-hidden px-container-mobile pb-24 pt-28 md:px-container-desktop md:pb-20 md:pt-32">
      <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/4 top-1/2 h-40 w-40 rounded-full bg-tertiary/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)] lg:items-start">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface-container-high/78 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            <Smartphone size={15} />
            Naraya Android Beta
          </p>
          <h1 className="mt-6 max-w-3xl break-words font-display text-4xl font-bold leading-tight text-on-background md:text-6xl">
            Install aplikasi Naraya Beta
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant md:text-lg">
            APK Naraya native Android masih tahap beta dan bisa diunduh tanpa login. Login hanya dibutuhkan untuk sinkron rak, komentar, love, dan favorite.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {available ? (
              <a
                href={`/download/android?v=${ANDROID_VERSION_CODE}`}
                className="interactive-lift inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-on-primary shadow-glow transition hover:brightness-110 active:scale-95"
              >
                <Download size={18} />
                Download APK
              </a>
            ) : (
              <div className="inline-flex min-h-12 items-center rounded-xl bg-tertiary/10 px-5 py-3 text-sm font-semibold text-tertiary ring-1 ring-tertiary/25">
                APK belum tersedia
              </div>
            )}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ['File', available ? formatBytes(apkInfo?.size ?? 0) : 'Belum ada'],
              ['Akses', 'Publik'],
              ['Versi', ANDROID_VERSION_NAME],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-2xl bg-surface-container-low/82 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_16px_40px_rgba(0,0,0,0.18)]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{label}</p>
                <p className="mt-2 truncate font-display text-xl font-semibold text-on-surface">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,rgba(28,25,36,0.88),rgba(13,12,18,0.96))] p-5 shadow-2xl shadow-black/28 ring-1 ring-white/8 md:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/12 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <img src="/logo.svg" alt="Naraya" width="64" height="64" className="h-16 w-16 shrink-0 rounded-2xl bg-background/42 p-2" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Naraya Native Beta</p>
              <p className="mt-1 truncate font-display text-2xl font-semibold text-on-surface">Versi {ANDROID_VERSION_NAME}</p>
            </div>
          </div>

          <div className="relative mt-6 grid gap-3">
            {highlights.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex min-w-0 items-start gap-3 rounded-2xl bg-background/34 px-4 py-3 text-on-surface-variant shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                  <Icon size={18} />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-on-surface">{title}</p>
                  <p className="mt-1 text-sm leading-6">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
