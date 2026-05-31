import { absoluteURL, DEFAULT_IMAGE, pageURL, ThingSchema, webPageRef, withContext } from './utils';

export interface ItemListEntryInput {
  name: string;
  path: string;
  image?: string;
  description?: string;
  type?: 'TVSeries' | 'ComicSeries' | 'CreativeWork';
}

export interface ItemListSchema {
  '@type': 'ItemList';
  name: string;
  description?: string;
  url: string;
  image?: string;
  mainEntityOfPage?: string | { '@type': 'WebPage'; '@id': string };
  numberOfItems: number;
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    url: string;
    item: ThingSchema;
  }[];
}

export interface ItemListInput {
  name: string;
  path: string;
  description?: string;
  items: ItemListEntryInput[];
}

export function buildItemListSchema(input: ItemListInput): (ItemListSchema & { '@context': 'https://schema.org' }) | undefined {
  const items = input.items.filter((item) => item.name.trim() && item.path.trim());
  if (!items.length) return undefined;

  return withContext<ItemListSchema>({
    '@type': 'ItemList',
    name: input.name,
    description: input.description,
    url: pageURL(input.path),
    image: DEFAULT_IMAGE,
    mainEntityOfPage: webPageRef(pageURL(input.path)),
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => {
      const url = pageURL(item.path);
      return {
        '@type': 'ListItem',
        position: index + 1,
        url,
        item: {
          '@type': item.type ?? 'CreativeWork',
          '@id': `${url}#primary`,
          name: item.name,
          url,
          image: absoluteURL(item.image),
          description: item.description,
          mainEntityOfPage: url,
        },
      };
    }),
  });
}
