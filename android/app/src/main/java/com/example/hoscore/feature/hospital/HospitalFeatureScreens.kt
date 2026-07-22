package com.example.hoscore.feature.hospital

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hoscore.core.common.Resource
import com.example.hoscore.core.network.*
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.components.StatusBadge
import com.example.hoscore.core.ui.components.statusColor
import com.example.hoscore.core.ui.theme.HoscoreTokens
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

// ---------- Generic Data ViewModel for Feature Lists ----------
class FeatureListViewModel<T>(private val fetcher: suspend () -> List<T>) {
    private val _state = MutableStateFlow<Resource<List<T>>>(Resource.Loading)
    val state: StateFlow<Resource<List<T>>> = _state

    fun load(scope: kotlinx.coroutines.CoroutineScope) {
        scope.launch {
            _state.value = Resource.Loading
            try {
                val data = fetcher()
                _state.value = Resource.Success(data)
            } catch (e: Exception) {
                _state.value = Resource.Error(e.message ?: "Failed to load data")
            }
        }
    }
}

// ---------- Generic Feature Screen Wrapper ----------
@Composable
fun <T> GenericFeatureScreen(
    title: String,
    subtitle: String,
    onBack: () -> Unit,
    fetcher: suspend () -> List<T>,
    itemContent: @Composable (T) -> Unit
) {
    val t = HoscoreTokens.current
    val scope = rememberCoroutineScope()
    var state by remember { mutableStateOf<Resource<List<T>>>(Resource.Loading) }

    fun refresh() {
        scope.launch {
            state = Resource.Loading
            try {
                state = Resource.Success(fetcher())
            } catch (e: Exception) {
                state = Resource.Error(e.message ?: "Failed to load")
            }
        }
    }

    LaunchedEffect(Unit) { refresh() }

    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar(title = title, subtitle = subtitle, onBack = onBack)
        when (val s = state) {
            is Resource.Loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = t.primary) }
            is Resource.Error -> Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
                Text(s.message, color = t.clinical, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(12.dp))
                Button(onClick = { refresh() }) { Text("Retry") }
            }
            is Resource.Success -> {
                if (s.data.isEmpty()) {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No records found.", color = t.textMuted, fontSize = 14.sp)
                    }
                } else {
                    LazyColumn(Modifier.fillMaxSize().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        items(s.data) { item -> itemContent(item) }
                        item { Spacer(Modifier.height(30.dp)) }
                    }
                }
            }
        }
    }
}

// ---------- Specific Module Views ----------

@Composable
fun PrescriptionsScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    GenericFeatureScreen("Prescriptions", "Active prescriptions & medications", onBack, { ServiceLocator.api.getPrescriptions() }) { rx ->
        HoscoreCard(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(4.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text(rx.patientName ?: "Patient", fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 15.sp)
                    StatusBadge(rx.status ?: "ISSUED", statusColor(rx.status))
                }
                Spacer(Modifier.height(4.dp))
                Text("Doctor: Dr. ${rx.doctorName ?: "Practitioner"}", fontSize = 12.sp, color = t.textSecondary)
                Text("Medicines: ${rx.medicines ?: "N/A"}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = t.primary)
                if (!rx.notes.isNullOrEmpty()) Text("Instructions: ${rx.notes}", fontSize = 11.sp, color = t.textMuted)
            }
        }
    }
}

@Composable
fun LabOrdersScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    GenericFeatureScreen("Lab Orders", "Diagnostic tests & pathology", onBack, { ServiceLocator.api.getLabOrders() }) { lab ->
        HoscoreCard(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(4.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text(lab.testName, fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 15.sp)
                    StatusBadge(lab.status, statusColor(lab.status))
                }
                Spacer(Modifier.height(4.dp))
                Text("Patient: ${lab.patientName}", fontSize = 12.sp, color = t.textSecondary)
                Text("Ordered by: Dr. ${lab.doctorName ?: "Practitioner"}", fontSize = 11.sp, color = t.textMuted)
            }
        }
    }
}

@Composable
fun VitalsScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    GenericFeatureScreen("Vitals Records", "Clinical observations & patient metrics", onBack, { ServiceLocator.api.getVitals() }) { v ->
        HoscoreCard(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(4.dp)) {
                Text(v.patientName, fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 15.sp)
                Spacer(Modifier.height(6.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("BP: ${v.bloodPressure ?: "N/A"}", fontSize = 12.sp, color = t.primary, fontWeight = FontWeight.Bold)
                    Text("SpO2: ${v.oxygenSaturation?.let { "$it%" } ?: "N/A"}", fontSize = 12.sp, color = t.emerald, fontWeight = FontWeight.Bold)
                    Text("Pulse: ${v.heartRate?.let { "$it bpm" } ?: "N/A"}", fontSize = 12.sp, color = t.clinical, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun BillingScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    GenericFeatureScreen("Billing & Invoices", "Hospital billing & settlements", onBack, { ServiceLocator.api.getBillings() }) { bill ->
        HoscoreCard(Modifier.fillMaxWidth()) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text(bill.description ?: "Hospital Bill", fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 14.sp)
                    Text("₹${bill.amount ?: 0.0}", fontSize = 16.sp, fontWeight = FontWeight.Black, color = t.primary)
                }
                StatusBadge(bill.status ?: "PENDING", statusColor(bill.status))
            }
        }
    }
}

@Composable
fun DoctorsScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    GenericFeatureScreen("Doctors Directory", "Medical staff & specialists", onBack, { ServiceLocator.api.getDoctors() }) { doc ->
        HoscoreCard(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(4.dp)) {
                Text("Dr. ${doc.name}", fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 15.sp)
                Text("${doc.specialization ?: "General Physician"} · ${doc.department ?: "Outpatient"}", fontSize = 12.sp, color = t.textSecondary)
                if (!doc.phone.isNullOrEmpty()) Text("Contact: ${doc.phone}", fontSize = 11.sp, color = t.textMuted)
            }
        }
    }
}

@Composable
fun StaffScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    GenericFeatureScreen("Staff Directory", "Hospital workforce", onBack, { ServiceLocator.api.getStaff() }) { s ->
        HoscoreCard(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(4.dp)) {
                Text(s.name, fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 15.sp)
                Text("${s.role} · ${s.department ?: "General"}", fontSize = 12.sp, color = t.textSecondary)
            }
        }
    }
}

@Composable
fun InventoryScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    GenericFeatureScreen("Pharmacy & Inventory", "Stock & medical supplies", onBack, { ServiceLocator.api.getInventory() }) { item ->
        HoscoreCard(Modifier.fillMaxWidth()) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text(item.name, fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 14.sp)
                    Text("Category: ${item.category ?: "General"}", fontSize = 11.sp, color = t.textMuted)
                }
                Surface(color = if (item.quantity <= (item.minThreshold ?: 10)) t.clinical.copy(0.15f) else t.primary.copy(0.15f), shape = RoundedCornerShape(8.dp)) {
                    Text("${item.quantity} ${item.unit ?: "pcs"}", Modifier.padding(horizontal = 8.dp, vertical = 4.dp), fontWeight = FontWeight.Black, fontSize = 12.sp, color = if (item.quantity <= (item.minThreshold ?: 10)) t.clinical else t.primary)
                }
            }
        }
    }
}

@Composable
fun ExpensesScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    GenericFeatureScreen("Operating Expenses", "Hospital expenditure", onBack, { ServiceLocator.api.getExpenses() }) { exp ->
        HoscoreCard(Modifier.fillMaxWidth()) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text(exp.category, fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 14.sp)
                    Text(exp.description, fontSize = 11.sp, color = t.textMuted)
                }
                Text("₹${exp.amount}", fontSize = 15.sp, fontWeight = FontWeight.Black, color = t.clinical)
            }
        }
    }
}

@Composable
fun ClaimsScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    GenericFeatureScreen("Insurance Claims", "Pre-authorization & claims", onBack, { ServiceLocator.api.getInsuranceClaims() }) { claim ->
        HoscoreCard(Modifier.fillMaxWidth()) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text(claim.patientName, fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 14.sp)
                    Text("Provider: ${claim.provider} · ₹${claim.claimAmount}", fontSize = 12.sp, color = t.textSecondary)
                }
                StatusBadge(claim.status, statusColor(claim.status))
            }
        }
    }
}

@Composable
fun ShiftsScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    GenericFeatureScreen("Shift Scheduling", "Staff duty rosters", onBack, { ServiceLocator.api.getShifts() }) { shift ->
        HoscoreCard(Modifier.fillMaxWidth()) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text(shift.staffName, fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 14.sp)
                    Text("Date: ${shift.date}", fontSize = 11.sp, color = t.textMuted)
                }
                Surface(color = t.teal.copy(0.15f), shape = RoundedCornerShape(8.dp)) {
                    Text(shift.shiftType, Modifier.padding(horizontal = 8.dp, vertical = 4.dp), fontWeight = FontWeight.Bold, fontSize = 11.sp, color = t.teal)
                }
            }
        }
    }
}

@Composable
fun NoticesScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    GenericFeatureScreen("Notice Board", "Hospital announcements", onBack, { ServiceLocator.api.getNotices() }) { n ->
        HoscoreCard(Modifier.fillMaxWidth()) {
            Column {
                Text(n.title, fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 15.sp)
                Spacer(Modifier.height(4.dp))
                Text(n.content, fontSize = 12.sp, color = t.textSecondary)
            }
        }
    }
}

@Composable
fun LeavesScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    GenericFeatureScreen("Leave Requests", "Staff leave approvals", onBack, { ServiceLocator.api.getLeaves() }) { leave ->
        HoscoreCard(Modifier.fillMaxWidth()) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text(leave.staffName, fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 14.sp)
                    Text("Reason: ${leave.reason} (${leave.startDate} to ${leave.endDate})", fontSize = 11.sp, color = t.textMuted)
                }
                StatusBadge(leave.status, statusColor(leave.status))
            }
        }
    }
}

@Composable
fun FeedbackScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    GenericFeatureScreen("Patient Feedback", "Reviews & star ratings", onBack, { ServiceLocator.api.getFeedback() }) { fb ->
        HoscoreCard(Modifier.fillMaxWidth()) {
            Column {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(fb.patientName ?: "Anonymous", fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 14.sp)
                    Text("★ ${fb.rating}/5", color = t.amber, fontWeight = FontWeight.Black, fontSize = 14.sp)
                }
                if (!fb.comment.isNullOrEmpty()) Text(fb.comment, fontSize = 12.sp, color = t.textSecondary)
            }
        }
    }
}

@Composable
fun AuditLogsScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    GenericFeatureScreen("Audit Logs", "Security & compliance audit trail", onBack, { ServiceLocator.api.getAuditLogs() }) { log ->
        HoscoreCard(Modifier.fillMaxWidth()) {
            Column {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("${log.action} · ${log.entity}", fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 13.sp)
                    Text(log.userName ?: "System", fontSize = 11.sp, color = t.textMuted)
                }
                if (!log.details.isNullOrEmpty()) Text(log.details, fontSize = 11.sp, color = t.textSecondary)
            }
        }
    }
}
