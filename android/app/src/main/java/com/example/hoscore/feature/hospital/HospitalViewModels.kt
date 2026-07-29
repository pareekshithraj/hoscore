package com.example.hoscore.feature.hospital

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import com.example.hoscore.core.common.Resource
import com.example.hoscore.core.network.Admission
import com.example.hoscore.core.network.Analytics
import com.example.hoscore.core.network.Appointment
import com.example.hoscore.core.network.CreateAdmissionRequest
import com.example.hoscore.core.network.CreatePatientRequest
import com.example.hoscore.core.network.CreateQueueRequest
import com.example.hoscore.core.network.Hospital
import com.example.hoscore.core.network.HospitalProfileUpdate
import com.example.hoscore.core.network.HoscoreSocket
import com.example.hoscore.core.network.Patient
import com.example.hoscore.core.network.QueueItem
import com.example.hoscore.core.network.Room
import com.example.hoscore.core.network.Stats
import com.example.hoscore.core.network.SubscriptionStatus
import com.example.hoscore.core.network.apiCall
import com.example.hoscore.core.ui.ListViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class PatientsVM : ListViewModel<List<Patient>>({ getPatients() }) {
    fun create(name: String, contact: String?, gender: String?, history: String?) = mutate {
        createPatient(
            CreatePatientRequest(
                name = name,
                contact = contact?.ifBlank { null },
                gender = gender?.ifBlank { null },
                medicalHistory = history?.ifBlank { null },
            )
        )
    }
}

class RoomsVM : ListViewModel<List<Room>>({ getRooms() }) {
    fun setBedStatus(bedId: String, status: String) = mutate {
        updateBedStatus(bedId, mapOf("status" to status))
    }
}

/** Dashboard stats + live socket refresh. */
class HospitalDashboardVM : ViewModel() {
    private val _state = MutableStateFlow<Resource<Stats>>(Resource.Loading)
    val state: StateFlow<Resource<Stats>> = _state.asStateFlow()

    private val _analytics = MutableStateFlow<Resource<Analytics>>(Resource.Loading)
    val analytics: StateFlow<Resource<Analytics>> = _analytics.asStateFlow()

    private var started = false

    fun start() {
        if (started) return
        started = true
        refresh()
        viewModelScope.launch {
            HoscoreSocket.events.collect { refresh() }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            _state.value = apiCall { getStats() }
            _analytics.value = apiCall { getAnalytics() }
        }
    }
}

/** OPD queue with live refresh + status mutations. */
class QueueVM : ViewModel() {
    private val _state = MutableStateFlow<Resource<List<QueueItem>>>(Resource.Loading)
    val state: StateFlow<Resource<List<QueueItem>>> = _state.asStateFlow()

    private val _pendingState = MutableStateFlow<Resource<List<Appointment>>>(Resource.Loading)
    val pendingState: StateFlow<Resource<List<Appointment>>> = _pendingState.asStateFlow()

    private var started = false

    var selectedDate by androidx.compose.runtime.mutableStateOf(java.time.LocalDate.now().toString())

    fun setDate(date: String) {
        selectedDate = date
        refresh()
    }

    fun start() {
        if (started) return
        started = true
        refresh()
        viewModelScope.launch { HoscoreSocket.events.collect { refresh() } }
    }

    fun refresh() {
        viewModelScope.launch { _state.value = apiCall { getQueue(selectedDate) } }
        viewModelScope.launch { _pendingState.value = apiCall { getPendingAppointments(selectedDate) } }
    }

    fun advance(item: QueueItem) {
        val next = when (item.status.uppercase()) {
            "WAITING" -> "IN_CONSULTATION"
            "IN_CONSULTATION" -> "COMPLETED"
            else -> return
        }
        viewModelScope.launch {
            apiCall { updateQueueStatus(item.id, mapOf("status" to next)) }
            refresh()
        }
    }

    fun checkIn(appointment: Appointment) {
        viewModelScope.launch {
            apiCall {
                createQueueItem(
                    CreateQueueRequest(
                        patientId = appointment.patient?.id,
                        patientName = appointment.patientName ?: "Unknown",
                        department = appointment.department,
                        doctorId = appointment.doctor?.id,
                        doctorName = appointment.doctorName
                    )
                )
            }
            refresh()
        }
    }

    fun add(patientName: String, department: String?, doctorName: String?) {
        viewModelScope.launch {
            apiCall {
                createQueueItem(
                    CreateQueueRequest(
                        patientName = patientName,
                        department = department?.ifBlank { "General" } ?: "General",
                        doctorName = doctorName?.ifBlank { null },
                    )
                )
            }
            refresh()
        }
    }

    fun remove(id: String) {
        viewModelScope.launch {
            apiCall { deleteQueueItem(id) }
            refresh()
        }
    }
}

class AdmissionsVM : ListViewModel<List<Admission>>({ getAdmissions() }) {
    fun discharge(id: String) = mutate { dischargeAdmission(id) }

    fun admit(patientName: String, bedId: String, reason: String?) = mutate {
        createAdmission(
            CreateAdmissionRequest(
                patientName = patientName,
                bedId = bedId,
                reason = reason?.ifBlank { null },
            )
        )
    }
}

class CalendarVM : ListViewModel<List<Appointment>>({ getHospitalAppointments() }) {
    fun checkIn(id: String) = mutate { checkInAppointment(id) }
    fun remove(id: String) = mutate { deleteHospitalAppointment(id) }
}

class HospitalSettingsVM : ViewModel() {
    private val _hospital = MutableStateFlow<Resource<Hospital>>(Resource.Loading)
    val hospital: StateFlow<Resource<Hospital>> = _hospital.asStateFlow()

    private val _subscription = MutableStateFlow<Resource<SubscriptionStatus>>(Resource.Loading)
    val subscription: StateFlow<Resource<SubscriptionStatus>> = _subscription.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _hospital.value = apiCall { getCurrentHospital() }
            _subscription.value = apiCall { getSubscriptionStatus() }
        }
    }

    fun save(update: HospitalProfileUpdate, onDone: (Boolean) -> Unit = {}) {
        viewModelScope.launch {
            val res = apiCall { updateHospital(update) }
            onDone(res is Resource.Success)
            if (res is Resource.Success) _hospital.value = res
        }
    }
}
