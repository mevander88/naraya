export const SITE_URL = 'https://naraya.biz.id';
export const SITE_NAME = 'Naraya';
export const DEFAULT_DESCRIPTION = 'Naraya adalah web anime indo dan komik online untuk nonton anime, anime indo, anime sub indo, streaming anime, nonton anime id, baca komik bahasa Indonesia, update episode terbaru, chapter terbaru, dan rekomendasi anime.';
export const DEFAULT_IMAGE = `${SITE_URL}/opengraph-image`;
export const LOGO_URL = `${SITE_URL}/logo.svg`;

export type JsonLdObject = object;

export type ThingSchema = {
  '@type': string;
  '@id'?: string;
  name?: string;
  url?: string;
  image?: string | string[];
  description?: string;
  mainEntityOfPage?: string | { '@type': 'WebPage'; '@id': string };
};

export type AggregateRatingSchema = {
  '@type': 'AggregateRating';
  ratingValue: number;
  ratingCount: number;
  bestRating: number;
  worstRating: number;
};

export type PageIdentity = {
  name: string;
  url: string;
  description: string;
  image?: string;
};

export type InfoRowLike = {
  label: string;
  value: string;
};

export function absoluteURL(value?: string) {
  const raw = String(value ?? '').trim();
  if (!raw) return undefined;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `${SITE_URL}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

export function pageURL(path: string) {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function webPageRef(url: string) {
  return { '@type': 'WebPage' as const, '@id': url };
}

export function withContext<T extends object>(schema: T): T & { '@context': 'https://schema.org' } {
  return cleanSchema({
    '@context': 'https://schema.org',
    ...schema,
  }) as T & { '@context': 'https://schema.org' };
}

export function cleanSchema<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((item) => cleanSchema(item))
      .filter((item) => !isEmptySchemaValue(item)) as T;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, cleanSchema(item)] as const)
      .filter(([, item]) => !isEmptySchemaValue(item));
    return Object.fromEntries(entries) as T;
  }
  return value;
}

export function isEmptySchemaValue(value: unknown) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length === 0;
  return false;
}

export function extractInfoValue(rows: InfoRowLike[], labels: string[]) {
  const normalized = labels.map((label) => label.trim().toLowerCase());
  return rows.find((row) => normalized.includes(row.label.trim().toLowerCase()))?.value.trim() || '';
}

export function extractAggregateRating(rows: InfoRowLike[]): AggregateRatingSchema | undefined {
  const value = extractInfoValue(rows, ['rating', 'score']);
  if (!value) return undefined;

  const ratingMatch = value.match(/(\d+(?:[.,]\d+)?)/);
  if (!ratingMatch) return undefined;

  const ratingValue = Number.parseFloat(ratingMatch[1].replace(',', '.'));
  const countSource = value.split('/').slice(1).join('/');
  const countMatch = countSource.match(/([\d.,]+)/);
  const ratingCount = countMatch ? Number.parseInt(countMatch[1].replace(/\D/g, ''), 10) : 0;

  if (!Number.isFinite(ratingValue) || ratingValue <= 0 || ratingValue > 10) return undefined;
  if (!Number.isFinite(ratingCount) || ratingCount <= 0) return undefined;

  return {
    '@type': 'AggregateRating',
    ratingValue,
    ratingCount,
    bestRating: 10,
    worstRating: 0,
  };
}

export function parseSourceDate(value?: string) {
  const raw = String(value ?? '').trim();
  if (!raw || raw === '?' || raw.toLowerCase() === 'unknown') return undefined;
  const firstRangeDate = raw.split(/\s+to\s+/i)[0]?.trim();
  if (!firstRangeDate || firstRangeDate === '?') return undefined;

  const iso = parseKnownDate(firstRangeDate);
  return iso;
}

function parseKnownDate(value: string) {
  const normalized = value.replaceAll(',', '').trim();
  const parts = normalized.split(/\s+/);
  if (parts.length >= 3) {
    const month = monthNumber(parts[0]);
    const day = Number.parseInt(parts[1], 10);
    const year = Number.parseInt(parts[2], 10);
    if (month && day && year) return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  const localParts = normalized.split(/\s+/);
  if (localParts.length >= 3) {
    const day = Number.parseInt(localParts[0], 10);
    const month = monthNumber(localParts[1]);
    const year = Number.parseInt(localParts[2], 10);
    if (month && day && year) return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  if (/^\d{4}$/.test(normalized)) return normalized;
  return undefined;
}

function monthNumber(value: string) {
  const key = value.trim().toLowerCase();
  const months: Record<string, number> = {
    jan: 1,
    january: 1,
    januari: 1,
    feb: 2,
    february: 2,
    februari: 2,
    mar: 3,
    march: 3,
    maret: 3,
    apr: 4,
    april: 4,
    may: 5,
    mei: 5,
    jun: 6,
    june: 6,
    juni: 6,
    jul: 7,
    july: 7,
    juli: 7,
    aug: 8,
    august: 8,
    agustus: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    oktober: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
    desember: 12,
  };
  return months[key];
}

function pad2(value: number) {
  return String(value).padStart(2, '0');
}
