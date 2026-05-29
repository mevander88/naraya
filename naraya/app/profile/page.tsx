import { getLibrary, getMe } from '../data';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const isLoggedIn = Boolean(cookies().get('naraya_session')?.value);
  if (!isLoggedIn) {
    redirect('/login?next=/profile');
  }

  const [user, library] = await Promise.all([getMe(), getLibrary()]);
  const completed = library.filter((item) => item.status === 'completed').length;

  return (
    <section className="px-container-mobile pt-28 md:px-container-desktop">
      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="h-36 bg-[linear-gradient(120deg,#37333d,#a078ff,#ffb869)]" />
        <div className="-mt-12 px-6 pb-6">
          <img src={user.avatarUrl || '/logo.svg'} alt={user.displayName} width={96} height={96} loading="lazy" decoding="async" className="reveal-soft h-24 w-24 rounded-2xl border-4 border-background object-cover" />
          <h2 className="mt-4 font-display text-3xl font-bold">{user.displayName}</h2>
          <p className="mt-2 max-w-xl text-on-surface-variant">{user.bio}</p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[
              [String(library.length), 'Library'],
              [String(completed), 'Completed'],
              [user.role, 'Role'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl bg-surface-container-high p-4">
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="text-xs text-on-surface-variant">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
