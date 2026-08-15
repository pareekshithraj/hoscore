package com.example.hoscore.feature.hospital

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.MonitorHeart
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.hoscore.core.qr.HoscorePassDialog
import com.example.hoscore.core.qr.HoscoreQrCodec
import com.example.hoscore.core.common.Resource
import com.example.hoscore.core.network.*
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.components.StatusBadge
import com.example.hoscore.core.ui.components.statusColor
import com.example.hoscore.core.ui.theme.HoscoreTokens
import kotlinx.coroutines.launch

// ---------- Generic Feature Screen Wrapper ----------
@Composable
fun <T> GenericFeatureScreen(
    title: String,
    subtitle: String,
    onBack: () -> Unit,
    fetcher: suspend () -> List<T>,
    fab: (@Composable () -> Unit)? = null,
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

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = t.screenBg,
        topBar = { HoscoreTopBar(title = title, subtitle = subtitle, onBack = onBack) },
        floatingActionButton = { fab?.invoke() }
    ) { padding ->
        @OptIn(ExperimentalMaterial3Api::class)
        PullToRefreshBox(
            isRefreshing = state is Resource.Loading,
            onRefresh = { refresh() },
            modifier = Modifier.fillMaxSize().padding(padding)
        ) {
            Box(Modifier.fillMaxSize()) {
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
                                item { Spacer(Modifier.height(16.dp)) }
                                items(s.data) { item -> itemContent(item) }
                                item { Spacer(Modifier.height(100.dp)) }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ─── 1. Prescriptions ────────────────────────────────────────────────────────
@Composable
fun PrescriptionsScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    var showDialog by remember { mutableStateOf(false) }
    var refreshTrigger by remember { mutableStateOf(0) }

    if (showDialog) {
        AddPrescriptionDialog(onDismiss = { showDialog = false }, onSuccess = { showDialog = false; refreshTrigger++ })
    }
    
    key(refreshTrigger) {
        GenericFeatureScreen(
            "Prescriptions", "Active prescriptions & medications", onBack, { ServiceLocator.api.getPrescriptions() },
            fab = {
                FloatingActionButton(onClick = { showDialog = true }, containerColor = t.primary) {
                    Icon(Icons.Rounded.Add, null, tint = Color.White)
                }
            }
        ) { rx ->
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
}

@Composable
private fun AddPrescriptionDialog(onDismiss: () -> Unit, onSuccess: () -> Unit) {
    val t = HoscoreTokens.current
    val scope = rememberCoroutineScope()
    var patientName by remember { mutableStateOf("") }
    var doctorName by remember { mutableStateOf("") }
    var medicines by remember { mutableStateOf("") }
    var instructions by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Write E-Prescription", fontWeight = FontWeight.Bold, color = t.textPrimary) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = patientName, onValueChange = { patientName = it }, label = { Text("Patient Name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = doctorName, onValueChange = { doctorName = it }, label = { Text("Doctor Name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = medicines, onValueChange = { medicines = it }, label = { Text("Medicines (e.g. Paracetamol 500mg)") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = instructions, onValueChange = { instructions = it }, label = { Text("Instructions") }, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (patientName.isNotBlank() && medicines.isNotBlank()) {
                        loading = true
                        scope.launch {
                            try {
                                apiCall {
                                    ServiceLocator.api.createPrescription(
                                        CreatePrescriptionRequest(
                                            patientName = patientName,
                                            doctorName = doctorName.ifBlank { "Dr. Staff" },
                                            medicines = medicines,
                                            instructions = instructions
                                        )
                                    )
                                }
                                onSuccess()
                            } catch (_: Exception) {} finally { loading = false }
                        }
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = t.primary)
            ) { Text(if (loading) "Saving..." else "Issue Prescription") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
        containerColor = t.screenBg
    )
}

// ─── 2. Lab Orders ───────────────────────────────────────────────────────────
@Composable
fun LabOrdersScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    var showDialog by remember { mutableStateOf(false) }
    var refreshTrigger by remember { mutableStateOf(0) }

    if (showDialog) {
        OrderLabDialog(onDismiss = { showDialog = false }, onSuccess = { showDialog = false; refreshTrigger++ })
    }

    key(refreshTrigger) {
        GenericFeatureScreen(
            "Lab Orders", "Diagnostic tests & pathology", onBack, { ServiceLocator.api.getLabOrders() },
            fab = {
                ExtendedFloatingActionButton(
                    onClick = { showDialog = true },
                    containerColor = t.primary,
                    contentColor = Color.White,
                    icon = { Icon(Icons.Rounded.Add, null) },
                    text = { Text("Order Lab", fontWeight = FontWeight.Bold) }
                )
            }
        ) { lab ->
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
}

@Composable
private fun OrderLabDialog(onDismiss: () -> Unit, onSuccess: () -> Unit) {
    val t = HoscoreTokens.current
    val scope = rememberCoroutineScope()
    var patientName by remember { mutableStateOf("") }
    var testName by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("Blood Test") }
    var priority by remember { mutableStateOf("ROUTINE") }
    var loading by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Order Diagnostic Test", fontWeight = FontWeight.Bold, color = t.textPrimary) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = patientName, onValueChange = { patientName = it }, label = { Text("Patient Name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = testName, onValueChange = { testName = it }, label = { Text("Test Name (e.g. CBC, Lipid)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = category, onValueChange = { category = it }, label = { Text("Category") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (patientName.isNotBlank() && testName.isNotBlank()) {
                        loading = true
                        scope.launch {
                            try {
                                apiCall {
                                    ServiceLocator.api.createLabOrder(
                                        CreateLabOrderRequest(
                                            patientName = patientName,
                                            testName = testName,
                                            category = category,
                                            priority = priority,
                                            doctorName = "Dr. Practitioner"
                                        )
                                    )
                                }
                                onSuccess()
                            } catch (_: Exception) {} finally { loading = false }
                        }
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = t.primary)
            ) { Text(if (loading) "Ordering..." else "Order Test") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
        containerColor = t.screenBg
    )
}

// ─── 3. Vitals ───────────────────────────────────────────────────────────────
@Composable
fun VitalsScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    var showDialog by remember { mutableStateOf(false) }
    var refreshTrigger by remember { mutableStateOf(0) }

    if (showDialog) {
        RecordVitalsDialog(onDismiss = { showDialog = false }, onSuccess = { showDialog = false; refreshTrigger++ })
    }

    key(refreshTrigger) {
        GenericFeatureScreen(
            "Vitals Records", "Clinical observations & patient metrics", onBack, { ServiceLocator.api.getVitals() },
            fab = {
                ExtendedFloatingActionButton(
                    onClick = { showDialog = true },
                    containerColor = t.primary,
                    contentColor = Color.White,
                    icon = { Icon(Icons.Rounded.MonitorHeart, null) },
                    text = { Text("Record Vitals", fontWeight = FontWeight.Bold) }
                )
            }
        ) { v ->
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
}

@Composable
private fun RecordVitalsDialog(onDismiss: () -> Unit, onSuccess: () -> Unit) {
    val t = HoscoreTokens.current
    val scope = rememberCoroutineScope()
    var patientName by remember { mutableStateOf("") }
    var bloodPressure by remember { mutableStateOf("120/80") }
    var heartRate by remember { mutableStateOf("72") }
    var oxygenSaturation by remember { mutableStateOf("98") }
    var temperature by remember { mutableStateOf("98.6") }
    var loading by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Record Patient Vitals", fontWeight = FontWeight.Bold, color = t.textPrimary) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = patientName, onValueChange = { patientName = it }, label = { Text("Patient Name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = bloodPressure, onValueChange = { bloodPressure = it }, label = { Text("Blood Pressure (mmHg)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = heartRate, onValueChange = { heartRate = it }, label = { Text("Heart Rate (bpm)") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = oxygenSaturation, onValueChange = { oxygenSaturation = it }, label = { Text("SpO2 (%)") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = temperature, onValueChange = { temperature = it }, label = { Text("Temperature (°F)") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), singleLine = true, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (patientName.isNotBlank()) {
                        loading = true
                        scope.launch {
                            try {
                                apiCall {
                                    ServiceLocator.api.recordVitals(
                                        RecordVitalsRequest(
                                            patientName = patientName,
                                            bloodPressure = bloodPressure,
                                            heartRate = heartRate.toIntOrNull(),
                                            oxygenSaturation = oxygenSaturation.toIntOrNull(),
                                            temperature = temperature.toDoubleOrNull()
                                        )
                                    )
                                }
                                onSuccess()
                            } catch (_: Exception) {} finally { loading = false }
                        }
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = t.primary)
            ) { Text(if (loading) "Recording..." else "Save Vitals") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
        containerColor = t.screenBg
    )
}

// ─── 4. Billing ──────────────────────────────────────────────────────────────
@Composable
fun BillingScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    var showDialog by remember { mutableStateOf(false) }
    var refreshTrigger by remember { mutableStateOf(0) }

    if (showDialog) {
        CreateInvoiceDialog(onDismiss = { showDialog = false }, onSuccess = { showDialog = false; refreshTrigger++ })
    }

    key(refreshTrigger) {
        GenericFeatureScreen(
            "Billing & Invoices", "Hospital billing & settlements", onBack, { ServiceLocator.api.getBillings() },
            fab = {
                ExtendedFloatingActionButton(
                    onClick = { showDialog = true },
                    containerColor = t.primary,
                    contentColor = Color.White,
                    icon = { Icon(Icons.Rounded.Add, null) },
                    text = { Text("Create Invoice", fontWeight = FontWeight.Bold) }
                )
            }
        ) { bill ->
            val scope = rememberCoroutineScope()
            var billStatus by remember { mutableStateOf(bill.status ?: "PENDING") }
            HoscoreCard(Modifier.fillMaxWidth()) {
                Column(Modifier.fillMaxWidth()) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column {
                            Text(bill.description ?: "Hospital Invoice", fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 14.sp)
                            Text("₹${bill.amount ?: 0.0}", fontSize = 16.sp, fontWeight = FontWeight.Black, color = t.primary)
                        }
                        StatusBadge(billStatus, statusColor(billStatus))
                    }
                    if (!billStatus.equals("PAID", true)) {
                        Spacer(Modifier.height(8.dp))
                        Button(
                            onClick = {
                                scope.launch {
                                    apiCall { ServiceLocator.api.updateBillingStatus(bill.id, mapOf("status" to "PAID")) }
                                    billStatus = "PAID"
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = t.emerald),
                            modifier = Modifier.fillMaxWidth().height(34.dp),
                            contentPadding = PaddingValues(0.dp)
                        ) {
                            Text("Collect Payment (Mark PAID)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CreateInvoiceDialog(onDismiss: () -> Unit, onSuccess: () -> Unit) {
    val t = HoscoreTokens.current
    val scope = rememberCoroutineScope()
    var admissionId by remember { mutableStateOf("") }
    var patientName by remember { mutableStateOf("") }
    var doctorFees by remember { mutableStateOf("500") }
    var roomCharges by remember { mutableStateOf("1500") }
    var loading by remember { mutableStateOf(false) }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create Hospital Invoice", fontWeight = FontWeight.Bold, color = t.textPrimary) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = patientName, onValueChange = { patientName = it }, label = { Text("Patient Name (for OPD Invoice)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = admissionId, onValueChange = { admissionId = it }, label = { Text("Admission UUID (Optional for Inpatient)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = doctorFees, onValueChange = { doctorFees = it }, label = { Text("Doctor Fees (₹)") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = roomCharges, onValueChange = { roomCharges = it }, label = { Text("Room / Ward Charges (₹)") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), singleLine = true, modifier = Modifier.fillMaxWidth())
                if (errorMsg != null) {
                    Text(errorMsg!!, color = t.clinical, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    errorMsg = null
                    if (patientName.isBlank() && admissionId.isBlank()) {
                        errorMsg = "Please enter either Patient Name or Admission UUID."
                        return@Button
                    }
                    loading = true
                    scope.launch {
                        try {
                            val res = apiCall {
                                ServiceLocator.api.createBilling(
                                    CreateBillingRequest(
                                        admissionId = admissionId.ifBlank { null },
                                        patientName = patientName.ifBlank { null },
                                        doctorFees = doctorFees.toDoubleOrNull() ?: 500.0,
                                        roomCharges = roomCharges.toDoubleOrNull() ?: 1500.0,
                                        pharmacyFees = 0.0,
                                        labFees = 0.0
                                    )
                                )
                            }
                            when (res) {
                                is com.example.hoscore.core.common.Resource.Success -> onSuccess()
                                is com.example.hoscore.core.common.Resource.Error -> errorMsg = res.message
                                else -> {}
                            }
                        } catch (e: Exception) {
                            errorMsg = e.localizedMessage ?: "Failed to create invoice"
                        } finally { loading = false }
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = t.primary)
            ) { Text(if (loading) "Generating..." else "Create Invoice") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
        containerColor = t.screenBg
    )
}

// ─── 5. Doctors ──────────────────────────────────────────────────────────────
@Composable
fun DoctorsScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    var showDialog by remember { mutableStateOf(false) }
    var refreshTrigger by remember { mutableStateOf(0) }

    if (showDialog) {
        AddDoctorDialog(onDismiss = { showDialog = false }, onSuccess = { showDialog = false; refreshTrigger++ })
    }

    key(refreshTrigger) {
        GenericFeatureScreen(
            "Doctors Directory", "Medical staff & specialists", onBack, { ServiceLocator.api.getDoctors() },
            fab = {
                ExtendedFloatingActionButton(
                    onClick = { showDialog = true },
                    containerColor = t.primary,
                    contentColor = Color.White,
                    icon = { Icon(Icons.Rounded.Add, null) },
                    text = { Text("Add Doctor", fontWeight = FontWeight.Bold) }
                )
            }
        ) { doc ->
            HoscoreCard(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(4.dp)) {
                    Text("Dr. ${doc.name}", fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 15.sp)
                    Text("${doc.specialization ?: "General Physician"} · ${doc.department ?: "Outpatient"}", fontSize = 12.sp, color = t.textSecondary)
                    if (!doc.phone.isNullOrEmpty()) Text("Contact: ${doc.phone}", fontSize = 11.sp, color = t.textMuted)
                }
            }
        }
    }
}

@Composable
private fun AddDoctorDialog(onDismiss: () -> Unit, onSuccess: () -> Unit) {
    val t = HoscoreTokens.current
    val scope = rememberCoroutineScope()
    var name by remember { mutableStateOf("") }
    var specialty by remember { mutableStateOf("General Medicine") }
    var contact by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Register New Doctor", fontWeight = FontWeight.Bold, color = t.textPrimary) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Doctor Full Name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = specialty, onValueChange = { specialty = it }, label = { Text("Specialty") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = contact, onValueChange = { contact = it }, label = { Text("Contact Phone") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isNotBlank()) {
                        loading = true
                        scope.launch {
                            try {
                                apiCall {
                                    ServiceLocator.api.createDoctor(
                                        CreateDoctorRequest(
                                            name = name,
                                            specialty = specialty,
                                            contact = contact.ifBlank { null },
                                            email = email.ifBlank { null }
                                        )
                                    )
                                }
                                onSuccess()
                            } catch (_: Exception) {} finally { loading = false }
                        }
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = t.primary)
            ) { Text(if (loading) "Registering..." else "Register Doctor") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
        containerColor = t.screenBg
    )
}

// ─── 6. Staff ────────────────────────────────────────────────────────────────
@Composable
fun StaffScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    var showDialog by remember { mutableStateOf(false) }
    var selectedStaff by remember { mutableStateOf<StaffMember?>(null) }
    var refreshTrigger by remember { mutableStateOf(0) }

    if (showDialog) {
        AddStaffDialog(onDismiss = { showDialog = false }, onSuccess = { showDialog = false; refreshTrigger++ })
    }
    selectedStaff?.let { staff ->
        StaffQRBadgeDialog(staff) { selectedStaff = null }
    }
    
    key(refreshTrigger) {
        GenericFeatureScreen(
            "Staff Directory", "Hospital workforce", onBack, { ServiceLocator.api.getStaff() },
            fab = {
                FloatingActionButton(onClick = { showDialog = true }, containerColor = t.primary) {
                    Icon(Icons.Rounded.Add, null, tint = Color.White)
                }
            }
        ) { s ->
            HoscoreCard(Modifier.fillMaxWidth().clickable { selectedStaff = s }) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.padding(4.dp)) {
                        Text(s.name, fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 15.sp)
                        Text("${s.role} · ${s.department ?: "General"}", fontSize = 12.sp, color = t.textSecondary)
                    }
                    StatusBadge("STF-${s.id.take(6).uppercase()}", t.primary)
                }
            }
        }
    }
}

@Composable
private fun AddStaffDialog(onDismiss: () -> Unit, onSuccess: () -> Unit) {
    val t = HoscoreTokens.current
    val scope = rememberCoroutineScope()
    var name by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("NURSE") }
    var contact by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Staff Member", fontWeight = FontWeight.Bold, color = t.textPrimary) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Full Name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = role, onValueChange = { role = it }, label = { Text("Role (NURSE, RECEPTIONIST)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = contact, onValueChange = { contact = it }, label = { Text("Contact Number") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isNotBlank()) {
                        loading = true
                        scope.launch {
                            try {
                                apiCall {
                                    ServiceLocator.api.createStaff(
                                        CreateStaffRequest(
                                            name = name,
                                            role = role,
                                            contact = contact.ifBlank { null },
                                            email = email.ifBlank { null }
                                        )
                                    )
                                }
                                onSuccess()
                            } catch (_: Exception) {} finally { loading = false }
                        }
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = t.primary)
            ) { Text(if (loading) "Adding..." else "Add Staff") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
        containerColor = t.screenBg
    )
}

@Composable
private fun StaffQRBadgeDialog(staff: StaffMember, onDismiss: () -> Unit) {
    val t = HoscoreTokens.current
    HoscorePassDialog(
        title = "STAFF DIGITAL BADGE",
        name = staff.name,
        idLabel = "STF-${staff.id.take(8).uppercase()}",
        payload = HoscoreQrCodec.encodeStaff(staff.id),
        caption = "Scan badge for duty verification — same format as the web staff badge.",
        accent = t.primary,
        onDismiss = onDismiss,
    )
}

// ─── 7. Inventory ────────────────────────────────────────────────────────────
@Composable
fun InventoryScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    var showDialog by remember { mutableStateOf(false) }
    var refreshTrigger by remember { mutableStateOf(0) }

    if (showDialog) {
        AddInventoryDialog(onDismiss = { showDialog = false }, onSuccess = { showDialog = false; refreshTrigger++ })
    }

    key(refreshTrigger) {
        GenericFeatureScreen(
            "Pharmacy & Inventory", "Stock & medical supplies", onBack, { ServiceLocator.api.getInventory() },
            fab = {
                FloatingActionButton(onClick = { showDialog = true }, containerColor = t.primary) {
                    Icon(Icons.Rounded.Add, null, tint = Color.White)
                }
            }
        ) { item ->
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
}

@Composable
private fun AddInventoryDialog(onDismiss: () -> Unit, onSuccess: () -> Unit) {
    val t = HoscoreTokens.current
    val scope = rememberCoroutineScope()
    var itemName by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("Pharmaceuticals") }
    var stock by remember { mutableStateOf("100") }
    var price by remember { mutableStateOf("15.0") }
    var loading by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Inventory Stock", fontWeight = FontWeight.Bold, color = t.textPrimary) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = itemName, onValueChange = { itemName = it }, label = { Text("Item / Medicine Name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = type, onValueChange = { type = it }, label = { Text("Type / Category") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = stock, onValueChange = { stock = it }, label = { Text("Stock Quantity") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = price, onValueChange = { price = it }, label = { Text("Unit Price (₹)") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), singleLine = true, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (itemName.isNotBlank()) {
                        loading = true
                        scope.launch {
                            try {
                                apiCall {
                                    ServiceLocator.api.createInventoryItem(
                                        CreateInventoryRequest(
                                            itemName = itemName,
                                            type = type,
                                            stock = stock.toIntOrNull() ?: 100,
                                            price = price.toDoubleOrNull() ?: 15.0
                                        )
                                    )
                                }
                                onSuccess()
                            } catch (_: Exception) {} finally { loading = false }
                        }
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = t.primary)
            ) { Text(if (loading) "Adding..." else "Add Stock") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
        containerColor = t.screenBg
    )
}

// ─── 8. Expenses ─────────────────────────────────────────────────────────────
@Composable
fun ExpensesScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    var showDialog by remember { mutableStateOf(false) }
    var refreshTrigger by remember { mutableStateOf(0) }

    if (showDialog) {
        LogExpenseDialog(onDismiss = { showDialog = false }, onSuccess = { showDialog = false; refreshTrigger++ })
    }

    key(refreshTrigger) {
        GenericFeatureScreen(
            "Operating Expenses", "Hospital expenditure", onBack, { ServiceLocator.api.getExpenses() },
            fab = {
                ExtendedFloatingActionButton(
                    onClick = { showDialog = true },
                    containerColor = t.primary,
                    contentColor = Color.White,
                    icon = { Icon(Icons.Rounded.Add, null) },
                    text = { Text("Log Expense", fontWeight = FontWeight.Bold) }
                )
            }
        ) { exp ->
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
}

@Composable
private fun LogExpenseDialog(onDismiss: () -> Unit, onSuccess: () -> Unit) {
    val t = HoscoreTokens.current
    val scope = rememberCoroutineScope()
    var title by remember { mutableStateOf("Medical Consumables") }
    var category by remember { mutableStateOf("Supplies") }
    var amount by remember { mutableStateOf("1200") }
    var loading by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Log Hospital Expense", fontWeight = FontWeight.Bold, color = t.textPrimary) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("Title / Summary") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = category, onValueChange = { category = it }, label = { Text("Category") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = amount, onValueChange = { amount = it }, label = { Text("Amount (₹)") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), singleLine = true, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (title.isNotBlank() && amount.isNotBlank()) {
                        loading = true
                        scope.launch {
                            try {
                                apiCall {
                                    ServiceLocator.api.createExpense(
                                        CreateExpenseRequest(
                                            title = title,
                                            category = category,
                                            amount = amount.toDoubleOrNull() ?: 1200.0
                                        )
                                    )
                                }
                                onSuccess()
                            } catch (_: Exception) {} finally { loading = false }
                        }
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = t.primary)
            ) { Text(if (loading) "Logging..." else "Log Expense") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
        containerColor = t.screenBg
    )
}

// ─── 9. Insurance Claims ─────────────────────────────────────────────────────
@Composable
fun ClaimsScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    var showDialog by remember { mutableStateOf(false) }
    var refreshTrigger by remember { mutableStateOf(0) }

    if (showDialog) {
        NewClaimDialog(onDismiss = { showDialog = false }, onSuccess = { showDialog = false; refreshTrigger++ })
    }

    key(refreshTrigger) {
        GenericFeatureScreen(
            "Insurance Claims", "Pre-authorization & claims", onBack, { ServiceLocator.api.getInsuranceClaims() },
            fab = {
                FloatingActionButton(onClick = { showDialog = true }, containerColor = t.primary) {
                    Icon(Icons.Rounded.Add, null, tint = Color.White)
                }
            }
        ) { claim ->
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
}

@Composable
private fun NewClaimDialog(onDismiss: () -> Unit, onSuccess: () -> Unit) {
    val t = HoscoreTokens.current
    val scope = rememberCoroutineScope()
    var patientName by remember { mutableStateOf("") }
    var insuranceCompany by remember { mutableStateOf("Star Health Insurance") }
    var policyNumber by remember { mutableStateOf("POL-882910") }
    var claimAmount by remember { mutableStateOf("25000") }
    var loading by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Submit Insurance Claim", fontWeight = FontWeight.Bold, color = t.textPrimary) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = patientName, onValueChange = { patientName = it }, label = { Text("Patient Name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = insuranceCompany, onValueChange = { insuranceCompany = it }, label = { Text("Insurance Company") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = policyNumber, onValueChange = { policyNumber = it }, label = { Text("Policy Number") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = claimAmount, onValueChange = { claimAmount = it }, label = { Text("Claim Amount (₹)") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), singleLine = true, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (patientName.isNotBlank() && claimAmount.isNotBlank()) {
                        loading = true
                        scope.launch {
                            try {
                                apiCall {
                                    ServiceLocator.api.createInsuranceClaim(
                                        CreateClaimRequest(
                                            patientName = patientName,
                                            insuranceCompany = insuranceCompany,
                                            policyNumber = policyNumber,
                                            claimAmount = claimAmount.toDoubleOrNull() ?: 25000.0
                                        )
                                    )
                                }
                                onSuccess()
                            } catch (_: Exception) {} finally { loading = false }
                        }
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = t.primary)
            ) { Text(if (loading) "Submitting..." else "Submit Claim") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
        containerColor = t.screenBg
    )
}

// ─── 10. Shifts ──────────────────────────────────────────────────────────────
@Composable
fun ShiftsScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    var showDialog by remember { mutableStateOf(false) }
    var refreshTrigger by remember { mutableStateOf(0) }

    if (showDialog) {
        AssignShiftDialog(onDismiss = { showDialog = false }, onSuccess = { showDialog = false; refreshTrigger++ })
    }

    key(refreshTrigger) {
        GenericFeatureScreen(
            "Shift Scheduling", "Staff duty rosters", onBack, { ServiceLocator.api.getShifts() },
            fab = {
                FloatingActionButton(onClick = { showDialog = true }, containerColor = t.primary) {
                    Icon(Icons.Rounded.Add, null, tint = Color.White)
                }
            }
        ) { shift ->
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
}

@Composable
private fun AssignShiftDialog(onDismiss: () -> Unit, onSuccess: () -> Unit) {
    val t = HoscoreTokens.current
    val scope = rememberCoroutineScope()
    var staffName by remember { mutableStateOf("") }
    var date by remember { mutableStateOf(java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())) }
    var startTime by remember { mutableStateOf("08:00 AM") }
    var endTime by remember { mutableStateOf("04:00 PM") }
    var loading by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Assign Staff Shift", fontWeight = FontWeight.Bold, color = t.textPrimary) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = staffName, onValueChange = { staffName = it }, label = { Text("Staff / Nurse Name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = date, onValueChange = { date = it }, label = { Text("Date (YYYY-MM-DD)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = startTime, onValueChange = { startTime = it }, label = { Text("Start Time") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = endTime, onValueChange = { endTime = it }, label = { Text("End Time") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (staffName.isNotBlank()) {
                        loading = true
                        scope.launch {
                            try {
                                apiCall {
                                    ServiceLocator.api.createShift(
                                        CreateShiftRequest(
                                            staffName = staffName,
                                            date = date,
                                            startTime = startTime,
                                            endTime = endTime
                                        )
                                    )
                                }
                                onSuccess()
                            } catch (_: Exception) {} finally { loading = false }
                        }
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = t.primary)
            ) { Text(if (loading) "Assigning..." else "Assign Shift") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
        containerColor = t.screenBg
    )
}

// ─── 11. Notices ─────────────────────────────────────────────────────────────
@Composable
fun NoticesScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    var showDialog by remember { mutableStateOf(false) }
    var refreshTrigger by remember { mutableStateOf(0) }

    if (showDialog) {
        PostNoticeDialog(onDismiss = { showDialog = false }, onSuccess = { showDialog = false; refreshTrigger++ })
    }

    key(refreshTrigger) {
        GenericFeatureScreen(
            "Notice Board", "Hospital announcements", onBack, { ServiceLocator.api.getNotices() },
            fab = {
                FloatingActionButton(onClick = { showDialog = true }, containerColor = t.primary) {
                    Icon(Icons.Rounded.Add, null, tint = Color.White)
                }
            }
        ) { n ->
            HoscoreCard(Modifier.fillMaxWidth()) {
                Column {
                    Text(n.title, fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 15.sp)
                    Spacer(Modifier.height(4.dp))
                    Text(n.content, fontSize = 12.sp, color = t.textSecondary)
                }
            }
        }
    }
}

@Composable
private fun PostNoticeDialog(onDismiss: () -> Unit, onSuccess: () -> Unit) {
    val t = HoscoreTokens.current
    val scope = rememberCoroutineScope()
    var title by remember { mutableStateOf("") }
    var body by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Publish Notice Announcement", fontWeight = FontWeight.Bold, color = t.textPrimary) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("Notice Title") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = body, onValueChange = { body = it }, label = { Text("Announcement Body") }, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (title.isNotBlank() && body.isNotBlank()) {
                        loading = true
                        scope.launch {
                            try {
                                apiCall {
                                    ServiceLocator.api.createNotice(
                                        CreateNoticeRequest(
                                            title = title,
                                            body = body
                                        )
                                    )
                                }
                                onSuccess()
                            } catch (_: Exception) {} finally { loading = false }
                        }
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = t.primary)
            ) { Text(if (loading) "Publishing..." else "Publish Notice") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
        containerColor = t.screenBg
    )
}

// ─── 12. Leaves ──────────────────────────────────────────────────────────────
@Composable
fun LeavesScreen(onBack: () -> Unit) {
    val t = HoscoreTokens.current
    var showDialog by remember { mutableStateOf(false) }
    var refreshTrigger by remember { mutableStateOf(0) }

    if (showDialog) {
        RequestLeaveDialog(onDismiss = { showDialog = false }, onSuccess = { showDialog = false; refreshTrigger++ })
    }

    key(refreshTrigger) {
        GenericFeatureScreen(
            "Leave Requests", "Staff leave approvals", onBack, { ServiceLocator.api.getLeaves() },
            fab = {
                ExtendedFloatingActionButton(
                    onClick = { showDialog = true },
                    containerColor = t.primary,
                    contentColor = Color.White,
                    icon = { Icon(Icons.Rounded.Add, null) },
                    text = { Text("Request Leave", fontWeight = FontWeight.Bold) }
                )
            }
        ) { leave ->
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
}

@Composable
private fun RequestLeaveDialog(onDismiss: () -> Unit, onSuccess: () -> Unit) {
    val t = HoscoreTokens.current
    val scope = rememberCoroutineScope()
    var staffName by remember { mutableStateOf("") }
    var reason by remember { mutableStateOf("Medical Leave") }
    var startDate by remember { mutableStateOf(java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())) }
    var endDate by remember { mutableStateOf(java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())) }
    var loading by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Submit Leave Request", fontWeight = FontWeight.Bold, color = t.textPrimary) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = staffName, onValueChange = { staffName = it }, label = { Text("Staff Member Name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = reason, onValueChange = { reason = it }, label = { Text("Reason for Leave") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = startDate, onValueChange = { startDate = it }, label = { Text("Start Date (YYYY-MM-DD)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = endDate, onValueChange = { endDate = it }, label = { Text("End Date (YYYY-MM-DD)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (staffName.isNotBlank()) {
                        loading = true
                        scope.launch {
                            try {
                                apiCall {
                                    ServiceLocator.api.createLeave(
                                        CreateLeaveRequest(
                                            staffName = staffName,
                                            reason = reason,
                                            startDate = startDate,
                                            endDate = endDate
                                        )
                                    )
                                }
                                onSuccess()
                            } catch (_: Exception) {} finally { loading = false }
                        }
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = t.primary)
            ) { Text(if (loading) "Submitting..." else "Submit Request") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
        containerColor = t.screenBg
    )
}

// ─── Extra Utilities ────────────────────────────────────────────────────────
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
