import { getSitemapCatalogItems, getSitemapSeriesItems } from '../data';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const SITE_URL = 'https://naraya.biz.id';

export async function GET() {
  const now = new Date();
  const [catalog, series] = await Promise.all([
    getSitemapCatalogItems(),
    getSitemapSeriesItems(),
  ]);
  const seen = new Set<string>();
  const urls: string[] = [];

  const pushURL = (path: string, lastModified: Date, priority: number) => {
    const loc = `${SITE_URL}${path}`;
    if (seen.has(loc)) return;
    seen.add(loc);
    urls.push(renderURL(loc, lastModified, priority));
  };

  pushURL('/amp', now, 0.9);

  [...series, ...catalog].forEach((item) => {
    if (!item.slug || (item.kind !== 'series' && item.kind !== 'comic')) return;
    const section = item.kind === 'series' ? 'series' : 'komik';
    pushURL(`/amp/${section}/${item.slug}`, safeDate(item.lastMod, now), item.kind === 'series' ? 0.74 : 0.76);
  });

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

function renderURL(loc: string, lastModified: Date, priority: number) {
  return [
    '  <url>',
    `    <loc>${escapeXML(loc)}</loc>`,
    `    <lastmod>${lastModified.toISOString()}</lastmod>`,
    '    <changefreq>daily</changefreq>',
    `    <priority>${priority.toFixed(2)}</priority>`,
    '  </url>',
  ].join('\n');
}

function safeDate(value: string, fallback: Date) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function escapeXML(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
