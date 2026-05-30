import type { MetadataRoute } from 'next';
import { getSitemapCatalogItems } from './data';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://naraya.biz.id';
  const now = new Date();
  const catalog = await getSitemapCatalogItems();
  const staticRoutes = ['', '/explore', '/komik'].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? ('daily' as const) : ('weekly' as const),
    priority: path === '' ? 1 : 0.8,
  }));
  const ampStaticRoutes = [{
    url: `${base}/amp`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }];
  const seen = new Set<string>();
  const catalogRoutes = catalog.flatMap((item) => {
    if (!item.slug || (item.kind !== 'series' && item.kind !== 'comic')) return [];
    const section = item.kind === 'series' ? 'series' : 'komik';
    const url = `${base}/${section}/${item.slug}`;
    if (seen.has(url)) return [];
    seen.add(url);
    const lastModified = safeDate(item.lastMod, now);
    return [
      {
        url,
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: item.kind === 'series' ? 0.72 : 0.75,
      },
      {
        url: `${base}/amp/${section}/${item.slug}`,
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: item.kind === 'series' ? 0.52 : 0.55,
      },
    ];
  });

  return [...staticRoutes, ...ampStaticRoutes, ...catalogRoutes];
}

function safeDate(value: string, fallback: Date) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}
