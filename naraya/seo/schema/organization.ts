import { DEFAULT_DESCRIPTION, LOGO_URL, SITE_NAME, SITE_URL, ThingSchema, withContext } from './utils';

export interface OrganizationSchema extends ThingSchema {
  '@type': 'Organization';
  logo?: string;
  sameAs?: string[];
}

export function buildOrganizationSchema(): OrganizationSchema & { '@context': 'https://schema.org' } {
  return withContext<OrganizationSchema>({
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: LOGO_URL,
    image: LOGO_URL,
    description: DEFAULT_DESCRIPTION,
  });
}
