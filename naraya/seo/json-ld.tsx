import { cleanSchema } from './schema/utils';

export function JsonLd({ data }: { data: Array<object | undefined> }) {
  const schemas = cleanSchema(data.filter(Boolean));
  if (!schemas.length) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas).replace(/</g, '\\u003c') }}
    />
  );
}
