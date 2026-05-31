'use client';

import { ArrowRight, LogIn, LogOut, Sparkles, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { apiCredentials, apiURL } from './lib/client-api';

type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
};

function readCookie(name: string) {
  if (typeof document === 'undefined') return '';
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1] ?? '';
}

function writeSession(user: AuthUser) {
  const maxAge = 60 * 60 * 24 * 30;
  document.cookie = `naraya_user=${encodeURIComponent(user.displayName || user.username)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  window.dispatchEvent(new Event('naraya-auth-changed'));
}

function clearSession() {
  document.cookie = 'naraya_user=; path=/; max-age=0; SameSite=Lax';
  window.dispatchEvent(new Event('naraya-auth-changed'));
}

export function AuthMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState('');

  useEffect(() => {
    setName(decodeURIComponent(readCookie('naraya_user')));
  }, [pathname]);

  async function logout() {
    await fetch(apiURL('/auth/logout'), {
      method: 'POST',
      credentials: apiCredentials(),
    }).catch(() => undefined);
    clearSession();
    setName('');
    router.push('/login');
    router.refresh();
  }

  if (name) {
    return (
      <div className="hidden items-center gap-2 md:flex">
        <Link href="/profile" className="rounded-2xl border border-white/10 bg-surface-container/78 px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:border-primary/40 hover:text-primary">
          {name}
        </Link>
        <button onClick={logout} className="rounded-2xl p-2 text-on-surface-variant transition hover:bg-white/5 hover:text-primary" aria-label="Logout">
          <LogOut size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-2 md:flex">
      <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-surface-container/78 px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:border-primary/40 hover:text-primary">
        <LogIn size={17} />
        Login
      </Link>
      <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-glow transition hover:brightness-110">
        <UserPlus size={17} />
        Daftar
      </Link>
    </div>
  );
}

export function LogoutButton({ className = '', label = 'Logout' }: { className?: string; label?: string }) {
  const router = useRouter();

  async function logout() {
    await fetch(apiURL('/auth/logout'), {
      method: 'POST',
      credentials: apiCredentials(),
    }).catch(() => undefined);
    clearSession();
    router.push('/login');
    router.refresh();
  }

  return (
    <button type="button" onClick={logout} className={className || 'inline-flex items-center gap-2 rounded-xl border border-white/10 bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-95'}>
      <LogOut size={17} />
      <span className="truncate">{label}</span>
    </button>
  );
}

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const next = safeNextPath(searchParams.get('next'));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');
    const form = new FormData(event.currentTarget);
    const payload = mode === 'login'
      ? {
          identifier: String(form.get('identifier') ?? '').trim(),
          password: String(form.get('password') ?? ''),
        }
      : {
          username: String(form.get('username') ?? '').trim(),
          email: String(form.get('email') ?? '').trim(),
          displayName: String(form.get('displayName') ?? '').trim(),
          password: String(form.get('password') ?? ''),
        };

    try {
      const response = await fetch(apiURL(`/auth/${mode === 'login' ? 'login' : 'register'}`), {
        method: 'POST',
        credentials: apiCredentials(),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Request gagal');
      const auth = await response.json() as { user: AuthUser };
      writeSession(auth.user);
      router.push(next);
      router.refresh();
    } catch {
      setStatus('error');
      setMessage(mode === 'login' ? 'Login gagal. Periksa email/username dan password.' : 'Registrasi gagal. Pastikan email valid dan password minimal 8 karakter.');
    }
  }

  return (
    <form onSubmit={submit} className="relative grid gap-5 overflow-hidden rounded-[2rem] bg-surface-container/88 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-7">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/12 blur-3xl" />
      <div className="relative mb-5 flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{mode === 'login' ? 'Akses pembaca' : 'Identitas baru'}</p>
          <h2 className="mt-1 break-words font-display text-2xl font-bold">{mode === 'login' ? 'Masuk akun' : 'Buat akun'}</h2>
          <p className="mt-2 break-words text-sm leading-6 text-on-surface-variant">
            {mode === 'login' ? 'Lanjutkan rak dan chapter terakhir dari akunmu.' : 'Simpan rak, komentar, dan preferensi baca dalam satu profil.'}
          </p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-glow">
          {mode === 'login' ? <LogIn size={22} /> : <UserPlus size={22} />}
        </div>
      </div>
      {mode === 'register' ? (
        <>
          <label className="relative grid gap-2.5 text-sm font-semibold text-on-surface">
            Nama pengguna
            <input name="username" required minLength={3} className={inputClassName} placeholder="naraya_reader" />
          </label>
          <label className="grid gap-2.5 text-sm font-semibold text-on-surface">
            Nama tampilan
            <input name="displayName" required className={inputClassName} placeholder="Nara Reader" />
          </label>
          <label className="grid gap-2.5 text-sm font-semibold text-on-surface">
            Email
            <input name="email" type="email" required className={inputClassName} placeholder="kamu@naraya.id" />
          </label>
        </>
      ) : (
        <label className="grid gap-2.5 text-sm font-semibold text-on-surface">
          Email atau username
          <input name="identifier" required className={inputClassName} placeholder="email atau username" />
        </label>
      )}
      <label className="grid gap-2.5 text-sm font-semibold text-on-surface">
        Password
        <input name="password" type="password" required minLength={8} className={inputClassName} placeholder="Minimal 8 karakter" />
      </label>
      <button className="interactive-lift mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-semibold text-on-primary shadow-glow disabled:cursor-not-allowed disabled:opacity-60" disabled={status === 'loading'}>
        {status === 'loading' ? <Sparkles size={18} className="animate-pulse" /> : null}
        {status === 'loading' ? 'Memproses...' : mode === 'login' ? 'Masuk ke Naraya' : 'Buat akun Naraya'}
        {status !== 'loading' ? <ArrowRight size={18} /> : null}
      </button>
      {message ? <p className="rounded-2xl bg-tertiary/10 px-4 py-3 text-sm leading-6 text-tertiary ring-1 ring-tertiary/25">{message}</p> : null}
      <p className="relative mt-1 text-center text-sm text-on-surface-variant">
        {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
        <Link href={mode === 'login' ? '/register' : '/login'} className="font-semibold text-primary hover:underline">
          {mode === 'login' ? 'Daftar' : 'Login'}
        </Link>
      </p>
    </form>
  );
}

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/profile';
  if (value.startsWith('/api/') || value.startsWith('/download/android')) return '/profile';
  return value;
}

const inputClassName = 'h-[3.25rem] rounded-[1.35rem] bg-[#17131f]/82 px-4 text-sm font-medium text-on-surface outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_10px_24px_rgba(0,0,0,0.16)] ring-1 ring-primary/10 transition placeholder:text-on-surface-variant/45 hover:bg-[#1b1724]/88 focus:bg-[#1d1827] focus:ring-2 focus:ring-primary/35';
