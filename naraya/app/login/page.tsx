import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AuthForm } from '../auth-client';
import { getMe } from '../data';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Masuk ke akun Naraya untuk menyimpan library, bookmark, dan komentar.',
  alternates: { canonical: '/login' },
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const user = await getMe();
  if (user) {
    redirect('/profile');
  }

  return (
    <section className="relative grid min-h-screen place-items-center overflow-hidden px-container-mobile py-10 md:px-container-desktop">
      <Link href="/" className="absolute left-container-mobile top-6 z-10 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container-high/82 text-primary shadow-xl shadow-black/20 transition hover:bg-primary hover:text-on-primary md:left-8" aria-label="Kembali ke Home">
        <ArrowLeft size={20} />
      </Link>
      <div className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute left-1/4 top-48 h-px w-72 rotate-[-18deg] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="mx-auto grid w-full max-w-[460px]">
        <AuthForm mode="login" />
      </div>
    </section>
  );
}
