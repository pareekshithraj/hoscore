package com.example.hoscore.feature.hospital

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.hoscore.core.common.Resource
import com.example.hoscore.core.network.CreateHospitalAppointmentRequest
import com.example.hoscore.core.network.CreateLabOrderRequest
import com.example.hoscore.core.network.CreatePrescriptionRequest
import com.example.hoscore.core.network.PatientRecordChart
import com.example.hoscore.core.network.RecordVitalsRequest
import com.example.hoscore.core.network.ServiceLocator
import com.example.hoscore.core.network.apiCall
import com.example.hoscore.core.ui.components.FormField
import com.example.hoscore.core.ui.DataScreen
import com.example.hoscore.core.ui.components.EmptyState
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.components.StatusBadge
import com.example.hoscore.core.ui.theme.HoscoreTokens
import kotlinx.coroutines.launch
import androidx.activity.compose.rememberLauncherForActivityResult
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions

@Composable
fun PatientsScreen() {
    val t = HoscoreTokens.current
    val vm: PatientsVM = viewModel()
    val scope = rememberCoroutineScope()
    var query by remember { mutableStateOf("") }
    var selectedChart by remember { mutableStateOf<PatientRecordChart?>(null) }
    var showScanModal by remember { mutableStateOf(false) }
    var inputId by remember { mutableStateOf("") }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    var isSearching by remember { mutableStateOf(false) }

    val scanLauncher = rememberLauncherForActivityResult(ScanContract()) { result ->
        if (result.contents != null) {
            val parts = result.contents.split(":")
            if (parts.size >= 2 && parts[0] == "HOSCORE") {
                val extractedId = parts[1]
                isSearching = true
                scope.launch {
                    val res = apiCall { ServiceLocator.api.getPatientBySixDigitId(extractedId) }
                    isSearching = false
                    if (res is Resource.Success) {
                        selectedChart = res.data
                    }
                }
            }
        }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = t.screenBg,
        topBar = { HoscoreTopBar("Patients", "Registered patient directory") },
        floatingActionButton = {
            Column(horizontalAlignment = Alignment.End) {
                androidx.compose.material3.SmallFloatingActionButton(
                    onClick = { showScanModal = true },
                    containerColor = t.card,
                    contentColor = t.primary
                ) {
                    Icon(Icons.Rounded.Edit, null)
                }
                Spacer(Modifier.height(8.dp))
                ExtendedFloatingActionButton(
                    onClick = {
                        scanLauncher.launch(ScanOptions().apply {
                            setOrientationLocked(false)
                            setPrompt("Scan Hoscore QR Code")
                        })
                    },
                    containerColor = t.primary,
                    contentColor = Color.White,
                    icon = { Icon(Icons.Rounded.QrCodeScanner, null) },
                    text = { Text("Scan QR Pass", fontWeight = FontWeight.Bold) }
                )
            }
        }
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                placeholder = { Text("Search by name or 6-digit ID", color = t.textMuted) },
                leadingIcon = { Icon(Icons.Rounded.Search, null, tint = t.textMuted) },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                keyboardOptions = KeyboardOptions(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = t.primary,
                    unfocusedBorderColor = t.cardBorder,
                    focusedContainerColor = t.card,
                    unfocusedContainerColor = t.card,
                    focusedTextColor = t.textPrimary,
                    unfocusedTextColor = t.textPrimary,
                ),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 4.dp),
            )
            Spacer(Modifier.size(8.dp))
            DataScreen(vm) { list ->
                val filtered = list.filter {
                    query.isBlank() ||
                        it.name.contains(query, true) ||
                        it.sixDigitId?.contains(query, true) == true
                }
                if (filtered.isEmpty()) {
                    EmptyState("No patients found", "Try a different search or scan a Hoscore ID.", Icons.Rounded.Person)
                } else {
                    LazyColumn(
                        Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(bottom = 80.dp, start = 20.dp, end = 20.dp, top = 10.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(filtered, key = { it.id }) { p ->
                            HoscoreCard(
                                Modifier.fillMaxWidth().clickable {
                                    if (!p.sixDigitId.isNullOrEmpty()) {
                                        scope.launch {
                                            val res = apiCall { ServiceLocator.api.getPatientBySixDigitId(p.sixDigitId) }
                                            if (res is Resource.Success) {
                                                selectedChart = res.data
                                            }
                                        }
                                    }
                                }
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        Modifier.size(44.dp).clip(CircleShape).background(t.primary.copy(0.12f)),
                                        contentAlignment = Alignment.Center,
                                    ) {
                                        Text(
                                            p.name.take(1).uppercase(),
                                            fontWeight = FontWeight.Black, color = t.primary, fontSize = 17.sp,
                                        )
                                    }
                                    Spacer(Modifier.size(14.dp))
                                    Column(Modifier.weight(1f)) {
                                        Text(p.name, fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 15.sp)
                                        Text(
                                            listOfNotNull(
                                                p.age?.let { "$it yrs" }, p.gender, p.bloodGroup,
                                            ).joinToString(" Â· ").ifEmpty { "Patient" },
                                            color = t.textMuted, fontSize = 12.sp,
                                        )
                                    }
                                    if (p.sixDigitId != null) StatusBadge("HSC-${p.sixDigitId}", t.cyan)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Modal to lookup by 6-digit ID
    if (showScanModal) {
        AlertDialog(
            onDismissRequest = { showScanModal = false },
            title = { Text("Scan / Lookup Hoscore ID", fontWeight = FontWeight.Bold, color = t.textPrimary) },
            text = {
                Column {
                    Text("Enter patient's 6-digit Hoscore ID to fetch full medical history & book visits.", fontSize = 12.sp, color = t.textSecondary)
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(
                        value = inputId,
                        onValueChange = { inputId = it.filter { c -> c.isDigit() }.take(6) },
                        placeholder = { Text("e.g. 882910") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    if (errorMsg != null) {
                        Spacer(Modifier.height(8.dp))
                        Text(errorMsg!!, fontSize = 11.sp, color = t.clinical, fontWeight = FontWeight.Bold)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (inputId.length == 6) {
                            isSearching = true
                            errorMsg = null
                            scope.launch {
                                val res = apiCall { ServiceLocator.api.getPatientBySixDigitId(inputId) }
                                isSearching = false
                                if (res is Resource.Success) {
                                    showScanModal = false
                                    selectedChart = res.data
                                } else {
                                    errorMsg = "No patient found for Hoscore ID #${inputId}"
                                }
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = t.primary)
                ) {
                    Text(if (isSearching) "Searching..." else "Fetch Chart")
                }
            },
            dismissButton = {
                TextButton(onClick = { showScanModal = false }) { Text("Cancel") }
            },
            containerColor = t.screenBg
        )
    }

    // Patient Full Chart Dialog
    selectedChart?.let { chart ->
        PatientChartDialog(chart = chart, onDismiss = { selectedChart = null })
    }
}

@Composable
private fun PatientChartDialog(chart: PatientRecordChart, onDismiss: () -> Unit) {
    val t = HoscoreTokens.current
    val scope = rememberCoroutineScope()
    var localChart by remember(chart.id) { mutableStateOf(chart) }
    var activeTab by remember { mutableStateOf(0) }
    val tabs = listOf("Profile", "Vitals", "Rx", "Labs", "Book Visit")
    var isBookingSuccess by remember { mutableStateOf(false) }
    var isBookingLoading by remember { mutableStateOf(false) }
    var writeError by remember { mutableStateOf<String?>(null) }
    var bp by remember { mutableStateOf("") }
    var hr by remember { mutableStateOf("") }
    var spo2 by remember { mutableStateOf("") }
    var diagnosis by remember { mutableStateOf("") }
    var medicines by remember { mutableStateOf("") }
    var testName by remember { mutableStateOf("") }
    var saving by remember { mutableStateOf(false) }

    fun refreshChart() {
        val six = localChart.sixDigitId ?: return
        scope.launch {
            val res = apiCall { ServiceLocator.api.getPatientBySixDigitId(six) }
            if (res is Resource.Success) localChart = res.data
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text(localChart.name, fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 18.sp)
                Text("HSC-${localChart.sixDigitId ?: "N/A"} Â· ${localChart.gender ?: "MALE"}", fontSize = 12.sp, color = t.primary, fontWeight = FontWeight.Bold)
            }
        },
        text = {
            Column(Modifier.fillMaxWidth()) {
                TabRow(
                    selectedTabIndex = activeTab,
                    containerColor = t.screenBg,
                    contentColor = t.primary,
                ) {
                    tabs.forEachIndexed { index, title ->
                        Tab(
                            selected = activeTab == index,
                            onClick = { activeTab = index },
                            text = { Text(title, fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                        )
                    }
                }
                Spacer(Modifier.height(10.dp))
                if (writeError != null) {
                    Text(writeError!!, fontSize = 11.sp, color = t.clinical, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(6.dp))
                }

                Box(Modifier.height(320.dp).fillMaxWidth()) {
                    when (activeTab) {
                        0 -> Column {
                            Text("Contact: ${localChart.contact ?: "N/A"}", fontSize = 12.sp, color = t.textSecondary)
                            Text("DOB: ${localChart.dateOfBirth?.take(10) ?: "N/A"}", fontSize = 12.sp, color = t.textSecondary)
                            Text("Blood Group: ${localChart.bloodGroup ?: "O+"}", fontSize = 12.sp, color = t.textSecondary)
                            Text("Medical History: ${localChart.medicalHistory ?: "None recorded"}", fontSize = 12.sp, color = t.textMuted)
                        }
                        1 -> LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            item {
                                FormField(bp, { bp = it }, "Blood pressure")
                                Spacer(Modifier.height(6.dp))
                                FormField(hr, { hr = it.filter { c -> c.isDigit() }.take(3) }, "Heart rate")
                                Spacer(Modifier.height(6.dp))
                                FormField(spo2, { spo2 = it.filter { c -> c.isDigit() }.take(3) }, "SpO2 %")
                                Spacer(Modifier.height(8.dp))
                                Button(
                                    onClick = {
                                        saving = true
                                        writeError = null
                                        scope.launch {
                                            val res = apiCall {
                                                ServiceLocator.api.recordVitals(
                                                    RecordVitalsRequest(
                                                        patientId = localChart.id,
                                                        patientName = localChart.name,
                                                        bloodPressure = bp.ifBlank { null },
                                                        heartRate = hr.toIntOrNull(),
                                                        oxygenSaturation = spo2.toIntOrNull(),
                                                    )
                                                )
                                            }
                                            saving = false
                                            if (res is Resource.Error) writeError = res.message
                                            else {
                                                bp = ""; hr = ""; spo2 = ""
                                                refreshChart()
                                            }
                                        }
                                    },
                                    enabled = !saving && (bp.isNotBlank() || hr.isNotBlank() || spo2.isNotBlank()),
                                    colors = ButtonDefaults.buttonColors(containerColor = t.primary),
                                    modifier = Modifier.fillMaxWidth().height(36.dp),
                                    contentPadding = PaddingValues(0.dp),
                                ) { Text(if (saving) "Savingâ€¦" else "Record vitals", fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                            }
                            if (localChart.vitals.isEmpty()) item { Text("No vitals recorded.", color = t.textMuted, fontSize = 12.sp) }
                            else items(localChart.vitals) { v ->
                                Text("BP: ${v.bloodPressure ?: "--"} | HR: ${v.heartRate ?: "--"} bpm | SpO2: ${v.oxygenSaturation ?: "--"}%", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = t.textPrimary)
                            }
                        }
                        2 -> LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            item {
                                FormField(diagnosis, { diagnosis = it }, "Diagnosis")
                                Spacer(Modifier.height(6.dp))
                                FormField(medicines, { medicines = it }, "Medicines", singleLine = false)
                                Spacer(Modifier.height(8.dp))
                                Button(
                                    onClick = {
                                        saving = true
                                        writeError = null
                                        scope.launch {
                                            val res = apiCall {
                                                ServiceLocator.api.createPrescription(
                                                    CreatePrescriptionRequest(
                                                        patientId = localChart.id,
                                                        patientName = localChart.name,
                                                        diagnosis = diagnosis.ifBlank { null },
                                                        medicines = medicines,
                                                        status = "ISSUED",
                                                    )
                                                )
                                            }
                                            saving = false
                                            if (res is Resource.Error) writeError = res.message
                                            else {
                                                diagnosis = ""; medicines = ""
                                                refreshChart()
                                            }
                                        }
                                    },
                                    enabled = !saving && medicines.isNotBlank(),
                                    colors = ButtonDefaults.buttonColors(containerColor = t.primary),
                                    modifier = Modifier.fillMaxWidth().height(36.dp),
                                    contentPadding = PaddingValues(0.dp),
                                ) { Text(if (saving) "Savingâ€¦" else "Issue prescription", fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                            }
                            if (localChart.prescriptions.isEmpty()) item { Text("No prescriptions recorded.", color = t.textMuted, fontSize = 12.sp) }
                            else items(localChart.prescriptions) { rx ->
                                var rxStatus by remember { mutableStateOf((rx.status ?: "UNCLAIMED").uppercase()) }
                                Column(
                                    Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(t.card)
                                        .border(1.dp, t.cardBorder, RoundedCornerShape(10.dp))
                                        .padding(10.dp)
                                ) {
                                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                        Text("Dr. ${rx.doctorName ?: "Practitioner"}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = t.textPrimary)
                                        StatusBadge(
                                            if (rxStatus == "ISSUED") "UNCLAIMED" else rxStatus,
                                            if (rxStatus == "CURRENT") t.primary else t.amber
                                        )
                                    }
                                    Spacer(Modifier.height(4.dp))
                                    Text(rx.medicines ?: "N/A", fontSize = 13.sp, color = t.primary, fontWeight = FontWeight.Bold)
                                    if (rxStatus == "UNCLAIMED" || rxStatus == "ISSUED") {
                                        Spacer(Modifier.height(6.dp))
                                        Button(
                                            onClick = {
                                                scope.launch {
                                                    apiCall { ServiceLocator.api.updatePrescriptionStatus(rx.id, mapOf("status" to "CURRENT")) }
                                                    rxStatus = "CURRENT"
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = t.emerald),
                                            modifier = Modifier.fillMaxWidth().height(32.dp),
                                            contentPadding = PaddingValues(0.dp)
                                        ) {
                                            Text("Claim & Make CURRENT", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    } else if (rxStatus == "CURRENT") {
                                        Spacer(Modifier.height(4.dp))
                                        Text("âœ“ Active Prescription (CURRENT)", fontSize = 11.sp, color = t.emerald, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                        3 -> LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            item {
                                FormField(testName, { testName = it }, "Test name")
                                Spacer(Modifier.height(8.dp))
                                Button(
                                    onClick = {
                                        saving = true
                                        writeError = null
                                        scope.launch {
                                            val res = apiCall {
                                                ServiceLocator.api.createLabOrder(
                                                    CreateLabOrderRequest(
                                                        patientId = localChart.id,
                                                        patientName = localChart.name,
                                                        testName = testName,
                                                    )
                                                )
                                            }
                                            saving = false
                                            if (res is Resource.Error) writeError = res.message
                                            else {
                                                testName = ""
                                                refreshChart()
                                            }
                                        }
                                    },
                                    enabled = !saving && testName.isNotBlank(),
                                    colors = ButtonDefaults.buttonColors(containerColor = t.primary),
                                    modifier = Modifier.fillMaxWidth().height(36.dp),
                                    contentPadding = PaddingValues(0.dp),
                                ) { Text(if (saving) "Savingâ€¦" else "Order lab", fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                            }
                            if (localChart.labOrders.isEmpty()) item { Text("No lab orders recorded.", color = t.textMuted, fontSize = 12.sp) }
                            else items(localChart.labOrders) { lab ->
                                var labStatus by remember { mutableStateOf((lab.status ?: "PENDING").uppercase()) }
                                Column(
                                    Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(t.card)
                                        .border(1.dp, t.cardBorder, RoundedCornerShape(10.dp))
                                        .padding(10.dp)
                                ) {
                                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                        Text(lab.testName, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = t.textPrimary)
                                        StatusBadge(
                                            labStatus,
                                            when (labStatus) {
                                                "COMPLETED" -> t.emerald
                                                "PROCESSING" -> t.primary
                                                else -> t.amber
                                            }
                                        )
                                    }
                                    Spacer(Modifier.height(4.dp))
                                    Text("Ordered by Dr. ${lab.doctorName ?: "Practitioner"}", fontSize = 11.sp, color = t.textMuted)
                                    if (labStatus == "PENDING") {
                                        Spacer(Modifier.height(6.dp))
                                        Button(
                                            onClick = {
                                                scope.launch {
                                                    apiCall { ServiceLocator.api.updateLabOrder(lab.id, mapOf("status" to "PROCESSING")) }
                                                    labStatus = "PROCESSING"
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = t.primary),
                                            modifier = Modifier.fillMaxWidth().height(32.dp),
                                            contentPadding = PaddingValues(0.dp)
                                        ) {
                                            Text("Start Test (PROCESSING)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    } else if (labStatus == "PROCESSING") {
                                        Spacer(Modifier.height(6.dp))
                                        Button(
                                            onClick = {
                                                scope.launch {
                                                    apiCall { ServiceLocator.api.updateLabOrder(lab.id, mapOf("status" to "COMPLETED")) }
                                                    labStatus = "COMPLETED"
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = t.emerald),
                                            modifier = Modifier.fillMaxWidth().height(32.dp),
                                            contentPadding = PaddingValues(0.dp)
                                        ) {
                                            Text("Complete Test (COMPLETED)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    } else if (labStatus == "COMPLETED") {
                                        Spacer(Modifier.height(4.dp))
                                        Text("âœ“ Test Completed", fontSize = 11.sp, color = t.emerald, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                        4 -> Column {
                            if (isBookingSuccess) {
                                Text("âœ“ Appointment booked successfully!", color = t.emerald, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            } else {
                                Text("Book visit for ${localChart.name} using Hoscore ID #${localChart.sixDigitId}", fontSize = 12.sp, color = t.textSecondary)
                                Spacer(Modifier.height(10.dp))
                                Button(
                                    onClick = {
                                        isBookingLoading = true
                                        scope.launch {
                                            apiCall {
                                                ServiceLocator.api.createHospitalAppointment(
                                                    CreateHospitalAppointmentRequest(
                                                        patientName = localChart.name,
                                                        sixDigitId = localChart.sixDigitId,
                                                        time = "10:00 AM",
                                                        date = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
                                                    )
                                                )
                                            }
                                            isBookingLoading = false
                                            isBookingSuccess = true
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = t.emerald),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(if (isBookingLoading) "Booking..." else "Confirm Booking")
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = onDismiss, colors = ButtonDefaults.buttonColors(containerColor = t.primary)) {
                Text("Close")
            }
        },
        containerColor = t.screenBg
    )
}
