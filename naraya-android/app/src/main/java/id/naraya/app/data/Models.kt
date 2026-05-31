package id.naraya.app.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class HomePayload(
    val featured: List<ComicCard> = emptyList(),
    val comics: List<ComicCard> = emptyList(),
    val series: List<ComicCard> = emptyList(),
    val genres: List<CatalogItem> = emptyList(),
)

@Serializable
data class PagedComics(
    val page: Int = 1,
    val totalPages: Int = 1,
    val items: List<ComicCard> = emptyList(),
)

@Serializable
data class PagedCatalog(
    val page: Int = 1,
    val totalPages: Int = 1,
    val totalItems: String = "",
    val items: List<CatalogItem> = emptyList(),
)

@Serializable
data class ComicCard(
    val slug: String = "",
    val title: String = "",
    val cover: String = "",
    val type: String = "",
    val status: String = "",
    val updatedAt: String = "",
    @SerialName("kind") val kind: String = "comic",
    val latestChapter: Chapter? = null,
)

@Serializable
data class CatalogItem(
    val slug: String = "",
    val title: String = "",
    val cover: String = "",
    val type: String = "",
    val status: String = "",
    val genres: List<String> = emptyList(),
    val description: String = "",
    val lastMod: String = "",
    @SerialName("kind") val kind: String = "comic",
    val count: String = "",
    val latestChapterSlug: String = "",
)

@Serializable
data class Chapter(
    val slug: String = "",
    val title: String = "",
    val number: String = "",
    val date: String = "",
)

@Serializable
data class ComicDetail(
    val slug: String = "",
    val title: String = "",
    val cover: String = "",
    val description: String = "",
    val type: String = "",
    val status: String = "",
    val genres: List<String> = emptyList(),
    val info: List<InfoRow> = emptyList(),
    val chapters: List<Chapter> = emptyList(),
)

@Serializable
data class SeriesDetail(
    val slug: String = "",
    val title: String = "",
    val cover: String = "",
    val description: String = "",
    val genres: List<String> = emptyList(),
    val info: List<InfoRow> = emptyList(),
    val episodes: List<SeriesEpisode> = emptyList(),
)

@Serializable
data class SeriesEpisode(
    val slug: String = "",
    val title: String = "",
    val number: String = "",
    val date: String = "",
)

@Serializable
data class InfoRow(
    val label: String = "",
    val value: String = "",
)

@Serializable
data class ReaderPayload(
    val slug: String = "",
    val title: String = "",
    val comicSlug: String = "",
    val images: List<String> = emptyList(),
)

@Serializable
data class EpisodePayload(
    val slug: String = "",
    val title: String = "",
    val seriesSlug: String = "",
    val cover: String = "",
    val playerUrl: String = "",
    val servers: List<EpisodeServer> = emptyList(),
    val downloads: List<EpisodeDownload> = emptyList(),
)

@Serializable
data class EpisodeServer(
    val type: String = "",
    val host: String = "",
    val url: String = "",
    val direct: Boolean = false,
)

@Serializable
data class EpisodeDownload(
    val resolution: String = "",
    val links: List<InfoRow> = emptyList(),
)

@Serializable
data class AndroidUpdateInfo(
    val platform: String = "android",
    val versionCode: Int = 1,
    val versionName: String = "1.0.0",
    val minSupportedVersionCode: Int = 1,
    val downloadUrl: String = "/download/android",
    val fileName: String = "Naraya.apk",
    val pageUrl: String = "/download",
    val sizeBytes: Long = 0,
    val updatedAt: String = "",
    val required: Boolean = false,
    val releaseNotes: List<String> = emptyList(),
)

@Serializable
data class User(
    val id: String = "",
    val username: String = "",
    val email: String = "",
    val displayName: String = "",
    val avatarUrl: String = "",
    val bio: String = "",
    val role: String = "reader",
)

@Serializable
data class AuthResponse(
    val expiresAt: String = "",
    val user: User = User(),
)

@Serializable
data class LoginRequest(
    val identifier: String,
    val password: String,
)

@Serializable
data class RegisterRequest(
    val username: String,
    val email: String,
    val displayName: String,
    val avatarUrl: String = "",
    val bio: String = "",
    val password: String,
)

@Serializable
data class ProfileStats(
    val libraryTotal: Int = 0,
    val completed: Int = 0,
    val commentTotal: Int = 0,
    val loveTotal: Int = 0,
)

@Serializable
data class UserSettings(
    val userId: String = "",
    val autoBookmark: Boolean = true,
    val matureFilter: Boolean = false,
    val highQualityImages: Boolean = true,
    val updatedAt: String = "",
)

@Serializable
data class UpdateSettingsRequest(
    val autoBookmark: Boolean? = null,
    val matureFilter: Boolean? = null,
    val highQualityImages: Boolean? = null,
)

@Serializable
data class LibraryPage(
    val items: List<LibraryItem> = emptyList(),
    val counts: LibraryCounts = LibraryCounts(),
    val nextCursor: String = "",
    val hasMore: Boolean = false,
)

@Serializable
data class LibraryCounts(
    val favorites: Int = 0,
    val history: Int = 0,
)

@Serializable
data class LibraryItem(
    val id: String = "",
    val comicSlug: String = "",
    val comicTitle: String = "",
    val contentKind: String = "comic",
    val contentStatus: String = "",
    val coverUrl: String = "",
    val latestChapterSlug: String = "",
    val lastChapterSlug: String = "",
    val lastChapterTitle: String = "",
    val status: String = "reading",
    val progressPercent: Int = 0,
    val progressCompleted: Int = 0,
    val progressTotal: Int = 0,
    val isBookmarked: Boolean = false,
    val updatedAt: String = "",
    val lastReadAt: String = "",
)

@Serializable
data class UpsertLibraryRequest(
    val comicSlug: String,
    val comicTitle: String,
    val contentKind: String,
    val contentStatus: String = "",
    val coverUrl: String = "",
    val latestChapterSlug: String = "",
    val lastChapterSlug: String = "",
    val lastChapterTitle: String = "",
    val status: String = "planned",
    val progressPercent: Int = 0,
    val progressCompleted: Int = 0,
    val progressTotal: Int = 0,
    val isBookmarked: Boolean = true,
)

@Serializable
data class FavoriteStatus(
    val targetSlug: String = "",
    val count: Int = 0,
    val favorited: Boolean = false,
)

@Serializable
data class LoveStatus(
    val targetSlug: String = "",
    val count: Int = 0,
    val loved: Boolean = false,
)

@Serializable
data class LoveRequest(
    val targetSlug: String,
    val targetTitle: String,
    val contentKind: String,
    val coverUrl: String = "",
    val targetUrl: String = "",
)

@Serializable
data class LoveItem(
    val id: String = "",
    val targetSlug: String = "",
    val targetTitle: String = "",
    val contentKind: String = "comic",
    val coverUrl: String = "",
    val targetUrl: String = "",
    val createdAt: String = "",
)

@Serializable
data class LoveList(
    val items: List<LoveItem> = emptyList(),
)

@Serializable
data class CommentPage(
    val items: List<CommentItem> = emptyList(),
    val nextCursor: String = "",
    val hasMore: Boolean = false,
    val total: Int = 0,
)

@Serializable
data class CommentItem(
    val id: String = "",
    val username: String = "",
    val displayName: String = "",
    val avatarUrl: String = "",
    val role: String = "",
    val comicSlug: String = "",
    val chapterSlug: String = "",
    val parentId: String = "",
    val parentUsername: String = "",
    val parentDisplayName: String = "",
    val parentBody: String = "",
    val body: String = "",
    val createdAt: String = "",
)

@Serializable
data class CommentRequest(
    val comicSlug: String = "",
    val chapterSlug: String = "",
    val parentId: String = "",
    val body: String,
)
