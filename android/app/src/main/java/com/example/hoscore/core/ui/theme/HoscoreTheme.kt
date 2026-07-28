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
import androidx.compose.ui.text.googlefonts.Font
import androidx.compose.ui.text.googlefonts.GoogleFont
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat
import com.example.hoscore.R

val provider = GoogleFont.Provider(
    providerAuthority = "com.google.android.gms.fonts",
    providerPackage = "com.google.android.gms",
    certificates = R.array.com_google_android_gms_fonts_certs
)

val InterFont = GoogleFont("Inter")

private val InterBlack = androidx.compose.ui.text.font.FontFamily(
    Font(googleFont = InterFont, fontProvider = provider, weight = FontWeight.Black)
)
private val InterExtraBold = androidx.compose.ui.text.font.FontFamily(
    Font(googleFont = InterFont, fontProvider = provider, weight = FontWeight.ExtraBold)
)
private val InterBold = androidx.compose.ui.text.font.FontFamily(
    Font(googleFont = InterFont, fontProvider = provider, weight = FontWeight.Bold)
)
private val InterMedium = androidx.compose.ui.text.font.FontFamily(
    Font(googleFont = InterFont, fontProvider = provider, weight = FontWeight.Medium)
)
private val InterNormal = androidx.compose.ui.text.font.FontFamily(
    Font(googleFont = InterFont, fontProvider = provider, weight = FontWeight.Normal)
)

/**
 * App-wide theme. Wraps Material3 with the HOSCORE palette and drives the
 * system bars. Dark mode is locked to light (removed toggle feature).
 */
@Composable
fun HoscoreTheme(
    darkTheme: Boolean = false,
    content: @Composable () -> Unit,
) {
    val palette = LightPalette

    val colorScheme = lightColorScheme(
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

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window ?: return@SideEffect
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = true
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
    displaySmall   = TextStyle(fontFamily = InterBlack,     fontWeight = FontWeight.Black,     fontSize = 30.sp, letterSpacing = (-0.5).sp),
    headlineMedium = TextStyle(fontFamily = InterBlack,     fontWeight = FontWeight.Black,     fontSize = 24.sp, letterSpacing = (-0.3).sp),
    titleLarge     = TextStyle(fontFamily = InterExtraBold, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp),
    titleMedium    = TextStyle(fontFamily = InterBold,      fontWeight = FontWeight.Bold,      fontSize = 16.sp),
    bodyLarge      = TextStyle(fontFamily = InterNormal,    fontWeight = FontWeight.Normal,    fontSize = 15.sp),
    bodyMedium     = TextStyle(fontFamily = InterNormal,    fontWeight = FontWeight.Normal,    fontSize = 13.sp),
    labelLarge     = TextStyle(fontFamily = InterBold,      fontWeight = FontWeight.Bold,      fontSize = 13.sp),
    labelSmall     = TextStyle(fontFamily = InterMedium,    fontWeight = FontWeight.Bold,      fontSize = 10.sp, letterSpacing = 1.sp),
)

/** Amber accent used for hero headline values (matches web). */
val AmberAccent = Color(0xFFFCD34D)
