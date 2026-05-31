import { pageURL, withContext } from './utils';

export interface BreadcrumbItemInput {
  name: string;
  path: string;
}

export interface ListItemSchema {
  '@type': 'ListItem';
  position: number;
  name: string;
  item?: string;
}

export interface BreadcrumbListSchema {
  '@type': 'BreadcrumbList';
  itemListElement: ListItemSchema[];
}

export function buildBreadcrumbSchema(items: BreadcrumbItemInput[]): (BreadcrumbListSchema & { '@context': 'https://schema.org' }) | undefined {
  const itemListElement = items
    .filter((item) => item.name.trim() && item.path.trim())
    .map((item, index, list): ListItemSchema => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: index === list.length - 1 ? undefined : pageURL(item.path),
    }));

  if (itemListElement.length < 2) return undefined;
  return withContext<BreadcrumbListSchema>({
    '@type': 'BreadcrumbList',
    itemListElement,
  });
}
