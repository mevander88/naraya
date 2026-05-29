export type ComicCardData = {
  slug: string;
  title: string;
  meta: string;
  episode: string;
  image: string;
  kind?: string;
  badge?: string;
  latestChapterSlug?: string;
};

export type ChapterData = {
  slug: string;
  title: string;
  number: string;
  url: string;
  date?: string;
};

export type ComicDetailData = {
  slug: string;
  title: string;
  url: string;
  cover: string;
  description: string;
  type: string;
  status: string;
  genres: string[];
  info: InfoRowData[];
  chapters: ChapterData[];
};

export type ReaderData = {
  slug: string;
  title: string;
  comicSlug?: string;
  images: string[];
};

export type SeriesEpisodeData = {
  slug: string;
  title: string;
  number: string;
  url: string;
  date?: string;
};

export type InfoRowData = {
  label: string;
  value: string;
};

export type SeriesDetailData = {
  slug: string;
  title: string;
  url: string;
  cover: string;
  description: string;
  genres: string[];
  info: InfoRowData[];
  episodes: SeriesEpisodeData[];
};

export type EpisodeServerData = {
  type: string;
  host: string;
  url: string;
  direct?: boolean;
};

export type EpisodeDownloadData = {
  resolution: string;
  links: InfoRowData[];
};

export type EpisodeReaderData = {
  slug: string;
  title: string;
  seriesSlug?: string;
  cover: string;
  playerUrl: string;
  servers: EpisodeServerData[];
  downloads: EpisodeDownloadData[];
};

type ApiComic = {
  slug: string;
  title: string;
  cover: string;
  type: string;
  status: string;
  updatedAt: string;
  kind?: string;
  latestChapter?: {
    slug: string;
    title: string;
    number: string;
  };
};

export type CatalogItem = {
  slug: string;
  url?: string;
  title?: string;
  cover?: string;
  type?: string;
  status?: string;
  genres?: string[];
  description?: string;
  lastMod: string;
  kind: string;
  count?: string;
};

export type InternalUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  role: string;
};

export type UserSettings = {
  userId: string;
  immersiveMode: boolean;
  autoBookmark: boolean;
  matureFilter: boolean;
  highQualityImages: boolean;
  updatedAt: string;
};

export type LibraryItem = {
  id: string;
  comicSlug: string;
  comicTitle: string;
  contentKind?: string;
  coverUrl: string;
  latestChapterSlug: string;
  lastChapterSlug: string;
  lastChapterTitle: string;
  status: string;
  progressPercent: number;
  isBookmarked: boolean;
  updatedAt: string;
  lastReadAt?: string;
};

export type CommentItem = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  role?: string;
  comicSlug: string;
  chapterSlug: string;
  body: string;
  createdAt: string;
};

const fallbackUser: InternalUser = {
  id: '00000000-0000-0000-0000-000000000001',
  username: 'nara_reader',
  displayName: 'Nara Reader',
  avatarUrl: '/logo.svg',
  bio: 'Akun pembaca Naraya.',
  role: 'reader',
};

const fallbackSettings: UserSettings = {
  userId: fallbackUser.id,
  immersiveMode: true,
  autoBookmark: true,
  matureFilter: false,
  highQualityImages: true,
  updatedAt: '',
};

function apiBaseURL() {
  if (process.env.NARAYA_API_URL) {
    return process.env.NARAYA_API_URL;
  }
  return process.env.NODE_ENV === 'production' ? 'https://naraya.biz.id/api' : 'http://127.0.0.1:4000/api';
}

function apiOrigin() {
  return apiBaseURL().replace(/\/api\/?$/, '');
}

function mediaURL(value: string) {
  if (value.startsWith('/api/')) {
    return `${apiOrigin()}${value}`;
  }
  return value;
}

function authHeaders(): Record<string, string> {
  const session = cookies().get('naraya_session')?.value;
  return session ? { 'X-Naraya-Session': session } : { 'X-Naraya-User-ID': fallbackUser.id };
}

export function titleFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function getLatestComics(page = 1): Promise<ComicCardData[]> {
  try {
    const response = await fetch(`${apiBaseURL()}/comics/latest?page=${page}`, {
      next: { revalidate: 120 },
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    const payload = (await response.json()) as { items?: ApiComic[] };
    const items = payload.items ?? [];
    if (!items.length) {
      return [];
    }

    return items.map((item, index) => ({
      slug: item.slug,
      title: item.title,
      image: mediaURL(item.cover),
      meta: [item.type, item.status].filter(Boolean).join(' - '),
      episode: item.latestChapter?.title ?? item.updatedAt,
      kind: item.kind || 'comic',
      latestChapterSlug: item.latestChapter?.slug,
      badge: index === 0 ? '#1 Update' : undefined,
    }));
  } catch {
    return [];
  }
}

export async function getLatestSeries(page = 1): Promise<ComicCardData[]> {
  try {
    const response = await fetch(`${apiBaseURL()}/series/latest?page=${page}`, {
      next: { revalidate: 120 },
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    const payload = (await response.json()) as { items?: ApiComic[] };
    return (payload.items ?? []).map((item, index) => ({
      slug: item.slug,
      title: item.title,
      image: mediaURL(item.cover),
      meta: [item.type || 'Anime', item.status].filter(Boolean).join(' - '),
      episode: item.latestChapter?.title ?? item.updatedAt,
      kind: 'series',
      latestChapterSlug: item.latestChapter?.slug,
      badge: index === 0 ? '#1 Anime' : undefined,
    }));
  } catch {
    return [];
  }
}

type HomePayload = {
  featured?: ApiComic[];
  comics?: ApiComic[];
  series?: ApiComic[];
  genres?: CatalogItem[];
};

function mapApiComic(item: ApiComic, index: number, fallbackKind: string, badge?: string): ComicCardData {
  return {
    slug: item.slug,
    title: item.title,
    image: mediaURL(item.cover),
    meta: [item.type || (fallbackKind === 'series' ? 'Anime' : ''), item.status].filter(Boolean).join(' - '),
    episode: item.latestChapter?.title ?? item.updatedAt,
    kind: item.kind || fallbackKind,
    latestChapterSlug: item.latestChapter?.slug,
    badge: index === 0 ? badge : undefined,
  };
}

export async function getHomeData(): Promise<{ featured: ComicCardData[]; comics: ComicCardData[]; series: ComicCardData[]; genres: CatalogItem[] }> {
  try {
    const response = await fetch(`${apiBaseURL()}/home`, {
      next: { revalidate: 120 },
    });
    if (!response.ok) {
      return { featured: [], comics: [], series: [], genres: [] };
    }
    const payload = (await response.json()) as HomePayload;
    return {
      featured: (payload.featured ?? []).map((item, index) => mapApiComic(item, index, item.kind || 'comic', '#Featured')),
      comics: (payload.comics ?? []).map((item, index) => mapApiComic(item, index, 'comic', '#1 Komik')),
      series: (payload.series ?? []).map((item, index) => mapApiComic(item, index, 'series', '#1 Anime')),
      genres: payload.genres ?? [],
    };
  } catch {
    return { featured: [], comics: [], series: [], genres: [] };
  }
}

export async function getCatalogItems(page = 1, filters: { genre?: string; type?: string; status?: string } = {}): Promise<{ page: number; totalPages: number; items: CatalogItem[] }> {
  try {
    const query = new URLSearchParams({ page: String(page) });
    if (filters.genre && filters.genre !== 'All') query.set('genre', filters.genre);
    if (filters.type && filters.type !== 'All') query.set('type', filters.type);
    if (filters.status && filters.status !== 'All') query.set('status', filters.status);
    const response = await fetch(`${apiBaseURL()}/comics/catalog?${query.toString()}`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      return { page, totalPages: 1, items: [] };
    }
    const payload = (await response.json()) as { page: number; totalPages: number; items: CatalogItem[] };
    return {
      ...payload,
      items: (payload.items ?? []).map((item) => ({
        ...item,
        cover: item.cover ? mediaURL(item.cover) : item.cover,
        description: '',
      })),
    };
  } catch {
    return { page, totalPages: 1, items: [] };
  }
}

export async function getAZCatalogItems(page = 1, letter = 'All'): Promise<{ page: number; totalPages: number; totalItems?: string; items: CatalogItem[] }> {
  try {
    const query = new URLSearchParams({ page: String(page) });
    if (letter && letter !== 'All') query.set('letter', letter);
    const response = await fetch(`${apiBaseURL()}/comics/az?${query.toString()}`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      return { page, totalPages: 1, items: [] };
    }
    const payload = (await response.json()) as { page: number; totalPages: number; totalItems?: string; items: CatalogItem[] };
    return {
      ...payload,
      items: (payload.items ?? []).map((item) => ({
        ...item,
        cover: item.cover ? mediaURL(item.cover) : item.cover,
      })),
    };
  } catch {
    return { page, totalPages: 1, items: [] };
  }
}

export async function getMe(): Promise<InternalUser> {
  try {
    const response = await fetch(`${apiBaseURL()}/me`, {
      next: { revalidate: 60 },
      headers: authHeaders(),
    });
    if (!response.ok) {
      return fallbackUser;
    }
    return (await response.json()) as InternalUser;
  } catch {
    return fallbackUser;
  }
}

export async function getLibrary(): Promise<LibraryItem[]> {
  try {
    const response = await fetch(`${apiBaseURL()}/library`, {
      next: { revalidate: 60 },
      headers: authHeaders(),
    });
    if (!response.ok) {
      return [];
    }
    const payload = (await response.json()) as { items?: LibraryItem[] };
    return payload.items ?? [];
  } catch {
    return [];
  }
}

export async function getSettings(): Promise<UserSettings> {
  try {
    const response = await fetch(`${apiBaseURL()}/settings`, {
      next: { revalidate: 60 },
      headers: authHeaders(),
    });
    if (!response.ok) {
      return fallbackSettings;
    }
    return (await response.json()) as UserSettings;
  } catch {
    return fallbackSettings;
  }
}

export async function getComments(params: { comicSlug?: string; chapterSlug?: string }): Promise<CommentItem[]> {
  const query = new URLSearchParams();
  if (params.comicSlug) query.set('comicSlug', params.comicSlug);
  if (params.chapterSlug) query.set('chapterSlug', params.chapterSlug);
  if (!query.toString()) return [];

  try {
    const response = await fetch(`${apiBaseURL()}/comments?${query.toString()}`, {
      next: { revalidate: 30 },
    });
    if (!response.ok) {
      return [];
    }
    const payload = (await response.json()) as { items?: CommentItem[] };
    return payload.items ?? [];
  } catch {
    return [];
  }
}

export async function getComicDetail(slug: string): Promise<ComicDetailData | null> {
  try {
    const response = await fetch(`${apiBaseURL()}/comics/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    const detail = (await response.json()) as ComicDetailData;
    return { ...detail, cover: mediaURL(detail.cover) };
  } catch {
    return null;
  }
}

export async function getReader(slug: string): Promise<ReaderData | null> {
  try {
    const response = await fetch(`${apiBaseURL()}/chapters/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    const reader = (await response.json()) as ReaderData;
    return { ...reader, images: reader.images.map(mediaURL) };
  } catch {
    return null;
  }
}

export async function getSeriesDetail(slug: string): Promise<SeriesDetailData | null> {
  try {
    const response = await fetch(`${apiBaseURL()}/series/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    const detail = (await response.json()) as SeriesDetailData;
    return { ...detail, cover: mediaURL(detail.cover) };
  } catch {
    return null;
  }
}

export async function getEpisodeReader(slug: string): Promise<EpisodeReaderData | null> {
  try {
    const response = await fetch(`${apiBaseURL()}/episodes/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    const reader = (await response.json()) as EpisodeReaderData;
    return {
      ...reader,
      cover: mediaURL(reader.cover),
      playerUrl: reader.playerUrl ? mediaURL(reader.playerUrl) : reader.playerUrl,
      servers: reader.servers.map((server) => ({
        ...server,
        url: server.url ? mediaURL(server.url) : server.url,
      })),
    };
  } catch {
    return null;
  }
}

export async function getGenresFromApi(): Promise<string[]> {
  try {
    const response = await fetch(`${apiBaseURL()}/genres`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { items?: { slug: string; title?: string }[] };
    const mapped = (payload.items ?? []).map((item) => item.title || item.slug.replaceAll('-', ' ')).filter(Boolean);
    return mapped;
  } catch {
    return [];
  }
}

export async function getGenreItems(): Promise<CatalogItem[]> {
  try {
    const response = await fetch(`${apiBaseURL()}/genres`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { items?: CatalogItem[] };
    return payload.items ?? [];
  } catch {
    return [];
  }
}
import { cookies } from 'next/headers';
