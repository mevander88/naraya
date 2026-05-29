import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://naraya.biz.id';
  return [
    '',
    '/explore',
    '/komik',
    '/series',
    '/library',
    '/login',
    '/register',
    '/profile',
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.8,
  }));
}
