'use client';

import { useEffect } from 'react';

export function WatchBack({ href, label }: { href: string; label: string }) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('naraya-reader-back', { detail: { href, label } }));
    window.dispatchEvent(new CustomEvent('naraya-reader-chrome', { detail: { visible: true } }));
  }, [href, label]);

  return null;
}
