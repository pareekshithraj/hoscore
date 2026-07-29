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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.ui.draw.clip
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.LocalHospital
import androidx.compose.material.icons.rounded.Payments
import androidx.compose.material.icons.rounded.Vaccines
import androidx.compose.material.icons.rounded.MonitorHeart
import androidx.compose.material.icons.rounded.Biotech
import androidx.compose.material.icons.rounded.MedicalServices
import androidx.compose.material3.Text
import androidx.compose.material3.TabRow
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.DatePicker
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.hoscore.core.ui.DataScreen
import com.example.hoscore.core.ui.components.EmptyState
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.components.StatusBadge
import com.example.hoscore.core.ui.components.statusColor
import com.example.hoscore.core.ui.theme.HoscoreTokens

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PatientAppointmentsScreen(onBook: () -> Unit = {}) {
    val t = HoscoreTokens.current
    val vm: AppointmentsVM = viewModel()
    
    var rescheduleTarget by remember { mutableStateOf<String?>(null) }
    var rescheduleTime by remember { mutableStateOf("10:00 AM") }
    
    if (rescheduleTarget != null) {
        val datePickerState = rememberDatePickerState()
        DatePickerDialog(
            onDismissRequest = { rescheduleTarget = null },
            confirmButton = {
                TextButton(onClick = {
                    // Fast demo format: YYYY-MM-DD
                    val ms = datePickerState.selectedDateMillis ?: System.currentTimeMillis()
                    val dt = java.time.Instant.ofEpochMilli(ms).atZone(java.time.ZoneId.systemDefault()).toLocalDate()
                    vm.reschedule(rescheduleTarget!!, dt.toString(), rescheduleTime)
                    rescheduleTarget = null
                }) {
                    Text("Confirm")
                }
            },
            dismissButton = {
                TextButton(onClick = { rescheduleTarget = null }) { Text("Cancel") }
            }
        ) {
            DatePicker(state = datePickerState, modifier = Modifier.weight(1f, false))
            androidx.compose.foundation.layout.Spacer(Modifier.height(8.dp))
            androidx.compose.material3.OutlinedTextField(
                value = rescheduleTime,
                onValueChange = { rescheduleTime = it },
                label = { Text("Time (e.g. 10:00 AM)") },
                modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp).padding(bottom = 16.dp)
            )
        }
    }

    var selectedPassAppt by remember { mutableStateOf<com.example.hoscore.core.network.Appointment?>(null) }

    if (selectedPassAppt != null) {
        androidx.compose.ui.window.Dialog(onDismissRequest = { selectedPassAppt = null }) {
            Box(Modifier.fillMaxWidth().clip(androidx.compose.foundation.shape.RoundedCornerShape(24.dp))) {
                AppointmentTicketPassScreen(
                    appointment = selectedPassAppt!!,
                    onDone = { selectedPassAppt = null }
                )
            }
        }
    }

    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar(
            "Appointments", "Your upcoming and past visits",
            trailingIcon = Icons.Rounded.Add, onTrailing = onBook,
        )
        DataScreen(vm) { list ->
            if (list.isEmpty()) {
                EmptyState("No appointments yet", "Tap + to find a hospital and book a visit.", Icons.Rounded.CalendarMonth)
            } else {
                LazyColumn(
                    Modifier.fillMaxSize(),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(list, key = { it.id }) { a ->
                        val status = (a.status ?: "").uppercase()
                        val cancellable = status !in setOf("CANCELLED", "COMPLETED")
                        HoscoreCard(Modifier.fillMaxWidth().clickable { selectedPassAppt = a }) {
                            Column {
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
                                    Column(Modifier.weight(1f)) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(a.doctorName ?: "Consultation", fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 15.sp)
                                            Spacer(Modifier.width(8.dp))
                                            Box(
                                                Modifier.clip(androidx.compose.foundation.shape.RoundedCornerShape(6.dp)).background(t.primary.copy(alpha = 0.15f)).padding(horizontal = 7.dp, vertical = 2.dp)
                                            ) {
                                                Text("Token #${a.tokenNumber ?: 1}", fontSize = 11.sp, fontWeight = FontWeight.Black, color = t.primary)
                                            }
                                        }
                                        Text(
                                            listOfNotNull(a.department, a.hospitalName).joinToString(" · ").ifEmpty { "General Hospital" },
                                            color = t.textMuted, fontSize = 12.sp,
                                        )
                                        Spacer(Modifier.height(6.dp))
                                        Text(
                                            listOfNotNull(a.date?.take(10), a.time).joinToString("  •  "),
                                            color = t.textSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium,
                                        )
                                    }
                                    StatusBadge(a.status ?: "SCHEDULED", statusColor(a.status))
                                }
                                Spacer(Modifier.height(14.dp))
                                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    androidx.compose.material3.Button(
                                        onClick = { selectedPassAppt = a },
                                        modifier = Modifier.fillMaxWidth().height(40.dp),
                                        shape = androidx.compose.foundation.shape.RoundedCornerShape(10.dp),
                                        colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = t.primary.copy(alpha = 0.12f))
                                    ) {
                                        Text("🎟️ View Token", color = t.primary, fontWeight = FontWeight.Black, fontSize = 12.sp)
                                    }
                                    if (cancellable) {
                                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            androidx.compose.material3.OutlinedButton(
                                                onClick = { vm.cancel(a.id) },
                                                modifier = Modifier.weight(1f).height(38.dp),
                                                shape = androidx.compose.foundation.shape.RoundedCornerShape(10.dp)
                                            ) { Text("Cancel", color = t.clinical, fontWeight = FontWeight.Bold, fontSize = 12.sp, maxLines = 1) }
                                            androidx.compose.material3.Button(
                                                onClick = { rescheduleTarget = a.id },
                                                modifier = Modifier.weight(1f).height(38.dp),
                                                shape = androidx.compose.foundation.shape.RoundedCornerShape(10.dp),
                                                colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = t.primary)
                                            ) { Text("Reschedule", color = androidx.compose.ui.graphics.Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp, maxLines = 1) }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PatientRecordsScreen() {
    val t = HoscoreTokens.current
    val rxVm: PrescriptionsVM = viewModel()
    val recordsVm: PatientRecordsVM = viewModel()
    
    var tabIndex by remember { mutableStateOf(0) }
    val tabs = listOf("Rx", "Vitals", "Labs", "Admissions")

    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar("Records", "Comprehensive medical history")
        
        TabRow(
            selectedTabIndex = tabIndex,
            containerColor = t.screenBg,
            contentColor = t.primary,
            indicator = { tabPositions ->
                if (tabIndex < tabPositions.size) {
                    TabRowDefaults.SecondaryIndicator(
                        Modifier.tabIndicatorOffset(tabPositions[tabIndex]),
                        color = t.primary
                    )
                }
            }
        ) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = tabIndex == index,
                    onClick = { tabIndex = index },
                    text = { Text(title, fontWeight = FontWeight.Bold) },
                    selectedContentColor = t.primary,
                    unselectedContentColor = t.textMuted
                )
            }
        }
        
        when (tabIndex) {
            0 -> DataScreen(rxVm) { list ->
                if (list.isEmpty()) {
                    EmptyState("No prescriptions", "Your prescriptions will appear here.", Icons.Rounded.Description)
                } else {
                    LazyColumn(
                        Modifier.fillMaxSize(),
                        contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(list, key = { it.id }) { p ->
                            HoscoreCard(Modifier.fillMaxWidth()) {
                                Column {
                                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("Dr. ${p.doctorName ?: "—"}", fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 14.sp)
                                        if (p.status != null) StatusBadge(p.status, statusColor(p.status))
                                    }
                                    if (!p.medicines.isNullOrBlank()) {
                                        Spacer(Modifier.height(8.dp))
                                        Text(p.medicines, color = t.textSecondary, fontSize = 12.sp)
                                    }
                                    if (!p.createdAt.isNullOrBlank()) {
                                        Spacer(Modifier.height(6.dp))
                                        Text(p.createdAt.take(10), color = t.textMuted, fontSize = 11.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            1 -> DataScreen(recordsVm) { records ->
                val vitals = records.vitals
                if (vitals.isEmpty()) {
                    EmptyState("No vitals recorded", "Your vital signs history will appear here.", Icons.Rounded.MonitorHeart)
                } else {
                    LazyColumn(
                        Modifier.fillMaxSize(),
                        contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(vitals, key = { it.id }) { v ->
                            HoscoreCard(Modifier.fillMaxWidth()) {
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Column {
                                        Text("BP: ${v.bloodPressure ?: "--"}  |  HR: ${v.heartRate ?: "--"} bpm", fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 14.sp)
                                        Spacer(Modifier.height(4.dp))
                                        Text("SpO₂: ${v.oxygenSaturation ?: "--"}%  |  Temp: ${v.temperature ?: "--"}°", color = t.textSecondary, fontSize = 12.sp)
                                    }
                                    if (!v.recordedAt.isNullOrBlank()) {
                                        Text(v.recordedAt.take(10), color = t.textMuted, fontSize = 11.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            2 -> DataScreen(recordsVm) { records ->
                val labs = records.labs
                if (labs.isEmpty()) {
                    EmptyState("No lab orders", "Your lab test results will appear here.", Icons.Rounded.Biotech)
                } else {
                    LazyColumn(
                        Modifier.fillMaxSize(),
                        contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(labs, key = { it.id }) { l ->
                            HoscoreCard(Modifier.fillMaxWidth()) {
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Column(Modifier.weight(1f)) {
                                        Text(l.testName, fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 14.sp)
                                        Spacer(Modifier.height(4.dp))
                                        Text(listOfNotNull(l.category, l.doctorName?.let { "Dr. $it" }).joinToString(" · "), color = t.textSecondary, fontSize = 12.sp)
                                        if (!l.createdAt.isNullOrBlank()) {
                                            Spacer(Modifier.height(6.dp))
                                            Text(l.createdAt.take(10), color = t.textMuted, fontSize = 11.sp)
                                        }
                                    }
                                    StatusBadge(l.status, statusColor(l.status))
                                }
                            }
                        }
                    }
                }
            }
            3 -> DataScreen(recordsVm) { records ->
                val admissions = records.admissions
                if (admissions.isEmpty()) {
                    EmptyState("No admissions", "Your hospital admissions history will appear here.", Icons.Rounded.MedicalServices)
                } else {
                    LazyColumn(
                        Modifier.fillMaxSize(),
                        contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(admissions, key = { it.id }) { a ->
                            HoscoreCard(Modifier.fillMaxWidth()) {
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Column(Modifier.weight(1f)) {
                                        Text(a.reason ?: "Admission", fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 14.sp)
                                        Spacer(Modifier.height(4.dp))
                                        Text(listOfNotNull(a.roomName, a.bedName).joinToString(" · "), color = t.textSecondary, fontSize = 12.sp)
                                        if (!a.admittedAt.isNullOrBlank()) {
                                            Spacer(Modifier.height(6.dp))
                                            Text(a.admittedAt?.take(10) ?: "", color = t.textMuted, fontSize = 11.sp)
                                        }
                                    }
                                    StatusBadge(a.status, statusColor(a.status))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

enum class PatientDest { VACCINATIONS, PRIVACY, LOCATION }

@Composable
fun PatientMoreScreen(onLogout: () -> Unit) {
    val t = HoscoreTokens.current
    val billsVm: BillsVM = viewModel()
    var subScreen by remember { mutableStateOf<PatientDest?>(null) }

    if (subScreen != null) {
        val closeSub = { subScreen = null }
        androidx.activity.compose.BackHandler { closeSub() }
        Box(Modifier.fillMaxSize()) {
            when (subScreen) {
                PatientDest.VACCINATIONS -> MyVaccinationsScreen(onBack = closeSub)
                PatientDest.PRIVACY -> MyPrivacyScreen(onBack = closeSub)
                PatientDest.LOCATION -> MyLocationScreen()
                null -> Unit
            }
        }
        return
    }

    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar("More & Settings", "Bills, vaccinations, privacy & location")
        DataScreen(billsVm) { bills ->
            LazyColumn(
                Modifier.fillMaxSize(),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                item {
                    Text("Health Services", fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 15.sp)
                    Spacer(Modifier.height(4.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        HoscoreCard(Modifier.weight(1f), onClick = { subScreen = PatientDest.VACCINATIONS }) {
                            Column {
                                Text("Vaccinations", fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 14.sp)
                                Text("Dose history & pass", color = t.textMuted, fontSize = 11.sp)
                            }
                        }
                        HoscoreCard(Modifier.weight(1f), onClick = { subScreen = PatientDest.PRIVACY }) {
                            Column {
                                Text("Privacy", fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 14.sp)
                                Text("ABDM access grants", color = t.textMuted, fontSize = 11.sp)
                            }
                        }
                    }
                    Spacer(Modifier.height(10.dp))
                    HoscoreCard(Modifier.fillMaxWidth(), onClick = { subScreen = PatientDest.LOCATION }) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column {
                                Text("Indoor Live Location & Share", fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 14.sp)
                                Text("Share 24h wayfinding link with family", color = t.textMuted, fontSize = 12.sp)
                            }
                            StatusBadge("LIVE", t.emerald)
                        }
                    }
                    Spacer(Modifier.height(16.dp))
                    Text("Outstanding bills", fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 15.sp)
                    Spacer(Modifier.height(4.dp))
                }
                if (bills.isEmpty()) {
                    item {
                        HoscoreCard(Modifier.fillMaxWidth()) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("No pending bills 🎉", color = t.textSecondary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                            }
                        }
                    }
                } else {
                    items(bills, key = { it.id }) { b ->
                        HoscoreCard(Modifier.fillMaxWidth()) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(b.description ?: "Statement", fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 14.sp)
                                    Text(b.hospitalName ?: "", color = t.textMuted, fontSize = 12.sp)
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text("₹${b.amount?.toInt() ?: 0}", fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 16.sp)
                                    if (b.status != null) StatusBadge(b.status, statusColor(b.status))
                                }
                            }
                        }
                    }
                }
                item {
                    Spacer(Modifier.height(8.dp))
                    androidx.compose.material3.OutlinedButton(
                        onClick = onLogout,
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                    ) { Text("Sign out", color = t.clinical, fontWeight = FontWeight.Bold) }
                }
            }
        }
    }
}
