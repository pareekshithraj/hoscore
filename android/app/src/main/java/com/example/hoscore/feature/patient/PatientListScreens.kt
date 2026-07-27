package com.example.hoscore.feature.patient

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.layout.Box
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.LocalHospital
import androidx.compose.material.icons.rounded.Payments
import androidx.compose.material.icons.rounded.Vaccines
import androidx.compose.material3.Text
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

@Composable
fun PatientAppointmentsScreen() {
    val t = HoscoreTokens.current
    val vm: AppointmentsVM = viewModel()
    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar("Appointments", "Your upcoming and past visits")
        DataScreen(vm) { list ->
            if (list.isEmpty()) {
                EmptyState("No appointments yet", "Book a visit from Find Hospital.", Icons.Rounded.CalendarMonth)
            } else {
                LazyColumn(
                    Modifier.fillMaxSize(),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(list, key = { it.id }) { a ->
                        HoscoreCard(Modifier.fillMaxWidth()) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Column(Modifier.weight(1f)) {
                                    Text(a.doctorName ?: "Consultation", fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 15.sp)
                                    Text(
                                        listOfNotNull(a.department, a.hospitalName).joinToString(" · ").ifEmpty { "General" },
                                        color = t.textMuted, fontSize = 12.sp,
                                    )
                                    Spacer(Modifier.height(6.dp))
                                    Text(
                                        listOfNotNull(a.date, a.time).joinToString("  •  "),
                                        color = t.textSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium,
                                    )
                                }
                                StatusBadge(a.status ?: "SCHEDULED", statusColor(a.status))
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
    val vm: PrescriptionsVM = viewModel()
    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar("Records", "Prescriptions & medical history")
        DataScreen(vm) { list ->
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
