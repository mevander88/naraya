import { getLatestComics, getLibrary } from '../data';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LibraryClient } from './library-client';

export const metadata: Metadata = {
  title: 'Rak Bacaan',
  description: 'Rak bacaan personal Naraya untuk menyimpan komik dan anime favorit.',
  alternates: { canonical: '/library' },
  robots: { index: false, follow: false },
};

export default async function LibraryPage() {
  const isLoggedIn = Boolean(cookies().get('naraya_session')?.value);
  if (!isLoggedIn) {
    redirect('/login?next=/library');
  }

  const [library, suggestions] = await Promise.all([getLibrary(), getLatestComics()]);

  return <LibraryClient library={library} suggestions={suggestions} />;
}
