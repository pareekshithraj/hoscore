package com.example.hoscore.feature.patient

import com.example.hoscore.core.network.Appointment
import com.example.hoscore.core.network.Bill
import com.example.hoscore.core.network.Hospital
import com.example.hoscore.core.network.Prescription
import com.example.hoscore.core.network.Vaccination
import com.example.hoscore.core.ui.ListViewModel

class AppointmentsVM : ListViewModel<List<Appointment>>({ getMyAppointments() })
class PrescriptionsVM : ListViewModel<List<Prescription>>({ getMyPrescriptions() })
class BillsVM : ListViewModel<List<Bill>>({ getMyBills() })
class VaccinationsVM : ListViewModel<List<Vaccination>>({ getMyVaccinations() })
class FindHospitalsVM : ListViewModel<List<Hospital>>({ searchHospitals() })
