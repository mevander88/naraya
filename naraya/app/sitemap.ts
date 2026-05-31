import type { MetadataRoute } from 'next';
import { getLatestComics, getSitemapCatalogItems, getSitemapSeriesItems } from './data';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://naraya.biz.id';
  const now = new Date();
  const [catalog, series, latestComicPages] = await Promise.all([
    getSitemapCatalogItems(),
    getSitemapSeriesItems(),
    Promise.all([getLatestComics(1), getLatestComics(2)]),
  ]);
  const latestComics = latestComicPages.flat().filter((item, index, list) => (
    item.slug && list.findIndex((candidate) => candidate.slug === item.slug) === index
  ));
  const seen = new Set<string>();
  const routes: MetadataRoute.Sitemap = [];

  const pushRoute = (path: string, lastModified: Date, changeFrequency: ChangeFrequency, priority: number) => {
    const normalizedPath = path === '' ? '/' : path;
    const url = `${base}${normalizedPath === '/' ? '' : normalizedPath}`;
    if (seen.has(url)) return;
    seen.add(url);
    routes.push({ url, lastModified, changeFrequency, priority });
  };

  pushRoute('/', now, 'daily', 1);
  pushRoute('/anime-indo', now, 'daily', 0.95);
  pushRoute('/indeks', now, 'weekly', 0.86);
  pushRoute('/explore', now, 'weekly', 0.82);
  pushRoute('/amp', now, 'daily', 0.7);

  [...catalog, ...series].forEach((item) => {
    if (!item.slug || (item.kind !== 'series' && item.kind !== 'comic')) return;
    const section = item.kind === 'series' ? 'series' : 'komik';
    const lastModified = safeDate(item.lastMod, now);

    pushRoute(`/${section}/${item.slug}`, lastModified, 'weekly', item.kind === 'series' ? 0.72 : 0.75);
    pushRoute(`/amp/${section}/${item.slug}`, lastModified, 'weekly', item.kind === 'series' ? 0.52 : 0.55);

    if (item.kind === 'series' && item.latestChapterSlug) {
      pushRoute(`/nonton/${item.latestChapterSlug}`, lastModified, 'daily', 0.64);
    }
  });

  latestComics.forEach((item) => {
    if (!item.slug) return;
    pushRoute(`/komik/${item.slug}`, now, 'weekly', 0.75);
    if (item.latestChapterSlug) {
      pushRoute(`/baca/${item.latestChapterSlug}`, now, 'daily', 0.64);
    }
  });

  return routes;
}

function safeDate(value: string, fallback: Date) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}
