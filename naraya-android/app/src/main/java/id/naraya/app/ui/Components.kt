package id.naraya.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Bookmark
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import id.naraya.app.data.CatalogItem
import id.naraya.app.data.ComicCard
import id.naraya.app.data.NarayaApiClient
import id.naraya.app.ui.theme.NarayaBackground
import id.naraya.app.ui.theme.NarayaPrimary
import id.naraya.app.ui.theme.NarayaSurface
import id.naraya.app.ui.theme.NarayaSurfaceHigh
import id.naraya.app.ui.theme.NarayaText

@Composable
fun LoadingSurface(modifier: Modifier = Modifier) {
    Box(modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = NarayaPrimary)
    }
}

@Composable
fun ErrorSurface(message: String, onRetry: () -> Unit, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.fillMaxWidth().padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("This page couldn't load", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Text(message, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Button(onClick = onRetry, colors = narayaPrimaryButtonColors()) {
            Text("Reload")
        }
    }
}

@Composable
fun HeroBanner(
    api: NarayaApiClient,
    item: ComicCard?,
    onOpen: (ComicCard) -> Unit,
    onLatest: (ComicCard) -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(520.dp)
            .background(NarayaBackground),
    ) {
        if (item != null) {
            AsyncImage(
                model = rememberNarayaImageModel(api, item.cover),
                contentDescription = item.title,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop,
            )
        }
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(Color.Transparent, NarayaBackground.copy(alpha = 0.58f), NarayaBackground)
                    )
                )
        )
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(horizontal = 20.dp, vertical = 34.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text("Update Naraya", color = NarayaPrimary, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
            Text(
                item?.title ?: "Naraya Comic Feed",
                style = MaterialTheme.typography.headlineLarge,
                color = NarayaText,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis,
                fontWeight = FontWeight.ExtraBold,
            )
            Text(
                item?.latestChapter?.title ?: item?.updatedAt ?: "Jelajahi komik, anime, genre, chapter, dan episode dalam satu pengalaman yang rapi.",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(
                    onClick = { if (item != null) onLatest(item) },
                    colors = narayaPrimaryButtonColors()
                ) {
                    Icon(Icons.Rounded.PlayArrow, contentDescription = null)
                    Spacer(Modifier.width(6.dp))
                    Text(if (item?.kind == "series") "Nonton Episode Baru" else "Baca Chapter Baru")
                }
                OutlinedButton(onClick = { if (item != null) onOpen(item) }, colors = narayaOutlinedButtonColors(), border = narayaOutlinedBorder()) {
                    Text(if (item?.kind == "series") "Detail Anime" else "Detail Komik")
                }
            }
        }
    }
}

@Composable
fun HeroControlRail(
    api: NarayaApiClient,
    slides: List<ComicCard>,
    activeIndex: Int,
    onSelect: (Int) -> Unit,
    onLatest: (ComicCard) -> Unit,
    modifier: Modifier = Modifier,
) {
    val active = slides.getOrNull(activeIndex) ?: slides.firstOrNull() ?: return
    Card(
        modifier = modifier.padding(horizontal = 20.dp),
        colors = CardDefaults.cardColors(containerColor = NarayaSurface.copy(alpha = 0.88f)),
        shape = RoundedCornerShape(28.dp),
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("Sedang tampil", color = NarayaPrimary, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                    Text(active.title, maxLines = 2, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.Bold)
                    Text(active.latestChapter?.title ?: active.updatedAt, maxLines = 1, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                IconButton(onClick = { onLatest(active) }) {
                    Icon(Icons.Rounded.PlayArrow, contentDescription = "Buka")
                }
            }
            LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp), contentPadding = PaddingValues(bottom = 4.dp)) {
                items(slides) { item ->
                    val index = slides.indexOf(item)
                    Column(
                        modifier = Modifier
                            .width(170.dp)
                            .clip(RoundedCornerShape(18.dp))
                            .background(if (index == activeIndex) NarayaPrimary.copy(alpha = 0.14f) else Color.White.copy(alpha = 0.035f))
                            .clickable { onSelect(index) }
                            .padding(bottom = 10.dp),
                    ) {
                        AsyncImage(
                            model = rememberNarayaImageModel(api, item.cover),
                            contentDescription = item.title,
                            modifier = Modifier.fillMaxWidth().height(112.dp),
                            contentScale = ContentScale.Crop,
                        )
                        Text(item.title, modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp), maxLines = 2, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}

@Composable
fun ContentRail(
    title: String,
    items: List<ComicCard>,
    api: NarayaApiClient,
    onOpen: (ComicCard) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier.padding(top = 28.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text(title, modifier = Modifier.padding(horizontal = 20.dp), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        LazyRow(horizontalArrangement = Arrangement.spacedBy(14.dp), contentPadding = PaddingValues(horizontal = 20.dp)) {
            items(items) { item ->
                ComicPoster(api = api, item = item, onClick = { onOpen(item) })
            }
        }
    }
}

@Composable
fun ComicPoster(api: NarayaApiClient, item: ComicCard, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Column(modifier.width(176.dp).clickable(onClick = onClick)) {
        Box(Modifier.fillMaxWidth().aspectRatio(2f / 3f).clip(RoundedCornerShape(14.dp)).background(NarayaSurfaceHigh)) {
            AsyncImage(
                model = rememberNarayaImageModel(api, item.cover),
                contentDescription = item.title,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop,
            )
        }
        Spacer(Modifier.height(10.dp))
        Text(item.title, maxLines = 1, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.Bold)
        Text(listOf(item.type, item.status).joinNonBlank(), maxLines = 1, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
fun CatalogCard(api: NarayaApiClient, item: CatalogItem, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(NarayaSurface)
            .clickable(onClick = onClick)
            .padding(12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        AsyncImage(
            model = rememberNarayaImageModel(api, item.cover),
            contentDescription = item.title,
            modifier = Modifier.size(76.dp, 112.dp).clip(RoundedCornerShape(12.dp)).background(NarayaSurfaceHigh),
            contentScale = ContentScale.Crop,
        )
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(item.title, maxLines = 2, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.Bold)
            Text(listOf(if (item.kind == "series") "Anime" else item.type, item.status).joinNonBlank(), color = MaterialTheme.colorScheme.onSurfaceVariant)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                item.genres.take(2).forEach { AssistChip(onClick = {}, label = { Text(it) }) }
            }
        }
    }
}

@Composable
fun ActionRow(
    favorited: Boolean,
    favoriteCount: Int,
    loved: Boolean,
    loveCount: Int,
    onFavorite: () -> Unit,
    onLove: () -> Unit,
    onShare: () -> Unit,
) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
        DetailIconAction(
            count = favoriteCount,
            active = favorited,
            onClick = onFavorite,
        ) {
            Icon(Icons.Rounded.Bookmark, contentDescription = "Simpan", tint = if (favorited) MaterialTheme.colorScheme.onPrimary else NarayaPrimary)
        }
        DetailIconAction(
            count = loveCount,
            active = loved,
            love = true,
            onClick = onLove,
        ) {
            Icon(Icons.Rounded.Favorite, contentDescription = "Love", tint = if (loved) Color(0xFF3A1F2A) else Color(0xFFFFB3C7))
        }
        DetailIconAction(onClick = onShare) {
            Icon(Icons.Rounded.Share, contentDescription = "Share", tint = NarayaPrimary)
        }
    }
}

@Composable
private fun DetailIconAction(
    count: Int = 0,
    active: Boolean = false,
    love: Boolean = false,
    onClick: () -> Unit,
    icon: @Composable () -> Unit,
) {
    Box {
        IconButton(
            onClick = onClick,
            modifier = Modifier
                .size(44.dp)
                .background(
                    when {
                        active && love -> Color(0xFFFFB3C7)
                        active -> NarayaPrimary
                        love -> Color(0xFF3A1F2A)
                        else -> NarayaSurfaceHigh
                    },
                    RoundedCornerShape(14.dp),
                ),
        ) {
            icon()
        }
        if (count > 0) {
            Text(
                count.toString(),
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .background(NarayaBackground, RoundedCornerShape(999.dp))
                    .padding(horizontal = 5.dp, vertical = 1.dp),
                color = NarayaPrimary,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
            )
        }
    }
}

fun List<String>.joinNonBlank(): String = filter { it.isNotBlank() }.joinToString(" - ")

@Composable
fun narayaPrimaryButtonColors() = ButtonDefaults.buttonColors(
    containerColor = NarayaPrimary,
    contentColor = MaterialTheme.colorScheme.onPrimary,
)

@Composable
fun narayaSurfaceButtonColors() = ButtonDefaults.buttonColors(
    containerColor = NarayaSurfaceHigh,
    contentColor = NarayaPrimary,
)

@Composable
fun narayaLoveButtonColors() = ButtonDefaults.buttonColors(
    containerColor = Color(0xFF3A1F2A),
    contentColor = Color(0xFFFFB3C7),
)

@Composable
fun narayaOutlinedButtonColors() = ButtonDefaults.outlinedButtonColors(
    contentColor = NarayaPrimary,
)

fun narayaOutlinedBorder() = BorderStroke(1.dp, Color.White.copy(alpha = 0.10f))

@Composable
fun rememberNarayaImageModel(api: NarayaApiClient, value: String, reloadKey: Int = 0): ImageRequest {
    val context = LocalContext.current
    return remember(value, reloadKey) {
        ImageRequest.Builder(context)
            .data(api.mediaUrl(value))
            .memoryCacheKey("${api.mediaUrl(value)}#$reloadKey")
            .apply {
                api.mediaHeaders("image").forEach { (name, headerValue) -> addHeader(name, headerValue) }
            }
            .crossfade(true)
            .build()
    }
}
