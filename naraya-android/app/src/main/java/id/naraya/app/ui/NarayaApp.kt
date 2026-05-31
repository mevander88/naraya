package id.naraya.app.ui

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import android.content.pm.ActivityInfo
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Book
import androidx.compose.material.icons.rounded.Bookmark
import androidx.compose.material.icons.rounded.Download
import androidx.compose.material.icons.rounded.Email
import androidx.compose.material.icons.rounded.Explore
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.Fullscreen
import androidx.compose.material.icons.rounded.FullscreenExit
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.KeyboardArrowDown
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material.icons.rounded.SwapVert
import androidx.compose.material.icons.rounded.Verified
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.FileProvider
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import id.naraya.app.R
import id.naraya.app.BuildConfig
import id.naraya.app.data.AndroidUpdateInfo
import id.naraya.app.data.CatalogItem
import id.naraya.app.data.Chapter
import id.naraya.app.data.CommentRequest
import id.naraya.app.data.ComicCard
import id.naraya.app.data.ComicDetail
import id.naraya.app.data.EpisodePayload
import id.naraya.app.data.LibraryItem
import id.naraya.app.data.NarayaApiClient
import id.naraya.app.data.RegisterRequest
import id.naraya.app.data.SeriesDetail
import id.naraya.app.data.SessionStore
import id.naraya.app.data.UpdateSettingsRequest
import id.naraya.app.data.UpsertLibraryRequest
import id.naraya.app.notify.NarayaNotifications
import id.naraya.app.playback.NarayaPipController
import id.naraya.app.playback.NarayaPlaybackService
import id.naraya.app.ui.theme.NarayaBackground
import id.naraya.app.ui.theme.NarayaPrimary
import id.naraya.app.ui.theme.NarayaSurface
import id.naraya.app.ui.theme.NarayaSurfaceHigh
import id.naraya.app.ui.theme.NarayaText
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout
import java.io.File
import java.time.Instant
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

private object Routes {
    const val Home = "home"
    const val Explore = "explore"
    const val ExploreWithGenre = "explore?genre={genre}"
    const val Index = "index"
    const val Library = "library"
    const val Profile = "profile"
    const val Settings = "settings"
    const val Login = "login"
    const val Register = "register"
    const val Comic = "komik/{slug}"
    const val Series = "series/{slug}"
    const val Reader = "baca/{slug}"
    const val Watch = "nonton/{slug}"
}

@Composable
fun NarayaApp(api: NarayaApiClient, sessionStore: SessionStore, isInPictureInPictureMode: Boolean = false) {
    val nav = rememberNavController()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var splashActive by remember { mutableStateOf(true) }
    var splashMounted by remember { mutableStateOf(true) }
    val backStack by nav.currentBackStackEntryAsState()
    val route = backStack?.destination?.route.orEmpty()
    val showBottom = route in setOf(Routes.Home, Routes.Explore, Routes.ExploreWithGenre, Routes.Index, Routes.Library, Routes.Profile)
    var updateInfo by remember { mutableStateOf<AndroidUpdateInfo?>(null) }
    var updateProgress by remember { mutableIntStateOf(0) }
    var updating by remember { mutableStateOf(false) }
    var updateMessage by remember { mutableStateOf("") }
    var updateDismissed by remember { mutableStateOf(false) }
    var pendingUpdateNotification by remember { mutableStateOf<AndroidUpdateInfo?>(null) }
    val notificationPermissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        sessionStore.notificationPermissionAsked = true
        val info = pendingUpdateNotification
        if (granted && info != null) {
            NarayaNotifications.showUpdateAvailable(context, sessionStore, info)
        }
        pendingUpdateNotification = null
    }

    LaunchedEffect(Unit) {
        launch {
            delay(1_450)
            splashActive = false
            delay(360)
            splashMounted = false
        }
        if (BuildConfig.ENABLE_IN_APP_UPDATER) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                !sessionStore.notificationPermissionAsked &&
                !NarayaNotifications.canPostNotifications(context)
            ) {
                sessionStore.notificationPermissionAsked = true
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
            runCatching { api.androidUpdateInfo() }.onSuccess { info ->
                if (info.versionCode > BuildConfig.VERSION_CODE || BuildConfig.VERSION_CODE < info.minSupportedVersionCode) {
                    updateInfo = info
                    updateDismissed = !info.required && sessionStore.dismissedUpdateVersionCode == info.versionCode
                    if (NarayaNotifications.canPostNotifications(context)) {
                        NarayaNotifications.showUpdateAvailable(context, sessionStore, info)
                    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && !sessionStore.notificationPermissionAsked) {
                        pendingUpdateNotification = info
                        sessionStore.notificationPermissionAsked = true
                        notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                    }
                }
            }
        }
    }

    Scaffold(
        containerColor = NarayaBackground,
        bottomBar = {
            if (showBottom) NarayaBottomBar(nav = nav, current = route, sessionStore = sessionStore)
        },
    ) { padding ->
        val contentModifier = if (route == Routes.Reader) Modifier else Modifier.padding(padding)
        Box(contentModifier) {
            NavHost(
                navController = nav,
                startDestination = Routes.Home,
            ) {
                composable(Routes.Home) { HomeScreen(api, nav) }
                composable(Routes.Explore) { ExploreScreen(api, nav) }
                composable(
                    Routes.ExploreWithGenre,
                    listOf(navArgument("genre") { type = NavType.StringType; defaultValue = "All" }),
                ) {
                    ExploreScreen(api, nav, it.arguments?.getString("genre").orEmpty())
                }
                composable(Routes.Index) { IndexScreen(api, nav) }
                composable(Routes.Library) { LibraryScreen(api, nav, sessionStore) }
                composable(Routes.Profile) { ProfileScreen(api, nav, sessionStore) }
                composable(Routes.Settings) { SettingsScreen(api, nav, sessionStore) }
                composable(Routes.Login) { LoginScreen(api, nav, sessionStore) }
                composable(Routes.Register) { RegisterScreen(api, nav, sessionStore) }
                composable(Routes.Comic, listOf(navArgument("slug") { type = NavType.StringType })) {
                    ComicDetailScreen(api, nav, it.arguments?.getString("slug").orEmpty())
                }
                composable(Routes.Series, listOf(navArgument("slug") { type = NavType.StringType })) {
                    SeriesDetailScreen(api, nav, it.arguments?.getString("slug").orEmpty())
                }
                composable(Routes.Reader, listOf(navArgument("slug") { type = NavType.StringType })) {
                    ReaderScreen(api, nav, sessionStore, it.arguments?.getString("slug").orEmpty())
                }
                composable(Routes.Watch, listOf(navArgument("slug") { type = NavType.StringType })) {
                    WatchScreen(api, nav, sessionStore, it.arguments?.getString("slug").orEmpty(), isInPictureInPictureMode)
                }
            }
            if (BuildConfig.ENABLE_IN_APP_UPDATER) updateInfo?.takeUnless { updateDismissed && !it.required }?.let { info ->
                UpdatePrompt(
                    info = info,
                    progress = updateProgress,
                    updating = updating,
                    message = updateMessage,
                    onDismiss = {
                        if (!info.required) {
                            sessionStore.dismissedUpdateVersionCode = info.versionCode
                            updateDismissed = true
                        }
                    },
                    onUpdate = {
                        if (!canInstallPackages(context)) {
                            updateMessage = "Aktifkan izin install aplikasi untuk Naraya, lalu tekan Update lagi."
                            openInstallPermission(context)
                            return@UpdatePrompt
                        }
                        scope.launch {
                            updating = true
                            updateMessage = "Download update..."
                            updateProgress = 0
                            runCatching {
                                val latest = runCatching { api.androidUpdateInfo() }
                                    .getOrDefault(info)
                                    .takeIf { it.versionCode >= info.versionCode }
                                    ?: info
                                updateInfo = latest
                                val apk = File(File(context.cacheDir, "updates"), latest.fileName.ifBlank { "Naraya-${latest.versionName}.apk" })
                                api.downloadAndroidApk(
                                    targetFile = apk,
                                    downloadUrl = latest.downloadUrl,
                                ) { updateProgress = it }
                                installApk(context, apk)
                            }.onSuccess {
                                updateMessage = "Installer Android sudah dibuka."
                            }.onFailure {
                                updateMessage = it.cleanMessage()
                            }
                            updating = false
                        }
                    },
                )
            }
        }
        if (splashMounted) {
            NarayaLaunchSplash(active = splashActive)
        }
    }
}

@Composable
private fun NarayaLaunchSplash(active: Boolean) {
    val alpha by animateFloatAsState(
        targetValue = if (active) 1f else 0f,
        animationSpec = tween(durationMillis = 340, easing = FastOutSlowInEasing),
        label = "splash-alpha",
    )
    val transition = rememberInfiniteTransition(label = "splash-motion")
    val pulse by transition.animateFloat(
        initialValue = 0.94f,
        targetValue = 1.06f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 980, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "splash-logo-pulse",
    )
    val halo by transition.animateFloat(
        initialValue = 0.28f,
        targetValue = 0.58f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1_180, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "splash-halo",
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .graphicsLayer { this.alpha = alpha }
            .background(
                Brush.verticalGradient(
                    listOf(
                        Color(0xFF0F0D16),
                        NarayaBackground,
                        Color(0xFF211A2C),
                    ),
                ),
            ),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            Box(contentAlignment = Alignment.Center, modifier = Modifier.size(142.dp)) {
                Box(
                    modifier = Modifier
                        .size(128.dp)
                        .graphicsLayer {
                            scaleX = pulse
                            scaleY = pulse
                            this.alpha = halo
                        }
                        .background(NarayaPrimary.copy(alpha = 0.18f), RoundedCornerShape(36.dp)),
                )
                Box(
                    modifier = Modifier
                        .size(104.dp)
                        .background(NarayaSurface.copy(alpha = 0.96f), RoundedCornerShape(30.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Image(
                        painter = painterResource(R.drawable.ic_launcher_foreground),
                        contentDescription = "Naraya",
                        modifier = Modifier
                            .size(92.dp)
                            .graphicsLayer {
                                scaleX = pulse
                                scaleY = pulse
                            },
                    )
                }
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Naraya", color = NarayaText, style = androidx.compose.material3.MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold)
                Text("Anime • Komik • Reader", color = NarayaPrimary, fontWeight = FontWeight.SemiBold)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(7.dp), verticalAlignment = Alignment.CenterVertically) {
                repeat(3) { index ->
                    val dot by transition.animateFloat(
                        initialValue = if (index == 0) 1f else 0.42f,
                        targetValue = if (index == 0) 0.42f else 1f,
                        animationSpec = infiniteRepeatable(
                            animation = tween(durationMillis = 720 + index * 120, easing = FastOutSlowInEasing),
                            repeatMode = RepeatMode.Reverse,
                        ),
                        label = "splash-dot-$index",
                    )
                    Box(
                        modifier = Modifier
                            .size(7.dp)
                            .graphicsLayer { this.alpha = dot }
                            .background(NarayaPrimary, RoundedCornerShape(999.dp)),
                    )
                }
            }
        }
    }
}

@Composable
private fun NarayaBottomBar(nav: NavHostController, current: String, sessionStore: SessionStore) {
    val items = listOf(
        Triple(Routes.Home, "Home", Icons.Rounded.Home),
        Triple(Routes.Index, "Indeks", Icons.Rounded.Search),
        Triple(Routes.Explore, "Explore", Icons.Rounded.Explore),
        Triple(Routes.Library, "Rak", Icons.Rounded.Bookmark),
        Triple(Routes.Profile, if (sessionStore.sessionToken.isBlank()) "Login" else "Profile", Icons.Rounded.Person),
    )
    NavigationBar(containerColor = NarayaSurface.copy(alpha = 0.98f)) {
        items.forEach { (route, label, icon) ->
            NavigationBarItem(
                selected = current == route || (route == Routes.Explore && current == Routes.ExploreWithGenre),
                onClick = { nav.navigateTopLevel(route) },
                icon = { Icon(icon, contentDescription = label) },
                label = { Text(label) },
            )
        }
    }
}

@Composable
private fun UpdatePrompt(
    info: AndroidUpdateInfo,
    progress: Int,
    updating: Boolean,
    message: String,
    onDismiss: () -> Unit,
    onUpdate: () -> Unit,
) {
    Dialog(onDismissRequest = { if (!updating && !info.required) onDismiss() }) {
        Card(
            colors = CardDefaults.cardColors(containerColor = NarayaSurface.copy(alpha = 0.98f)),
            shape = RoundedCornerShape(24.dp),
        ) {
            Column(Modifier.fillMaxWidth().padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .background(NarayaPrimary.copy(alpha = 0.16f), RoundedCornerShape(16.dp)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Rounded.Download, contentDescription = null, tint = NarayaPrimary)
                    }
                    Column(Modifier.weight(1f)) {
                        Text("Update Naraya tersedia", color = NarayaPrimary, fontWeight = FontWeight.Bold)
                        Text("Versi ${info.versionName}", fontWeight = FontWeight.ExtraBold)
                    }
                }
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    info.releaseNotes.take(4).forEach { note ->
                        Text(
                            "• $note",
                            color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant,
                            style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                        )
                    }
                }
                if (message.isNotBlank()) Text(message, color = NarayaPrimary, fontWeight = FontWeight.SemiBold)
                if (updating) {
                    Text("Download $progress%", color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                    if (!info.required) {
                        Button(
                            onClick = onDismiss,
                            enabled = !updating,
                            modifier = Modifier.weight(1f),
                            colors = narayaSurfaceButtonColors(),
                        ) {
                            Text("Nanti")
                        }
                    }
                    Button(
                        onClick = onUpdate,
                        enabled = !updating,
                        modifier = Modifier.weight(if (info.required) 1f else 1.35f),
                        colors = narayaPrimaryButtonColors(),
                    ) {
                        Text(if (updating) "Menyiapkan..." else "Download")
                    }
                }
            }
        }
    }
}

@Composable
private fun HomeScreen(api: NarayaApiClient, nav: NavHostController) {
    var state by remember { mutableStateOf<UiState<id.naraya.app.data.HomePayload>>(UiState.Loading) }
    var heroIndex by remember { mutableIntStateOf(0) }
    LaunchedEffect(Unit) {
        state = runCatching { api.home() }.fold({ UiState.Ready(it) }, { UiState.Error(it.cleanMessage()) })
    }
    when (val value = state) {
        UiState.Loading -> LoadingSurface()
        is UiState.Error -> ErrorSurface(value.message, onRetry = { state = UiState.Loading })
        is UiState.Ready -> {
            val payload = value.value
            val heroItems = payload.featured.ifEmpty { payload.series.take(8) + payload.comics.take(8) }
            val slides = heroItems.take(8)
            val genres = payload.genres.map { it.title.ifBlank { it.slug } }.filter { it.isNotBlank() }
            LazyColumn(contentPadding = PaddingValues(bottom = 24.dp)) {
                item {
                    HeroBanner(
                        api = api,
                        item = slides.getOrNull(heroIndex),
                        onOpen = { nav.openDetail(it) },
                        onLatest = { nav.openLatest(it) },
                    )
                }
                if (slides.isNotEmpty()) {
                    item {
                        HeroControlRail(
                            api = api,
                            slides = slides,
                            activeIndex = heroIndex,
                            onSelect = { heroIndex = it },
                            onLatest = { nav.openLatest(it) },
                            modifier = Modifier.padding(top = 0.dp),
                        )
                    }
                }
                item { ContentRail("Sorotan Utama", heroItems.take(18), api, onOpen = { nav.openDetail(it) }) }
                if (genres.isNotEmpty()) {
                    item { GenreChips(genres = genres) { genre -> nav.navigate("explore?genre=${java.net.URLEncoder.encode(genre, "UTF-8")}") } }
                }
                item { ContentRail("Anime Indo Terbaru", payload.series, api, onOpen = { nav.openDetail(it) }) }
                item { ContentRail("Komik Trending", payload.comics.take(18), api, onOpen = { nav.openDetail(it) }) }
                item { ContentRail("Update Komik Terbaru", payload.comics, api, onOpen = { nav.openLatest(it) }) }
                item { ContentRail("Update Anime Indo Terbaru", payload.series, api, onOpen = { nav.openLatest(it) }) }
            }
        }
    }
}

@Composable
private fun ExploreScreen(api: NarayaApiClient, nav: NavHostController, initialGenre: String = "All") {
    var query by remember { mutableStateOf("") }
    var genre by remember(initialGenre) { mutableStateOf(initialGenre.ifBlank { "All" }) }
    var type by remember { mutableStateOf("All") }
    var status by remember { mutableStateOf("All") }
    var page by remember { mutableIntStateOf(1) }
    var totalPages by remember { mutableIntStateOf(1) }
    var items by remember { mutableStateOf<List<CatalogItem>>(emptyList()) }
    var state by remember { mutableStateOf<UiState<Unit>>(UiState.Loading) }
    var loadingMore by remember { mutableStateOf(false) }
    val typeOptions = listOf("All", "Anime", "MANGA", "MANHUA", "MANHWA", "ONE-SHOT")
    val statusOptions = listOf("All", "On-Going", "Completed")
    val genres = remember { mutableStateOf(listOf("All")) }

    LaunchedEffect(Unit) {
        runCatching { api.genres().items.map { item -> item.title.ifBlank { item.slug } }.filter { it.isNotBlank() } }
            .onSuccess { values -> genres.value = (listOf("All") + values).distinct() }
    }

    LaunchedEffect(genre, type, status, query) {
        state = UiState.Loading
        page = 1
        totalPages = 1
        val normalizedType = if (type == "Anime") "anime" else type
        val normalizedStatus = when (status) {
            "On-Going" -> "on-going"
            "Completed" -> "completed"
            else -> status
        }
        val result = runCatching {
            if (query.isBlank()) {
                api.catalog(page = 1, genre = genre, type = normalizedType, status = normalizedStatus)
            } else {
                val searched = api.search(query)
                searched.copy(items = searched.items.filter { item ->
                    val genreMatch = genre == "All" || item.genres.any { it.equals(genre, ignoreCase = true) }
                    val typeMatch = type == "All" ||
                        (type == "Anime" && (item.kind == "series" || item.type.equals("anime", ignoreCase = true))) ||
                        item.type.equals(type, ignoreCase = true)
                    val statusMatch = status == "All" || item.status.equals(status, ignoreCase = true) || item.status.equals(normalizedStatus, ignoreCase = true)
                    genreMatch && typeMatch && statusMatch
                })
            }
        }
        result
            .onSuccess {
                items = it.items
                page = it.page
                totalPages = it.totalPages.coerceAtLeast(1)
                state = UiState.Ready(Unit)
            }
            .onFailure { state = UiState.Error(it.cleanMessage()) }
    }
    ScreenShell(title = "Explore") {
        LazyVerticalGrid(
            columns = GridCells.Adaptive(280.dp),
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item(span = { GridItemSpan(maxLineSpan) }) {
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Cari anime atau komik") },
                )
            }
            item(span = { GridItemSpan(maxLineSpan) }) {
                ExploreFilterPanel(
                    genre = genre,
                    genres = genres.value,
                    status = status,
                    statusOptions = statusOptions,
                    type = type,
                    typeOptions = typeOptions,
                    onGenreChange = { genre = it },
                    onStatusChange = { status = it },
                    onTypeChange = { type = it },
                )
            }
            when (val value = state) {
                UiState.Loading -> item(span = { GridItemSpan(maxLineSpan) }) { LoadingSurface(Modifier.height(360.dp)) }
                is UiState.Error -> item(span = { GridItemSpan(maxLineSpan) }) { ErrorSurface(value.message, onRetry = { state = UiState.Loading }) }
                is UiState.Ready -> {
                    items(items) { item -> CatalogCard(api, item, onClick = { nav.openCatalog(item) }) }
                    if (query.isBlank() && page < totalPages) {
                        item(span = { GridItemSpan(maxLineSpan) }) {
                            Button(
                                onClick = {
                                    if (loadingMore) return@Button
                                    loadingMore = true
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = narayaSurfaceButtonColors(),
                            ) { Text(if (loadingMore) "Memuat..." else "Muat lagi") }
                        }
                    }
                }
            }
        }
    }
    LaunchedEffect(loadingMore) {
        if (!loadingMore) return@LaunchedEffect
        val normalizedType = if (type == "Anime") "anime" else type
        val normalizedStatus = when (status) {
            "On-Going" -> "on-going"
            "Completed" -> "completed"
            else -> status
        }
        runCatching { api.catalog(page = page + 1, genre = genre, type = normalizedType, status = normalizedStatus) }
            .onSuccess {
                items = (items + it.items).distinctBy { item -> item.slug }
                page = it.page
                totalPages = it.totalPages.coerceAtLeast(1)
            }
        loadingMore = false
    }
}

@Composable
private fun ExploreFilterPanel(
    genre: String,
    genres: List<String>,
    status: String,
    statusOptions: List<String>,
    type: String,
    typeOptions: List<String>,
    onGenreChange: (String) -> Unit,
    onStatusChange: (String) -> Unit,
    onTypeChange: (String) -> Unit,
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = NarayaSurface),
        shape = RoundedCornerShape(24.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            ExploreFilterDropdown(
                label = "Genre",
                value = genre,
                values = genres,
                optionLabel = { if (it == "All") "Semua Genre" else it },
                onChange = onGenreChange,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                ExploreFilterDropdown(
                    label = "Status",
                    value = status,
                    values = statusOptions,
                    optionLabel = { if (it == "All") "Semua Status" else it },
                    onChange = onStatusChange,
                    modifier = Modifier.weight(1f),
                )
                ExploreFilterDropdown(
                    label = "Tipe",
                    value = type,
                    values = typeOptions,
                    optionLabel = { if (it == "All") "Semua Tipe" else it },
                    onChange = onTypeChange,
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}

@Composable
private fun ExploreFilterDropdown(
    label: String,
    value: String,
    values: List<String>,
    optionLabel: (String) -> String,
    onChange: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var expanded by remember { mutableStateOf(false) }
    Column(modifier, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(label, color = NarayaPrimary, fontWeight = FontWeight.Bold, style = androidx.compose.material3.MaterialTheme.typography.bodySmall)
        Box {
            Button(
                onClick = { expanded = true },
                modifier = Modifier.fillMaxWidth(),
                colors = narayaSurfaceButtonColors(),
                shape = RoundedCornerShape(16.dp),
            ) {
                Text(optionLabel(value), modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Spacer(Modifier.width(6.dp))
                Icon(Icons.Rounded.KeyboardArrowDown, contentDescription = null, tint = NarayaPrimary)
            }
            DropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false },
                modifier = Modifier.background(NarayaSurfaceHigh),
            ) {
                values.distinct().forEach { option ->
                    DropdownMenuItem(
                        text = {
                            Text(
                                optionLabel(option),
                                color = if (option == value) NarayaPrimary else NarayaText,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        },
                        onClick = {
                            onChange(option)
                            expanded = false
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun IndexScreen(api: NarayaApiClient, nav: NavHostController) {
    var letter by remember { mutableStateOf("All") }
    var state by remember { mutableStateOf<UiState<List<CatalogItem>>>(UiState.Loading) }
    LaunchedEffect(letter) {
        state = runCatching { api.azCatalog(letter = letter).items }.fold({ UiState.Ready(it) }, { UiState.Error(it.cleanMessage()) })
    }
    ScreenShell(title = "Indeks") {
        FilterRow("Huruf", listOf("All") + ('A'..'Z').map { it.toString() }, letter) { letter = it }
        when (val value = state) {
            UiState.Loading -> LoadingSurface()
            is UiState.Error -> ErrorSurface(value.message, onRetry = { state = UiState.Loading })
            is UiState.Ready -> LazyColumn(contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(value.value) { item -> CatalogCard(api, item, onClick = { nav.openCatalog(item) }) }
            }
        }
    }
}

@Composable
private fun LibraryScreen(api: NarayaApiClient, nav: NavHostController, sessionStore: SessionStore) {
    if (sessionStore.sessionToken.isBlank()) {
        LoginRequired(nav)
        return
    }
    var section by remember { mutableStateOf("favorites") }
    var type by remember { mutableStateOf("All") }
    var status by remember { mutableStateOf("All") }
    var state by remember { mutableStateOf<UiState<id.naraya.app.data.LibraryPage>>(UiState.Loading) }
    var loadingMore by remember { mutableStateOf(false) }
    fun libraryStatusQuery(): String = when {
        status == "All" -> ""
        section == "favorites" && status == "Ongoing" -> "ongoing"
        section == "favorites" && status == "Complete" -> "completed"
        status == "Berjalan" -> "reading"
        status == "Selesai" -> "completed"
        else -> status
    }
    fun libraryTypeQuery(): String = when (type) {
        "Anime" -> "anime"
        "Komik" -> "comic"
        else -> ""
    }

    LaunchedEffect(section, type, status) {
        loadingMore = false
        state = UiState.Loading
        state = runCatching { api.library(section, type = libraryTypeQuery(), status = libraryStatusQuery()) }
            .fold({ UiState.Ready(it) }, { UiState.Error(it.cleanMessage()) })
    }

    LaunchedEffect(loadingMore) {
        if (!loadingMore) return@LaunchedEffect
        val current = (state as? UiState.Ready)?.value
        if (current == null || !current.hasMore || current.nextCursor.isBlank()) {
            loadingMore = false
            return@LaunchedEffect
        }
        runCatching {
            api.library(
                section,
                type = libraryTypeQuery(),
                status = libraryStatusQuery(),
                cursor = current.nextCursor,
            )
        }.onSuccess { next ->
            state = UiState.Ready(next.copy(items = (current.items + next.items).distinctBy { item -> item.id.ifBlank { item.comicSlug } }))
        }
        loadingMore = false
    }

    ScreenShell(title = "Rak") {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(start = 20.dp, top = 20.dp, end = 20.dp, bottom = 112.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                LibraryFilterPanel(
                    section = section,
                    type = type,
                    status = status,
                    statusOptions = if (section == "favorites") listOf("All", "Ongoing", "Complete") else listOf("All", "Berjalan", "Selesai"),
                    onSectionChange = {
                        section = it
                        status = "All"
                    },
                    onTypeChange = { type = it },
                    onStatusChange = { status = it },
                )
            }

            when (val value = state) {
                UiState.Loading -> item { LoadingSurface(Modifier.height(280.dp)) }
                is UiState.Error -> item { ErrorSurface(value.message, onRetry = { state = UiState.Loading }) }
                is UiState.Ready -> {
                    val visibleItems = value.value.items.filter { item -> item.matchesLibraryType(type) }
                    items(visibleItems) { item ->
                        LibraryCard(api, item) {
                            val isAnime = item.isAnimeLibraryItem()
                            if (section == "favorites") {
                                if (isAnime) nav.navigate("series/${item.comicSlug}") else nav.navigate("komik/${item.comicSlug}")
                            } else if (item.lastChapterSlug.isNotBlank()) {
                                if (isAnime) nav.navigate("nonton/${item.lastChapterSlug}") else nav.navigate("baca/${item.lastChapterSlug}")
                            }
                        }
                    }
                    if (visibleItems.isEmpty() && !value.value.hasMore) {
                        item {
                            Text(
                                "Belum ada item untuk filter ini.",
                                modifier = Modifier.fillMaxWidth().padding(14.dp),
                                color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                    if (value.value.hasMore) {
                        item {
                            Button(
                                onClick = {
                                    if (loadingMore) return@Button
                                    loadingMore = true
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = narayaSurfaceButtonColors(),
                            ) {
                                Text(if (loadingMore) "Memuat..." else "Muat lagi")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun LibraryFilterPanel(
    section: String,
    type: String,
    status: String,
    statusOptions: List<String>,
    onSectionChange: (String) -> Unit,
    onTypeChange: (String) -> Unit,
    onStatusChange: (String) -> Unit,
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = NarayaSurface),
        shape = RoundedCornerShape(24.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            ExploreFilterDropdown(
                label = "Rak",
                value = section,
                values = listOf("favorites", "history"),
                optionLabel = {
                    when (it) {
                        "favorites" -> "Favorit"
                        "history" -> "Riwayat"
                        else -> it
                    }
                },
                onChange = onSectionChange,
            )
            ExploreFilterDropdown(
                label = "Tipe",
                value = type,
                values = listOf("All", "Anime", "Komik"),
                optionLabel = { if (it == "All") "Semua Tipe" else it },
                onChange = onTypeChange,
            )
            ExploreFilterDropdown(
                label = "Status",
                value = status,
                values = statusOptions,
                optionLabel = { if (it == "All") "Semua Status" else it },
                onChange = onStatusChange,
            )
        }
    }
}

@Composable
private fun ProfileAvatar(api: NarayaApiClient, user: id.naraya.app.data.User?) {
    val avatarUrl = user?.avatarUrl.orEmpty()
    Card(
        colors = CardDefaults.cardColors(containerColor = NarayaBackground),
        shape = RoundedCornerShape(22.dp),
        modifier = Modifier.size(88.dp),
    ) {
        Box(
            Modifier
                .fillMaxSize()
                .background(NarayaBackground),
            contentAlignment = Alignment.Center,
        ) {
            if (avatarUrl.isNotBlank()) {
                AsyncImage(
                    model = rememberNarayaImageModel(api, avatarUrl),
                    contentDescription = user?.displayName ?: "Profile",
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop,
                )
            } else {
                Image(
                    painter = painterResource(R.drawable.ic_launcher_foreground),
                    contentDescription = "Naraya",
                    modifier = Modifier.size(72.dp),
                    contentScale = ContentScale.Fit,
                )
            }
        }
    }
}

@Composable
private fun ProfileScreen(api: NarayaApiClient, nav: NavHostController, sessionStore: SessionStore) {
    if (sessionStore.sessionToken.isBlank()) {
        LoginRequired(nav)
        return
    }
    var userState by remember { mutableStateOf<UiState<id.naraya.app.data.User>>(UiState.Loading) }
    var statsState by remember { mutableStateOf<UiState<id.naraya.app.data.ProfileStats>>(UiState.Loading) }
    var commentsState by remember { mutableStateOf<UiState<id.naraya.app.data.CommentPage>>(UiState.Loading) }
    var lovesState by remember { mutableStateOf<UiState<id.naraya.app.data.LoveList>>(UiState.Loading) }
    var commentsExpanded by remember { mutableStateOf(false) }
    var lovesExpanded by remember { mutableStateOf(false) }
    var loadingMoreComments by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        userState = runCatching { api.me() }.fold({ UiState.Ready(it) }, { UiState.Error(it.cleanMessage()) })
        statsState = runCatching { api.stats() }.fold({ UiState.Ready(it) }, { UiState.Error(it.cleanMessage()) })
        commentsState = runCatching { api.myComments(limit = 10) }.fold({ UiState.Ready(it) }, { UiState.Error(it.cleanMessage()) })
        lovesState = runCatching { api.myLoves() }.fold({ UiState.Ready(it) }, { UiState.Error(it.cleanMessage()) })
    }
    ScreenShell(title = "Profile", trailing = { TextButton(onClick = { nav.navigate(Routes.Settings) }, colors = ButtonDefaults.textButtonColors(contentColor = NarayaPrimary)) { Text("Settings") } }) {
        LazyColumn(contentPadding = PaddingValues(start = 20.dp, top = 20.dp, end = 20.dp, bottom = 112.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            item {
                val user = (userState as? UiState.Ready)?.value
                Card(
                    colors = CardDefaults.cardColors(containerColor = NarayaSurface),
                    shape = RoundedCornerShape(24.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(0.dp)) {
                        Box(
                            Modifier
                                .fillMaxWidth()
                                .height(82.dp)
                                .background(
                                    Brush.linearGradient(
                                        listOf(
                                            Color(0xFF37333D),
                                            NarayaPrimary.copy(alpha = 0.72f),
                                            Color(0xFFFFB869),
                                        ),
                                    ),
                                ),
                        )
                        Row(
                            Modifier.padding(start = 18.dp, top = 0.dp, end = 18.dp, bottom = 18.dp),
                            verticalAlignment = Alignment.Top,
                            horizontalArrangement = Arrangement.spacedBy(14.dp),
                        ) {
                            ProfileAvatar(api = api, user = user)
                            Column(Modifier.weight(1f).padding(top = 12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Text(
                                        user?.displayName ?: sessionStore.displayName.ifBlank { "Naraya User" },
                                        modifier = Modifier.weight(1f, fill = false),
                                        style = androidx.compose.material3.MaterialTheme.typography.headlineSmall,
                                        fontWeight = FontWeight.Bold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                    )
                                    if (user?.role == "admin") {
                                        VerifiedIcon()
                                    }
                                }
                                Text("@${user?.username.orEmpty()}", color = NarayaPrimary, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                if (!user?.bio.isNullOrBlank()) {
                                    Text(
                                        user?.bio.orEmpty(),
                                        color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis,
                                    )
                                }
                            }
                        }
                    }
                }
            }
            item {
                val stats = (statsState as? UiState.Ready)?.value
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        StatCard("Library", stats?.libraryTotal ?: 0, Modifier.weight(1f))
                        StatCard("Complete", stats?.completed ?: 0, Modifier.weight(1f))
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        StatCard("Komentar", stats?.commentTotal ?: 0, Modifier.weight(1f))
                        StatCard("Love", stats?.loveTotal ?: 0, Modifier.weight(1f))
                    }
                }
            }
            item { SectionTitle("Riwayat komentar", (commentsState as? UiState.Ready)?.value?.total ?: 0) }
            val commentPage = (commentsState as? UiState.Ready)?.value
            val comments = commentPage?.items.orEmpty()
            items(if (commentsExpanded) comments else comments.take(3)) { comment -> CommentHistoryLine(comment) }
            if (comments.size > 3 || commentPage?.hasMore == true) {
                item {
                    ViewAllToggle(
                        expanded = commentsExpanded,
                        total = commentPage?.total ?: comments.size,
                        collapsedLabel = "View all komentar",
                        onClick = { commentsExpanded = !commentsExpanded },
                    )
                }
            }
            if (commentsExpanded && commentPage?.hasMore == true) {
                item {
                    Button(
                        onClick = { loadingMoreComments = true },
                        modifier = Modifier.fillMaxWidth(),
                        colors = narayaSurfaceButtonColors(),
                    ) { Text(if (loadingMoreComments) "Memuat..." else "Muat komentar lagi") }
                }
            }
            item {
                LaunchedEffect(loadingMoreComments) {
                    if (!loadingMoreComments) return@LaunchedEffect
                    val current = (commentsState as? UiState.Ready)?.value ?: return@LaunchedEffect
                    runCatching { api.myComments(cursor = current.nextCursor, limit = 10) }
                        .onSuccess { next -> commentsState = UiState.Ready(next.copy(items = current.items + next.items)) }
                    loadingMoreComments = false
                }
            }
            val loves = (lovesState as? UiState.Ready)?.value?.items.orEmpty()
            item {
                LoveHistorySection(
                    api = api,
                    nav = nav,
                    loves = loves,
                    total = (statsState as? UiState.Ready)?.value?.loveTotal ?: loves.size,
                    expanded = lovesExpanded,
                    onExpandedChange = { lovesExpanded = it },
                )
            }
        }
    }
}

@Composable
private fun SettingsScreen(api: NarayaApiClient, nav: NavHostController, sessionStore: SessionStore) {
    var state by remember { mutableStateOf<UiState<id.naraya.app.data.UserSettings>>(UiState.Loading) }
    val scope = rememberCoroutineScope()
    LaunchedEffect(Unit) {
        state = runCatching { api.settings() }.fold({ UiState.Ready(it) }, { UiState.Error(it.cleanMessage()) })
    }
    ScreenShell(title = "Settings") {
        when (val value = state) {
            UiState.Loading -> LoadingSurface()
            is UiState.Error -> ErrorSurface(value.message, onRetry = { state = UiState.Loading })
            is UiState.Ready -> {
                val settings = value.value
                LazyColumn(contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    item { AdvertiseContactCard() }
                    item { SettingButton("Auto bookmark", settings.autoBookmark) { scope.launch { state = UiState.Ready(api.updateSettings(UpdateSettingsRequest(autoBookmark = !settings.autoBookmark))) } } }
                    item { SettingButton("Mature filter", settings.matureFilter) { scope.launch { state = UiState.Ready(api.updateSettings(UpdateSettingsRequest(matureFilter = !settings.matureFilter))) } } }
                    item { SettingButton("High quality images", settings.highQualityImages) { scope.launch { state = UiState.Ready(api.updateSettings(UpdateSettingsRequest(highQualityImages = !settings.highQualityImages))) } } }
                    item {
                        Button(
                            onClick = {
                                scope.launch {
                                    runCatching { api.logout() }
                                    sessionStore.clear()
                                    nav.navigate(Routes.Login) {
                                        popUpTo(Routes.Home)
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = narayaSurfaceButtonColors(),
                        ) {
                            Text("Logout")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AdvertiseContactCard() {
    val context = LocalContext.current
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = NarayaSurface),
        shape = RoundedCornerShape(18.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { openAdvertiseEmail(context) }
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .background(NarayaPrimary.copy(alpha = 0.14f), RoundedCornerShape(14.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Rounded.Email, contentDescription = null, tint = NarayaPrimary)
            }
            Column(modifier = Modifier.weight(1f)) {
                Text("Iklan / kerja sama", color = NarayaText, fontWeight = FontWeight.Bold)
                Text(
                    "Hubungi serjkrk18@proton.me",
                    color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant,
                    style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}

@Composable
private fun LoginScreen(api: NarayaApiClient, nav: NavHostController, sessionStore: SessionStore) {
    LaunchedEffect(sessionStore.sessionToken) {
        if (sessionStore.sessionToken.isNotBlank()) nav.navigate(Routes.Profile) { popUpTo(Routes.Home) }
    }
    var identifier by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    AuthSurface("Login") {
        OutlinedTextField(identifier, { identifier = it }, placeholder = { Text("Username atau email") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(password, { password = it }, placeholder = { Text("Password") }, modifier = Modifier.fillMaxWidth(), visualTransformation = PasswordVisualTransformation())
        if (error.isNotBlank()) Text(error, color = NarayaPrimary)
        Button(onClick = {
            scope.launch {
                error = ""
                runCatching { api.login(identifier, password) }
                    .onSuccess { nav.navigate(Routes.Profile) { popUpTo(Routes.Home) } }
                    .onFailure { error = it.cleanMessage() }
            }
        }, modifier = Modifier.fillMaxWidth(), colors = narayaPrimaryButtonColors()) { Text("Login") }
        TextButton(onClick = { nav.navigate(Routes.Register) }, colors = ButtonDefaults.textButtonColors(contentColor = NarayaPrimary)) { Text("Daftar akun") }
    }
}

@Composable
private fun RegisterScreen(api: NarayaApiClient, nav: NavHostController, sessionStore: SessionStore) {
    LaunchedEffect(sessionStore.sessionToken) {
        if (sessionStore.sessionToken.isNotBlank()) nav.navigate(Routes.Profile) { popUpTo(Routes.Home) }
    }
    var username by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var displayName by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    AuthSurface("Register") {
        OutlinedTextField(username, { username = it }, placeholder = { Text("Username") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(email, { email = it }, placeholder = { Text("Email") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(displayName, { displayName = it }, placeholder = { Text("Nama tampilan") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(password, { password = it }, placeholder = { Text("Password") }, modifier = Modifier.fillMaxWidth(), visualTransformation = PasswordVisualTransformation())
        if (error.isNotBlank()) Text(error, color = NarayaPrimary)
        Button(onClick = {
            scope.launch {
                error = ""
                runCatching { api.register(RegisterRequest(username, email, displayName, password = password)) }
                    .onSuccess { nav.navigate(Routes.Profile) { popUpTo(Routes.Home) } }
                    .onFailure { error = it.cleanMessage() }
            }
        }, modifier = Modifier.fillMaxWidth(), colors = narayaPrimaryButtonColors()) { Text("Register") }
        TextButton(onClick = { nav.navigate(Routes.Login) }, colors = ButtonDefaults.textButtonColors(contentColor = NarayaPrimary)) { Text("Sudah punya akun") }
    }
}

@Composable
private fun ComicDetailScreen(api: NarayaApiClient, nav: NavHostController, slug: String) {
    var state by remember(slug) { mutableStateOf<UiState<ComicDetail>>(UiState.Loading) }
    LaunchedEffect(slug) {
        state = runCatching { api.comic(slug) }.fold({ UiState.Ready(it) }, { UiState.Error(it.cleanMessage()) })
    }
    when (val value = state) {
        UiState.Loading -> LoadingSurface()
        is UiState.Error -> ErrorSurface(value.message, onRetry = { state = UiState.Loading })
        is UiState.Ready -> ComicDetailContent(api, nav, value.value)
    }
}

@Composable
private fun SeriesDetailScreen(api: NarayaApiClient, nav: NavHostController, slug: String) {
    var state by remember(slug) { mutableStateOf<UiState<SeriesDetail>>(UiState.Loading) }
    LaunchedEffect(slug) {
        state = runCatching { api.series(slug) }.fold({ UiState.Ready(it) }, { UiState.Error(it.cleanMessage()) })
    }
    when (val value = state) {
        UiState.Loading -> LoadingSurface()
        is UiState.Error -> ErrorSurface(value.message, onRetry = { state = UiState.Loading })
        is UiState.Ready -> SeriesDetailContent(api, nav, value.value)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ReaderScreen(api: NarayaApiClient, nav: NavHostController, sessionStore: SessionStore, slug: String) {
    val context = LocalContext.current
    var state by remember(slug) { mutableStateOf<UiState<id.naraya.app.data.ReaderPayload>>(UiState.Loading) }
    var comicDetail by remember(slug) { mutableStateOf<ComicDetail?>(null) }
    var chromeVisible by remember(slug) { mutableStateOf(true) }
    var retryKey by remember(slug) { mutableIntStateOf(0) }
    LaunchedEffect(slug, retryKey) {
        state = UiState.Loading
        comicDetail = null
        runCatching { api.chapter(slug) }
            .onSuccess { reader ->
                state = UiState.Ready(reader)
                if (reader.comicSlug.isNotBlank()) {
                    runCatching { api.comic(reader.comicSlug) }
                        .onSuccess { detail ->
                            comicDetail = detail
                            if (sessionStore.sessionToken.isNotBlank() && runCatching { api.settings().autoBookmark }.getOrDefault(false)) {
                                runCatching {
                                    api.saveLibrary(
                                        UpsertLibraryRequest(
                                            comicSlug = detail.slug,
                                    comicTitle = detail.title,
                                    contentKind = "comic",
                                    contentStatus = detail.status,
                                    coverUrl = detail.cover,
                                    latestChapterSlug = detail.chapters.firstOrNull()?.slug.orEmpty(),
                                    lastChapterSlug = reader.slug,
                                    lastChapterTitle = reader.title,
                                    status = "reading",
                                    progressTotal = detail.chapters.size,
                                            isBookmarked = false,
                                        )
                                    )
                                }
                            }
                        }
                }
            }
            .onFailure { state = UiState.Error(it.cleanMessage()) }
    }
    Column(Modifier.fillMaxSize().background(NarayaBackground)) {
        if (chromeVisible) {
            TopAppBar(
                title = {
                    val title = (state as? UiState.Ready)?.value?.title ?: "Baca komik"
                    Text(title, maxLines = 1, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.Bold)
                },
                navigationIcon = {
                    androidx.compose.material3.IconButton(onClick = { nav.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Kembali", tint = NarayaPrimary)
                    }
                },
                actions = {
                    val reader = (state as? UiState.Ready)?.value
                    if (reader != null) {
                        androidx.compose.material3.IconButton(onClick = { context.share("https://naraya.biz.id/baca/${reader.slug}") }) {
                            Icon(Icons.Rounded.Share, contentDescription = "Share", tint = NarayaPrimary)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = NarayaBackground,
                    titleContentColor = NarayaText,
                    navigationIconContentColor = NarayaPrimary,
                ),
            )
        }
        when (val value = state) {
            UiState.Loading -> LoadingSurface()
            is UiState.Error -> ErrorSurface(value.message, onRetry = { retryKey++ })
            is UiState.Ready -> {
                val reader = value.value
                val chapters = comicDetail?.chapters.orEmpty()
                val currentIndex = chapters.indexOfFirst { it.slug == reader.slug }
                val previousChapter = if (currentIndex >= 0) chapters.getOrNull(currentIndex + 1) else null
                val nextChapter = if (currentIndex >= 0) chapters.getOrNull(currentIndex - 1) else null
                LazyColumn(
                    modifier = Modifier.fillMaxSize().background(NarayaBackground),
                    contentPadding = PaddingValues(bottom = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(0.dp),
                ) {
                    items(reader.images) { image ->
                        ReaderImage(
                            api = api,
                            image = image,
                            title = reader.title,
                            onToggleChrome = { chromeVisible = !chromeVisible },
                        )
                    }
                    item {
                        ReaderChapterControls(
                            previousChapter = previousChapter,
                            nextChapter = nextChapter,
                            onOpen = { chapter -> nav.navigate("baca/${chapter.slug}") },
                        )
                    }
                    item {
                        Column(Modifier.padding(horizontal = 16.dp, vertical = 18.dp)) {
                            CommentBlock(api, comicSlug = reader.comicSlug, chapterSlug = reader.slug)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ReaderImage(api: NarayaApiClient, image: String, title: String, onToggleChrome: () -> Unit) {
    var reloadKey by remember(image) { mutableIntStateOf(0) }
    var imageState by remember(image, reloadKey) { mutableStateOf("loading") }
    var slowLoading by remember(image, reloadKey) { mutableStateOf(false) }
    val loading = imageState == "loading"
    val failed = imageState == "failed"

    LaunchedEffect(image, reloadKey, loading) {
        slowLoading = false
        if (loading) {
            delay(12_000)
            if (loading) slowLoading = true
        }
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(NarayaBackground)
            .clickable { onToggleChrome() },
        contentAlignment = Alignment.Center,
    ) {
        if (loading) {
            Column(
                modifier = Modifier.fillMaxWidth().height(320.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                CircularProgressIndicator(color = NarayaPrimary)
                Spacer(Modifier.height(10.dp))
                Text(if (slowLoading) "Gambar belum terload" else "Memuat gambar", color = NarayaPrimary, fontWeight = FontWeight.Bold)
                if (slowLoading) {
                    Spacer(Modifier.height(10.dp))
                    Button(onClick = { reloadKey++ }, colors = narayaSurfaceButtonColors()) {
                        Text("Muat ulang")
                    }
                }
            }
        }
        if (failed) {
            Column(
                modifier = Modifier.fillMaxWidth().height(260.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Text("Gambar gagal dimuat", color = NarayaPrimary, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(10.dp))
                Button(onClick = { reloadKey++ }, colors = narayaSurfaceButtonColors()) {
                    Text("Muat ulang")
                }
            }
        }
        AsyncImage(
            model = rememberNarayaImageModel(api, image, reloadKey),
            contentDescription = title,
            modifier = Modifier.fillMaxWidth(),
            contentScale = ContentScale.FillWidth,
            onLoading = {
                imageState = "loading"
            },
            onSuccess = {
                imageState = "ready"
                slowLoading = false
            },
            onError = {
                imageState = "failed"
                slowLoading = false
            },
        )
    }
}

@Composable
private fun ReaderChapterControls(previousChapter: Chapter?, nextChapter: Chapter?, onOpen: (Chapter) -> Unit) {
    if (previousChapter == null && nextChapter == null) return
    Column(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 18.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
            Button(
                onClick = { previousChapter?.let(onOpen) },
                enabled = previousChapter != null,
                modifier = Modifier.weight(1f),
                colors = narayaSurfaceButtonColors(),
            ) {
                Text("Prev", maxLines = 1)
            }
            Button(
                onClick = { nextChapter?.let(onOpen) },
                enabled = nextChapter != null,
                modifier = Modifier.weight(1f),
                colors = narayaPrimaryButtonColors(),
            ) {
                Text("Next", maxLines = 1)
            }
        }
        val label = listOfNotNull(
            previousChapter?.title?.let { "Prev: $it" },
            nextChapter?.title?.let { "Next: $it" },
        ).joinToString("\n")
        if (label.isNotBlank()) {
            Text(label, color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant, style = androidx.compose.material3.MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
private fun WatchScreen(api: NarayaApiClient, nav: NavHostController, sessionStore: SessionStore, slug: String, isInPictureInPictureMode: Boolean) {
    var state by remember(slug) { mutableStateOf<UiState<EpisodePayload>>(UiState.Loading) }
    var series by remember(slug) { mutableStateOf<SeriesDetail?>(null) }
    var retryKey by remember(slug) { mutableIntStateOf(0) }
    LaunchedEffect(slug, retryKey) {
        state = UiState.Loading
        series = null
        runCatching { api.episode(slug) }
            .onSuccess { episode ->
                state = UiState.Ready(episode)
                if (episode.seriesSlug.isNotBlank()) {
                    runCatching { api.series(episode.seriesSlug) }.onSuccess { detail ->
                        series = detail
                        if (sessionStore.sessionToken.isNotBlank()) {
                            runCatching {
                                val settings = api.settings()
                                if (settings.autoBookmark) {
                                    api.saveLibrary(
                                        UpsertLibraryRequest(
                                            comicSlug = detail.slug,
                                            comicTitle = detail.title,
                                            contentKind = "series",
                                            contentStatus = detail.info.firstOrNull { it.label.equals("Status", ignoreCase = true) }?.value.orEmpty(),
                                            coverUrl = detail.cover,
                                            latestChapterSlug = detail.episodes.firstOrNull()?.slug.orEmpty(),
                                            lastChapterSlug = episode.slug,
                                            lastChapterTitle = episode.title,
                                            status = "reading",
                                            progressTotal = detail.episodes.size,
                                            isBookmarked = false,
                                        )
                                    )
                                }
                            }
                        }
                    }
                }
            }
            .onFailure { state = UiState.Error(it.cleanMessage()) }
    }
    when (val value = state) {
        UiState.Loading -> LoadingSurface()
        is UiState.Error -> ErrorSurface(value.message, onRetry = { retryKey++ })
        is UiState.Ready -> WatchContent(api, nav, value.value, series, isInPictureInPictureMode)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ScreenShell(title: String, trailing: @Composable () -> Unit = {}, content: @Composable () -> Unit) {
    Column(Modifier.fillMaxSize().background(NarayaBackground)) {
        TopAppBar(
            title = { Text(title, fontWeight = FontWeight.Bold) },
            actions = { trailing() },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = NarayaBackground),
        )
        content()
    }
}

@Composable
private fun FilterRow(label: String, values: List<String>, active: String, onSelect: (String) -> Unit) {
    Column(Modifier.padding(top = 12.dp)) {
        Text(label, modifier = Modifier.padding(horizontal = 20.dp), color = NarayaPrimary, fontWeight = FontWeight.Bold)
        androidx.compose.foundation.lazy.LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp), contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp)) {
            items(values.distinct()) { value ->
                Button(
                    onClick = { onSelect(value) },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (value == active) NarayaPrimary else NarayaSurfaceHigh,
                        contentColor = if (value == active) androidx.compose.material3.MaterialTheme.colorScheme.onPrimary else NarayaPrimary,
                    ),
                ) { Text(value) }
            }
        }
    }
}

@Composable
private fun GenreChips(genres: List<String>, onSelect: (String) -> Unit) {
    Column(Modifier.padding(top = 28.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Genre", modifier = Modifier.padding(horizontal = 20.dp), style = androidx.compose.material3.MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        androidx.compose.foundation.lazy.LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp), contentPadding = PaddingValues(horizontal = 20.dp)) {
            items(genres.take(24)) { genre ->
                Button(onClick = { onSelect(genre) }, colors = narayaSurfaceButtonColors(), shape = RoundedCornerShape(999.dp)) {
                    Text(genre, maxLines = 1)
                }
            }
        }
    }
}

@Composable
private fun LoginRequired(nav: NavHostController) {
    Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center) {
        Text("Login diperlukan", fontWeight = FontWeight.Bold)
        Text("Masuk dulu untuk membuka rak, profile, komentar, love, dan settings.")
        Spacer(Modifier.height(18.dp))
        Button(onClick = { nav.navigate(Routes.Login) }, colors = narayaPrimaryButtonColors()) { Text("Login") }
    }
}

@Composable
private fun AuthSurface(title: String, content: @Composable ColumnScope.() -> Unit) {
    Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center) {
        Text(title, style = androidx.compose.material3.MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(18.dp))
        Column(verticalArrangement = Arrangement.spacedBy(12.dp), content = content)
    }
}

@Composable
private fun LibraryCard(api: NarayaApiClient, item: LibraryItem, onClick: () -> Unit) {
    Card(onClick = onClick, colors = CardDefaults.cardColors(containerColor = NarayaSurface), shape = RoundedCornerShape(18.dp)) {
        Row(Modifier.padding(12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            AsyncImage(model = rememberNarayaImageModel(api, item.coverUrl), contentDescription = item.comicTitle, modifier = Modifier.width(74.dp).height(108.dp))
            Column(Modifier.weight(1f)) {
                Text(item.comicTitle, fontWeight = FontWeight.Bold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Text(if (item.isAnimeLibraryItem()) "Anime" else "Komik", color = NarayaPrimary)
                Text("${item.progressCompleted}/${item.progressTotal} - ${item.progressPercent}%", color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

private fun LibraryItem.matchesLibraryType(type: String): Boolean {
    return when (type) {
        "Anime" -> isAnimeLibraryItem()
        "Komik" -> !isAnimeLibraryItem()
        else -> true
    }
}

private fun LibraryItem.isAnimeLibraryItem(): Boolean {
    return contentKind.equals("series", ignoreCase = true) ||
        latestChapterSlug.isEpisodeSlug() ||
        lastChapterSlug.isEpisodeSlug()
}

private fun String.isEpisodeSlug(): Boolean {
    return contains("-episode-", ignoreCase = true) || contains("episode-", ignoreCase = true)
}

@Composable
private fun StatCard(label: String, count: Int, modifier: Modifier = Modifier) {
    Card(modifier, colors = CardDefaults.cardColors(containerColor = NarayaSurface), shape = RoundedCornerShape(18.dp)) {
        Column(Modifier.padding(12.dp)) {
            Text(count.toString(), color = NarayaPrimary, fontWeight = FontWeight.Bold)
            Text(label, style = androidx.compose.material3.MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
private fun HistoryLine(text: String) {
    Card(colors = CardDefaults.cardColors(containerColor = NarayaSurface), shape = RoundedCornerShape(16.dp)) {
        Text(
            text,
            modifier = Modifier.padding(14.dp),
            color = NarayaText,
            style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
        )
    }
}

@Composable
private fun SectionTitle(label: String, count: Int) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text("$label ($count)", fontWeight = FontWeight.Bold)
        Box(Modifier.width((label.length.coerceAtLeast(8) * 9).dp).height(2.dp).background(NarayaPrimary, RoundedCornerShape(999.dp)))
    }
}

@Composable
private fun DetailSectionTitle(label: String) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(label, fontWeight = FontWeight.Bold)
        Box(Modifier.width((label.length.coerceAtLeast(8) * 9).dp).height(2.dp).background(NarayaPrimary.copy(alpha = 0.68f), RoundedCornerShape(999.dp)))
    }
}

@Composable
private fun CommentHistoryLine(comment: id.naraya.app.data.CommentItem) {
    val target = comment.comicSlug.ifBlank { comment.chapterSlug.ifBlank { "Naraya" } }
    val reply = comment.parentId.isNotBlank()
    val parentName = comment.parentDisplayName.ifBlank { comment.parentUsername }
    val createdAt = formatCommentDateTime(comment.createdAt)
    Card(colors = CardDefaults.cardColors(containerColor = NarayaSurface), shape = RoundedCornerShape(16.dp)) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    target,
                    modifier = Modifier.weight(1f),
                    color = NarayaPrimary,
                    fontWeight = FontWeight.Bold,
                    overflow = TextOverflow.Ellipsis,
                    maxLines = 2,
                )
                if (createdAt.isNotBlank()) {
                    Text(
                        createdAt,
                        color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant,
                        style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                    )
                }
            }
            if (reply) {
                Text(
                    "Reply ke ${parentName.ifBlank { "komentar" }}",
                    color = NarayaPrimary,
                    fontWeight = FontWeight.SemiBold,
                    style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                )
                if (comment.parentBody.isNotBlank()) {
                    Column(
                        Modifier
                            .fillMaxWidth()
                            .background(NarayaSurfaceHigh, RoundedCornerShape(12.dp))
                            .padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(5.dp),
                    ) {
                        Text(
                            "Komentar yang dibalas",
                            color = NarayaPrimary,
                            fontWeight = FontWeight.Bold,
                            style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                        )
                        Text(
                            comment.parentBody,
                            color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant,
                            style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
                        )
                    }
                }
                Text(
                    "Balasan kamu",
                    color = NarayaPrimary,
                    fontWeight = FontWeight.Bold,
                    style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                )
            }
            Text(
                comment.body,
                color = NarayaText,
                style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
            )
        }
    }
}

@Composable
private fun LoveHistorySection(
    api: NarayaApiClient,
    nav: NavHostController,
    loves: List<id.naraya.app.data.LoveItem>,
    total: Int,
    expanded: Boolean,
    onExpandedChange: (Boolean) -> Unit,
) {
    val shouldCollapse = loves.size > 3
    val visibleLoves = if (expanded || !shouldCollapse) loves else loves.take(3)
    val totalLabel = "$total Love"
    Card(
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        shape = RoundedCornerShape(28.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            Modifier
                .fillMaxWidth()
                .background(
                    Brush.linearGradient(
                        listOf(
                            Color(0xFF1D1A23).copy(alpha = 0.98f),
                            Color(0xFF15121B).copy(alpha = 0.96f),
                        ),
                    ),
                )
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.Bottom,
            ) {
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        "Riwayat Love",
                        color = Color(0xFFFECACA),
                        fontWeight = FontWeight.SemiBold,
                        style = androidx.compose.material3.MaterialTheme.typography.labelSmall,
                    )
                    Text(
                        "Komik dan anime yang kamu Love",
                        color = NarayaText,
                        fontWeight = FontWeight.Bold,
                        style = androidx.compose.material3.MaterialTheme.typography.titleLarge,
                    )
                    Text(
                        if (shouldCollapse && !expanded) "Menampilkan 3 Love terbaru." else "Semua Love tersimpan di akun ini.",
                        color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant,
                        style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                    )
                }
                Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        totalLabel,
                        color = Color(0xFFFECACA),
                        fontWeight = FontWeight.Bold,
                        style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                    )
                    Box(
                        Modifier
                            .width((totalLabel.length.coerceAtLeast(6) * 7).dp)
                            .height(1.dp)
                            .background(Color(0xFFFECACA).copy(alpha = 0.65f), RoundedCornerShape(999.dp)),
                    )
                }
            }

            if (visibleLoves.isEmpty()) {
                Text(
                    "Belum ada Love di akun ini.",
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(NarayaBackground.copy(alpha = 0.35f), RoundedCornerShape(18.dp))
                        .padding(16.dp),
                    color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant,
                    style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
                )
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    visibleLoves.forEach { love ->
                        LoveHistoryCard(
                            api = api,
                            love = love,
                            onClick = { nav.openLove(love) },
                        )
                    }
                }
            }

            if (shouldCollapse) {
                Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    ViewAllToggle(
                        expanded = expanded,
                        total = total,
                        collapsedLabel = "View all love",
                        onClick = { onExpandedChange(!expanded) },
                    )
                }
            }
        }
    }
}

@Composable
private fun LoveHistoryCard(api: NarayaApiClient, love: id.naraya.app.data.LoveItem, onClick: () -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .clickable(onClick = onClick)
            .background(NarayaBackground.copy(alpha = 0.35f))
            .padding(12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            Modifier
                .width(56.dp)
                .height(84.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(NarayaSurfaceHigh),
            contentAlignment = Alignment.Center,
        ) {
            if (love.coverUrl.isNotBlank()) {
                AsyncImage(
                    model = rememberNarayaImageModel(api, love.coverUrl),
                    contentDescription = love.targetTitle,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop,
                )
            } else {
                Image(
                    painter = painterResource(R.drawable.ic_launcher_foreground),
                    contentDescription = "Naraya",
                    modifier = Modifier.size(48.dp),
                )
            }
        }
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Text(
                love.targetTitle.ifBlank { "Naraya" },
                color = NarayaText,
                fontWeight = FontWeight.Bold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
            )
            Text(
                if (love.contentKind == "series") "Anime" else "Komik",
                color = Color(0xFFFECACA),
                fontWeight = FontWeight.SemiBold,
                style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
            )
            val createdAt = formatCommentDateTime(love.createdAt)
            if (createdAt.isNotBlank()) {
                Text(
                    createdAt,
                    color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant,
                    style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                )
            }
        }
    }
}

@Composable
private fun VerifiedIcon() {
    Icon(
        Icons.Rounded.Verified,
        contentDescription = "Admin verified",
        tint = NarayaPrimary,
        modifier = Modifier.width(18.dp).height(18.dp),
    )
}

@Composable
private fun SettingButton(label: String, enabled: Boolean, onClick: () -> Unit) {
    Button(onClick = onClick, modifier = Modifier.fillMaxWidth(), colors = narayaSurfaceButtonColors()) {
        Text("$label: ${if (enabled) "On" else "Off"}")
    }
}

@Composable
private fun ComicDetailContent(api: NarayaApiClient, nav: NavHostController, detail: ComicDetail) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var favorite by remember { mutableStateOf(FavoriteUi()) }
    var love by remember { mutableStateOf(LoveUi()) }
    var showAllChapters by remember(detail.slug) { mutableStateOf(false) }
    var chapterSort by remember(detail.slug) { mutableStateOf(DetailSortOrder.Newest) }
    val sortedChapters = remember(detail.chapters, chapterSort) { sortChapters(detail.chapters, chapterSort) }
    val visibleChapters = if (showAllChapters) sortedChapters else sortedChapters.take(5)
    LaunchedEffect(detail.slug) {
        runCatching { api.favoriteStatus(detail.slug) }.onSuccess { favorite = FavoriteUi(it.favorited, it.count) }
        runCatching { api.loveStatus(detail.slug) }.onSuccess { love = LoveUi(it.loved, it.count) }
    }
    LazyColumn(contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item {
            DetailHeader(api, detail.cover, detail.title, listOf(detail.type, detail.status).joinNonBlank()) {
                ActionRow(
                    favorite.favorited,
                    favorite.count,
                    love.loved,
                    love.count,
                    onFavorite = {
                        scope.launch {
                            runCatching { api.saveLibrary(detail.toLibraryRequest()) }
                                .onSuccess { runCatching { api.favoriteStatus(detail.slug) }.onSuccess { status -> favorite = FavoriteUi(status.favorited, status.count) } }
                        }
                    },
                    onLove = { scope.launch { runCatching { api.love(detail.toLoveRequest()) }.onSuccess { love = LoveUi(it.loved, it.count) } } },
                    onShare = { context.share("https://naraya.biz.id/komik/${detail.slug}") },
                )
            }
        }
        item { DetailInfoBlock(title = "Info Komik", genres = detail.genres, info = detail.info) }
        item { DetailSynopsisBlock(text = detail.description.ifBlank { "Sinopsis belum tersedia untuk komik ini." }) }
        item {
            Button(onClick = { detail.chapters.firstOrNull()?.let { nav.navigate("baca/${it.slug}") } }, modifier = Modifier.fillMaxWidth(), colors = narayaPrimaryButtonColors()) {
                Icon(Icons.Rounded.Book, contentDescription = null)
                Spacer(Modifier.width(6.dp))
                Text("Baca Chapter Terbaru")
            }
        }
        item {
            DetailListHeader(
                title = "Daftar Chapter",
                count = sortedChapters.size,
                countLabel = "chapter",
                sortOrder = chapterSort,
                onToggleSort = { chapterSort = chapterSort.toggled() },
            )
        }
        items(visibleChapters) { chapter -> ChapterRow(chapter) { nav.navigate("baca/${chapter.slug}") } }
        if (sortedChapters.size > 5) {
            item {
                ViewAllToggle(
                    expanded = showAllChapters,
                    total = sortedChapters.size,
                    collapsedLabel = "View all chapter",
                    onClick = { showAllChapters = !showAllChapters },
                )
            }
        }
        item { CommentBlock(api, comicSlug = detail.slug) }
    }
}

@Composable
private fun SeriesDetailContent(api: NarayaApiClient, nav: NavHostController, detail: SeriesDetail) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var favorite by remember { mutableStateOf(FavoriteUi()) }
    var love by remember { mutableStateOf(LoveUi()) }
    var showAllEpisodes by remember(detail.slug) { mutableStateOf(false) }
    var episodeSort by remember(detail.slug) { mutableStateOf(DetailSortOrder.Newest) }
    val sortedEpisodes = remember(detail.episodes, episodeSort) { sortEpisodes(detail.episodes, episodeSort) }
    val visibleEpisodes = if (showAllEpisodes) sortedEpisodes else sortedEpisodes.take(5)
    LaunchedEffect(detail.slug) {
        runCatching { api.favoriteStatus(detail.slug) }.onSuccess { favorite = FavoriteUi(it.favorited, it.count) }
        runCatching { api.loveStatus(detail.slug) }.onSuccess { love = LoveUi(it.loved, it.count) }
    }
    LazyColumn(contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item {
            DetailHeader(api, detail.cover, detail.title, "Anime") {
                ActionRow(
                    favorite.favorited,
                    favorite.count,
                    love.loved,
                    love.count,
                    onFavorite = {
                        scope.launch {
                            runCatching { api.saveLibrary(detail.toLibraryRequest()) }
                                .onSuccess { runCatching { api.favoriteStatus(detail.slug) }.onSuccess { status -> favorite = FavoriteUi(status.favorited, status.count) } }
                        }
                    },
                    onLove = { scope.launch { runCatching { api.love(detail.toLoveRequest()) }.onSuccess { love = LoveUi(it.loved, it.count) } } },
                    onShare = { context.share("https://naraya.biz.id/series/${detail.slug}") },
                )
            }
        }
        item { DetailInfoBlock(title = "Info Anime", genres = detail.genres, info = detail.info) }
        item { DetailSynopsisBlock(text = detail.description.ifBlank { "Sinopsis belum tersedia untuk anime ini." }) }
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                Button(onClick = { detail.episodes.firstOrNull()?.let { nav.navigate("nonton/${it.slug}") } }, modifier = Modifier.fillMaxWidth(), colors = narayaPrimaryButtonColors()) {
                    Icon(Icons.Rounded.PlayArrow, contentDescription = null)
                    Spacer(Modifier.width(6.dp))
                    Text("Nonton Episode Terbaru")
                }
            }
        }
        item {
            DetailListHeader(
                title = "Daftar Episode",
                count = sortedEpisodes.size,
                countLabel = "episode",
                sortOrder = episodeSort,
                onToggleSort = { episodeSort = episodeSort.toggled() },
            )
        }
        items(visibleEpisodes) { episode -> EpisodeRow(episode) { nav.navigate("nonton/${episode.slug}") } }
        if (sortedEpisodes.size > 5) {
            item {
                ViewAllToggle(
                    expanded = showAllEpisodes,
                    total = sortedEpisodes.size,
                    collapsedLabel = "View all episode",
                    onClick = { showAllEpisodes = !showAllEpisodes },
                )
            }
        }
        item { CommentBlock(api, comicSlug = detail.slug) }
    }
}

@Composable
private fun DetailListHeader(
    title: String,
    count: Int,
    countLabel: String,
    sortOrder: DetailSortOrder,
    onToggleSort: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(5.dp), modifier = Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.Bold)
            Text(
                "$count $countLabel",
                color = NarayaPrimary,
                style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.SemiBold,
            )
            Box(Modifier.width(72.dp).height(2.dp).background(NarayaPrimary.copy(alpha = 0.68f), RoundedCornerShape(999.dp)))
        }
        Box(Modifier.background(NarayaSurfaceHigh, RoundedCornerShape(999.dp)).padding(4.dp)) {
            androidx.compose.material3.IconButton(
                onClick = onToggleSort,
                modifier = Modifier.background(NarayaPrimary, RoundedCornerShape(999.dp)),
            ) {
                Icon(
                    Icons.Rounded.SwapVert,
                    contentDescription = if (sortOrder == DetailSortOrder.Newest) "Ubah urutan ke terlama" else "Ubah urutan ke terbaru",
                    tint = androidx.compose.material3.MaterialTheme.colorScheme.onPrimary,
                )
            }
        }
    }
}

private enum class DetailSortOrder {
    Newest,
    Oldest;

    fun toggled(): DetailSortOrder = if (this == Newest) Oldest else Newest
}

private fun sortChapters(chapters: List<Chapter>, order: DetailSortOrder): List<Chapter> {
    return sortDetailList(chapters, order) { listOf(it.number, it.title, it.slug) }
}

private fun sortEpisodes(episodes: List<id.naraya.app.data.SeriesEpisode>, order: DetailSortOrder): List<id.naraya.app.data.SeriesEpisode> {
    return sortDetailList(episodes, order) { listOf(it.number, it.title, it.slug) }
}

private fun <T> sortDetailList(items: List<T>, order: DetailSortOrder, parts: (T) -> List<String>): List<T> {
    return items
        .mapIndexed { index, item -> DetailSortEntry(item, index, extractDetailNumber(parts(item))) }
        .sortedWith { left, right ->
            when {
                left.value != null && right.value != null && left.value != right.value -> {
                    if (order == DetailSortOrder.Newest) right.value.compareTo(left.value) else left.value.compareTo(right.value)
                }
                left.value != null && right.value == null -> -1
                left.value == null && right.value != null -> 1
                else -> if (order == DetailSortOrder.Newest) left.index.compareTo(right.index) else right.index.compareTo(left.index)
            }
        }
        .map { it.item }
}

private data class DetailSortEntry<T>(val item: T, val index: Int, val value: Double?)

private fun extractDetailNumber(parts: List<String>): Double? {
    val text = parts.filter { it.isNotBlank() }.joinToString(" ")
    val matches = Regex("""\d+(?:[.,]\d+)?""").findAll(text).toList()
    if (matches.isEmpty()) return null
    return matches.last().value.replace(',', '.').toDoubleOrNull()
}

@Composable
private fun DetailHeader(
    api: NarayaApiClient,
    cover: String,
    title: String,
    meta: String,
    actions: @Composable ColumnScope.() -> Unit = {},
) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        AsyncImage(
            model = rememberNarayaImageModel(api, cover),
            contentDescription = title,
            modifier = Modifier.width(128.dp).height(192.dp),
        )
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(title, style = androidx.compose.material3.MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Text(meta, color = NarayaPrimary)
            actions()
        }
    }
}

@Composable
private fun DetailInfoBlock(title: String, genres: List<String>, info: List<id.naraya.app.data.InfoRow>) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = NarayaSurface), shape = RoundedCornerShape(18.dp)) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            DetailSectionTitle(title)
            if (genres.isNotEmpty()) {
                Text("Genre", color = NarayaPrimary, fontWeight = FontWeight.Bold)
                androidx.compose.foundation.lazy.LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(genres) { genre ->
                        Text(genre, modifier = Modifier.background(NarayaSurfaceHigh, RoundedCornerShape(999.dp)).padding(horizontal = 10.dp, vertical = 6.dp))
                    }
                }
            }
            info.take(8).forEach { row ->
                if (row.label.isNotBlank() || row.value.isNotBlank()) {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(row.label, modifier = Modifier.width(92.dp), color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text(row.value, modifier = Modifier.weight(1f), fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}

@Composable
private fun DetailSynopsisBlock(text: String) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = NarayaSurface), shape = RoundedCornerShape(18.dp)) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            DetailSectionTitle("Sinopsis")
            Text(
                text,
                color = NarayaText,
                style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
            )
        }
    }
}

@Composable
private fun ChapterRow(chapter: Chapter, onClick: () -> Unit) {
    Card(onClick = onClick, colors = CardDefaults.cardColors(containerColor = NarayaSurface), shape = RoundedCornerShape(14.dp)) {
        Text(chapter.title.ifBlank { chapter.slug }, modifier = Modifier.padding(14.dp), fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun EpisodeRow(episode: id.naraya.app.data.SeriesEpisode, onClick: () -> Unit) {
    Card(onClick = onClick, colors = CardDefaults.cardColors(containerColor = NarayaSurface), shape = RoundedCornerShape(14.dp)) {
        Text(episode.title.ifBlank { episode.slug }, modifier = Modifier.padding(14.dp), fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun ViewAllToggle(expanded: Boolean, total: Int, collapsedLabel: String, onClick: () -> Unit) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
        Button(
            onClick = onClick,
            colors = narayaPrimaryButtonColors(),
            shape = RoundedCornerShape(999.dp),
        ) {
            Text(if (expanded) "Hide" else "$collapsedLabel ($total)")
        }
    }
}

@Composable
private fun CommentBlock(api: NarayaApiClient, comicSlug: String = "", chapterSlug: String = "") {
    var state by remember(comicSlug, chapterSlug) { mutableStateOf<UiState<id.naraya.app.data.CommentPage>>(UiState.Loading) }
    var body by remember(comicSlug, chapterSlug) { mutableStateOf("") }
    var replyingTo by remember(comicSlug, chapterSlug) { mutableStateOf<id.naraya.app.data.CommentItem?>(null) }
    var loadingMore by remember(comicSlug, chapterSlug) { mutableStateOf(false) }
    var reloadKey by remember { mutableIntStateOf(0) }
    val scope = rememberCoroutineScope()
    LaunchedEffect(comicSlug, chapterSlug, reloadKey) {
        state = runCatching { api.comments(comicSlug, chapterSlug) }.fold({ UiState.Ready(it) }, { UiState.Error(it.cleanMessage()) })
    }
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
            Text("Komentar", fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
            TextButton(onClick = { reloadKey++ }, colors = ButtonDefaults.textButtonColors(contentColor = NarayaPrimary)) { Text("Reload") }
        }
        when (val value = state) {
            UiState.Loading -> Text("Memuat komentar...")
            is UiState.Error -> Text(value.message)
            is UiState.Ready -> {
                value.value.items.forEach { comment ->
                    CommentLine(comment, onReply = { replyingTo = comment })
                }
                if (value.value.hasMore) {
                    Button(
                        onClick = { loadingMore = true },
                        modifier = Modifier.fillMaxWidth(),
                        colors = narayaSurfaceButtonColors(),
                    ) { Text(if (loadingMore) "Memuat..." else "Muat komentar lagi") }
                }
            }
        }
        LaunchedEffect(loadingMore) {
            if (!loadingMore) return@LaunchedEffect
            val current = (state as? UiState.Ready)?.value ?: return@LaunchedEffect
            runCatching { api.comments(comicSlug, chapterSlug, cursor = current.nextCursor, limit = 10) }
                .onSuccess { next -> state = UiState.Ready(next.copy(items = current.items + next.items)) }
            loadingMore = false
        }
        replyingTo?.let {
            Card(colors = CardDefaults.cardColors(containerColor = NarayaSurfaceHigh), shape = RoundedCornerShape(14.dp)) {
                Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("Membalas @${it.username}", modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                    TextButton(onClick = { replyingTo = null }, colors = ButtonDefaults.textButtonColors(contentColor = NarayaPrimary)) { Text("Batal") }
                }
            }
        }
        OutlinedTextField(
            body,
            { body = it },
            placeholder = { Text("Tulis komentar") },
            modifier = Modifier.fillMaxWidth(),
            minLines = 3,
            maxLines = 5,
        )
        Button(onClick = {
            scope.launch {
                runCatching { api.sendComment(CommentRequest(comicSlug, chapterSlug, parentId = replyingTo?.id.orEmpty(), body = body)) }
                    .onSuccess {
                        body = ""
                        replyingTo = null
                        state = UiState.Ready(api.comments(comicSlug, chapterSlug))
                    }
            }
        }, colors = narayaPrimaryButtonColors()) { Text("Kirim") }
    }
}

@Composable
private fun CommentLine(comment: id.naraya.app.data.CommentItem, onReply: () -> Unit) {
    val createdAt = formatCommentDateTime(comment.createdAt)
    Card(colors = CardDefaults.cardColors(containerColor = NarayaSurface), shape = RoundedCornerShape(16.dp)) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(comment.displayName.ifBlank { comment.username }, modifier = Modifier.weight(1f), fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                if (comment.role == "admin") VerifiedIcon()
            }
            if (comment.parentId.isNotBlank()) {
                Text("Membalas ${comment.parentDisplayName.ifBlank { comment.parentUsername }}", color = NarayaPrimary, style = androidx.compose.material3.MaterialTheme.typography.bodySmall)
            }
            Text(comment.body, maxLines = 5, overflow = TextOverflow.Ellipsis)
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(createdAt, modifier = Modifier.weight(1f), color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant, style = androidx.compose.material3.MaterialTheme.typography.bodySmall)
                TextButton(onClick = onReply, colors = ButtonDefaults.textButtonColors(contentColor = NarayaPrimary)) { Text("Balas") }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun WatchContent(api: NarayaApiClient, nav: NavHostController, episode: EpisodePayload, series: SeriesDetail?, isInPictureInPictureMode: Boolean) {
    val context = LocalContext.current
    val notificationPermissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {}
    val servers = remember(episode.slug, episode.playerUrl, episode.servers) {
        buildList {
            if (episode.playerUrl.isNotBlank()) add(id.naraya.app.data.EpisodeServer(type = "DEFAULT", host = "Player", url = episode.playerUrl))
            addAll(episode.servers)
        }.filter { it.url.isNotBlank() }.distinctBy { it.url }
    }
    var activeServerUrl by remember(episode.slug) { mutableStateOf(servers.firstOrNull()?.url.orEmpty()) }
    var resolvedUrl by remember(episode.slug) { mutableStateOf("") }
    var resolving by remember(episode.slug) { mutableStateOf(false) }
    var playerMessage by remember(episode.slug) { mutableStateOf("") }
    var serverMenuOpen by remember(episode.slug) { mutableStateOf(false) }

    LaunchedEffect(activeServerUrl) {
        resolving = true
        playerMessage = ""
        resolvedUrl = ""
        val rawUrl = activeServerUrl.ifBlank { episode.playerUrl }
        val server = servers.firstOrNull { it.url == rawUrl }
        val direct = server?.direct == true || rawUrl.isDirectVideoUrl()
        runCatching {
            withTimeout(25_000) {
                if (direct || !rawUrl.contains("/api/video-source/")) {
                    api.mediaUrl(rawUrl)
                } else {
                    api.mediaUrl(api.videoSource(rawUrl).url)
                }
            }
        }.onSuccess {
            resolvedUrl = it
        }.onFailure {
            playerMessage = "Server terlalu lama merespons. Ganti server dari pilihan di bawah player."
        }
        resolving = false
    }

    val currentIndex = series?.episodes?.indexOfFirst { it.slug == episode.slug } ?: -1
    val newer = series?.episodes?.getOrNull(currentIndex - 1)
    val older = series?.episodes?.getOrNull(currentIndex + 1)

    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && !NarayaNotifications.canPostNotifications(context)) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }
    DisposableEffect(episode.slug) {
        onDispose { runCatching { NarayaPlaybackService.stop(context) } }
    }

    if (isInPictureInPictureMode) {
        Box(Modifier.fillMaxSize().background(Color.Black), contentAlignment = Alignment.Center) {
            NativeVideoPanel(
                api = api,
                url = resolvedUrl,
                title = episode.title,
                resolving = resolving,
                message = playerMessage,
                fillParent = true,
                onPlaybackProblem = {
                    playerMessage = it
                    resolvedUrl = ""
                },
            )
        }
        return
    }

    Column(Modifier.fillMaxSize().background(NarayaBackground)) {
        TopAppBar(
            title = { Text(episode.title, maxLines = 1, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.Bold) },
            navigationIcon = {
                androidx.compose.material3.IconButton(onClick = { if (!nav.popBackStack()) nav.navigate(series?.let { "series/${it.slug}" } ?: Routes.Index) }) {
                    Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Kembali", tint = NarayaPrimary)
                }
            },
            actions = {
                androidx.compose.material3.IconButton(onClick = { context.share("https://naraya.biz.id/nonton/${episode.slug}") }) {
                    Icon(Icons.Rounded.Share, contentDescription = "Share", tint = NarayaPrimary)
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = NarayaBackground),
        )
        LazyColumn(contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            item {
                NativeVideoPanel(
                    api = api,
                    url = resolvedUrl,
                    title = episode.title,
                    resolving = resolving,
                    message = playerMessage,
                    onPlaybackProblem = {
                        playerMessage = it
                        resolvedUrl = ""
                    },
                )
            }
            item { Text(episode.title, fontWeight = FontWeight.Bold) }
            if (newer != null || older != null) {
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                        Button(
                            onClick = { older?.let { nav.navigate("nonton/${it.slug}") } },
                            enabled = older != null,
                            modifier = Modifier.weight(1f),
                            colors = narayaSurfaceButtonColors(),
                        ) { Text("Prev", maxLines = 1) }
                        Button(
                            onClick = { newer?.let { nav.navigate("nonton/${it.slug}") } },
                            enabled = newer != null,
                            modifier = Modifier.weight(1f),
                            colors = narayaSurfaceButtonColors(),
                        ) { Text("Next", maxLines = 1) }
                    }
                }
            }
            if (servers.isNotEmpty()) {
                item {
                    val activeServer = servers.firstOrNull { it.url == activeServerUrl }
                    val activeLabel = activeServer?.let { listOf(it.type, it.host).joinNonBlank() }.orEmpty().ifBlank { "Pilih server" }
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Bottom) {
                            Text("Server", color = NarayaPrimary, fontWeight = FontWeight.Bold)
                            Text("${servers.size} pilihan", color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant, style = androidx.compose.material3.MaterialTheme.typography.bodySmall)
                        }
                        Box(Modifier.fillMaxWidth()) {
                            Button(
                                onClick = { serverMenuOpen = true },
                                modifier = Modifier.fillMaxWidth(),
                                colors = narayaSurfaceButtonColors(),
                            ) {
                                Text(activeLabel, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                                Icon(Icons.Rounded.KeyboardArrowDown, contentDescription = null)
                            }
                            DropdownMenu(
                                expanded = serverMenuOpen,
                                onDismissRequest = { serverMenuOpen = false },
                                modifier = Modifier
                                    .fillMaxWidth(0.92f)
                                    .background(NarayaSurfaceHigh),
                            ) {
                                servers.forEachIndexed { index, server ->
                                    val label = listOf(server.type, server.host).joinNonBlank().ifBlank { "Server ${index + 1}" }
                                    val active = activeServerUrl == server.url
                                    DropdownMenuItem(
                                        text = {
                                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                                                Text(label, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis, color = if (active) NarayaPrimary else NarayaText)
                                                if (active) Box(Modifier.size(8.dp).background(NarayaPrimary, RoundedCornerShape(999.dp)))
                                            }
                                        },
                                        onClick = {
                                            activeServerUrl = server.url
                                            serverMenuOpen = false
                                        },
                                    )
                                }
                            }
                        }
                    }
                }
            }
            item { Text("Jika video tidak terload atau lama, ganti server yang tersedia.", color = NarayaPrimary) }
            item { CommentBlock(api, chapterSlug = episode.slug) }
        }
    }
}

@Composable
private fun NativeVideoPanel(
    api: NarayaApiClient,
    url: String,
    title: String,
    resolving: Boolean,
    message: String,
    fillParent: Boolean = false,
    onPlaybackProblem: (String) -> Unit,
) {
    Box(
        modifier = if (fillParent) {
            Modifier.fillMaxSize().background(Color.Black)
        } else {
            Modifier.fillMaxWidth().height(260.dp).background(NarayaSurface, RoundedCornerShape(24.dp))
        },
        contentAlignment = androidx.compose.ui.Alignment.Center,
    ) {
        when {
            resolving -> {
                Column(horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    androidx.compose.material3.CircularProgressIndicator(color = NarayaPrimary)
                    Text("Menyiapkan server", color = NarayaPrimary, fontWeight = FontWeight.Bold)
                }
            }
            url.isBlank() -> {
                Text(message.ifBlank { "Pilih server untuk memutar video." }, modifier = Modifier.padding(20.dp), color = NarayaPrimary)
            }
            else -> {
                NarayaExoPlayer(api = api, url = url, title = title, onPlaybackProblem = onPlaybackProblem)
            }
        }
    }
}

@Composable
private fun NarayaExoPlayer(api: NarayaApiClient, url: String, title: String, onPlaybackProblem: (String) -> Unit) {
    val context = LocalContext.current
    val activity = remember(context) { context.findActivity() }
    val player = remember(url) {
        NarayaPlaybackService.ensurePlayer(
            context = context,
            title = title,
            url = url,
            headers = api.mediaHeaders("video"),
        )
    }
    DisposableEffect(activity, player) {
        activity?.let { NarayaPipController.attach(it, player) }
        onDispose { NarayaPipController.detach(player) }
    }
    var playbackState by remember(url) { mutableIntStateOf(player.playbackState) }
    var playerLoading by remember(url) { mutableStateOf(player.playbackState == Player.STATE_IDLE || player.playbackState == Player.STATE_BUFFERING || player.isLoading) }
    var slowLoading by remember(url) { mutableStateOf(false) }
    var fullscreen by remember(url) { mutableStateOf(false) }
    DisposableEffect(player) {
        val listener = object : Player.Listener {
            override fun onPlaybackStateChanged(playbackStateValue: Int) {
                playbackState = playbackStateValue
                playerLoading = playbackStateValue == Player.STATE_IDLE || playbackStateValue == Player.STATE_BUFFERING
            }

            override fun onIsLoadingChanged(isLoading: Boolean) {
                playerLoading = isLoading || playbackState == Player.STATE_IDLE || playbackState == Player.STATE_BUFFERING
            }

            override fun onRenderedFirstFrame() {
                playerLoading = false
            }

            override fun onPlayerError(error: PlaybackException) {
                onPlaybackProblem("Video gagal dimuat dari server ini. Ganti server yang tersedia.")
            }
        }
        player.addListener(listener)
        playbackState = player.playbackState
        playerLoading = player.isLoading || player.playbackState == Player.STATE_IDLE || player.playbackState == Player.STATE_BUFFERING
        onDispose { player.removeListener(listener) }
    }
    LaunchedEffect(player, url) {
        slowLoading = false
        delay(15_000)
        if (playerLoading || player.playbackState == Player.STATE_BUFFERING || player.playbackState == Player.STATE_IDLE) {
            slowLoading = true
        }
    }
    Box(Modifier.fillMaxSize()) {
        if (!fullscreen) {
            NarayaPlayerView(player = player, modifier = Modifier.fillMaxSize())
            VideoLoadingBadge(
                visible = playerLoading,
                message = if (slowLoading) "Masih memuat, coba ganti server jika terlalu lama" else "Memuat video",
                modifier = Modifier.align(Alignment.BottomStart).padding(12.dp),
            )
        }
        FullscreenVideoButton(
            fullscreen = fullscreen,
            onClick = { fullscreen = !fullscreen },
            modifier = Modifier.align(Alignment.TopEnd).padding(10.dp),
        )
    }
    if (fullscreen) {
        NarayaFullscreenVideo(
            player = player,
            title = title,
            loading = playerLoading,
            onExit = { fullscreen = false },
        )
    }
}

@Composable
private fun NarayaPlayerView(player: ExoPlayer, modifier: Modifier = Modifier) {
    AndroidView(
        factory = {
            PlayerView(it).apply {
                this.player = player
                useController = true
            }
        },
        update = { it.player = player },
        modifier = modifier,
    )
}

@Composable
private fun VideoLoadingBadge(visible: Boolean, message: String, modifier: Modifier = Modifier) {
    if (!visible) return
    val transition = rememberInfiniteTransition(label = "video-loading")
    val pulse by transition.animateFloat(
        initialValue = 0.92f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 900, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "video-loading-pulse",
    )
    Row(
        modifier = modifier
            .background(Color.Black.copy(alpha = 0.68f), RoundedCornerShape(999.dp))
            .padding(horizontal = 12.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(contentAlignment = Alignment.Center, modifier = Modifier.size(28.dp)) {
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .graphicsLayer {
                        scaleX = pulse
                        scaleY = pulse
                        alpha = 0.48f
                    }
                    .background(NarayaPrimary.copy(alpha = 0.2f), RoundedCornerShape(999.dp)),
            )
            CircularProgressIndicator(color = NarayaPrimary, strokeWidth = 2.dp, modifier = Modifier.size(22.dp))
        }
        Text(message, color = NarayaPrimary, fontWeight = FontWeight.Bold, style = androidx.compose.material3.MaterialTheme.typography.bodySmall)
    }
}

@Composable
private fun FullscreenVideoButton(fullscreen: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    androidx.compose.material3.IconButton(
        onClick = onClick,
        modifier = modifier
            .background(Color.Black.copy(alpha = 0.58f), RoundedCornerShape(999.dp)),
    ) {
        Icon(
            imageVector = if (fullscreen) Icons.Rounded.FullscreenExit else Icons.Rounded.Fullscreen,
            contentDescription = if (fullscreen) "Keluar fullscreen" else "Fullscreen",
            tint = NarayaPrimary,
        )
    }
}

@Composable
private fun NarayaFullscreenVideo(player: ExoPlayer, title: String, loading: Boolean, onExit: () -> Unit) {
    val context = LocalContext.current
    Dialog(
        onDismissRequest = onExit,
        properties = DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false),
    ) {
        val activity = remember(context) { context.findActivity() }
        DisposableEffect(activity) {
            val previousOrientation = activity?.requestedOrientation ?: ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
            activity?.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
            activity?.window?.let { window ->
                WindowCompat.getInsetsController(window, window.decorView).apply {
                    systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                    hide(WindowInsetsCompat.Type.systemBars())
                }
            }
            onDispose {
                activity?.requestedOrientation = previousOrientation
                activity?.window?.let { window ->
                    WindowCompat.getInsetsController(window, window.decorView).show(WindowInsetsCompat.Type.systemBars())
                }
            }
        }
        Box(Modifier.fillMaxSize().background(Color.Black), contentAlignment = Alignment.Center) {
            NarayaPlayerView(player = player, modifier = Modifier.fillMaxSize())
            VideoLoadingBadge(visible = loading, message = "Memuat video", modifier = Modifier.align(Alignment.BottomStart).padding(16.dp))
            Text(
                title,
                modifier = Modifier.align(Alignment.TopStart).padding(16.dp),
                color = NarayaText,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                fontWeight = FontWeight.Bold,
            )
            FullscreenVideoButton(
                fullscreen = true,
                onClick = onExit,
                modifier = Modifier.align(Alignment.TopEnd).padding(12.dp),
            )
        }
    }
}

private tailrec fun Context.findActivity(): Activity? {
    return when (this) {
        is Activity -> this
        is ContextWrapper -> baseContext.findActivity()
        else -> null
    }
}

private data class FavoriteUi(val favorited: Boolean = false, val count: Int = 0)
private data class LoveUi(val loved: Boolean = false, val count: Int = 0)

private fun NavHostController.openDetail(item: ComicCard) {
    navigate(if (item.kind == "series") "series/${item.slug}" else "komik/${item.slug}")
}

private fun NavHostController.openCatalog(item: CatalogItem) {
    navigate(if (item.kind == "series") "series/${item.slug}" else "komik/${item.slug}")
}

private fun NavHostController.openLatest(item: ComicCard) {
    val latest = item.latestChapter?.slug
    if (latest.isNullOrBlank()) openDetail(item) else navigate(if (item.kind == "series") "nonton/$latest" else "baca/$latest")
}

private fun NavHostController.navigateTopLevel(route: String) {
    if (route == Routes.Home) {
        if (!popBackStack(Routes.Home, inclusive = false)) {
            navigate(Routes.Home) { launchSingleTop = true }
        }
        return
    }
    navigate(route) {
        launchSingleTop = true
        popUpTo(Routes.Home) { saveState = true }
        restoreState = true
    }
}

private fun NavHostController.openLove(item: id.naraya.app.data.LoveItem) {
    val slug = item.targetSlug.ifBlank { item.targetUrl.trimEnd('/').substringAfterLast("/") }
    if (slug.isBlank()) return
    navigate(if (item.contentKind == "series") "series/$slug" else "komik/$slug")
}

private fun android.content.Context.share(url: String) {
    startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_TEXT, url)
    }, "Share Naraya"))
}

private fun openAdvertiseEmail(context: Context) {
    runCatching {
        context.startActivity(Intent(Intent.ACTION_SENDTO).apply {
            data = Uri.parse("mailto:serjkrk18@proton.me")
            putExtra(Intent.EXTRA_EMAIL, arrayOf("serjkrk18@proton.me"))
            putExtra(Intent.EXTRA_SUBJECT, "Iklan / kerja sama Naraya")
        })
    }
}

private fun canInstallPackages(context: Context): Boolean {
    return Build.VERSION.SDK_INT < Build.VERSION_CODES.O || context.packageManager.canRequestPackageInstalls()
}

private fun openInstallPermission(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    context.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
        data = Uri.parse("package:${context.packageName}")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    })
}

private fun installApk(context: Context, apk: File) {
    val uri = FileProvider.getUriForFile(context, "${context.packageName}.provider", apk)
    context.startActivity(Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(uri, "application/vnd.android.package-archive")
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        putExtra(Intent.EXTRA_NOT_UNKNOWN_SOURCE, true)
    })
}

private fun ComicDetail.toLibraryRequest() = UpsertLibraryRequest(
    comicSlug = slug,
    comicTitle = title,
    contentKind = "comic",
    contentStatus = status,
    coverUrl = cover,
    latestChapterSlug = chapters.firstOrNull()?.slug.orEmpty(),
    lastChapterSlug = chapters.firstOrNull()?.slug.orEmpty(),
    lastChapterTitle = chapters.firstOrNull()?.title.orEmpty(),
    isBookmarked = true,
)

private fun ComicDetail.toLoveRequest() = id.naraya.app.data.LoveRequest(
    targetSlug = slug,
    targetTitle = title,
    contentKind = "comic",
    coverUrl = cover,
    targetUrl = "/komik/$slug",
)

private fun SeriesDetail.toLibraryRequest() = UpsertLibraryRequest(
    comicSlug = slug,
    comicTitle = title,
    contentKind = "series",
    coverUrl = cover,
    latestChapterSlug = episodes.firstOrNull()?.slug.orEmpty(),
    lastChapterSlug = episodes.firstOrNull()?.slug.orEmpty(),
    lastChapterTitle = episodes.firstOrNull()?.title.orEmpty(),
    isBookmarked = true,
)

private fun SeriesDetail.toLoveRequest() = id.naraya.app.data.LoveRequest(
    targetSlug = slug,
    targetTitle = title,
    contentKind = "series",
    coverUrl = cover,
    targetUrl = "/series/$slug",
)

private fun String.isDirectVideoUrl(): Boolean {
    val lower = lowercase()
    return lower.contains(".m3u8") || lower.contains(".mp4") || lower.contains("/media/") || lower.contains("/api/videos/")
}

private val narayaDateTimeFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")

private fun formatCommentDateTime(value: String): String {
    val raw = value.trim()
    if (raw.isBlank()) return ""
    runCatching {
        return Instant.parse(raw).atZone(ZoneId.systemDefault()).format(narayaDateTimeFormatter)
    }
    runCatching {
        return OffsetDateTime.parse(raw).atZoneSameInstant(ZoneId.systemDefault()).format(narayaDateTimeFormatter)
    }
    runCatching {
        return LocalDateTime.parse(raw.substringBefore("+").substringBefore("Z")).format(narayaDateTimeFormatter)
    }
    val cleaned = raw.substringBefore(".").substringBefore("+").substringBefore("Z").replace('T', ' ')
    val parts = cleaned.split(" ")
    val date = parts.getOrNull(0).orEmpty()
    val time = parts.getOrNull(1).orEmpty().take(5)
    if (date.length == 10 && time.length >= 5) {
        val dateParts = date.split("-")
        if (dateParts.size == 3) return "${dateParts[2]}/${dateParts[1]}/${dateParts[0]} $time"
    }
    return cleaned
}
