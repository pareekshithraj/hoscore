package com.example.hoscore.feature.hospital

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.border
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.example.hoscore.core.common.Resource
import com.example.hoscore.core.network.ServiceLocator
import com.example.hoscore.core.network.Stats
import com.example.hoscore.core.ui.components.DonutChart

// ─── Hospital portal colour tokens ───────────────────────────────────────────
private val HTeal      = Color(0xFF0D9488)
private val HTealMid   = Color(0xFF14B8A6)
private val HTealSoft  = Color(0xFFCCFBF1)
private val HBlue      = Color(0xFF2563EB)
private val HBlueSoft  = Color(0xFFDBEAFE)
private val HGreen     = Color(0xFF10B981)
private val HGreenSoft = Color(0xFFD1FAE5)
private val HAmber     = Color(0xFFF59E0B)
private val HAmberSoft = Color(0xFFFEF3C7)
private val HPurple    = Color(0xFF7C3AED)
private val HPurpleSoft = Color(0xFFEDE9FE)
private val HRed       = Color(0xFFEF4444)
private val HRedSoft   = Color(0xFFFEE2E2)
private val BGLight    = Color(0xFFF0FDF9)   // slightly teal-tinted background
private val TextDark   = Color(0xFF0F172A)
private val TextMid    = Color(0xFF475569)
private val TextLight  = Color(0xFF94A3B8)

@Composable
fun HospitalDashboardScreen(
    onSwitchContext: () -> Unit,
    canSwitch: Boolean,
    onOpenTab: (Int) -> Unit = {},
) {
    val vm: HospitalDashboardVM = viewModel()
    LaunchedEffect(Unit) { vm.start() }
    val state by vm.state.collectAsState()

    val ctx          = ServiceLocator.sessionStore.activeContext
    val hospitalName = ctx?.hospitalName ?: "Hospital"
    val role         = ctx?.role ?: "Staff"
    val user         = ServiceLocator.sessionStore.user
    val initials     = (user?.name ?: hospitalName).split(" ").filter { it.isNotEmpty() }.take(2)
        .joinToString("") { it.first().uppercase() }.ifEmpty { "H" }

    Column(
        Modifier
            .fillMaxSize()
            .background(BGLight)
            .verticalScroll(rememberScrollState()),
    ) {
        // ─── Top bar ──────────────────────────────────────────────────────
        Row(
            Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 20.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                Modifier
                    .size(46.dp)
                    .clip(CircleShape)
                    .background(Brush.linearGradient(listOf(HTeal, HTealMid))),
                contentAlignment = Alignment.Center,
            ) { Text(initials, color = Color.White, fontWeight = FontWeight.Black, fontSize = 15.sp) }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text("Dashboard 🏥", fontSize = 12.sp, color = TextLight, fontWeight = FontWeight.Medium)
                Text(hospitalName, fontSize = 15.sp, fontWeight = FontWeight.Black, color = TextDark, maxLines = 1)
            }
            var showHospitalQR by remember { mutableStateOf(false) }
            if (showHospitalQR) {
                HospitalQRModal(hospitalName, ctx?.hospitalId ?: "HSP-MAIN") { showHospitalQR = false }
            }

            HIconBtn(Icons.Rounded.QrCode2, { showHospitalQR = true }, HTeal)
            Spacer(Modifier.width(8.dp))
            if (canSwitch) {
                HIconBtn(Icons.Rounded.SwapHoriz, onSwitchContext, HTeal)
                Spacer(Modifier.width(8.dp))
            }
            HIconBtn(Icons.Rounded.Notifications, { onOpenTab(1) }, HTeal)
        }

        when (val s = state) {
            is Resource.Loading -> HospitalLoadingContent()
            is Resource.Error   -> HospitalErrorContent(s.message) { vm.refresh() }
            is Resource.Success -> HospitalContent(s.data, onOpenTab, role)
        }
    }
}

@Composable
private fun HospitalContent(stats: Stats, onOpenTab: (Int) -> Unit = {}, role: String = "Staff") {
    var selectedDateIdx by remember { mutableStateOf(2) }
    val today = java.util.Calendar.getInstance()
    val dayOfMonth = today.get(java.util.Calendar.DAY_OF_MONTH)
    val dayNames = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
    val dayOfWeek = today.get(java.util.Calendar.DAY_OF_WEEK) // 1=Sun
    val dateChips = (0..5).map { offset ->
        val d = dayOfMonth - 2 + offset
        val dow = ((dayOfWeek - 2 + offset).mod(7))
        Pair(d.toString(), dayNames[dow])
    }

    Column(Modifier.padding(horizontal = 20.dp)) {
        // ─── Date strip ───────────────────────────────────────────────────
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            dateChips.forEachIndexed { i, (day, dow) ->
                val selected = i == selectedDateIdx
                Column(
                    Modifier
                        .clip(RoundedCornerShape(14.dp))
                        .background(if (selected) HTeal else Color.White)
                        .clickable { selectedDateIdx = i }
                        .padding(horizontal = 10.dp, vertical = 8.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(dow, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = if (selected) Color.White.copy(0.8f) else TextLight)
                    Spacer(Modifier.height(2.dp))
                    Text(day, fontSize = 15.sp, fontWeight = FontWeight.Black, color = if (selected) Color.White else TextDark)
                }
            }
        }

        Spacer(Modifier.height(20.dp))

        val dayTitle = when (role) {
            "DOCTOR" -> "My clinic day"
            "RECEPTIONIST" -> "Front desk"
            "NURSE" -> "Ward round"
            "LAB_TECH" -> "Lab inbox"
            "PHARMACIST" -> "Dispense desk"
            else -> "Hospital activity"
        }
        Box(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(Color.White)
                .clickable { onOpenTab(1) }
                .padding(16.dp),
        ) {
            Column {
                Text(dayTitle, fontWeight = FontWeight.Black, color = TextDark, fontSize = 15.sp)
                Spacer(Modifier.height(4.dp))
                Text("${stats.telemetry.activeQueue} in OPD queue · occupancy ${stats.occupancyRate}%", color = TextMid, fontSize = 12.sp)
                Spacer(Modifier.height(8.dp))
                Text("Open queue", color = HTeal, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }

        Spacer(Modifier.height(20.dp))

        // ─── Hero gradient activity card ─────────────────────────────────
        Box(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .background(Brush.linearGradient(listOf(HTeal, Color(0xFF2DD4BF), HBlue)))
                .padding(20.dp),
        ) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Box(
                        Modifier
                            .clip(CircleShape)
                            .background(Color.White.copy(0.2f))
                            .padding(horizontal = 10.dp, vertical = 3.dp),
                    ) {
                        Text("LIVE CLINICAL", fontSize = 9.sp, fontWeight = FontWeight.Black, color = Color.White, letterSpacing = 1.sp)
                    }
                    Spacer(Modifier.height(8.dp))
                    Text("Hospital\nActivity", fontSize = 22.sp, fontWeight = FontWeight.Black, color = Color.White, lineHeight = 26.sp)
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        HeroPill("${stats.telemetry.activeQueue} Queue", Color(0xFFBFDBFE))
                        HeroPill("${stats.occupancyRate}% Beds", Color(0xFFBBF7D0))
                    }
                }
                Box(
                    Modifier
                        .size(80.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(0.18f)),
                    contentAlignment = Alignment.Center,
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Rounded.LocalHospital, null, tint = Color.White, modifier = Modifier.size(30.dp))
                        Text("${stats.occupancyRate}%", fontSize = 13.sp, fontWeight = FontWeight.Black, color = Color.White)
                    }
                }
            }
        }

        Spacer(Modifier.height(20.dp))

        // ─── Metric 2×2 grid ─────────────────────────────────────────────
        SectionHeader2("Clinic Metrics")
        Spacer(Modifier.height(12.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            HMetricCard(
                icon = Icons.Rounded.Groups,
                iconBg = HTealSoft,
                iconTint = HTeal,
                label = "Active Queue",
                value = "${stats.telemetry.activeQueue}",
                sub = "Patients waiting",
                modifier = Modifier.weight(1f),
            )
            HMetricCard(
                icon = Icons.Rounded.Bed,
                iconBg = HBlueSoft,
                iconTint = HBlue,
                label = "Ward Beds",
                value = "${stats.occupiedBeds}/${stats.totalBeds}",
                sub = "${stats.occupancyRate}% occupied",
                trend = "${stats.occupancyRate}%",
                trendUp = stats.occupancyRate < 85,
                modifier = Modifier.weight(1f),
            )
        }
        Spacer(Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            HMetricCard(
                icon = Icons.Rounded.Science,
                iconBg = HAmberSoft,
                iconTint = HAmber,
                label = "Pending Labs",
                value = "${stats.telemetry.pendingLabs}",
                sub = "Awaiting results",
                modifier = Modifier.weight(1f),
            )
            HMetricCard(
                icon = Icons.Rounded.MonitorHeart,
                iconBg = HPurpleSoft,
                iconTint = HPurple,
                label = "Pending Rx",
                value = "${stats.telemetry.pendingRx}",
                sub = "Prescriptions",
                modifier = Modifier.weight(1f),
            )
        }

        Spacer(Modifier.height(20.dp))

        // ─── Donut chart ─────────────────────────────────────────────────
        SectionHeader2("Bed Occupancy")
        Spacer(Modifier.height(12.dp))

        Box(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(Color.White)
                .shadow(4.dp, RoundedCornerShape(20.dp))
                .padding(20.dp),
        ) {
            Column {
                val occupied = stats.occupiedBeds.toFloat()
                val free = (stats.totalBeds - stats.occupiedBeds).coerceAtLeast(0).toFloat()
                DonutChart(
                    segments = listOf(occupied to HTeal, free to HTealSoft),
                    centerLabel = "occupied",
                    centerValue = "${stats.occupancyRate}%",
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(12.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                    DonutLegend("Occupied",  "${stats.occupiedBeds}",                                  HTeal)
                    DonutLegend("Available", "${(stats.totalBeds - stats.occupiedBeds).coerceAtLeast(0)}", HGreen)
                    DonutLegend("Total",     "${stats.totalBeds}",                                     TextLight)
                }
            }
        }

        Spacer(Modifier.height(20.dp))

        // ─── Quick actions row ────────────────────────────────────────────
        SectionHeader2("Quick Actions")
        Spacer(Modifier.height(12.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            HQuickBtn("OPD Queue", Icons.Rounded.Groups, HTeal, HTealSoft, Modifier.weight(1f)) { onOpenTab(1) }
            HQuickBtn("Patients", Icons.Rounded.Person, HBlue, HBlueSoft, Modifier.weight(1f)) { onOpenTab(2) }
            HQuickBtn("More", Icons.Rounded.GridView, HGreen, HGreenSoft, Modifier.weight(1f)) { onOpenTab(3) }
        }

        Spacer(Modifier.height(28.dp))
    }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

@Composable
private fun HMetricCard(
    icon: ImageVector,
    iconBg: Color,
    iconTint: Color,
    label: String,
    value: String,
    sub: String,
    modifier: Modifier = Modifier,
    trend: String? = null,
    trendUp: Boolean = true,
) {
    Box(
        modifier
            .clip(RoundedCornerShape(20.dp))
            .background(Color.White)
            .padding(14.dp),
    ) {
        Column {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    Modifier.size(38.dp).clip(CircleShape).background(iconBg),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(icon, null, tint = iconTint, modifier = Modifier.size(20.dp))
                }
                // Only render a trend badge when we have a real derived value.
                if (trend != null) {
                    Box(
                        Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (trendUp) HGreenSoft else HRedSoft)
                            .padding(horizontal = 6.dp, vertical = 2.dp),
                    ) {
                        Text(
                            trend,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                            color = if (trendUp) HGreen else HRed,
                        )
                    }
                }
            }
            Spacer(Modifier.height(10.dp))
            Text(value, fontSize = 20.sp, fontWeight = FontWeight.Black, color = TextDark)
            Text(label, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextMid)
            Text(sub, fontSize = 10.sp, color = TextLight)
        }
    }
}

@Composable
private fun HQuickBtn(label: String, icon: ImageVector, color: Color, bgColor: Color, modifier: Modifier = Modifier, onClick: () -> Unit = {}) {
    Box(
        modifier
            .clip(RoundedCornerShape(14.dp))
            .background(Color.White)
            .clickable { onClick() }
            .padding(10.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                Modifier.size(40.dp).clip(RoundedCornerShape(12.dp)).background(bgColor),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, null, tint = color, modifier = Modifier.size(20.dp))
            }
            Spacer(Modifier.height(4.dp))
            Text(label, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = TextDark, maxLines = 1)
        }
    }
}

@Composable
private fun HeroPill(text: String, bg: Color) {
    Box(Modifier.clip(CircleShape).background(bg.copy(0.3f)).padding(horizontal = 10.dp, vertical = 3.dp)) {
        Text(text, fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color.White)
    }
}

@Composable
private fun DonutLegend(label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, fontSize = 18.sp, fontWeight = FontWeight.Black, color = color)
        Text(label, fontSize = 10.sp, color = TextLight, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun SectionHeader2(title: String) {
    Text(title, fontSize = 16.sp, fontWeight = FontWeight.Black, color = TextDark)
}

@Composable
private fun HIconBtn(icon: ImageVector, onClick: () -> Unit, tint: Color = TextLight) {
    Box(
        Modifier.size(40.dp).clip(CircleShape).background(Color.White).clickable { onClick() },
        contentAlignment = Alignment.Center,
    ) {
        Icon(icon, null, tint = tint, modifier = Modifier.size(20.dp))
    }
}

@Composable
private fun HospitalLoadingContent() {
    Box(Modifier.fillMaxWidth().padding(60.dp), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = HTeal)
    }
}

@Composable
private fun HospitalErrorContent(msg: String, onRetry: () -> Unit) {
    Column(
        Modifier.fillMaxWidth().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(Icons.Rounded.Warning, null, tint = HAmber, modifier = Modifier.size(48.dp))
        Spacer(Modifier.height(12.dp))
        Text(msg, color = TextMid, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
        Spacer(Modifier.height(16.dp))
        Box(
            Modifier.clip(RoundedCornerShape(12.dp)).background(HTeal).clickable { onRetry() }.padding(horizontal = 24.dp, vertical = 10.dp),
        ) {
            Text("Retry", color = Color.White, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun HospitalQRModal(hospitalName: String, hospitalId: String, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Text("Hospital Official QR Pass", fontWeight = FontWeight.Black, fontSize = 18.sp, color = TextDark)
                Text(hospitalName, fontSize = 13.sp, color = TextMid, fontWeight = FontWeight.Medium)
            }
        },
        text = {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(180.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color.White)
                        .border(2.dp, HTeal.copy(alpha = 0.2f), RoundedCornerShape(16.dp))
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    val qrData = java.net.URLEncoder.encode("HOSCORE:$hospitalId:HOSPITAL", "UTF-8")
                    AsyncImage(
                        model = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=$qrData",
                        contentDescription = "Hospital QR Code",
                        modifier = Modifier.fillMaxSize()
                    )
                }
                Spacer(Modifier.height(14.dp))
                Text(
                    "ID: HSP-${hospitalId.take(8).uppercase()}",
                    fontWeight = FontWeight.Black,
                    fontSize = 15.sp,
                    color = HTeal
                )
                Spacer(Modifier.height(4.dp))
                Text("Display at OPD desk or kiosk for patient auto-checkin & hospital selection", fontSize = 11.sp, color = TextLight)
            }
        },
        confirmButton = {
            Button(
                onClick = onDismiss,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = HTeal)
            ) {
                Text("Done", fontWeight = FontWeight.Bold)
            }
        },
        containerColor = Color.White
    )
}
