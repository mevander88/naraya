import { absoluteURL, AggregateRatingSchema, extractAggregateRating, extractInfoValue, InfoRowLike, pageURL, parseSourceDate, ThingSchema, webPageRef, withContext } from './utils';

export interface TVSeriesSchema extends ThingSchema {
  '@type': 'TVSeries';
  genre?: string[];
  inLanguage?: string;
  numberOfEpisodes?: number;
  datePublished?: string;
  aggregateRating?: AggregateRatingSchema;
  publisher?: { '@type': 'Organization'; name: string; url: string };
}

export interface TVSeriesInput {
  slug: string;
  title: string;
  description: string;
  image?: string;
  genres: string[];
  info: InfoRowLike[];
  episodeCount: number;
}

export function buildTVSeriesSchema(input: TVSeriesInput): TVSeriesSchema & { '@context': 'https://schema.org' } {
  const url = pageURL(`/series/${input.slug}`);
  return withContext<TVSeriesSchema>({
    '@type': 'TVSeries',
    '@id': `${url}#tvseries`,
    name: input.title,
    url,
    image: absoluteURL(input.image),
    description: input.description,
    mainEntityOfPage: webPageRef(url),
    genre: input.genres,
    inLanguage: 'id',
    datePublished: parseSourceDate(extractInfoValue(input.info, ['Release Date', 'Released', 'Year', 'Years'])),
    numberOfEpisodes: input.episodeCount,
    aggregateRating: extractAggregateRating(input.info),
    publisher: { '@type': 'Organization', name: 'Naraya', url: pageURL('/') },
  });
}
