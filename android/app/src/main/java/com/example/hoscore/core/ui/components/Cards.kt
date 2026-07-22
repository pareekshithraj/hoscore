package com.example.hoscore.core.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hoscore.core.ui.theme.HoscoreTokens

/** Standard elevated surface card used everywhere. */
@Composable
fun HoscoreCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    padding: Int = 16,
    content: @Composable () -> Unit,
) {
    val t = HoscoreTokens.current
    val base = modifier
        .shadow(if (t.isDark) 0.dp else 4.dp, RoundedCornerShape(18.dp), clip = false)
        .clip(RoundedCornerShape(18.dp))
        .background(t.card)
        .border(BorderStroke(1.dp, t.cardBorder), RoundedCornerShape(18.dp))
    val clickable = if (onClick != null) base.clickable { onClick() } else base
    Box(clickable.padding(padding.dp)) { content() }
}

/** Compact KPI tile: label, big value, small subtext + tinted icon. */
@Composable
fun MetricCard(
    label: String,
    value: String,
    subtext: String? = null,
    icon: ImageVector? = null,
    accent: Color? = null,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
) {
    val t = HoscoreTokens.current
    val tint = accent ?: t.primary
    HoscoreCard(modifier = modifier, onClick = onClick) {
        Column {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(label, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = t.textSecondary)
                if (icon != null) {
                    Box(
                        Modifier.size(32.dp).clip(CircleShape).background(tint.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center,
                    ) { Icon(icon, label, tint = tint, modifier = Modifier.size(17.dp)) }
                }
            }
            Spacer(Modifier.height(10.dp))
            Text(value, fontSize = 22.sp, fontWeight = FontWeight.Black, color = t.textPrimary)
            if (subtext != null) {
                Spacer(Modifier.height(3.dp))
                Text(subtext, fontSize = 11.sp, color = t.textMuted, fontWeight = FontWeight.Medium)
            }
        }
    }
}

/** Big gradient hero card for the top of dashboards. */
@Composable
fun GradientHeroCard(
    eyebrow: String,
    title: String,
    metricLabel: String,
    metricValue: String,
    modifier: Modifier = Modifier,
    bullets: List<String> = emptyList(),
) {
    val t = HoscoreTokens.current
    Box(
        modifier
            .shadow(10.dp, RoundedCornerShape(20.dp))
            .clip(RoundedCornerShape(20.dp))
            .background(Brush.linearGradient(listOf(t.heroStart, t.heroEnd)))
            .padding(20.dp),
    ) {
        Column {
            Text(eyebrow, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White.copy(0.8f), letterSpacing = 1.sp)
            Text(title, fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color.White)
            if (bullets.isNotEmpty()) {
                Spacer(Modifier.height(12.dp))
                bullets.take(3).forEach {
                    Text("•  $it", fontSize = 12.sp, color = Color.White.copy(0.9f),
                        maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(bottom = 4.dp))
                }
            }
            Spacer(Modifier.height(14.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Bottom) {
                Text(metricLabel, fontSize = 12.sp, color = Color.White.copy(0.75f), fontWeight = FontWeight.Bold)
                Text(metricValue, fontSize = 24.sp, fontWeight = FontWeight.Black, color = Color(0xFFFCD34D))
            }
        }
    }
}
