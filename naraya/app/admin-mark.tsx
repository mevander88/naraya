import { BadgeCheck } from 'lucide-react';

export function isAdminRole(role?: string) {
  return role?.toLowerCase() === 'admin';
}

export function AdminMark() {
  return (
    <details className="group relative inline-flex shrink-0">
      <summary
        aria-label="Informasi admin"
        className="inline-flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-full text-sky-300 outline-none transition hover:bg-sky-400/10 focus-visible:ring-2 focus-visible:ring-sky-300/60 [&::-webkit-details-marker]:hidden"
      >
        <BadgeCheck size={18} strokeWidth={2.4} />
      </summary>
      <div className="absolute right-0 top-9 z-30 w-[min(14rem,calc(100vw-2rem))] rounded-xl border border-sky-300/25 bg-surface-container-high p-3 text-xs leading-5 text-on-surface shadow-xl shadow-black/25 sm:left-1/2 sm:right-auto sm:w-56 sm:-translate-x-1/2">
        <p className="font-bold text-sky-200">Admin Naraya</p>
        <p className="mt-1 text-on-surface-variant">Akun resmi pengelola Naraya.</p>
      </div>
    </details>
  );
}
