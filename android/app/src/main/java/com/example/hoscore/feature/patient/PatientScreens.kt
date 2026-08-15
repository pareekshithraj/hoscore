package com.example.hoscore.feature.patient

import com.example.hoscore.core.network.AccessGrant
import com.example.hoscore.core.network.Appointment
import com.example.hoscore.core.network.Bill
import com.example.hoscore.core.network.DoctorAccessRequest
import com.example.hoscore.core.network.Hospital
import com.example.hoscore.core.network.PatientRecords
import com.example.hoscore.core.network.Prescription
import com.example.hoscore.core.network.Vaccination
import com.example.hoscore.core.ui.ListViewModel

import com.example.hoscore.core.network.PatientVisit
import com.example.hoscore.core.network.apiCall
import com.example.hoscore.core.common.Resource
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class VisitVM : ViewModel() {
    private val _visit = MutableStateFlow<PatientVisit>(PatientVisit())
    val visit: StateFlow<PatientVisit> = _visit.asStateFlow()

    fun load() {
        viewModelScope.launch {
            when (val res = apiCall { getMyVisit() }) {
                is Resource.Success -> _visit.value = res.data
                else -> {}
            }
        }
    }

    init {
        load()
        viewModelScope.launch {
            while (true) {
                kotlinx.coroutines.delay(8000)
                load()
            }
        }
    }
}

class AppointmentsVM : ListViewModel<List<Appointment>>({ getMyAppointments() }) {
    fun reschedule(id: String, date: String, time: String) = mutate { rescheduleAppointment(id, com.example.hoscore.core.network.RescheduleRequest(date, time)) }
    fun cancel(id: String) = mutate { cancelAppointment(id) }
}
class PrescriptionsVM : ListViewModel<List<Prescription>>({ getMyPrescriptions() })
class BillsVM : ListViewModel<List<Bill>>({ getMyBills() })
class VaccinationsVM : ListViewModel<List<Vaccination>>({ getMyVaccinations() })
class FindHospitalsVM : ListViewModel<List<Hospital>>({ searchHospitals() })
class AccessGrantsVM : ListViewModel<List<AccessGrant>>({ getAccessGrants() }) {
    fun revoke(doctorId: String) = mutate { revokeDoctorAccess(DoctorAccessRequest(doctorId)) }
    fun restore(doctorId: String) = mutate { restoreDoctorAccess(DoctorAccessRequest(doctorId)) }
}
class PatientRecordsVM : ListViewModel<PatientRecords>({ getMyRecords() })
