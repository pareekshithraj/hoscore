package com.example.hoscore.feature.patient

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.DarkMode
import androidx.compose.material.icons.rounded.LightMode
import androidx.compose.material.icons.rounded.LocalPharmacy
import androidx.compose.material.icons.rounded.Payments
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.SwapHoriz
import androidx.compose.material.icons.rounded.Vaccines
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hoscore.core.network.ServiceLocator
import com.example.hoscore.core.ui.components.GradientHeroCard
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.SectionTitle
import com.example.hoscore.core.ui.theme.HoscoreTokens

@Composable
fun PatientDashboardScreen(
    darkMode: Boolean,
    onToggleDark: () -> Unit,
    onSwitchContext: () -> Unit,
    onLogout: () -> Unit,
    canSwitch: Boolean,
    onOpenTab: (Int) -> Unit,
) {
    val t = HoscoreTokens.current
    val user = ServiceLocator.sessionStore.user
    val name = user?.name?.ifBlank { "Patient" } ?: "Patient"
    val initials = name.split(" ").filter { it.isNotEmpty() }.take(2)
        .joinToString("") { it.first().uppercase() }.ifEmpty { "P" }

    Column(
        Modifier.fillMaxSize().background(t.screenBg).verticalScroll(rememberScrollState()),
    ) {
        // Header
        Row(
            Modifier.fillMaxWidth().statusBarsPadding().padding(horizontal = 20.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                Modifier.size(46.dp).clip(CircleShape).background(t.primary),
                contentAlignment = Alignment.Center,
            ) { Text(initials, color = Color.White, fontWeight = FontWeight.Black, fontSize = 15.sp) }
            Spacer(Modifier.size(12.dp))
            Column(Modifier.weight(1f)) {
                Text("Welcome back", fontSize = 12.sp, color = t.textMuted, fontWeight = FontWeight.Medium)
                Text(name, fontSize = 18.sp, fontWeight = FontWeight.Black, color = t.textPrimary)
            }
            IconPill(if (darkMode) Icons.Rounded.LightMode else Icons.Rounded.DarkMode, onToggleDark)
            if (canSwitch) {
                Spacer(Modifier.size(8.dp))
                IconPill(Icons.Rounded.SwapHoriz, onSwitchContext)
            }
        }

        Column(Modifier.padding(horizontal = 20.dp)) {
            GradientHeroCard(
                eyebrow = "YOUR HEALTH PORTAL",
                title = "Everything in one place",
                metricLabel = "Secure & encrypted",
                metricValue = "Active",
                bullets = listOf(
                    "Book and manage appointments",
                    "View prescriptions & records",
                    "Track bills and vaccinations",
                ),
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(Modifier.height(22.dp))
            SectionTitle("Quick actions")
            Spacer(Modifier.height(12.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                QuickAction("Appointments", Icons.Rounded.CalendarMonth, t.primary, Modifier.weight(1f)) { onOpenTab(1) }
                QuickAction("Records", Icons.Rounded.LocalPharmacy, t.teal, Modifier.weight(1f)) { onOpenTab(2) }
            }
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                QuickAction("Bills", Icons.Rounded.Payments, t.amber, Modifier.weight(1f)) { onOpenTab(3) }
                QuickAction("Find hospital", Icons.Rounded.Search, t.cyan, Modifier.weight(1f)) { onOpenTab(3) }
            }

            Spacer(Modifier.height(22.dp))
            SectionTitle("Your care")
            Spacer(Modifier.height(12.dp))
            HoscoreCard(Modifier.fillMaxWidth()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        Modifier.size(44.dp).clip(CircleShape).background(t.emerald.copy(0.12f)),
                        contentAlignment = Alignment.Center,
                    ) { Icon(Icons.Rounded.Vaccines, null, tint = t.emerald, modifier = Modifier.size(22.dp)) }
                    Spacer(Modifier.size(14.dp))
                    Column {
                        Text("Health summary", fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 14.sp)
                        Text("Open a tab below to view live details", color = t.textMuted, fontSize = 12.sp)
                    }
                }
            }
            Spacer(Modifier.height(20.dp))
        }
    }
}

@Composable
private fun IconPill(icon: ImageVector, onClick: () -> Unit) {
    val t = HoscoreTokens.current
    Box(
        Modifier.size(40.dp).clip(CircleShape).background(t.card).clickable { onClick() },
        contentAlignment = Alignment.Center,
    ) { Icon(icon, null, tint = t.textSecondary, modifier = Modifier.size(20.dp)) }
}

@Composable
fun QuickAction(label: String, icon: ImageVector, color: Color, modifier: Modifier = Modifier, onClick: () -> Unit) {
    val t = HoscoreTokens.current
    HoscoreCard(modifier = modifier, onClick = onClick) {
        Column {
            Box(
                Modifier.size(42.dp).clip(CircleShape).background(color.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center,
            ) { Icon(icon, label, tint = color, modifier = Modifier.size(21.dp)) }
            Spacer(Modifier.height(12.dp))
            Text(label, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = t.textPrimary)
        }
    }
}
