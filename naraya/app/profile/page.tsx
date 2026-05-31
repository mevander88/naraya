import { getLibrary, getMe, getMyComments, getMyLoves, getProfileStats } from '../data';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Settings } from 'lucide-react';
import { AdminMark, isAdminRole } from '../admin-mark';
import { LogoutButton } from '../auth-client';
import { CommentHistorySection, LoveHistorySection } from './profile-history-sections';

export const metadata: Metadata = {
  title: 'Profil',
  description: 'Profil akun Naraya untuk melihat library, role, dan aktivitas baca.',
  alternates: { canonical: '/profile' },
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const isLoggedIn = Boolean(cookieStore.get('naraya_session')?.value);
  if (!isLoggedIn) {
    redirect('/login?next=/profile');
  }

  const [user, library, comments, loves, stats] = await Promise.all([getMe(), getLibrary(), getMyComments(), getMyLoves(), getProfileStats()]);
  if (!user) {
    redirect('/login?next=/profile');
  }
  const profileStats = stats ?? {
    libraryTotal: 0,
    completed: 0,
    commentTotal: 0,
    loveTotal: 0,
  };

  return (
    <section className="px-container-mobile pt-28 md:px-container-desktop">
      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="h-36 bg-[linear-gradient(120deg,#37333d,#a078ff,#ffb869)]" />
        <div className="-mt-12 px-6 pb-6">
          <img src={user.avatarUrl || '/logo.svg'} alt={user.displayName} width={96} height={96} loading="lazy" decoding="async" className="reveal-soft h-24 w-24 rounded-2xl border-4 border-background object-cover" />
          <div className="mt-4 flex min-w-0 max-w-full flex-wrap items-center gap-2">
            <h1 className="min-w-0 break-words font-display text-3xl font-bold">{user.displayName}</h1>
            {isAdminRole(user.role) ? (
              <AdminMark />
            ) : (
              <span className="max-w-full rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-primary [overflow-wrap:anywhere]">{user.role}</span>
            )}
          </div>
          <p className="mt-2 max-w-xl break-words text-on-surface-variant">{user.bio}</p>
          <div className="mt-4 flex flex-wrap gap-3 md:hidden">
            <Link href="/settings" className="inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/10 active:scale-95">
              <Settings size={17} />
              <span className="truncate">Settings</span>
            </Link>
            <LogoutButton className="inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-95" />
          </div>
          <div className="mt-6 grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 text-center">
            {[
              [String(profileStats.libraryTotal), 'Library'],
              [String(profileStats.completed), 'Completed'],
              [String(profileStats.commentTotal), 'Komentar'],
              [String(profileStats.loveTotal), 'Love'],
            ].map(([value, label]) => (
              <div key={label} className="min-w-0 rounded-xl bg-surface-container-high p-4">
                <p className="mx-auto flex w-fit max-w-full min-w-0 flex-col items-center gap-1 text-2xl font-bold text-primary">
                  <span className="max-w-full truncate">{value}</span>
                  <span className="h-px w-full rounded-full bg-primary/65 shadow-[0_0_14px_rgba(216,178,255,0.24)]" />
                </p>
                <p className="truncate text-xs text-on-surface-variant">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <LoveHistorySection loves={loves} total={profileStats.loveTotal} />
      <CommentHistorySection initialPage={comments} library={library} />
    </section>
  );
}
