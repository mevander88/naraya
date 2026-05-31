package id.naraya.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val NarayaBackground = Color(0xFF15121B)
val NarayaSurface = Color(0xFF211E27)
val NarayaSurfaceHigh = Color(0xFF2C2832)
val NarayaSurfaceHighest = Color(0xFF37333D)
val NarayaPrimary = Color(0xFFD0BCFF)
val NarayaOnPrimary = Color(0xFF3C0091)
val NarayaText = Color(0xFFE7E0ED)
val NarayaMuted = Color(0xFFCBC3D7)
val NarayaTertiary = Color(0xFFFFB869)

private val NarayaDark: ColorScheme = darkColorScheme(
    primary = NarayaPrimary,
    onPrimary = NarayaOnPrimary,
    secondary = NarayaTertiary,
    background = NarayaBackground,
    onBackground = NarayaText,
    surface = NarayaSurface,
    onSurface = NarayaText,
    surfaceVariant = NarayaSurfaceHighest,
    onSurfaceVariant = NarayaMuted,
)

@Composable
fun NarayaTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = NarayaDark,
        typography = MaterialTheme.typography,
        content = content,
    )
}
