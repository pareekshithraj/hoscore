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
