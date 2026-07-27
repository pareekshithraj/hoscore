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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
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
    var selectedDateIdx by remember { mutableStateOf(3) }
    val dateChips = listOf("09", "10", "11", "Today, 12 June", "13", "14")

    Column(Modifier.padding(horizontal = 20.dp)) {
        // Date chip selector (Matching Image 3)
        Row(
            Modifier.fillMaxWidth().padding(vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            dateChips.forEachIndexed { idx, label ->
                val isSelected = idx == selectedDateIdx
                Box(
                    Modifier
                        .clip(CircleShape)
                        .background(if (isSelected) t.primary else t.card)
                        .clickable { selectedDateIdx = idx }
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        label,
                        fontSize = 12.sp,
                        fontWeight = if (isSelected) FontWeight.Black else FontWeight.Bold,
                        color = if (isSelected) Color.White else t.textMuted,
                    )
                }
            }
        }

        Spacer(Modifier.height(10.dp))

        // Vibrant Royal Blue Metrics Hero Grid (Matching Image 2)
        Box(
            Modifier
                .fillMaxWidth()
                .clip(androidx.compose.foundation.shape.RoundedCornerShape(26.dp))
                .background(
                    androidx.compose.ui.graphics.Brush.linearGradient(
                        listOf(t.primary, Color(0xFF2563EB), Color(0xFF1D4ED8))
                    )
                )
                .padding(20.dp)
        ) {
            Column {
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column {
                        Text("CLINICAL REVIEW", fontSize = 11.sp, fontWeight = FontWeight.Black, color = Color.White.copy(alpha = 0.8f), letterSpacing = 1.sp)
                        Text("Active Hospital Load", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color.White)
                    }
                    Box(
                        Modifier
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.2f))
                            .padding(horizontal = 12.dp, vertical = 6.dp),
                    ) {
                        Text("LIVE", fontSize = 11.sp, fontWeight = FontWeight.Black, color = Color.White)
                    }
                }

                Spacer(Modifier.height(16.dp))

                // 2x2 Metric Tile Grid (Matching Image 2)
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        MetricTile(
                            title = "Active Queue",
                            value = "${stats.telemetry.activeQueue} Patients",
                            subPill = "Now Waiting",
                            icon = Icons.Rounded.Groups,
                            modifier = Modifier.weight(1f)
                        )
                        MetricTile(
                            title = "Pending Labs",
                            value = "${stats.telemetry.pendingLabs} Orders",
                            subPill = "Awaiting",
                            icon = Icons.Rounded.Science,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        MetricTile(
                            title = "Heart Rate & Vitals",
                            value = "${stats.icuOccupancyRate ?: 98.5}%",
                            subPill = "ICU Load",
                            icon = Icons.Rounded.MonitorHeart,
                            modifier = Modifier.weight(1f)
                        )
                        MetricTile(
                            title = "Ward Beds",
                            value = "${stats.occupancyRate}%",
                            subPill = "${stats.occupiedBeds}/${stats.totalBeds} Beds",
                            icon = Icons.Rounded.Bed,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(20.dp))
        SectionTitle("Bed occupancy & ward distribution")
        Spacer(Modifier.height(12.dp))

        // Donut Chart Card
        HoscoreCard(Modifier.fillMaxWidth(), padding = 20) {
            Column {
                val occupied = stats.occupiedBeds.toFloat()
                val free = (stats.totalBeds - stats.occupiedBeds).coerceAtLeast(0).toFloat()
                DonutChart(
                    segments = listOf(occupied to t.primary, free to t.gridLine),
                    centerLabel = "occupied",
                    centerValue = "${stats.occupancyRate}%",
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(12.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                    LegendItem("Occupied", stats.occupiedBeds.toString(), t.primary)
                    LegendItem("Available", (stats.totalBeds - stats.occupiedBeds).coerceAtLeast(0).toString(), t.emerald)
                    LegendItem("Total Beds", stats.totalBeds.toString(), t.textMuted)
                }
            }
        }

        Spacer(Modifier.height(20.dp))
        SectionTitle("Clinical operations summary")
        Spacer(Modifier.height(12.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            MetricCard("Prescriptions", stats.telemetry.pendingRx.toString(), "Pending dispense", Icons.Rounded.Science, t.primary, Modifier.weight(1f))
            MetricCard("Discharges", stats.dischargesThisMonth.toString(), "This month", Icons.Rounded.Bed, t.emerald, Modifier.weight(1f))
        }

        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun MetricTile(
    title: String,
    value: String,
    subPill: String,
    icon: ImageVector,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier
            .clip(androidx.compose.foundation.shape.RoundedCornerShape(18.dp))
            .background(Color.White.copy(alpha = 0.15f))
            .padding(14.dp)
    ) {
        Column {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.25f)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(icon, null, tint = Color.White, modifier = Modifier.size(18.dp))
                }
                Box(
                    Modifier
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.25f))
                        .padding(horizontal = 8.dp, vertical = 2.dp),
                ) {
                    Text(subPill, fontSize = 9.5.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
            Spacer(Modifier.height(10.dp))
            Text(value, fontSize = 16.sp, fontWeight = FontWeight.Black, color = Color.White)
            Text(title, fontSize = 11.sp, fontWeight = FontWeight.Medium, color = Color.White.copy(alpha = 0.85f))
        }
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
