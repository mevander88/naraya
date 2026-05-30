import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSettings } from '../data';
import { SettingsClient } from './settings-client';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Pengaturan pengalaman baca dan nonton akun Naraya.',
  alternates: { canonical: '/settings' },
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const isLoggedIn = Boolean(cookieStore.get('naraya_session')?.value);
  if (!isLoggedIn) {
    redirect('/login?next=/settings');
  }

  const settings = await getSettings();
  if (!settings) {
    redirect('/login?next=/settings');
  }

  return (
    <section className="px-container-mobile pt-28 md:px-container-desktop">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Settings</p>
      <h1 className="mt-2 break-words font-display text-4xl font-bold">Preferensi baca</h1>
      <p className="mt-3 max-w-2xl text-on-surface-variant">Atur pengalaman baca Naraya agar sesuai dengan kebiasaanmu.</p>
      <SettingsClient initialSettings={settings} />
    </section>
  );
}
