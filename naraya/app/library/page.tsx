import { getLatestComics, getLibrary } from '../data';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LibraryClient } from './library-client';

export default async function LibraryPage() {
  const isLoggedIn = Boolean(cookies().get('naraya_session')?.value);
  if (!isLoggedIn) {
    redirect('/login?next=/library');
  }

  const [library, suggestions] = await Promise.all([getLibrary(), getLatestComics()]);

  return <LibraryClient library={library} suggestions={suggestions} />;
}
