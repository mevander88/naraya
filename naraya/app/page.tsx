import { HomeClient } from './home-client';
import { getHomeData } from './data';

export default async function Page() {
  const home = await getHomeData();
  const heroItems = home.featured.length ? home.featured : [...home.series.slice(0, 8), ...home.comics.slice(0, 8)];
  const genres = home.genres
    .map((genre) => ({
      title: genre.title || genre.slug.replaceAll('-', ' '),
      count: Number(String(genre.count ?? '0').replace(/[^\d]/g, '')) || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .map((genre) => genre.title);

  return <HomeClient heroItems={heroItems} comics={home.comics} series={home.series} genres={genres} />;
}
