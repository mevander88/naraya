import type { ChapterData, ComicCardData, ComicDetailData, SeriesDetailData, SeriesEpisodeData } from '../data';

const SITE_URL = 'https://naraya.biz.id';
const AMP_BOILERPLATE = 'body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}';
const AMP_NO_SCRIPT = 'body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}';
const AMP_STYLE = `
  :root{color-scheme:dark;--bg:#121019;--surface:#1d1a24;--surface2:#292431;--text:#f4eff4;--muted:#cac4d0;--primary:#d0bcff;--accent:#f2b8b5}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--text);font-family:Arial,Helvetica,sans-serif;line-height:1.6}
  a{color:inherit;text-decoration:none}
  .wrap{width:min(1080px,100%);margin:0 auto;padding:24px 18px 52px}
  .nav{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 0 24px}
  .brand{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:.02em}
  .pill{border:1px solid rgba(208,188,255,.28);border-radius:999px;padding:8px 12px;color:var(--primary);font-size:13px;font-weight:700}
  .hero{display:grid;gap:20px;margin-top:8px;padding:24px;border-radius:28px;background:linear-gradient(135deg,rgba(208,188,255,.16),rgba(242,184,181,.08)),var(--surface)}
  h1{margin:0;font-size:clamp(32px,7vw,64px);line-height:1.04;letter-spacing:0}
  h2{margin:32px 0 14px;font-size:24px;line-height:1.2}
  h3{margin:12px 0 6px;font-size:18px;line-height:1.25}
  p{margin:0;color:var(--muted)}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(148px,1fr));gap:14px}
  .card{display:block;min-width:0;border-radius:18px;background:var(--surface);overflow:hidden;border:1px solid rgba(255,255,255,.08)}
  .card-body{padding:12px}
  .meta{color:var(--primary);font-size:12px;font-weight:700;text-transform:uppercase}
  .detail{display:grid;gap:22px;margin-top:8px}
  .cover{border-radius:22px;overflow:hidden;background:var(--surface2)}
  .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
  .chip{border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:6px 10px;color:var(--muted);font-size:13px}
  .list{display:grid;gap:10px;margin:0;padding:0;list-style:none}
  .row{display:block;border-radius:16px;background:var(--surface);padding:13px 14px;border:1px solid rgba(255,255,255,.08)}
  .footer{margin-top:42px;color:var(--muted);font-size:13px}
  @media (min-width:760px){.detail{grid-template-columns:260px minmax(0,1fr)}.hero{padding:36px}.wrap{padding-inline:28px}}
`;

type AmpDocument = {
  title: string;
  description: string;
  canonicalPath: string;
  image?: string;
  jsonLd?: object;
  body: string;
};

export function ampResponse(document: AmpDocument) {
  return new Response(renderAmpDocument(document), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400',
      'X-Robots-Tag': 'index, follow',
    },
  });
}

export function renderHomeAmp(featured: ComicCardData[], comics: ComicCardData[], series: ComicCardData[]) {
  const hero = featured[0] ?? series[0] ?? comics[0];
  const items = [...series.slice(0, 6), ...comics.slice(0, 6)];
  return ampResponse({
    title: 'Naraya - Baca Komik dan Nonton Anime',
    description: 'Naraya adalah platform baca komik dan nonton anime dengan katalog genre, chapter terbaru, episode terbaru, reader, dan player.',
    canonicalPath: '/',
    image: hero?.image,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Naraya',
      url: SITE_URL,
      description: 'Platform baca komik dan nonton anime.',
    },
    body: `
      <section class="hero">
        <p class="meta">AMP Naraya</p>
        <h1>Baca komik dan nonton anime di Naraya</h1>
        <p>Temukan update komik, anime, genre, chapter terbaru, dan episode terbaru dalam halaman ringan untuk crawler dan perangkat mobile.</p>
      </section>
      <h2>Update Terbaru</h2>
      ${renderCardGrid(items)}
    `,
  });
}

export function renderComicAmp(detail: ComicDetailData) {
  const description = detail.description || `Baca detail ${detail.title}, genre, status, dan daftar chapter di Naraya.`;
  return ampResponse({
    title: `${detail.title} | Naraya`,
    description,
    canonicalPath: `/komik/${detail.slug}`,
    image: detail.cover,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ComicSeries',
      name: detail.title,
      url: `${SITE_URL}/komik/${detail.slug}`,
      image: absoluteURL(detail.cover),
      description,
      genre: detail.genres,
      inLanguage: 'id',
      publisher: { '@type': 'Organization', name: 'Naraya', url: SITE_URL },
    },
    body: `
      ${renderDetailHeader({
        title: detail.title,
        eyebrow: [detail.type || 'Komik', detail.status].filter(Boolean).join(' - '),
        description,
        cover: detail.cover,
        genres: detail.genres,
      })}
      <h2>Chapter Terbaru</h2>
      ${renderChapterList(detail.chapters.slice(0, 20))}
    `,
  });
}

export function renderSeriesAmp(detail: SeriesDetailData) {
  const description = detail.description || `Nonton ${detail.title} di Naraya.`;
  return ampResponse({
    title: `${detail.title} | Naraya`,
    description,
    canonicalPath: `/series/${detail.slug}`,
    image: detail.cover,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'TVSeries',
      name: detail.title,
      url: `${SITE_URL}/series/${detail.slug}`,
      image: absoluteURL(detail.cover),
      description,
      genre: detail.genres,
      inLanguage: 'id',
      publisher: { '@type': 'Organization', name: 'Naraya', url: SITE_URL },
      numberOfEpisodes: detail.episodes.length,
    },
    body: `
      ${renderDetailHeader({
        title: detail.title,
        eyebrow: 'Series Anime',
        description,
        cover: detail.cover,
        genres: detail.genres,
      })}
      <h2>Episode Terbaru</h2>
      ${renderEpisodeList(detail.episodes.slice(0, 20))}
    `,
  });
}

export function absoluteURL(value?: string) {
  if (!value) return `${SITE_URL}/logo.svg`;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${SITE_URL}${value.startsWith('/') ? value : `/${value}`}`;
}

function renderAmpDocument(document: AmpDocument) {
  const canonical = `${SITE_URL}${document.canonicalPath}`;
  const ampURL = `${SITE_URL}/amp${document.canonicalPath === '/' ? '' : document.canonicalPath}`;
  const image = absoluteURL(document.image);
  return `<!doctype html>
<html amp lang="id">
  <head>
    <meta charset="utf-8">
    <title>${escapeHTML(document.title)}</title>
    <link rel="canonical" href="${escapeAttr(canonical)}">
    <link rel="self" href="${escapeAttr(ampURL)}">
    <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
    <meta name="description" content="${escapeAttr(document.description)}">
    <meta property="og:title" content="${escapeAttr(document.title)}">
    <meta property="og:description" content="${escapeAttr(document.description)}">
    <meta property="og:image" content="${escapeAttr(image)}">
    <meta name="robots" content="index,follow">
    <script async src="https://cdn.ampproject.org/v0.js"></script>
    ${document.jsonLd ? `<script type="application/ld+json">${escapeScript(JSON.stringify(document.jsonLd))}</script>` : ''}
    <style amp-boilerplate>${AMP_BOILERPLATE}</style><noscript><style amp-boilerplate>${AMP_NO_SCRIPT}</style></noscript>
    <style amp-custom>${AMP_STYLE}</style>
  </head>
  <body>
    <main class="wrap">
      <nav class="nav">
        <a class="brand" href="${SITE_URL}/">
          <amp-img src="${SITE_URL}/logo.svg" width="42" height="22" layout="fixed" alt="Naraya"></amp-img>
          <span>Naraya</span>
        </a>
        <a class="pill" href="${escapeAttr(canonical)}">Buka versi utama</a>
      </nav>
      ${document.body}
      <footer class="footer">Naraya AMP - halaman ringan untuk crawler dan mobile.</footer>
    </main>
  </body>
</html>`;
}

function renderDetailHeader(props: { title: string; eyebrow: string; description: string; cover: string; genres: string[] }) {
  return `
    <section class="detail">
      <div class="cover">
        <amp-img src="${escapeAttr(absoluteURL(props.cover))}" width="520" height="780" layout="responsive" alt="${escapeAttr(props.title)}"></amp-img>
      </div>
      <div>
        <p class="meta">${escapeHTML(props.eyebrow)}</p>
        <h1>${escapeHTML(props.title)}</h1>
        <p>${escapeHTML(trimText(props.description, 520))}</p>
        <div class="chips">${props.genres.map((genre) => `<span class="chip">${escapeHTML(genre)}</span>`).join('')}</div>
      </div>
    </section>
  `;
}

function renderCardGrid(items: ComicCardData[]) {
  if (!items.length) return '<p>Belum ada update yang tersedia.</p>';
  return `<div class="grid">${items.map(renderCard).join('')}</div>`;
}

function renderCard(item: ComicCardData) {
  const kindPath = item.kind === 'series' ? 'series' : 'komik';
  return `
    <a class="card" href="${SITE_URL}/${kindPath}/${escapeAttr(item.slug)}">
      <amp-img src="${escapeAttr(absoluteURL(item.image))}" width="320" height="480" layout="responsive" alt="${escapeAttr(item.title)}"></amp-img>
      <div class="card-body">
        <p class="meta">${escapeHTML(item.kind === 'series' ? 'Anime' : 'Komik')}</p>
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.episode || item.meta)}</p>
      </div>
    </a>
  `;
}

function renderChapterList(chapters: ChapterData[]) {
  if (!chapters.length) return '<p>Belum ada chapter yang tersedia.</p>';
  return `<ul class="list">${chapters.map((chapter) => `
    <li><a class="row" href="${SITE_URL}/baca/${escapeAttr(chapter.slug)}">
      <strong>${escapeHTML(chapter.title || `Chapter ${chapter.number}`)}</strong><br>
      <span>${escapeHTML(chapter.date || chapter.number || 'Chapter')}</span>
    </a></li>
  `).join('')}</ul>`;
}

function renderEpisodeList(episodes: SeriesEpisodeData[]) {
  if (!episodes.length) return '<p>Belum ada episode yang tersedia.</p>';
  return `<ul class="list">${episodes.map((episode) => `
    <li><a class="row" href="${SITE_URL}/nonton/${escapeAttr(episode.slug)}">
      <strong>${escapeHTML(episode.title || `Episode ${episode.number}`)}</strong><br>
      <span>${escapeHTML(episode.date || episode.number || 'Episode')}</span>
    </a></li>
  `).join('')}</ul>`;
}

function trimText(value: string, max: number) {
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1).trim()}...` : text;
}

function escapeHTML(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value: string) {
  return escapeHTML(value).replace(/`/g, '&#96;');
}

function escapeScript(value: string) {
  return value.replace(/</g, '\\u003c');
}
