package com.example.hoscore.core.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hoscore.core.ui.theme.HoscoreTokens

@Composable
fun SectionTitle(text: String, modifier: Modifier = Modifier) {
    Text(
        text,
        modifier = modifier,
        fontSize = 16.sp,
        fontWeight = FontWeight.Black,
        color = HoscoreTokens.current.textPrimary,
    )
}

/** Colored pill for statuses (queue, bills, admissions, etc.). */
@Composable
fun StatusBadge(text: String, color: Color, modifier: Modifier = Modifier) {
    Box(
        modifier
            .background(color.copy(alpha = 0.14f), RoundedCornerShape(8.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp),
    ) {
        Text(text, fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = color, letterSpacing = 0.5.sp)
    }
}

/** Maps common backend status strings to a semantic accent color. */
@Composable
fun statusColor(status: String?): Color {
    val t = HoscoreTokens.current
    return when (status?.uppercase()) {
        "WAITING", "PENDING", "SCHEDULED", "PROCESSING", "OPEN" -> t.amber
        "IN_CONSULTATION", "ADMITTED", "ACTIVE", "IN_PROGRESS" -> t.primary
        "COMPLETED", "PAID", "DISCHARGED", "APPROVED", "DONE", "CLOSED" -> t.emerald
        "CANCELLED", "REJECTED", "OVERDUE", "CRITICAL", "SUSPENDED" -> t.clinical
        else -> t.textMuted
    }
}

val ScreenPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp)
