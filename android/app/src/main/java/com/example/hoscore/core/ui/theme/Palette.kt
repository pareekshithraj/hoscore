package com.example.hoscore.core.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

/**
 * HOSCORE design tokens, ported 1:1 from the web client's index.css so native
 * and web feel like one product. Exposed through [LocalHoscorePalette].
 */
data class HoscorePalette(
    val isDark: Boolean,
    // brand
    val primary: Color,
    val primaryDark: Color,
    val cyan: Color,
    val teal: Color,
    val emerald: Color,
    val clinical: Color,
    val amber: Color,
    // surfaces
    val screenBg: Color,
    val card: Color,
    val cardBorder: Color,
    val innerBg: Color,
    val gridLine: Color,
    // text
    val textPrimary: Color,
    val textSecondary: Color,
    val textMuted: Color,
    val onBrand: Color,
) {
    /** Gradient anchor pair for hero cards. */
    val heroStart get() = primary
    val heroEnd get() = primaryDark
}

val LightPalette = HoscorePalette(
    isDark = false,
    primary = Color(0xFF2563EB),
    primaryDark = Color(0xFF1D4ED8),
    cyan = Color(0xFF0EA5E9),
    teal = Color(0xFF0D9488),
    emerald = Color(0xFF10B981),
    clinical = Color(0xFFE11D48),
    amber = Color(0xFFF59E0B),
    screenBg = Color(0xFFFAFAFA),
    card = Color(0xFFFFFFFF),
    cardBorder = Color(0xFFEAEAEA),
    innerBg = Color(0xFFF4F4F5),
    gridLine = Color(0xFFF1F5F9),
    textPrimary = Color(0xFF0A0A0A),
    textSecondary = Color(0xFF666666),
    textMuted = Color(0xFF888888),
    onBrand = Color(0xFFFFFFFF),
)

val DarkPalette = HoscorePalette(
    isDark = true,
    primary = Color(0xFF3B82F6),
    primaryDark = Color(0xFF1D4ED8),
    cyan = Color(0xFF38BDF8),
    teal = Color(0xFF14B8A6),
    emerald = Color(0xFF10B981),
    clinical = Color(0xFFF43F5E),
    amber = Color(0xFFFCD34D),
    screenBg = Color(0xFF000000),
    card = Color(0xFF0A0A0A),
    cardBorder = Color(0xFF1F1F1F),
    innerBg = Color(0xFF111113),
    gridLine = Color(0x14FFFFFF),
    textPrimary = Color(0xFFFFFFFF),
    textSecondary = Color(0xFF9A9A9A),
    textMuted = Color(0xFF6B6B6B),
    onBrand = Color(0xFFFFFFFF),
)

val LocalHoscorePalette = staticCompositionLocalOf { LightPalette }

/** Convenience accessor: `HoscoreTokens.current`. */
object HoscoreTokens {
    val current: HoscorePalette
        @Composable @ReadOnlyComposable get() = LocalHoscorePalette.current
}
