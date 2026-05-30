import { notFound } from 'next/navigation';
import { getSeriesDetail } from '../../../data';
import { renderSeriesAmp } from '../../amp-html';

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const detail = await getSeriesDetail(slug);
  if (!detail) notFound();
  return renderSeriesAmp(detail);
}
