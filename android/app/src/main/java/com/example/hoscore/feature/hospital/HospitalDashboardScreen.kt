package com.example.hoscore.feature.hospital

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
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
import androidx.compose.material.icons.rounded.Bed
import androidx.compose.material.icons.rounded.DarkMode
import androidx.compose.material.icons.rounded.Groups
import androidx.compose.material.icons.rounded.LightMode
import androidx.compose.material.icons.rounded.MonitorHeart
import androidx.compose.material.icons.rounded.Science
import androidx.compose.material.icons.rounded.SwapHoriz
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.hoscore.core.common.Resource
import com.example.hoscore.core.network.ServiceLocator
import com.example.hoscore.core.network.Stats
import com.example.hoscore.core.ui.components.DonutChart
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.LoadingSkeleton
import com.example.hoscore.core.ui.components.MetricCard
import com.example.hoscore.core.ui.components.SectionTitle
import com.example.hoscore.core.ui.theme.HoscoreTokens
import com.example.hoscore.core.ui.components.WorkspaceHeaderBar

@Composable
fun HospitalDashboardScreen(
    darkMode: Boolean,
    onToggleDark: () -> Unit,
    onSwitchContext: () -> Unit,
    canSwitch: Boolean,
) {
    val t = HoscoreTokens.current
    val vm: HospitalDashboardVM = viewModel()
    LaunchedEffect(Unit) { vm.start() }
    val state by vm.state.collectAsState()

    val ctx = ServiceLocator.sessionStore.activeContext
    val hospitalName = ctx?.hospitalName ?: "Hospital"
    val role = ctx?.role ?: "STAFF"

    Column(Modifier.fillMaxSize().background(t.screenBg).verticalScroll(rememberScrollState())) {
        WorkspaceHeaderBar(
            onSwitchContext = onSwitchContext,
            darkMode = darkMode,
            onToggleDark = onToggleDark,
            canSwitch = canSwitch
        )

        when (val s = state) {
            is Resource.Loading -> LoadingSkeleton()
            is Resource.Error -> com.example.hoscore.core.ui.components.ErrorState(s.message, onRetry = { vm.refresh() })
            is Resource.Success -> DashboardContent(s.data)
        }
    }
}

@Composable
private fun DashboardContent(stats: Stats) {
    val t = HoscoreTokens.current
    Column(Modifier.padding(horizontal = 20.dp)) {
        // Occupancy hero with donut
        HoscoreCard(Modifier.fillMaxWidth(), padding = 20) {
            Column {
                Text("BED OCCUPANCY", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = t.primary, letterSpacing = 1.sp)
                Text("Ward saturation", fontSize = 18.sp, fontWeight = FontWeight.Black, color = t.textPrimary)
                Spacer(Modifier.height(8.dp))
                val occupied = stats.occupiedBeds.toFloat()
                val free = (stats.totalBeds - stats.occupiedBeds).coerceAtLeast(0).toFloat()
                DonutChart(
                    segments = listOf(occupied to t.primary, free to t.gridLine),
                    centerLabel = "occupied",
                    centerValue = "${stats.occupancyRate}%",
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(8.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                    LegendItem("Occupied", stats.occupiedBeds.toString(), t.primary)
                    LegendItem("Available", (stats.totalBeds - stats.occupiedBeds).coerceAtLeast(0).toString(), t.emerald)
                    LegendItem("Total beds", stats.totalBeds.toString(), t.textMuted)
                }
            }
        }

        Spacer(Modifier.height(20.dp))
        SectionTitle("Clinical resource overview")
        Spacer(Modifier.height(12.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            MetricCard("Patients", stats.totalPatients.toString(), "Registered", Icons.Rounded.Groups, t.primary, Modifier.weight(1f))
            MetricCard("ICU load", stats.icuOccupancyRate?.let { "$it%" } ?: "—", "ICU capacity", Icons.Rounded.MonitorHeart, t.clinical, Modifier.weight(1f))
        }
        Spacer(Modifier.height(14.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            MetricCard("OPD queue", stats.telemetry.activeQueue.toString(), "Active now", Icons.Rounded.Groups, t.cyan, Modifier.weight(1f))
            MetricCard("Pending labs", stats.telemetry.pendingLabs.toString(), "Awaiting results", Icons.Rounded.Science, t.teal, Modifier.weight(1f))
        }
        Spacer(Modifier.height(14.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            MetricCard("Pending Rx", stats.telemetry.pendingRx.toString(), "To dispense", Icons.Rounded.Science, t.primary, Modifier.weight(1f))
            MetricCard("Discharges", stats.dischargesThisMonth.toString(), "This month", Icons.Rounded.Bed, t.emerald, Modifier.weight(1f))
        }

        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun LegendItem(label: String, value: String, color: Color) {
    val t = HoscoreTokens.current
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, fontSize = 18.sp, fontWeight = FontWeight.Black, color = color)
        Text(label, fontSize = 10.sp, color = t.textMuted, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun LiveDot() {
    val t = HoscoreTokens.current
    val transition = rememberInfiniteTransition(label = "live")
    val alpha by transition.animateFloat(
        0.3f, 1f, infiniteRepeatable(tween(800), RepeatMode.Reverse), label = "liveAlpha",
    )
    Box(Modifier.size(7.dp).clip(CircleShape).background(t.emerald.copy(alpha = alpha)))
}

@Composable
private fun IconPill(icon: ImageVector, onClick: () -> Unit) {
    val t = HoscoreTokens.current
    Box(
        Modifier.size(40.dp).clip(CircleShape).background(t.card).clickable { onClick() },
        contentAlignment = Alignment.Center,
    ) { Icon(icon, null, tint = t.textSecondary, modifier = Modifier.size(20.dp)) }
}
