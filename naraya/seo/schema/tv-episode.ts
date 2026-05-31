import { absoluteURL, pageURL, parseSourceDate, ThingSchema, webPageRef, withContext } from './utils';

export interface TVEpisodeSchema extends ThingSchema {
  '@type': 'TVEpisode';
  episodeNumber?: string;
  datePublished?: string;
  partOfSeries?: ThingSchema;
  associatedMedia?: { '@id': string };
  inLanguage?: string;
}

export interface TVEpisodeInput {
  slug: string;
  title: string;
  description: string;
  image?: string;
  episodeNumber?: string;
  publishedDate?: string;
  series?: {
    slug: string;
    title: string;
  } | null;
  hasVideo?: boolean;
}

export function buildTVEpisodeSchema(input: TVEpisodeInput): TVEpisodeSchema & { '@context': 'https://schema.org' } {
  const url = pageURL(`/nonton/${input.slug}`);
  const seriesURL = input.series ? pageURL(`/series/${input.series.slug}`) : undefined;
  return withContext<TVEpisodeSchema>({
    '@type': 'TVEpisode',
    '@id': `${url}#episode`,
    name: input.title,
    url,
    image: absoluteURL(input.image),
    description: input.description,
    mainEntityOfPage: webPageRef(url),
    episodeNumber: input.episodeNumber,
    datePublished: parseSourceDate(input.publishedDate),
    partOfSeries: input.series && seriesURL ? {
      '@type': 'TVSeries',
      '@id': `${seriesURL}#tvseries`,
      name: input.series.title,
      url: seriesURL,
    } : undefined,
    associatedMedia: input.hasVideo ? { '@id': `${url}#video` } : undefined,
    inLanguage: 'id',
  });
}
