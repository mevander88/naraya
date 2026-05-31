import { DEFAULT_DESCRIPTION, DEFAULT_IMAGE, SITE_NAME, SITE_URL, ThingSchema, webPageRef, withContext } from './utils';

export interface SearchActionSchema {
  '@type': 'SearchAction';
  target: string;
  'query-input': string;
}

export interface WebSiteSchema extends ThingSchema {
  '@type': 'WebSite';
  potentialAction?: SearchActionSchema;
  publisher?: { '@id': string };
}

export function buildWebSiteSchema(): WebSiteSchema & { '@context': 'https://schema.org' } {
  return withContext<WebSiteSchema>({
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    image: DEFAULT_IMAGE,
    description: DEFAULT_DESCRIPTION,
    mainEntityOfPage: webPageRef(SITE_URL),
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/explore?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  });
}
