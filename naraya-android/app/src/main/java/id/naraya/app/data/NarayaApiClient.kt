package id.naraya.app.data

import id.naraya.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.KSerializer
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.io.File
import java.io.FileOutputStream
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

class NarayaApiClient(
    private val sessionStore: SessionStore,
    private val origin: String = "https://naraya.biz.id",
) {
    private val apiOrigin = "$origin/api"
    private val cookieJar = NarayaCookieJar()
    private val json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        encodeDefaults = true
    }
    private val jsonType = "application/json; charset=utf-8".toMediaType()
    private val userAgent =
        "Mozilla/5.0 (Linux; Android 15; Naraya Native) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36"

    private val client = OkHttpClient.Builder()
        .cookieJar(cookieJar)
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()
    private val downloadClient = client.newBuilder()
        .readTimeout(2, TimeUnit.MINUTES)
        .build()

    suspend fun home(): HomePayload = get("/home", HomePayload.serializer())
    suspend fun latestSeries(page: Int = 1): PagedComics = get("/series/latest?page=$page", PagedComics.serializer())
    suspend fun latestComics(page: Int = 1): PagedComics = get("/comics/latest?page=$page", PagedComics.serializer())
    suspend fun genres(): PagedCatalog = get("/genres", PagedCatalog.serializer())
    suspend fun search(query: String): PagedCatalog =
        get("/search?q=${query.urlEncoded()}", PagedCatalog.serializer())

    suspend fun catalog(page: Int = 1, genre: String = "", type: String = "", status: String = ""): PagedCatalog {
        val query = mutableListOf("page=$page")
        if (genre.isNotBlank() && genre != "All") query += "genre=${genre.urlEncoded()}"
        if (type.isNotBlank() && type != "All") query += "type=${type.urlEncoded()}"
        if (status.isNotBlank() && status != "All") query += "status=${status.urlEncoded()}"
        return get("/comics/catalog?${query.joinToString("&")}", PagedCatalog.serializer())
    }

    suspend fun azCatalog(page: Int = 1, letter: String = "All"): PagedCatalog {
        val suffix = if (letter == "All") "page=$page" else "page=$page&letter=${letter.urlEncoded()}"
        return get("/comics/az?$suffix", PagedCatalog.serializer())
    }

    suspend fun comic(slug: String): ComicDetail = get("/comics/${slug.urlEncoded()}", ComicDetail.serializer())
    suspend fun series(slug: String): SeriesDetail = get("/series/${slug.urlEncoded()}", SeriesDetail.serializer())
    suspend fun chapter(slug: String): ReaderPayload = get("/chapters/${slug.urlEncoded()}", ReaderPayload.serializer())
    suspend fun episode(slug: String): EpisodePayload = get("/episodes/${slug.urlEncoded()}", EpisodePayload.serializer())
    suspend fun androidUpdateInfo(): AndroidUpdateInfo =
        request(AndroidUpdateInfo.serializer(), primeWeb = false) {
            webRequest("/download/android/version")
                .header("Cache-Control", "no-cache")
                .header("Pragma", "no-cache")
                .get()
                .build()
        }

    suspend fun videoSource(playerUrl: String): EpisodeServer =
        get(apiPath(playerUrl), EpisodeServer.serializer())

    suspend fun me(): User = get("/me", User.serializer(), authenticated = true)
    suspend fun stats(): ProfileStats = get("/me/stats", ProfileStats.serializer(), authenticated = true)
    suspend fun settings(): UserSettings = get("/settings", UserSettings.serializer(), authenticated = true)
    suspend fun updateSettings(request: UpdateSettingsRequest): UserSettings =
        patch("/settings", json.encodeToString(request), UserSettings.serializer(), authenticated = true)

    suspend fun library(section: String, type: String = "", status: String = "", cursor: String = "", limit: Int = 24): LibraryPage {
        val query = mutableListOf("section=${section.urlEncoded()}", "limit=$limit")
        if (type.isNotBlank() && type != "All") query += "type=${type.urlEncoded()}"
        if (status.isNotBlank() && status != "All") query += "status=${status.urlEncoded()}"
        if (cursor.isNotBlank()) query += "cursor=${cursor.urlEncoded()}"
        return get("/library?${query.joinToString("&")}", LibraryPage.serializer(), authenticated = true)
    }

    suspend fun favoriteStatus(slug: String): FavoriteStatus =
        get("/library/${slug.urlEncoded()}/status", FavoriteStatus.serializer(), authenticated = true)

    suspend fun saveLibrary(request: UpsertLibraryRequest): LibraryItem =
        post("/library", json.encodeToString(request), LibraryItem.serializer(), authenticated = true)

    suspend fun loveStatus(slug: String): LoveStatus =
        get("/loves/${slug.urlEncoded()}", LoveStatus.serializer(), authenticated = true)

    suspend fun love(request: LoveRequest): LoveStatus =
        post("/loves", json.encodeToString(request), LoveStatus.serializer(), authenticated = true)

    suspend fun myLoves(): LoveList = get("/loves/me", LoveList.serializer(), authenticated = true)

    suspend fun comments(comicSlug: String = "", chapterSlug: String = "", cursor: String = "", limit: Int = 10): CommentPage {
        val query = mutableListOf("limit=$limit")
        if (comicSlug.isNotBlank()) query += "comicSlug=${comicSlug.urlEncoded()}"
        if (chapterSlug.isNotBlank()) query += "chapterSlug=${chapterSlug.urlEncoded()}"
        if (cursor.isNotBlank()) query += "cursor=${cursor.urlEncoded()}"
        return get("/comments?${query.joinToString("&")}", CommentPage.serializer())
    }

    suspend fun myComments(cursor: String = "", limit: Int = 10): CommentPage {
        val query = if (cursor.isBlank()) "limit=$limit" else "limit=$limit&cursor=${cursor.urlEncoded()}"
        return get("/comments/me?$query", CommentPage.serializer(), authenticated = true)
    }

    suspend fun sendComment(request: CommentRequest): CommentItem =
        post("/comments", json.encodeToString(request), CommentItem.serializer(), authenticated = true)

    suspend fun login(identifier: String, password: String): AuthResponse {
        val response = post(
            "/auth/login",
            json.encodeToString(LoginRequest(identifier, password)),
            AuthResponse.serializer()
        )
        persistSession(response.user)
        return response
    }

    suspend fun register(request: RegisterRequest): AuthResponse {
        val response = post("/auth/register", json.encodeToString(request), AuthResponse.serializer())
        persistSession(response.user)
        return response
    }

    suspend fun logout() {
        withContext(Dispatchers.IO) {
            primeWebAccess()
            client.newCall(baseRequest("/auth/logout", authenticated = true).post(ByteArray(0).toRequestBody()).build()).execute().close()
            sessionStore.clear()
            cookieJar.clear()
        }
    }

    suspend fun downloadAndroidApk(
        targetFile: File,
        downloadUrl: String = "/download/android",
        onProgress: (Int) -> Unit = {},
    ) = withContext(Dispatchers.IO) {
        targetFile.parentFile?.mkdirs()
        val tempFile = File(targetFile.parentFile, "${targetFile.name}.part")
        val updatePath = downloadUrl.ifBlank { "/download/android" }
        downloadClient.newCall(
            webRequest(updatePath)
                .header("Accept", "application/vnd.android.package-archive,*/*")
                .get()
                .build()
        ).execute().use { response ->
            if (!response.isSuccessful) throw IOException("Naraya APK ${response.code}: ${response.body?.string().orEmpty()}")
            val body = response.body ?: throw IOException("Naraya APK response is empty")
            val total = body.contentLength().takeIf { it > 0 } ?: -1L
            body.byteStream().use { input ->
                FileOutputStream(tempFile).use { output ->
                    val buffer = ByteArray(256 * 1024)
                    var downloaded = 0L
                    var lastProgress = -1
                    while (true) {
                        val read = input.read(buffer)
                        if (read == -1) break
                        output.write(buffer, 0, read)
                        downloaded += read
                        if (total > 0) {
                            val progress = ((downloaded * 100) / total).toInt().coerceIn(0, 100)
                            if (progress != lastProgress) {
                                lastProgress = progress
                                withContext(Dispatchers.Main.immediate) { onProgress(progress) }
                            }
                        }
                    }
                }
            }
        }
        targetFile.delete()
        if (!tempFile.renameTo(targetFile)) {
            tempFile.copyTo(targetFile, overwrite = true)
            tempFile.delete()
        }
        withContext(Dispatchers.Main.immediate) { onProgress(100) }
    }

    fun mediaUrl(value: String): String {
        if (value.isBlank()) return value
        val absolute = if (value.startsWith("/api/")) "$origin$value" else value
        return withWebAccessQuery(absolute)
    }

    fun mediaHeaders(destination: String = "empty"): Map<String, String> {
        return (mapOf(
            "User-Agent" to userAgent,
            "Referer" to "$origin/",
            "Origin" to origin,
            "Sec-Fetch-Site" to "same-origin",
            "Sec-Fetch-Mode" to "cors",
            "Sec-Fetch-Dest" to destination,
            "Cookie" to cookieJar.cookieHeaderFor(origin.toHttpUrl()),
        ) + signedAppHeaders()).filterValues { it.isNotBlank() }
    }

    private suspend fun <T> get(path: String, serializer: KSerializer<T>, authenticated: Boolean = false): T =
        request(serializer) { baseRequest(path, authenticated).get().build() }

    private suspend fun <T> getWeb(path: String, serializer: KSerializer<T>, authenticated: Boolean = false, primeWeb: Boolean = true): T =
        request(serializer, primeWeb = primeWeb) { webRequest(path, authenticated).get().build() }

    private suspend fun <T> post(path: String, body: String, serializer: KSerializer<T>, authenticated: Boolean = false): T =
        request(serializer) { baseRequest(path, authenticated).post(body.toRequestBody(jsonType)).build() }

    private suspend fun <T> patch(path: String, body: String, serializer: KSerializer<T>, authenticated: Boolean = false): T =
        request(serializer) { baseRequest(path, authenticated).patch(body.toRequestBody(jsonType)).build() }

    private suspend fun <T> request(serializer: KSerializer<T>, primeWeb: Boolean = true, builder: () -> Request): T = withContext(Dispatchers.IO) {
        if (primeWeb) primeWebAccess()
        client.newCall(builder()).execute().use { response ->
            val body = response.body?.string().orEmpty()
            if (!response.isSuccessful) throw IOException("Naraya API ${response.code}: $body")
            json.decodeFromString(serializer, body)
        }
    }

    private fun baseRequest(path: String, authenticated: Boolean = false): Request.Builder {
        val url = if (path.startsWith("http")) path else "$apiOrigin$path"
        return requestBuilder(url, authenticated)
    }

    private fun webRequest(path: String, authenticated: Boolean = false): Request.Builder {
        val url = if (path.startsWith("http")) path else "$origin$path"
        return requestBuilder(url, authenticated)
    }

    private fun requestBuilder(url: String, authenticated: Boolean = false): Request.Builder {
        val builder = Request.Builder()
            .url(url)
            .header("User-Agent", userAgent)
            .header("Accept", "application/json")
            .header("Referer", "$origin/")
            .header("Origin", origin)
            .header("Sec-Fetch-Site", "same-origin")
            .header("Sec-Fetch-Mode", "cors")
            .header("Sec-Fetch-Dest", "empty")
        signedAppHeaders().forEach { (key, value) -> builder.header(key, value) }
        if (authenticated && sessionStore.sessionToken.isNotBlank()) {
            builder.header("X-Naraya-Session", sessionStore.sessionToken)
        }
        return builder
    }

    private fun signedAppHeaders(): Map<String, String> {
        val secret = BuildConfig.NARAYA_APP_ACCESS_SECRET.trim()
        if (secret.isBlank()) return emptyMap()
        val appId = BuildConfig.APPLICATION_ID
        val version = BuildConfig.VERSION_NAME
        val timestamp = (System.currentTimeMillis() / 1000L).toString()
        val payload = "$timestamp|$appId|$version|$userAgent"
        return mapOf(
            "X-Naraya-App" to appId,
            "X-Naraya-App-Version" to version,
            "X-Naraya-App-Timestamp" to timestamp,
            "X-Naraya-App-Signature" to hmacSha256(payload, secret),
        )
    }

    private fun hmacSha256(value: String, secret: String): String {
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(secret.toByteArray(StandardCharsets.UTF_8), "HmacSHA256"))
        return mac.doFinal(value.toByteArray(StandardCharsets.UTF_8)).joinToString("") { "%02x".format(it.toInt() and 0xff) }
    }

    private fun apiPath(value: String): String {
        val trimmed = value.trim()
        return when {
            trimmed.startsWith("$origin/api/") -> trimmed
            trimmed.startsWith("/api/") -> trimmed.removePrefix("/api")
            trimmed.startsWith("http") -> trimmed
            else -> trimmed
        }
    }

    private fun withWebAccessQuery(value: String): String {
        val url = value.toHttpUrlOrNull() ?: return value
        if (url.host != origin.toHttpUrl().host || !isProtectedMediaPath(url.encodedPath)) return value
        val token = cookieJar.cookiesFor(origin.toHttpUrl()).firstOrNull { it.name == "naraya_web" }?.value.orEmpty()
        if (token.isBlank()) return value
        return url.newBuilder()
            .removeAllQueryParameters("nw")
            .addQueryParameter("nw", token)
            .build()
            .toString()
    }

    private fun isProtectedMediaPath(path: String): Boolean {
        return path.startsWith("/api/videos/") || path.startsWith("/api/video-source/")
    }

    private fun persistSession(user: User) {
        sessionStore.displayName = user.displayName.ifBlank { user.username }
        cookieJar.cookiesFor(origin.toHttpUrl()).firstOrNull { it.name == "naraya_session" }?.let {
            sessionStore.sessionToken = it.value
        }
    }

    private fun primeWebAccess() {
        val hasWebCookie = cookieJar.cookiesFor(origin.toHttpUrl()).any { it.name == "naraya_web" }
        if (hasWebCookie) return
        val request = Request.Builder()
            .url(origin)
            .header("User-Agent", userAgent)
            .header("Accept", "text/html,application/xhtml+xml")
            .build()
        client.newCall(request).execute().close()
    }

    private fun String.urlEncoded(): String = URLEncoder.encode(this, StandardCharsets.UTF_8.name())
}

private class NarayaCookieJar : CookieJar {
    private val store = ConcurrentHashMap<String, MutableList<Cookie>>()

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        val key = url.host
        val current = store[key].orEmpty().filterNot { old -> cookies.any { it.name == old.name } }.toMutableList()
        current += cookies
        store[key] = current
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val now = System.currentTimeMillis()
        val cookies = store[url.host].orEmpty().filter { it.expiresAt > now }
        store[url.host] = cookies.toMutableList()
        return cookies
    }

    fun cookiesFor(url: HttpUrl): List<Cookie> = loadForRequest(url)
    fun cookieHeaderFor(url: HttpUrl): String = loadForRequest(url).joinToString("; ") { "${it.name}=${it.value}" }
    fun clear() = store.clear()
}
