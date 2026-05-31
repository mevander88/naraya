'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function ScrollRevealActivator() {
  const pathname = usePathname();

  useEffect(() => {
    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const observed = new Set<HTMLElement>();

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

    function registerNodes() {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-scroll-reveal]'));
      nodes.forEach((node) => {
        if (observed.has(node) || node.classList.contains('is-visible')) return;
        const index = observed.size;
        observed.add(node);

        if (!node.style.getPropertyValue('--reveal-delay')) {
          node.style.setProperty('--reveal-delay', `${Math.min(index % 3, 2) * 60}ms`);
        }

        if (reduceQuery.matches) {
          node.classList.add('is-visible');
          return;
        }

        observer.observe(node);
      });
    }

    registerNodes();
    const animationFrame = window.requestAnimationFrame(registerNodes);

    const mutationObserver = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.addedNodes.length > 0)) {
        registerNodes();
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
