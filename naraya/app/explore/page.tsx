import { getCatalogItems, getGenresFromApi } from '../data';
import type { Metadata } from 'next';
import { ExploreClient } from './explore-client';

export const metadata: Metadata = {
  title: 'Explore Komik dan Anime',
  description: 'Cari komik dan anime Naraya berdasarkan judul, tipe, status, dan genre.',
  alternates: { canonical: '/explore' },
  openGraph: {
    title: 'Explore Komik dan Anime | Naraya',
    description: 'Temukan bacaan dan tontonan baru, filter genre, lalu buka detail di Naraya.',
    url: '/explore',
  },
};

export default async function ExplorePage({ searchParams }: { searchParams: { q?: string; genre?: string; type?: string; status?: string; order?: string; page?: string } }) {
  const query = searchParams.q?.trim() ?? '';
  const activeGenre = searchParams.genre ?? 'All';
  const activeType = searchParams.type ?? 'All';
  const activeStatus = searchParams.status ?? 'All';
  const [catalogPage, availableGenres] = await Promise.all([getCatalogItems(1, { genre: activeGenre, type: activeType, status: activeStatus }), getGenresFromApi()]);
  const genres = ['All', ...availableGenres];

  return (
    <ExploreClient
      initialItems={catalogPage.items}
      initialPage={catalogPage.page}
      totalPages={catalogPage.totalPages}
      genres={genres}
      initialFilters={{ genre: activeGenre, type: activeType, status: activeStatus, query }}
    />
  );
}
