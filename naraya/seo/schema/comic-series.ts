import { absoluteURL, AggregateRatingSchema, extractAggregateRating, extractInfoValue, InfoRowLike, pageURL, parseSourceDate, ThingSchema, webPageRef, withContext } from './utils';

export interface ComicSeriesSchema extends ThingSchema {
  '@type': 'ComicSeries';
  genre?: string[];
  inLanguage?: string;
  datePublished?: string;
  aggregateRating?: AggregateRatingSchema;
  publisher?: { '@type': 'Organization'; name: string; url: string };
}

export interface ComicSeriesInput {
  slug: string;
  title: string;
  description: string;
  image?: string;
  genres: string[];
  info: InfoRowLike[];
}

export function buildComicSeriesSchema(input: ComicSeriesInput): ComicSeriesSchema & { '@context': 'https://schema.org' } {
  const url = pageURL(`/komik/${input.slug}`);
  return withContext<ComicSeriesSchema>({
    '@type': 'ComicSeries',
    '@id': `${url}#comicseries`,
    name: input.title,
    url,
    image: absoluteURL(input.image),
    description: input.description,
    mainEntityOfPage: webPageRef(url),
    genre: input.genres,
    inLanguage: 'id',
    datePublished: parseSourceDate(extractInfoValue(input.info, ['Release Date', 'Released', 'Year', 'Years'])),
    aggregateRating: extractAggregateRating(input.info),
    publisher: { '@type': 'Organization', name: 'Naraya', url: pageURL('/') },
  });
}
