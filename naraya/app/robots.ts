import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/images/'],
        disallow: [
          '/api/',
          '/library',
          '/profile',
          '/settings',
          '/notifications',
          '/login',
          '/register',
        ],
      },
    ],
    sitemap: 'https://naraya.biz.id/sitemap.xml',
    host: 'https://naraya.biz.id',
  };
}
