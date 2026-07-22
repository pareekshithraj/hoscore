package com.example.hoscore.core.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hoscore.core.ui.theme.HoscoreTokens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.rounded.DarkMode
import androidx.compose.material.icons.rounded.KeyboardArrowDown
import androidx.compose.material.icons.rounded.LightMode
import androidx.compose.material.icons.rounded.SwapHoriz
import com.example.hoscore.core.network.ServiceLocator

/** Compact screen header with optional back button + trailing action. */
@Composable
fun HoscoreTopBar(
    title: String,
    subtitle: String? = null,
    onBack: (() -> Unit)? = null,
    trailingIcon: ImageVector? = null,
    onTrailing: (() -> Unit)? = null,
) {
    val t = HoscoreTokens.current
    Row(
        Modifier
            .fillMaxWidth()
            .background(t.screenBg)
            .statusBarsPadding()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (onBack != null) {
            Box(
                Modifier.size(38.dp).clip(CircleShape).background(t.card).clickable { onBack() },
                contentAlignment = Alignment.Center,
            ) { Icon(Icons.AutoMirrored.Rounded.ArrowBack, "Back", tint = t.textPrimary, modifier = Modifier.size(20.dp)) }
            Spacer(Modifier.size(12.dp))
        }
        Column(Modifier.weight(1f)) {
            Text(title, fontSize = 20.sp, fontWeight = FontWeight.Black, color = t.textPrimary)
            if (subtitle != null) Text(subtitle, fontSize = 12.sp, color = t.textMuted, fontWeight = FontWeight.Medium)
        }
        if (trailingIcon != null && onTrailing != null) {
            Box(
                Modifier.size(40.dp).clip(CircleShape).background(t.primary.copy(alpha = 0.12f)).clickable { onTrailing() },
                contentAlignment = Alignment.Center,
            ) { Icon(trailingIcon, null, tint = t.primary, modifier = Modifier.size(20.dp)) }
        }
    }
}

/**
 * Top bar header with active workspace switcher dropdown button and theme toggle.
 * Gives instant access to switch between Hospital, Patient, and SuperAdmin dashboards.
 */
@Composable
fun WorkspaceHeaderBar(
    onSwitchContext: () -> Unit,
    darkMode: Boolean,
    onToggleDark: () -> Unit,
    canSwitch: Boolean = true,
) {
    val t = HoscoreTokens.current
    val ctx = ServiceLocator.sessionStore.activeContext
    val workspaceName = when (ctx?.type) {
        "hospital" -> ctx.hospitalName ?: "Hospital Portal"
        "superadmin" -> "Super Admin"
        else -> "Patient Portal"
    }
    val roleBadge = ctx?.role ?: ctx?.type?.uppercase() ?: "PORTAL"

    Row(
        Modifier
            .fillMaxWidth()
            .background(t.screenBg)
            .statusBarsPadding()
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        // Workspace Switcher Pill Button
        Row(
            Modifier
                .clip(RoundedCornerShape(20.dp))
                .background(t.card)
                .border(BorderStroke(1.dp, t.cardBorder), RoundedCornerShape(20.dp))
                .clickable { onSwitchContext() }
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                Modifier
                    .size(24.dp)
                    .clip(CircleShape)
                    .background(t.primary.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.Rounded.SwapHoriz,
                    contentDescription = "Switch Workspace",
                    tint = t.primary,
                    modifier = Modifier.size(14.dp)
                )
            }
            Spacer(Modifier.size(8.dp))
            Column {
                Text(
                    text = workspaceName,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Black,
                    color = t.textPrimary,
                    maxLines = 1
                )
                Text(
                    text = roleBadge,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = t.primary,
                    maxLines = 1
                )
            }
            Spacer(Modifier.size(6.dp))
            Icon(
                imageVector = Icons.Rounded.KeyboardArrowDown,
                contentDescription = "Dropdown",
                tint = t.textMuted,
                modifier = Modifier.size(16.dp)
            )
        }

        // Theme Toggle Button
        Box(
            Modifier
                .size(38.dp)
                .clip(CircleShape)
                .background(t.card)
                .border(BorderStroke(1.dp, t.cardBorder), CircleShape)
                .clickable { onToggleDark() },
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = if (darkMode) Icons.Rounded.LightMode else Icons.Rounded.DarkMode,
                contentDescription = "Toggle Dark Mode",
                tint = if (darkMode) t.amber else t.textPrimary,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}
