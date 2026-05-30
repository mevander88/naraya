'use client';

import { Check, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type ShareButtonProps = {
  title: string;
  path?: string;
  label?: string;
  variant?: 'button' | 'icon';
};

export function ShareButton({ title, path, label = 'Share', variant = 'button' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function share() {
    const url = path ? new URL(path, window.location.origin).toString() : window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      } catch {
        setCopied(false);
      }
    }
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={() => void share()}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-surface-container-high text-primary transition hover:border-primary/50 hover:bg-primary/10 active:scale-95"
        aria-label={copied ? 'Link tersalin' : `Share ${title}`}
        title={copied ? 'Link tersalin' : 'Share halaman'}
      >
        {copied ? <Check size={18} /> : <Share2 size={18} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      className="interactive-lift inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-surface-container-high px-5 py-3 font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/10 active:scale-95"
      aria-label={copied ? 'Link tersalin' : `Share ${title}`}
    >
      {copied ? <Check size={18} /> : <Share2 size={18} />}
      {copied ? 'Tersalin' : label}
    </button>
  );
}
