import type { Metadata } from 'next';

const SOCIAL_IMAGE = '/opengraph-image';
const SITE_NAME = 'Naraya';
const LOCALE = 'id_ID';
const DESCRIPTION_LIMIT = 180;

type SocialMetadataInput = {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  imageAlt?: string;
};

export function trimSocialDescription(value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= DESCRIPTION_LIMIT) return normalized;
  return `${normalized.slice(0, DESCRIPTION_LIMIT - 1).trimEnd()}…`;
}

export function buildOpenGraphMetadata(input: SocialMetadataInput): NonNullable<Metadata['openGraph']> {
  const description = trimSocialDescription(input.description);
  const title = input.title.trim();
  const alt = input.imageAlt || title || SITE_NAME;
  return {
    type: input.type ?? 'website',
    locale: LOCALE,
    siteName: SITE_NAME,
    title,
    description,
    url: input.path,
    images: [
      {
        url: SOCIAL_IMAGE,
        width: 1200,
        height: 630,
        alt,
        type: 'image/png',
      },
    ],
  };
}

export function buildTwitterMetadata(input: SocialMetadataInput): NonNullable<Metadata['twitter']> {
  const description = trimSocialDescription(input.description);
  const title = input.title.trim();
  const alt = input.imageAlt || title || SITE_NAME;
  return {
    card: 'summary_large_image',
    title,
    description,
    images: [
      {
        url: SOCIAL_IMAGE,
        alt,
        width: 1200,
        height: 630,
      },
    ],
  };
}
