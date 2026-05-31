'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function ScrollRevealActivator() {
  const pathname = usePathname();

  useEffect(() => {
    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-scroll-reveal]'));
    if (!nodes.length) return;

    if (reduceQuery.matches) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.12,
    });

    nodes.forEach((node, index) => {
      if (!node.style.getPropertyValue('--reveal-delay')) {
        node.style.setProperty('--reveal-delay', `${Math.min(index % 3, 2) * 60}ms`);
      }
      observer.observe(node);
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
