import type { MetadataRoute } from 'next';
import { getSitemapCatalogItems } from './data';

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
  const catalogRoutes = catalog.map((item) => ({
    url: `${base}/${item.kind === 'series' ? 'series' : 'komik'}/${item.slug}`,
    lastModified: item.lastMod ? new Date(item.lastMod) : now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...catalogRoutes];
}
