package com.example.hoscore.feature.patient

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.LocalHospital
import androidx.compose.material.icons.rounded.QrCode2
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.hoscore.core.common.Resource
import com.example.hoscore.core.network.AvailableSlotsResponse
import com.example.hoscore.core.network.BookAppointmentRequest
import com.example.hoscore.core.network.Doctor
import com.example.hoscore.core.network.HospitalDetail
import com.example.hoscore.core.network.ServiceLocator
import com.example.hoscore.core.network.TimeSlotDto
import com.example.hoscore.core.network.apiCall
import com.example.hoscore.core.ui.DataScreen
import com.example.hoscore.core.ui.components.EmptyState
import com.example.hoscore.core.ui.components.HoscoreCard
import com.example.hoscore.core.ui.components.HoscoreTopBar
import com.example.hoscore.core.ui.theme.HoscoreTokens
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

// ─────────────────────────────────────────────────────────────────────────────
// Find Hospitals — search + list, tap to book
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun FindHospitalsScreen(onBack: () -> Unit, onPick: (hospitalId: String, hospitalName: String) -> Unit) {
    val t = HoscoreTokens.current
    val vm: FindHospitalsVM = viewModel()
    var query by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar("Find a Hospital", "Search and book your visit", onBack = onBack)

        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 8.dp),
            placeholder = { Text("Search hospitals or cities…") },
            leadingIcon = { Icon(Icons.Rounded.Search, null, tint = t.primary) },
            singleLine = true,
            shape = RoundedCornerShape(16.dp),
        )

        DataScreen(vm) { all ->
            val filtered = if (query.isBlank()) all else all.filter {
                it.name.contains(query, true) || (it.city ?: "").contains(query, true) ||
                    (it.state ?: "").contains(query, true)
            }
            if (filtered.isEmpty()) {
                EmptyState("No hospitals found", "Try a different name or city.", Icons.Rounded.LocalHospital)
            } else {
                LazyColumn(
                    Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(filtered, key = { it.id }) { h ->
                        HoscoreCard(Modifier.fillMaxWidth(), onClick = { onPick(h.id, h.name) }) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    Modifier.size(44.dp).clip(CircleShape).background(t.primary.copy(0.12f)),
                                    contentAlignment = Alignment.Center,
                                ) { Icon(Icons.Rounded.LocalHospital, null, tint = t.primary, modifier = Modifier.size(22.dp)) }
                                Spacer(Modifier.width(12.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(h.name, fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 15.sp)
                                    Text(
                                        listOfNotNull(h.city, h.state).joinToString(", ").ifEmpty { "Hospital" },
                                        color = t.textMuted, fontSize = 12.sp,
                                    )
                                }
                                if (h.rating != null) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Rounded.Star, null, tint = t.amber, modifier = Modifier.size(15.dp))
                                        Spacer(Modifier.width(3.dp))
                                        Text(String.format("%.1f", h.rating), fontWeight = FontWeight.Bold, color = t.textSecondary, fontSize = 12.sp)
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

// ─────────────────────────────────────────────────────────────────────────────
// Book Appointment — hospital detail + doctor/date/time form
// ─────────────────────────────────────────────────────────────────────────────

class BookingVM(private val hospitalId: String) : ViewModel() {
    private val api = ServiceLocator.api

    private val _detail = MutableStateFlow<Resource<HospitalDetail>>(Resource.Loading)
    val detail = _detail.asStateFlow()

    private val _slotsState = MutableStateFlow<Resource<AvailableSlotsResponse>>(Resource.Loading)
    val slotsState = _slotsState.asStateFlow()

    private val _submit = MutableStateFlow<Resource<com.example.hoscore.core.network.Appointment>?>(null)
    val submit = _submit.asStateFlow()

    init { load() }

    fun load() {
        _detail.value = Resource.Loading
        viewModelScope.launch { _detail.value = apiCall { getHospitalDetail(hospitalId) } }
    }

    fun loadSlots(date: String, doctorId: String?) {
        _slotsState.value = Resource.Loading
        viewModelScope.launch {
            _slotsState.value = apiCall { getAvailableSlots(hospitalId, date, doctorId) }
        }
    }

    fun book(doctorId: String?, date: String, time: String) {
        _submit.value = Resource.Loading
        viewModelScope.launch {
            _submit.value = apiCall {
                bookAppointment(BookAppointmentRequest(hospitalId = hospitalId, date = date, time = time, doctorId = doctorId))
            }
        }
    }

    fun clearSubmit() { _submit.value = null }
}

@Composable
fun BookAppointmentScreen(
    hospitalId: String,
    hospitalName: String,
    onBack: () -> Unit,
    onBooked: () -> Unit,
) {
    val t = HoscoreTokens.current
    val vm: BookingVM = viewModel(key = "booking-$hospitalId") { BookingVM(hospitalId) }
    val detailState by vm.detail.collectAsState()
    val slotsState by vm.slotsState.collectAsState()
    val submitState by vm.submit.collectAsState()

    var selectedDoctor by remember { mutableStateOf<Doctor?>(null) }
    var date by remember {
        val sdf = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
        mutableStateOf(sdf.format(java.util.Date()))
    }
    var selectedTime by remember { mutableStateOf("") }

    val context = LocalContext.current
    var showDatePicker by remember { mutableStateOf(false) }

    LaunchedEffect(date, selectedDoctor?.id) {
        if (date.isNotBlank()) {
            vm.loadSlots(date, selectedDoctor?.id)
        }
    }

    LaunchedEffect(slotsState) {
        if (slotsState is Resource.Success) {
            val availableSlots = (slotsState as Resource.Success<AvailableSlotsResponse>).data.slots
            val firstAvailable = availableSlots.firstOrNull { !it.isBooked }?.time
            if (firstAvailable != null && (selectedTime.isBlank() || availableSlots.find { it.time == selectedTime }?.isBooked == true)) {
                selectedTime = firstAvailable
            }
        }
    }

    if (showDatePicker) {
        val calendar = java.util.Calendar.getInstance()
        try {
            if (date.isNotBlank()) {
                val parts = date.split("-")
                if (parts.size == 3) {
                    calendar.set(parts[0].toInt(), parts[1].toInt() - 1, parts[2].toInt())
                }
            }
        } catch (_: Exception) {}

        val datePickerDialog = android.app.DatePickerDialog(
            context,
            { _, yr, mo, dy ->
                date = String.format(java.util.Locale.US, "%04d-%02d-%02d", yr, mo + 1, dy)
                showDatePicker = false
            },
            calendar.get(java.util.Calendar.YEAR),
            calendar.get(java.util.Calendar.MONTH),
            calendar.get(java.util.Calendar.DAY_OF_MONTH)
        )
        datePickerDialog.datePicker.minDate = System.currentTimeMillis() - 1000
        datePickerDialog.setOnCancelListener { showDatePicker = false }
        datePickerDialog.setOnDismissListener { showDatePicker = false }
        DisposableEffect(Unit) {
            datePickerDialog.show()
            onDispose {
                if (datePickerDialog.isShowing) {
                    datePickerDialog.dismiss()
                }
            }
        }
    }

    if (submitState is Resource.Success) {
        val appt = (submitState as Resource.Success<com.example.hoscore.core.network.Appointment>).data
        AppointmentTicketPassScreen(
            appointment = appt,
            hospitalFallbackName = hospitalName,
            onDone = { vm.clearSubmit(); onBooked() }
        )
        return
    }

    Column(Modifier.fillMaxSize().background(t.screenBg)) {
        HoscoreTopBar("Book Appointment", hospitalName, onBack = onBack)
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(20.dp)) {
            // Doctor selection
            Text("Choose a Doctor (optional)", fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 14.sp)
            Spacer(Modifier.height(10.dp))
            when (val d = detailState) {
                is Resource.Loading -> LinearProgressIndicator(Modifier.fillMaxWidth())
                is Resource.Error -> Text(d.message, color = t.clinical, fontSize = 12.sp)
                is Resource.Success -> {
                    val available = d.data.doctors.filter { (it.status ?: "").uppercase() !in setOf("OFF_DUTY", "ON LEAVE", "INACTIVE") }
                    if (available.isEmpty()) {
                        Text("No doctors listed — you can still request a general visit.", color = t.textMuted, fontSize = 12.sp)
                    } else {
                        available.forEach { doc ->
                            val sel = selectedDoctor?.id == doc.id
                            HoscoreCard(
                                Modifier.fillMaxWidth().padding(bottom = 8.dp),
                                onClick = { selectedDoctor = if (sel) null else doc },
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Column(Modifier.weight(1f)) {
                                        Text("Dr. ${doc.name}", fontWeight = FontWeight.Bold, color = t.textPrimary, fontSize = 14.sp)
                                        Text(doc.specialty ?: "General Physician", color = t.textMuted, fontSize = 12.sp)
                                    }
                                    if (sel) Icon(Icons.Rounded.CheckCircle, null, tint = t.primary, modifier = Modifier.size(22.dp))
                                }
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(18.dp))
            Text("Date", fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 14.sp)
            Spacer(Modifier.height(8.dp))
            Box(modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = date,
                    onValueChange = {},
                    readOnly = true,
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Select Date") },
                    trailingIcon = {
                        Icon(
                            Icons.Rounded.CalendarMonth,
                            contentDescription = "Select Date",
                            tint = t.primary
                        )
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = t.textPrimary,
                        unfocusedTextColor = t.textPrimary,
                        focusedBorderColor = t.primary,
                        unfocusedBorderColor = t.cardBorder,
                        focusedContainerColor = androidx.compose.ui.graphics.Color.Transparent,
                        unfocusedContainerColor = androidx.compose.ui.graphics.Color.Transparent
                    ),
                    shape = RoundedCornerShape(14.dp),
                )
                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .clip(RoundedCornerShape(14.dp))
                        .clickable { showDatePicker = true }
                )
            }

            Spacer(Modifier.height(18.dp))
            Text("Time Slot (30-min intervals)", fontWeight = FontWeight.Black, color = t.textPrimary, fontSize = 14.sp)
            Spacer(Modifier.height(8.dp))
            when (val s = slotsState) {
                is Resource.Loading -> LinearProgressIndicator(Modifier.fillMaxWidth())
                is Resource.Error -> Text(s.message, color = t.clinical, fontSize = 12.sp)
                is Resource.Success -> {
                    val resData: AvailableSlotsResponse = s.data
                    if (resData.isOpen == false) {
                        Text("Hospital is closed on this date.", color = t.clinical, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    } else if (resData.slots.isEmpty()) {
                        Text("No slots available.", color = t.textMuted, fontSize = 12.sp)
                    } else {
                        FlowTimeSlots(resData.slots, selectedTime) { selectedTime = it }
                    }
                }
            }

            if (submitState is Resource.Error) {
                Spacer(Modifier.height(12.dp))
                Text((submitState as Resource.Error).message, color = t.clinical, fontSize = 12.sp, fontWeight = FontWeight.Medium)
            }
        }

        val valid = date.isNotBlank() && selectedTime.isNotBlank()
        Button(
            onClick = { vm.book(selectedDoctor?.id, date, selectedTime) },
            enabled = valid && submitState !is Resource.Loading,
            modifier = Modifier.fillMaxWidth().padding(20.dp).height(52.dp),
        ) {
            if (submitState is Resource.Loading) {
                CircularProgressIndicator(Modifier.size(20.dp), color = androidx.compose.ui.graphics.Color.White, strokeWidth = 2.dp)
            } else {
                Text("Request Appointment", fontWeight = FontWeight.Black, fontSize = 15.sp)
            }
        }
    }
}

@Composable
private fun FlowTimeSlots(slots: List<TimeSlotDto>, selected: String, onSelect: (String) -> Unit) {
    val t = HoscoreTokens.current
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        for (row in slots.chunked(3)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                for (item in row) {
                    val slot = item.time
                    val isBooked = item.isBooked
                    val sel = slot == selected
                    val bgColor = when {
                        sel -> t.primary
                        isBooked -> t.card.copy(alpha = 0.4f)
                        else -> t.card
                    }
                    val textColor = when {
                        sel -> androidx.compose.ui.graphics.Color.White
                        isBooked -> t.textMuted
                        else -> t.textSecondary
                    }
                    Box(
                        Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .background(bgColor)
                            .border(1.dp, if (sel) t.primary else t.cardBorder, RoundedCornerShape(12.dp))
                            .clickable(enabled = !isBooked) { onSelect(slot) }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                slot,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = textColor,
                                style = if (isBooked) androidx.compose.ui.text.TextStyle(textDecoration = androidx.compose.ui.text.style.TextDecoration.LineThrough) else androidx.compose.ui.text.TextStyle.Default
                            )
                            if (isBooked) {
                                Text("Booked", fontSize = 9.sp, fontWeight = FontWeight.Black, color = t.clinical)
                            }
                        }
                    }
                }
                repeat(3 - row.size) { Spacer(Modifier.weight(1f)) }
            }
        }
    }
}

@Composable
fun AppointmentTicketPassScreen(
    appointment: com.example.hoscore.core.network.Appointment,
    hospitalFallbackName: String = "",
    onDone: () -> Unit,
) {
    val t = HoscoreTokens.current
    val sessionUser = ServiceLocator.sessionStore.user
    val patientName = appointment.patientName ?: sessionUser?.name ?: "Patient"
    val hospName = appointment.hospitalName?.ifBlank { hospitalFallbackName } ?: hospitalFallbackName.ifBlank { "Clinical Facility" }
    val sixId = appointment.sixDigitId ?: sessionUser?.id?.takeLast(6) ?: "882910"
    val tokenNum = appointment.tokenNumber ?: 1
    val timeSlot = appointment.time ?: "09:30 AM"
    val dateStr = appointment.date?.take(10) ?: "Today"
    val docName = appointment.doctorName ?: "General Consultation"

    Column(
        Modifier
            .fillMaxSize()
            .background(t.screenBg)
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
            Spacer(Modifier.height(20.dp))
            Icon(Icons.Rounded.CheckCircle, null, tint = t.emerald, modifier = Modifier.size(54.dp))
            Spacer(Modifier.height(8.dp))
            Text("Appointment Confirmed!", fontWeight = FontWeight.Black, fontSize = 22.sp, color = t.textPrimary)
            Text("HOSCORE Digital Health Pass", fontSize = 12.sp, color = t.textMuted, fontWeight = FontWeight.Medium)

            Spacer(Modifier.height(20.dp))

            // Modern Ticket Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
            ) {
                Column(Modifier.padding(20.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(hospName.uppercase(), fontSize = 11.sp, fontWeight = FontWeight.Black, color = t.primary)
                            Text(patientName, fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color.White)
                        }
                        Box(
                            Modifier.clip(CircleShape).background(t.primary.copy(alpha = 0.2f)).padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text("#$sixId", fontSize = 11.sp, fontWeight = FontWeight.Black, color = t.primary)
                        }
                    }

                    Spacer(Modifier.height(16.dp))
                    Box(Modifier.fillMaxWidth().height(1.dp).background(Color.White.copy(alpha = 0.1f)))
                    Spacer(Modifier.height(16.dp))

                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text("TOKEN NUMBER", fontSize = 9.sp, fontWeight = FontWeight.Black, color = t.primary, letterSpacing = 1.sp)
                            Text("#$tokenNum", fontSize = 46.sp, fontWeight = FontWeight.Black, color = Color.White)
                        }

                        // QR Code Box
                        Box(
                            Modifier
                                .size(100.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .background(Color.White)
                                .padding(8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
                                val sz = this.size
                                val step = sz.width / 7f
                                drawRect(color = Color.Black, topLeft = androidx.compose.ui.geometry.Offset(0f, 0f), size = androidx.compose.ui.geometry.Size(step * 2, step * 2))
                                drawRect(color = Color.White, topLeft = androidx.compose.ui.geometry.Offset(step * 0.4f, step * 0.4f), size = androidx.compose.ui.geometry.Size(step * 1.2f, step * 1.2f))
                                drawRect(color = Color.Black, topLeft = androidx.compose.ui.geometry.Offset(step * 0.7f, step * 0.7f), size = androidx.compose.ui.geometry.Size(step * 0.6f, step * 0.6f))
                                
                                drawRect(color = Color.Black, topLeft = androidx.compose.ui.geometry.Offset(sz.width - step * 2, 0f), size = androidx.compose.ui.geometry.Size(step * 2, step * 2))
                                drawRect(color = Color.White, topLeft = androidx.compose.ui.geometry.Offset(sz.width - step * 1.6f, step * 0.4f), size = androidx.compose.ui.geometry.Size(step * 1.2f, step * 1.2f))
                                drawRect(color = Color.Black, topLeft = androidx.compose.ui.geometry.Offset(sz.width - step * 1.3f, step * 0.7f), size = androidx.compose.ui.geometry.Size(step * 0.6f, step * 0.6f))

                                drawRect(color = Color.Black, topLeft = androidx.compose.ui.geometry.Offset(0f, sz.height - step * 2), size = androidx.compose.ui.geometry.Size(step * 2, step * 2))
                                drawRect(color = Color.White, topLeft = androidx.compose.ui.geometry.Offset(step * 0.4f, sz.height - step * 1.6f), size = androidx.compose.ui.geometry.Size(step * 1.2f, step * 1.2f))
                                drawRect(color = Color.Black, topLeft = androidx.compose.ui.geometry.Offset(step * 0.7f, sz.height - step * 1.3f), size = androidx.compose.ui.geometry.Size(step * 0.6f, step * 0.6f))

                                // Middle data points
                                drawRect(color = Color.Black, topLeft = androidx.compose.ui.geometry.Offset(step * 3f, step * 3f), size = androidx.compose.ui.geometry.Size(step, step))
                                drawRect(color = Color.Black, topLeft = androidx.compose.ui.geometry.Offset(step * 4.5f, step * 2f), size = androidx.compose.ui.geometry.Size(step, step))
                                drawRect(color = Color.Black, topLeft = androidx.compose.ui.geometry.Offset(step * 2f, step * 4.5f), size = androidx.compose.ui.geometry.Size(step, step))
                            }
                        }
                    }

                    Spacer(Modifier.height(16.dp))
                    Box(Modifier.fillMaxWidth().height(1.dp).background(Color.White.copy(alpha = 0.1f)))
                    Spacer(Modifier.height(16.dp))

                    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column(Modifier.weight(1f)) {
                                Text("TIME SLOT", fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
                                Text(timeSlot, fontSize = 14.sp, fontWeight = FontWeight.Black, color = Color.White)
                            }
                            Column(Modifier.weight(1f)) {
                                Text("DATE", fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
                                Text(dateStr, fontSize = 14.sp, fontWeight = FontWeight.Black, color = Color.White)
                            }
                        }
                        Box(Modifier.fillMaxWidth().height(1.dp).background(Color.White.copy(alpha = 0.08f)))
                        Column {
                            Text("ATTENDING DOCTOR", fontSize = 10.sp, color = Color.Gray, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
                            Text(docName, fontSize = 14.sp, fontWeight = FontWeight.Black, color = t.primary)
                        }
                    }
                }
            }

            Spacer(Modifier.height(16.dp))
            Card(
                colors = CardDefaults.cardColors(containerColor = t.emerald.copy(alpha = 0.1f)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.QrCode2, null, tint = t.emerald, modifier = Modifier.size(24.dp))
                    Spacer(Modifier.width(10.dp))
                    Text(
                        "Scan this QR code or present Token #$tokenNum at the hospital reception kiosk for instant check-in.",
                        fontSize = 11.sp, color = t.emerald, fontWeight = FontWeight.Medium, lineHeight = 15.sp
                    )
                }
            }
        }

        Button(
            onClick = onDone,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            colors = ButtonDefaults.buttonColors(containerColor = t.primary)
        ) {
            Text("Done & View Appointments", fontWeight = FontWeight.Black, fontSize = 15.sp)
        }
    }
}
