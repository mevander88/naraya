import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/amp/', '/api/images/'],
        disallow: [
          '/api/',
          '/library',
          '/profile',
          '/settings',
          '/notifications',
          '/login',
          '/register',
          '/download/android',
        ],
      },
    ],
    sitemap: ['https://naraya.biz.id/sitemap.xml', 'https://naraya.biz.id/amp-sitemap.xml'],
    host: 'https://naraya.biz.id',
  };
}
