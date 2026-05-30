import { getHomeData } from '../data';
import { renderHomeAmp } from './amp-html';

export const revalidate = 300;

export async function GET() {
  const home = await getHomeData();
  const featured = home.featured.length ? home.featured : [...home.series.slice(0, 4), ...home.comics.slice(0, 4)];
  return renderHomeAmp(featured, home.comics, home.series);
}
