import { absoluteURL, pageURL, parseSourceDate, ThingSchema, webPageRef, withContext } from './utils';

export interface ChapterSchema extends ThingSchema {
  '@type': 'Chapter';
  position?: string;
  datePublished?: string;
  isPartOf?: ThingSchema;
  inLanguage?: string;
}

export interface ChapterInput {
  slug: string;
  title: string;
  description: string;
  image?: string;
  chapterNumber?: string;
  publishedDate?: string;
  comic?: {
    slug: string;
    title: string;
  } | null;
}

export function buildChapterSchema(input: ChapterInput): ChapterSchema & { '@context': 'https://schema.org' } {
  const url = pageURL(`/baca/${input.slug}`);
  const comicURL = input.comic ? pageURL(`/komik/${input.comic.slug}`) : undefined;
  return withContext<ChapterSchema>({
    '@type': 'Chapter',
    '@id': `${url}#chapter`,
    name: input.title,
    url,
    image: absoluteURL(input.image),
    description: input.description,
    mainEntityOfPage: webPageRef(url),
    position: input.chapterNumber,
    datePublished: parseSourceDate(input.publishedDate),
    isPartOf: input.comic && comicURL ? {
      '@type': 'ComicSeries',
      '@id': `${comicURL}#comicseries`,
      name: input.comic.title,
      url: comicURL,
    } : undefined,
    inLanguage: 'id',
  });
}
