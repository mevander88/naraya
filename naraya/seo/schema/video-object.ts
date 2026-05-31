import { absoluteURL, pageURL, parseSourceDate, ThingSchema, webPageRef, withContext } from './utils';

export interface VideoObjectSchema extends ThingSchema {
  '@type': 'VideoObject';
  thumbnailUrl: string[];
  uploadDate: string;
  embedUrl: string;
  contentUrl?: string;
  inLanguage?: string;
}

export interface VideoObjectInput {
  name: string;
  description: string;
  thumbnailUrl?: string;
  uploadDate?: string;
  embedUrl?: string;
  contentUrl?: string;
  pagePath: string;
}

export function buildVideoObjectSchema(input: VideoObjectInput): (VideoObjectSchema & { '@context': 'https://schema.org' }) | undefined {
  const thumbnailUrl = absoluteURL(input.thumbnailUrl);
  const uploadDate = parseSourceDate(input.uploadDate);
  const embedUrl = absoluteURL(input.embedUrl);
  if (!input.name.trim() || !input.description.trim() || !thumbnailUrl || !uploadDate || !embedUrl) return undefined;

  const page = pageURL(input.pagePath);
  return withContext<VideoObjectSchema>({
    '@type': 'VideoObject',
    '@id': `${page}#video`,
    name: input.name,
    description: input.description,
    thumbnailUrl: [thumbnailUrl],
    uploadDate,
    embedUrl,
    contentUrl: absoluteURL(input.contentUrl),
    mainEntityOfPage: webPageRef(page),
    inLanguage: 'id',
  });
}
