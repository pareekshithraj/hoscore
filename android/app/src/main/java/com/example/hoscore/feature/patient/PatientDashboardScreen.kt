package com.example.hoscore.feature.patient

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
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
import com.example.hoscore.core.network.ServiceLocator

// ─── Patient portal colour tokens ────────────────────────────────────────────
private val PBlue     = Color(0xFF3B5BDB)
private val PBlueMid  = Color(0xFF5C7CFA)
private val PBlueSoft = Color(0xFFEEF2FF)
private val PTeal     = Color(0xFF0D9488)
private val PTealSoft = Color(0xFFCCFBF1)
private val PAmber    = Color(0xFFF59E0B)
private val PAmberSoft = Color(0xFFFEF3C7)
private val PPurple   = Color(0xFF7C3AED)
private val PPurpleSoft = Color(0xFFEDE9FE)
private val PPink     = Color(0xFFEC4899)
private val PPinkSoft = Color(0xFFFCE7F3)
private val PRed      = Color(0xFFEF4444)
private val PRedSoft  = Color(0xFFFEE2E2)
private val PGreen    = Color(0xFF10B981)
private val PGreenSoft = Color(0xFFD1FAE5)
private val BGLight   = Color(0xFFF0F4FF)
private val TextDark  = Color(0xFF0F172A)
private val TextMid   = Color(0xFF475569)
private val TextLight = Color(0xFF94A3B8)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PatientDashboardScreen(
    onSwitchContext: () -> Unit,
    onLogout: () -> Unit,
    canSwitch: Boolean,
    onOpenTab: (Int) -> Unit,
    onFindHospitals: () -> Unit,
) {
    val user    = ServiceLocator.sessionStore.user
    val name    = user?.name?.ifBlank { "Patient" } ?: "Patient"
    val initials = name.split(" ").filter { it.isNotEmpty() }.take(2)
        .joinToString("") { it.first().uppercase() }.ifEmpty { "P" }
    val firstName = name.split(" ").firstOrNull() ?: name

    val apptVm: AppointmentsVM = viewModel()
    val apptState by apptVm.state.collectAsState()
    val rxVm: PrescriptionsVM = viewModel()
    val rxState by rxVm.state.collectAsState()
    val billsVm: BillsVM = viewModel()
    val billsState by billsVm.state.collectAsState()
    val recordsVm: PatientRecordsVM = viewModel()
    val recordsState by recordsVm.state.collectAsState()

    LaunchedEffect(Unit) {
        apptVm.loadOnce()
        rxVm.loadOnce()
        billsVm.loadOnce()
        recordsVm.loadOnce()
    }

    var isManualRefreshing by remember { mutableStateOf(false) }

    LaunchedEffect(apptState, rxState, billsState, recordsState) {
        if (apptState !is com.example.hoscore.core.common.Resource.Loading &&
            rxState !is com.example.hoscore.core.common.Resource.Loading &&
            billsState !is com.example.hoscore.core.common.Resource.Loading &&
            recordsState !is com.example.hoscore.core.common.Resource.Loading) {
            isManualRefreshing = false
        }
    }

    PullToRefreshBox(
        isRefreshing = isManualRefreshing,
        onRefresh = {
            isManualRefreshing = true
            apptVm.refresh()
            rxVm.refresh()
            billsVm.refresh()
            recordsVm.refresh()
        },
        modifier = Modifier.fillMaxSize().background(BGLight)
    ) {
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
        ) {
        // ─── Header bar ───────────────────────────────────────────────────
        Row(
            Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 20.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Avatar
            Box(
                Modifier
                    .size(46.dp)
                    .clip(CircleShape)
                    .background(Brush.linearGradient(listOf(PBlue, PBlueMid))),
                contentAlignment = Alignment.Center,
            ) { Text(initials, color = Color.White, fontWeight = FontWeight.Black, fontSize = 15.sp) }

            Spacer(Modifier.size(12.dp))
            val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
            val greeting = when (hour) {
                in 0..11 -> "Good morning 👋"
                in 12..16 -> "Good afternoon 👋"
                in 17..20 -> "Good evening 👋"
                else -> "Good night 🌙"
            }
            Column(Modifier.weight(1f)) {
                Text(greeting, fontSize = 12.sp, color = TextLight, fontWeight = FontWeight.Medium)
                Text(firstName, fontSize = 17.sp, fontWeight = FontWeight.Black, color = TextDark)
            }

            var showQrModal by remember { mutableStateOf(false) }
            if (showQrModal) {
                PatientQRModal(user?.id ?: "PAT-882910", name) { showQrModal = false }
            }

            SmallIconBtn(Icons.Rounded.QrCode2, { showQrModal = true }, PBlue)
            Spacer(Modifier.width(8.dp))
            if (canSwitch) {
                SmallIconBtn(Icons.Rounded.SwapHoriz, onSwitchContext, PBlue)
            }
            Spacer(Modifier.width(8.dp))
            SmallIconBtn(Icons.Rounded.CalendarMonth, { onOpenTab(1) }, PBlue)
        }

        // ─── Search ───────────────────────────────────────────────────────
        Column(Modifier.padding(horizontal = 20.dp)) {
            Text(
                "Let's Find Your\nDoctor",
                fontSize = 26.sp,
                fontWeight = FontWeight.Black,
                color = TextDark,
                lineHeight = 32.sp,
            )
            Spacer(Modifier.height(14.dp))

            Box(
                Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .shadow(6.dp, RoundedCornerShape(16.dp), ambientColor = PBlue.copy(0.1f))
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color.White)
                    .clickable { onFindHospitals() }
                    .padding(horizontal = 16.dp),
                contentAlignment = Alignment.CenterStart,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.Search, null, tint = PBlue, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(10.dp))
                    Text("Search doctors, specialties…", fontSize = 14.sp, color = TextLight)
                    Spacer(Modifier.weight(1f))
                    Box(
                        Modifier
                            .size(34.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(PBlueSoft),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Rounded.Tune, null, tint = PBlue, modifier = Modifier.size(18.dp))
                    }
                }
            }
        }

        Spacer(Modifier.height(18.dp))

        // ─── Specialist chips (horizontal scroll) ────────────────────────
        val specialists = listOf(
            Triple("All", PBlue,   PBlueSoft),
            Triple("Pediatric",    PPurple, PPurpleSoft),
            Triple("Neurologist",  PAmber,  PAmberSoft),
            Triple("Physician",    PTeal,   PTealSoft),
            Triple("Cardiologist", PRed,    PRedSoft),
            Triple("Dentist",      PPink,   PPinkSoft),
        )
        var selectedSpec by remember { mutableStateOf(0) }

        LazyRow(
            contentPadding = PaddingValues(horizontal = 20.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            itemsIndexed(specialists) { i, (label, color, softBg) ->
                val selected = i == selectedSpec
                Box(
                    Modifier
                        .clip(CircleShape)
                        .background(if (selected) color else Color.White)
                        .clickable { selectedSpec = i; onFindHospitals() }
                        .padding(horizontal = 18.dp, vertical = 9.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        label,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Black,
                        color = if (selected) Color.White else TextMid,
                    )
                }
            }
        }

        Spacer(Modifier.height(22.dp))

        // ─── Care Summary — real counts from the patient's own records ────
        val apptList = (apptState as? com.example.hoscore.core.common.Resource.Success)?.data ?: emptyList()
        val rxList = (rxState as? com.example.hoscore.core.common.Resource.Success)?.data ?: emptyList()
        val billList = (billsState as? com.example.hoscore.core.common.Resource.Success)?.data ?: emptyList()
        val lastVital = (recordsState as? com.example.hoscore.core.common.Resource.Success)?.data?.vitals?.firstOrNull()

        if (lastVital != null) {
            Column(Modifier.padding(horizontal = 20.dp)) {
                SectionHeader("Latest Vitals", "History") { onOpenTab(2) }
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    VitalMiniCard("BP", lastVital.bloodPressure ?: "--", "mmHg", PRed, PRedSoft, Modifier.weight(1f))
                    VitalMiniCard("Heart Rate", lastVital.heartRate?.toString() ?: "--", "bpm", PPink, PPinkSoft, Modifier.weight(1f))
                    VitalMiniCard("SpO₂", lastVital.oxygenSaturation?.toString() ?: "--", "%", PTeal, PTealSoft, Modifier.weight(1f))
                }
            }
            Spacer(Modifier.height(22.dp))
        }

        val upcomingCount = apptList.count { (it.status ?: "").lowercase() !in setOf("cancelled", "completed") }
        val activeRxCount = rxList.count { (it.status ?: "").uppercase() != "CANCELLED" }
        val pendingBills = billList.filter { (it.status ?: "").uppercase() != "PAID" }
        val pendingBillTotal = pendingBills.sumOf { it.amount ?: 0.0 }

        Column(Modifier.padding(horizontal = 20.dp)) {
            SectionHeader("Care Summary", "See All") { onOpenTab(1) }
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                HealthStatusCard(
                    icon = Icons.Rounded.CalendarMonth, iconBg = PBlueSoft, iconTint = PBlue,
                    label = "Upcoming visits", value = upcomingCount.toString(),
                    sub = if (upcomingCount > 0) "Tap to view" else "None scheduled",
                    badge = "Visits", badgeColor = PBlue, modifier = Modifier.weight(1f),
                    onClick = { onOpenTab(1) },
                )
                HealthStatusCard(
                    icon = Icons.Rounded.LocalPharmacy, iconBg = PTealSoft, iconTint = PTeal,
                    label = "Prescriptions", value = activeRxCount.toString(),
                    sub = "Active records", badge = "Records", badgeColor = PTeal,
                    modifier = Modifier.weight(1f), onClick = { onOpenTab(2) },
                )
            }
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                HealthStatusCard(
                    icon = Icons.Rounded.Payments, iconBg = PAmberSoft, iconTint = PAmber,
                    label = "Pending bills", value = pendingBills.size.toString(),
                    sub = if (pendingBillTotal > 0) "₹${pendingBillTotal.toInt()} due" else "All settled",
                    badge = "Billing", badgeColor = PAmber, modifier = Modifier.weight(1f),
                    onClick = { onOpenTab(3) },
                )
                HealthStatusCard(
                    icon = Icons.Rounded.LocalHospital, iconBg = PPurpleSoft, iconTint = PPurple,
                    label = "Find care", value = "Book",
                    sub = "Search hospitals", badge = "New", badgeColor = PPurple,
                    modifier = Modifier.weight(1f), onClick = onFindHospitals,
                )
            }
        }

        Spacer(Modifier.height(22.dp))

        // ─── Upcoming Appointment card ────────────────────────────────────

        Column(Modifier.padding(horizontal = 20.dp)) {
            SectionHeader("Upcoming Appointment", "See All") { onOpenTab(1) }
            Spacer(Modifier.height(12.dp))

            val upcoming = apptList.firstOrNull { (it.status ?: "").lowercase() != "cancelled" && (it.status ?: "").lowercase() != "completed" }

            Box(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(Brush.linearGradient(listOf(PBlue, Color(0xFF818CF8))))
                    .clickable { onOpenTab(1) }
                    .padding(18.dp),
            ) {
                if (upcoming != null) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            Modifier
                                .size(58.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.22f)),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text("DR", color = Color.White, fontWeight = FontWeight.Black, fontSize = 18.sp)
                        }
                        Spacer(Modifier.width(14.dp))
                        Column(Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(upcoming.doctorName ?: "Doctor Appointment", fontWeight = FontWeight.Black, color = Color.White, fontSize = 15.sp)
                                Spacer(Modifier.width(6.dp))
                                Box(
                                    Modifier
                                        .clip(CircleShape)
                                        .background(Color.White.copy(alpha = 0.2f))
                                        .padding(horizontal = 6.dp, vertical = 2.dp),
                                ) {
                                    Text((upcoming.status ?: "CONFIRMED").uppercase(), fontSize = 9.sp, fontWeight = FontWeight.Black, color = Color.White)
                                }
                            }
                            Text("${upcoming.hospitalName ?: "Hospital Visit"} · ${upcoming.department ?: "General"}", color = Color.White.copy(0.75f), fontSize = 12.sp)
                            Spacer(Modifier.height(8.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                WhitePill(upcoming.date ?: "Upcoming")
                                WhitePill(upcoming.time ?: "Scheduled")
                            }
                        }
                    }
                } else {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
                        Text("No Upcoming Appointments", fontWeight = FontWeight.Black, color = Color.White, fontSize = 16.sp)
                        Spacer(Modifier.height(4.dp))
                        Text("Tap to explore hospitals & schedule your next visit", color = Color.White.copy(0.8f), fontSize = 12.sp)
                    }
                }
            }
        }

        Spacer(Modifier.height(22.dp))

        // ─── Quick Access grid ────────────────────────────────────────────
        Column(Modifier.padding(horizontal = 20.dp)) {
            SectionHeader("Quick Access", "") {}
            Spacer(Modifier.height(12.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                QuickCard("Appointments", Icons.Rounded.CalendarMonth, PBlue,   PBlueSoft,   Modifier.weight(1f)) { onOpenTab(1) }
                QuickCard("Records",      Icons.Rounded.LocalPharmacy, PTeal,   PTealSoft,   Modifier.weight(1f)) { onOpenTab(2) }
                QuickCard("Bills",        Icons.Rounded.Payments,      PAmber,  PAmberSoft,  Modifier.weight(1f)) { onOpenTab(3) }
                QuickCard("Hospitals",    Icons.Rounded.LocalHospital, PPurple, PPurpleSoft, Modifier.weight(1f)) { onFindHospitals() }
            }
        }
        Spacer(Modifier.height(28.dp))
    }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun VitalMiniCard(label: String, value: String, unit: String, color: Color, bg: Color, modifier: Modifier = Modifier) {
    Box(modifier.clip(RoundedCornerShape(14.dp)).background(bg).padding(12.dp)) {
        Column {
            Text(label, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = color)
            Spacer(Modifier.height(4.dp))
            Row(verticalAlignment = Alignment.Bottom) {
                Text(value, fontSize = 16.sp, fontWeight = FontWeight.Black, color = TextDark)
                Spacer(Modifier.width(2.dp))
                Text(unit, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = TextMid, modifier = Modifier.padding(bottom = 2.dp))
            }
        }
    }
}

@Composable
private fun HealthStatusCard(
    icon: ImageVector,
    iconBg: Color,
    iconTint: Color,
    label: String,
    value: String,
    sub: String,
    badge: String,
    badgeColor: Color,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
) {
    Box(
        modifier
            .clip(RoundedCornerShape(20.dp))
            .background(Color.White)
            .then(if (onClick != null) Modifier.clickable { onClick() } else Modifier)
            .padding(14.dp),
    ) {
        Column {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    Modifier
                        .size(38.dp)
                        .clip(CircleShape)
                        .background(iconBg),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(icon, null, tint = iconTint, modifier = Modifier.size(20.dp))
                }
                Box(
                    Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(iconBg)
                        .padding(horizontal = 6.dp, vertical = 2.dp),
                ) {
                    Text(badge, fontSize = 9.sp, fontWeight = FontWeight.Black, color = badgeColor)
                }
            }
            Spacer(Modifier.height(10.dp))
            Text(value, fontSize = 20.sp, fontWeight = FontWeight.Black, color = TextDark)
            Text(label, fontSize = 11.sp, color = TextMid)
            Spacer(Modifier.height(4.dp))
            Text(sub, fontSize = 10.sp, color = iconTint, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun QuickCard(
    label: String,
    icon: ImageVector,
    color: Color,
    bgColor: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    Box(
        modifier
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .clickable { onClick() }
            .padding(12.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                Modifier
                    .size(42.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(bgColor),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, null, tint = color, modifier = Modifier.size(22.dp))
            }
            Spacer(Modifier.height(6.dp))
            Text(label, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextDark, maxLines = 1)
        }
    }
}

@Composable
private fun SmallIconBtn(icon: ImageVector, onClick: () -> Unit, tint: Color = Color(0xFF64748B)) {
    Box(
        Modifier
            .size(40.dp)
            .clip(CircleShape)
            .background(Color.White)
            .clickable { onClick() },
        contentAlignment = Alignment.Center,
    ) {
        Icon(icon, null, tint = tint, modifier = Modifier.size(20.dp))
    }
}

@Composable
private fun SectionHeader(title: String, actionLabel: String, onAction: () -> Unit) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(title, fontSize = 16.sp, fontWeight = FontWeight.Black, color = TextDark, modifier = Modifier.weight(1f))
        if (actionLabel.isNotEmpty()) {
            Text(
                actionLabel,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = PBlue,
                modifier = Modifier.clickable { onAction() },
            )
        }
    }
}

@Composable
private fun WhitePill(text: String) {
    Box(
        Modifier
            .clip(CircleShape)
            .background(Color.White.copy(0.22f))
            .padding(horizontal = 10.dp, vertical = 3.dp),
    ) {
        Text(text, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White)
    }
}

@Composable
private fun PatientQRModal(patientId: String, patientName: String, onDismiss: () -> Unit) {
    androidx.compose.material3.AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Text("Digital Health Pass", fontWeight = FontWeight.Black, fontSize = 18.sp, color = TextDark)
                Text(patientName, fontSize = 13.sp, color = TextMid, fontWeight = FontWeight.Medium)
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
                        .border(2.dp, PBlue.copy(alpha = 0.2f), RoundedCornerShape(16.dp))
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    val qrData = java.net.URLEncoder.encode("HOSCORE:$patientId:TOKEN-1", "UTF-8")
                    AsyncImage(
                        model = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=$qrData",
                        contentDescription = "QR Code",
                        modifier = Modifier.fillMaxSize()
                    )
                }
                Spacer(Modifier.height(14.dp))
                Text(
                    "ID: ${patientId.take(12).uppercase()}",
                    fontWeight = FontWeight.Black,
                    fontSize = 15.sp,
                    color = PBlue
                )
                Spacer(Modifier.height(4.dp))
                Text("Show this QR at reception or self-service kiosk for check-in", fontSize = 11.sp, color = TextLight)
            }
        },
        confirmButton = {
            androidx.compose.material3.Button(
                onClick = onDismiss,
                modifier = Modifier.fillMaxWidth(),
                colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = PBlue)
            ) {
                Text("Done", fontWeight = FontWeight.Bold)
            }
        },
        containerColor = Color.White
    )
}
