'use client';

import { useEffect } from 'react';

export function ReaderBack({ href, label }: { href: string; label: string }) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('naraya-reader-back', { detail: { href, label } }));
  }, [href, label]);

  return null;
}
