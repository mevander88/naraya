import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AuthForm } from '../auth-client';

export const metadata: Metadata = {
  title: 'Daftar Akun',
  description: 'Buat akun Naraya untuk menyimpan library, bookmark, progress baca, dan komentar.',
  alternates: { canonical: '/register' },
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <section className="relative grid min-h-screen place-items-center overflow-hidden px-container-mobile py-10 md:px-container-desktop">
      <Link href="/" className="absolute left-container-mobile top-6 z-10 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container-high/82 text-primary shadow-xl shadow-black/20 transition hover:bg-primary hover:text-on-primary md:left-8" aria-label="Kembali ke Home">
        <ArrowLeft size={20} />
      </Link>
      <div className="pointer-events-none absolute left-10 top-24 h-72 w-72 rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-52 h-px w-80 rotate-[14deg] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="mx-auto grid w-full max-w-[500px]">
        <AuthForm mode="register" />
      </div>
    </section>
  );
}
