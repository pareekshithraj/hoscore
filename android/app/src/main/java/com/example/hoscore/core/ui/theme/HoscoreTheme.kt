package com.example.hoscore.core.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat

/**
 * App-wide theme. Wraps Material3 with the HOSCORE palette and drives the
 * system bars. Dark mode is an explicit app setting (falls back to system).
 */
@Composable
fun HoscoreTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val palette = if (darkTheme) DarkPalette else LightPalette

    val colorScheme = if (darkTheme) {
        darkColorScheme(
            primary = palette.primary,
            onPrimary = palette.onBrand,
            secondary = palette.teal,
            tertiary = palette.cyan,
            background = palette.screenBg,
            surface = palette.card,
            onBackground = palette.textPrimary,
            onSurface = palette.textPrimary,
            error = palette.clinical,
        )
    } else {
        lightColorScheme(
            primary = palette.primary,
            onPrimary = palette.onBrand,
            secondary = palette.teal,
            tertiary = palette.cyan,
            background = palette.screenBg,
            surface = palette.card,
            onBackground = palette.textPrimary,
            onSurface = palette.textPrimary,
            error = palette.clinical,
        )
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window ?: return@SideEffect
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    CompositionLocalProvider(LocalHoscorePalette provides palette) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = HoscoreTypography,
            content = content,
        )
    }
}

private val HoscoreTypography = Typography(
    displaySmall = TextStyle(fontWeight = FontWeight.Black, fontSize = 30.sp, letterSpacing = (-0.5).sp),
    headlineMedium = TextStyle(fontWeight = FontWeight.Black, fontSize = 24.sp, letterSpacing = (-0.3).sp),
    titleLarge = TextStyle(fontWeight = FontWeight.ExtraBold, fontSize = 18.sp),
    titleMedium = TextStyle(fontWeight = FontWeight.Bold, fontSize = 16.sp),
    bodyLarge = TextStyle(fontWeight = FontWeight.Normal, fontSize = 15.sp),
    bodyMedium = TextStyle(fontWeight = FontWeight.Normal, fontSize = 13.sp),
    labelLarge = TextStyle(fontWeight = FontWeight.Bold, fontSize = 13.sp),
    labelSmall = TextStyle(fontWeight = FontWeight.Bold, fontSize = 10.sp, letterSpacing = 1.sp),
)

/** Amber accent used for hero headline values (matches web). */
val AmberAccent = Color(0xFFFCD34D)
