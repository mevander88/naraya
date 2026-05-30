import { notFound } from 'next/navigation';
import { getComicDetail } from '../../../data';
import { renderComicAmp } from '../../amp-html';

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const detail = await getComicDetail(slug);
  if (!detail) notFound();
  return renderComicAmp(detail);
}
