package com.example.hoscore.core.network

import kotlinx.serialization.Serializable

// DTOs modelled from the fields the React web client reads (client/src/pages)
// against the same endpoints. All fields are nullable / defaulted and the Json
// parser ignores unknown keys, so server additions never crash the app.

// ---------- Auth ----------
@Serializable
data class LoginRequest(val identifier: String, val password: String)

@Serializable
data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String,
    val phone: String? = null,
)

@Serializable
data class OtpStartRequest(val identifier: String)

@Serializable
data class OtpVerifyRequest(val challengeId: String, val channel: String, val code: String)

@Serializable
data class OtpResendRequest(val challengeId: String, val channel: String)

@Serializable
data class ForgotPasswordRequest(val identifier: String)

@Serializable
data class ResetPasswordRequest(val resetToken: String, val password: String)

@Serializable
data class MessageResponse(val message: String? = null, val error: String? = null, val resetToken: String? = null)

@Serializable
data class SwitchContextRequest(
    val contextType: String,
    val hospitalId: String? = null,
    val password: String? = null,
)

@Serializable
data class SwitchContextResponse(
    val token: String? = null,
    val activeContext: com.example.hoscore.core.model.ContextItem? = null,
    val user: com.example.hoscore.core.model.User? = null,
    val contexts: List<com.example.hoscore.core.model.ContextItem> = emptyList(),
)

// ---------- Hospital: stats / dashboard ----------
@Serializable
data class Stats(
    val totalPatients: Int = 0,
    val totalRooms: Int = 0,
    val totalBeds: Int = 0,
    val occupiedBeds: Int = 0,
    val occupancyRate: Int = 0,
    val icuOccupancyRate: Int? = null,
    val erOccupancyRate: Int? = null,
    val dischargesThisMonth: Int = 0,
    val avgTriageTime: Double? = null,
    val weeklyData: List<WeeklyPoint> = emptyList(),
    val departmentData: List<DeptPoint> = emptyList(),
    val telemetry: Telemetry = Telemetry(),
)

@Serializable
data class WeeklyPoint(
    val name: String = "",
    val admissions: Int = 0,
    val discharges: Int = 0,
    val revenue: Double = 0.0,
)

@Serializable
data class DeptPoint(
    val name: String = "",
    val value: Int = 0,
    val color: String? = null,
)

@Serializable
data class Telemetry(
    val activeQueue: Int = 0,
    val pendingLabs: Int = 0,
    val pendingRx: Int = 0,
    val todaysShifts: Int = 0,
    val pendingClaims: Int = 0,
)

@Serializable
data class Analytics(
    val occupancyData: List<NamedValue> = emptyList(),
    val admissionsMonthly: List<NamedValue> = emptyList(),
    val revenueData: List<NamedValue> = emptyList(),
    val stayDurationData: List<NamedValue> = emptyList(),
    val departmentRevenue: List<NamedValue> = emptyList(),
    val kpis: AnalyticsKpis? = null,
)

@Serializable
data class NamedValue(val name: String = "", val value: Double = 0.0)

@Serializable
data class AnalyticsKpis(
    val totalRevenue: Double? = null,
    val avgStayDays: Double? = null,
    val occupancyRate: Double? = null,
    val admissionsThisMonth: Int? = null,
)

// ---------- Hospital: OPD queue ----------
@Serializable
data class QueueItem(
    val id: String = "",
    val tokenNumber: Int? = null,
    val patientName: String = "",
    val patientId: String? = null,
    val doctorName: String? = null,
    val department: String? = null,
    val status: String = "WAITING", // WAITING | IN_CONSULTATION | COMPLETED
    val createdAt: String? = null,
)

// Lightweight nested reference — the server returns related records (doctor,
// hospital, patient, room) as objects via Prisma `include`. We only model the
// fields the app actually reads; unknown keys are ignored by the parser.
@Serializable
data class NamedRef(
    val id: String = "",
    val name: String? = null,
    val specialty: String? = null,
    val bedNumber: String? = null,
    val sixDigitId: String? = null,
    val room: NamedRef? = null,
)

// ---------- Hospital: patients ----------
@Serializable
data class Patient(
    val id: String = "",
    val name: String = "",
    val gender: String? = null,
    // Server fields (schema.prisma Patient): `contact` + `dateOfBirth`, not phone/age.
    val contact: String? = null,
    val dateOfBirth: String? = null,
    val sixDigitId: String? = null,
    val bloodGroup: String? = null,
    val isHoscoreUser: Boolean? = null,
    val medicalHistory: String? = null,
    val createdAt: String? = null,
) {
    /** Contact phone — server stores it as `contact`. */
    val phone: String? get() = contact

    /** Approximate age in years derived from `dateOfBirth`. */
    val age: Int? get() = dateOfBirth?.takeIf { it.length >= 4 }?.let {
        runCatching {
            val birthYear = it.take(4).toInt()
            java.util.Calendar.getInstance().get(java.util.Calendar.YEAR) - birthYear
        }.getOrNull()?.takeIf { yrs -> yrs in 0..150 }
    }
}

@Serializable
data class PatientRecordChart(
    val id: String = "",
    val name: String = "",
    val gender: String? = null,
    val contact: String? = null,
    val dateOfBirth: String? = null,
    val sixDigitId: String? = null,
    val bloodGroup: String? = null,
    val isHoscoreUser: Boolean? = null,
    val medicalHistory: String? = null,
    val vitals: List<VitalRecord> = emptyList(),
    val labOrders: List<LabOrder> = emptyList(),
    val vaccinations: List<Vaccination> = emptyList(),
    val prescriptions: List<Prescription> = emptyList(),
    val admissions: List<Admission> = emptyList(),
    val appointments: List<Appointment> = emptyList(),
)

// ---------- Hospital: rooms / beds ----------
@Serializable
data class Room(
    val id: String = "",
    val name: String = "",
    val type: String? = null,
    val floor: String? = null,
    val beds: List<Bed> = emptyList(),
)

@Serializable
data class Bed(
    val id: String = "",
    // Server field is `bedNumber` (schema.prisma Bed), not `name`.
    val bedNumber: String = "",
    val status: String = "AVAILABLE", // AVAILABLE | OCCUPIED | MAINTENANCE
    val roomId: String? = null,
) {
    /** Display label — server calls this `bedNumber`. */
    val name: String get() = bedNumber
}

// ---------- Hospital: admissions ----------
// Server returns the raw Admission with `include: { patient, bed: { room }, billing }`
// and uses `admissionDate` + status "Active"/"Discharged". We model that shape and
// expose the flat names the screens read.
@Serializable
data class Admission(
    val id: String = "",
    val reason: String? = null,
    val status: String = "Active",
    val admissionDate: String? = null,
    val patient: NamedRef? = null,
    val bed: NamedRef? = null,
) {
    val patientName: String get() = patient?.name ?: "Patient"
    val bedName: String? get() = bed?.bedNumber
    val roomName: String? get() = bed?.room?.name
    val doctorName: String? get() = null // not included in the admissions payload
    val admittedAt: String? get() = admissionDate
}

@Serializable
data class DischargeSummary(
    val id: String = "",
    val patientName: String = "",
    val doctorName: String? = null,
    val diagnosis: String? = null,
    val medications: String? = null,
    val status: String = "SIGNED",
    val dischargeDate: String? = null,
    val createdAt: String? = null,
)

// ---------- Patient portal ----------
// Server includes `hospital: { name }` and `doctor: { name, specialty }`.
@Serializable
data class Appointment(
    val id: String = "",
    val tokenNumber: Int? = null,
    val department: String? = null,
    val date: String? = null,
    val time: String? = null,
    val status: String? = null,
    val reason: String? = null,
    val doctor: NamedRef? = null,
    val hospital: NamedRef? = null,
    val patient: NamedRef? = null,
) {
    val doctorName: String? get() = doctor?.name
    val hospitalName: String? get() = hospital?.name
    val patientName: String? get() = patient?.name
    val sixDigitId: String? get() = patient?.sixDigitId
}

// `medicines`, `status`, `date` are flat columns; doctor/hospital are nested.
@Serializable
data class Prescription(
    val id: String = "",
    val medicines: String? = null,
    val diagnosis: String? = null,
    val instructions: String? = null,
    val status: String? = null,
    val date: String? = null,
    val createdAt: String? = null,
    val doctor: NamedRef? = null,
    val patient: NamedRef? = null,
) {
    val doctorName: String? get() = doctor?.name
    val patientName: String? get() = patient?.name
    val notes: String? get() = instructions
}

// Patient bills = spread `billing` + `hospitalName`. Billing uses `totalAmount`.
@Serializable
data class Bill(
    val id: String = "",
    val totalAmount: Double? = null,
    val status: String? = null,
    val hospitalName: String? = null,
    val createdAt: String? = null,
) {
    val amount: Double? get() = totalAmount
    val description: String? get() = null
}

@Serializable
data class Vaccination(
    val id: String = "",
    val name: String = "",
    val scheduledAge: String? = null,
    val status: String? = null,
    // Server fields: `givenAt` (date administered) + `givenBy` (clinic/doctor).
    val givenAt: String? = null,
    val givenBy: String? = null,
    val notes: String? = null,
) {
    val date: String? get() = givenAt
    val provider: String? get() = givenBy
}

@Serializable
data class Hospital(
    val id: String = "",
    val name: String = "",
    val city: String? = null,
    val state: String? = null,
    val address: String? = null,
    // Server fields: `contact` (phone), `logo` (signed URL), `rating`.
    val contact: String? = null,
    val logo: String? = null,
    val description: String? = null,
    val rating: Double? = null,
    val type: String? = null,
) {
    val phone: String? get() = contact
    val logoUrl: String? get() = logo
}

// GET /hospitals/:id — includes the hospital's doctors for the booking screen.
@Serializable
data class HospitalDetail(
    val id: String = "",
    val name: String = "",
    val city: String? = null,
    val state: String? = null,
    val address: String? = null,
    val contact: String? = null,
    val description: String? = null,
    val rating: Double? = null,
    val doctors: List<Doctor> = emptyList(),
)

// POST /patient/appointments
@Serializable
data class BookAppointmentRequest(
    val hospitalId: String,
    val date: String,      // ISO date, e.g. 2026-07-28
    val time: String,      // e.g. "09:00 AM"
    val doctorId: String? = null,
    val patientId: String? = null,
)

@Serializable
data class TimeSlotDto(
    val time: String,
    val isBooked: Boolean = false
)

@Serializable
data class AvailableSlotsResponse(
    val isOpen: Boolean = true,
    val openTime: String = "08:00 AM",
    val closeTime: String = "08:00 PM",
    val slots: List<TimeSlotDto> = emptyList()
)

@Serializable
data class RescheduleRequest(val date: String, val time: String)

@Serializable
data class PatientDashboard(
    val upcoming: List<Appointment> = emptyList(),
    val recentRx: List<Prescription> = emptyList(),
    val profile: Patient? = null,
)

@Serializable
data class PatientRecords(
    val vitals: List<VitalRecord> = emptyList(),
    val labs: List<LabOrder> = emptyList(),
    val admissions: List<Admission> = emptyList(),
)

@Serializable
data class CreateDependentRequest(
    val name: String,
    val contact: String? = null,
    val email: String? = null,
    val dateOfBirth: String? = null,
    val gender: String? = null,
    val bloodGroup: String? = null,
)

@Serializable
data class RecordVaccinationRequest(
    val id: String,
    val status: String = "COMPLETED",
    val givenAt: String? = null,
    val givenBy: String? = null,
    val notes: String? = null,
)

// ---------- Hospital create / mutate requests ----------
@Serializable
data class CreatePatientRequest(
    val name: String,
    val contact: String? = null,
    val email: String? = null,
    val dateOfBirth: String? = null,
    val gender: String? = null,
    val medicalHistory: String? = null,
    val isHoscoreUser: Boolean? = false,
)

@Serializable
data class CreateAdmissionRequest(
    val patientId: String? = null,
    val patientName: String? = null,
    val bedId: String,
    val reason: String? = null,
)

@Serializable
data class CreateQueueRequest(
    val patientName: String,
    val patientId: String? = null,
    val doctorName: String? = null,
    val doctorId: String? = null,
    val department: String? = "General",
    val estimatedWait: Int? = 15,
    val notes: String? = null,
    val isHoscoreUser: Boolean? = false,
    val contact: String? = null,
)

@Serializable
data class CreatePrescriptionRequest(
    val patientId: String? = null,
    val patientName: String? = null,
    val doctorId: String? = null,
    val doctorName: String? = null,
    val diagnosis: String? = null,
    val instructions: String? = null,
    val medicines: String? = null,
    val status: String? = "ISSUED",
)

@Serializable
data class CreateLabOrderRequest(
    val patientId: String? = null,
    val patientName: String,
    val testName: String,
    val category: String? = null,
    val doctorName: String? = null,
    val priority: String? = null,
    val notes: String? = null,
)

@Serializable
data class CreateBillingRequest(
    val admissionId: String? = null,
    val patientName: String? = null,
    val roomCharges: Double = 0.0,
    val doctorFees: Double = 0.0,
    val pharmacyFees: Double = 0.0,
    val labFees: Double = 0.0,
)

@Serializable
data class CreateDoctorRequest(
    val name: String,
    val specialty: String? = null,
    val contact: String? = null,
    val email: String? = null,
)

@Serializable
data class CreateStaffRequest(
    val name: String,
    val role: String,
    val contact: String? = null,
    val email: String? = null,
)

@Serializable
data class CreateInventoryRequest(
    val itemName: String,
    val type: String? = null,
    val stock: Int = 0,
    val reorderLevel: Int? = 10,
    val supplier: String? = null,
    val price: Double? = null,
)

@Serializable
data class CreateExpenseRequest(
    val title: String,
    val category: String,
    val amount: Double,
    val vendor: String? = null,
    val notes: String? = null,
)

@Serializable
data class CreateClaimRequest(
    val patientName: String,
    val insuranceCompany: String,
    val claimAmount: Double,
    val patientId: String? = null,
    val policyNumber: String? = null,
    val diagnosis: String? = null,
)

@Serializable
data class CreateNoticeRequest(
    val title: String,
    val body: String,
    val priority: String? = null,
    val isPinned: Boolean = false,
)

@Serializable
data class CreateLeaveRequest(
    val staffName: String,
    val reason: String,
    val startDate: String,
    val endDate: String,
    val type: String? = null,
    val role: String? = null,
)

@Serializable
data class CreateShiftRequest(
    val staffName: String,
    val date: String,
    val startTime: String? = null,
    val endTime: String? = null,
    val department: String? = null,
    val role: String? = null,
    val notes: String? = null,
)

@Serializable
data class CreateGroupRequest(
    val name: String,
    val description: String? = null,
    val color: String? = null,
)

@Serializable
data class CreateRoomRequest(
    val name: String,
    val type: String? = null,
    val capacity: Int? = 1,
)

@Serializable
data class CreateBedRequest(
    val roomId: String,
    val bedNumber: String,
    val pricePerDay: Double? = null,
)

@Serializable
data class CreateHospitalAppointmentRequest(
    val patientName: String,
    val date: String,
    val time: String,
    val doctorId: String? = null,
    val contact: String? = null,
    val email: String? = null,
    val sixDigitId: String? = null,
)

@Serializable
data class HospitalProfileUpdate(
    val name: String? = null,
    val address: String? = null,
    val city: String? = null,
    val state: String? = null,
    val contact: String? = null,
    val email: String? = null,
    val description: String? = null,
)

@Serializable
data class SubscriptionStatus(
    val plan: String? = null,
    val status: String? = null,
    val endDate: String? = null,
    val maxUsers: Int? = null,
    val pricePerUser: Double? = null,
)

@Serializable
data class PaymentPlan(
    val id: String = "",
    val name: String = "",
    val price: Double = 0.0,
    val maxUsers: Int? = null,
    val features: List<String> = emptyList(),
)

@Serializable
data class CreateStaffTypeRequest(
    val name: String,
    val role: String? = null,
    val description: String? = null,
    val permissions: List<String> = emptyList(),
)

@Serializable
data class PlatformUsage(
    val totalApiCalls: Long? = null,
    val totalStorageMb: Double? = null,
    val activeHospitals: Int? = null,
    val billableUsers: Int? = null,
    val estimatedCost: Double? = null,
)

@Serializable
data class DeploymentReadiness(
    val ready: Boolean = false,
    val checks: List<DeploymentCheck> = emptyList(),
    val summary: String? = null,
)

@Serializable
data class DeploymentCheck(
    val name: String = "",
    val status: String = "",
    val detail: String? = null,
)

@Serializable
data class AccessLogItem(
    val id: String = "",
    val doctorName: String? = null,
    val action: String? = null,
    val createdAt: String? = null,
    val details: String? = null,
)

// ---------- Additional Hospital Feature DTOs ----------

@Serializable
data class VitalRecord(
    val id: String = "",
    val patientName: String = "",
    val bloodPressure: String? = null,
    val heartRate: Int? = null,
    val temperature: Double? = null,
    val oxygenSaturation: Int? = null,
    val recordedAt: String? = null,
)

// Request body for POST /vitals. Numeric fields must serialize as JSON numbers
// (not strings) or Prisma rejects them against the Int/Float columns.
@Serializable
data class RecordVitalsRequest(
    val patientId: String? = null,
    val patientName: String,
    val bloodPressure: String? = null,
    val heartRate: Int? = null,
    val temperature: Double? = null,
    val oxygenSaturation: Int? = null,
    val respiratoryRate: Int? = null,
    val notes: String? = null,
)

@Serializable
data class LabOrder(
    val id: String = "",
    val patientName: String = "",
    val testName: String = "",
    val category: String? = null,
    val doctorName: String? = null,
    val status: String = "PENDING", // PENDING | PROCESSING | COMPLETED
    val resultUrl: String? = null,
    val createdAt: String? = null,
)

@Serializable
data class Doctor(
    val id: String = "",
    val name: String = "",
    // Server fields (schema.prisma Doctor): `specialty` + `contact`.
    val specialty: String? = null,
    val contact: String? = null,
    val email: String? = null,
    val status: String? = null,
) {
    val specialization: String? get() = specialty
    val department: String? get() = specialty
    val phone: String? get() = contact
}

@Serializable
data class StaffMember(
    val id: String = "",
    val name: String = "",
    val role: String = "",
    val department: String? = null,
    val phone: String? = null,
    val email: String? = null,
    val staffTypeName: String? = null,
)

@Serializable
data class InventoryItem(
    val id: String = "",
    // Server fields (schema.prisma Inventory): itemName/type/stock/reorderLevel/price.
    val itemName: String = "",
    val type: String? = null,
    val stock: Int = 0,
    val unit: String? = null,
    val reorderLevel: Int? = 10,
    val price: Double? = null,
) {
    val name: String get() = itemName
    val category: String? get() = type
    val quantity: Int get() = stock
    val minThreshold: Int? get() = reorderLevel
    val unitPrice: Double? get() = price
}

@Serializable
data class Expense(
    val id: String = "",
    val title: String = "",
    val category: String = "",
    val amount: Double = 0.0,
    val vendor: String? = null,
    val paidDate: String? = null,
) {
    // Server has no `description`; use the expense title / vendor as the subtitle.
    val description: String get() = listOfNotNull(title.ifBlank { null }, vendor).joinToString(" · ")
    val date: String? get() = paidDate
}

@Serializable
data class InsuranceClaim(
    val id: String = "",
    val patientName: String = "",
    // Server field is `insuranceCompany`, not `provider`.
    val insuranceCompany: String = "",
    val claimAmount: Double = 0.0,
    val status: String = "SUBMITTED",
    val createdAt: String? = null,
) {
    val provider: String get() = insuranceCompany
}

@Serializable
data class ShiftRecord(
    val id: String = "",
    val staffName: String = "",
    val shiftType: String = "", // Morning | Evening | Night
    val date: String = "",
    val department: String? = null,
)

@Serializable
data class NoticeItem(
    val id: String = "",
    val title: String = "",
    // Server field is `body`, not `content`.
    val body: String = "",
    val priority: String? = null,
    val isPinned: Boolean = false,
    val createdAt: String? = null,
) {
    val content: String get() = body
}

@Serializable
data class LeaveRequest(
    val id: String = "",
    val staffName: String = "",
    val reason: String = "",
    val startDate: String = "",
    val endDate: String = "",
    val status: String = "PENDING", // PENDING | APPROVED | REJECTED
)

@Serializable
data class GroupItem(
    val id: String = "",
    val name: String = "",
    val description: String? = null,
    val color: String? = null,
    // Server includes the full `members` array.
    val members: List<NamedRef> = emptyList(),
) {
    val memberCount: Int get() = members.size
}

@Serializable
data class FeedbackItem(
    val id: String = "",
    val patientName: String? = null,
    val rating: Int = 5,
    val comment: String? = null,
    val createdAt: String? = null,
)

@Serializable
data class AuditLogItem(
    val id: String = "",
    val action: String = "",
    val entity: String = "",
    val details: String? = null,
    val userName: String? = null,
    val createdAt: String? = null,
)

@Serializable
data class StaffType(
    val id: String = "",
    val name: String = "",
    val description: String? = null,
    val permissions: List<String> = emptyList(),
)

// ---------- Super admin ----------
@Serializable
data class SuperAdminStats(
    val totalHospitals: Int = 0,
    val totalUsers: Int = 0,
    val totalPatients: Int = 0,
    val activeSubscriptions: Int = 0,
    // Server field is `totalRevenue`.
    val totalRevenue: Double? = null,
) {
    val monthlyRevenue: Double? get() = totalRevenue
}

@Serializable
data class AdminHospital(
    val id: String = "",
    val name: String = "",
    val city: String? = null,
    val isActive: Boolean = true,
    // Server includes latest subscription as `subscriptions: [{ status }]`.
    val subscriptions: List<Subscription> = emptyList(),
    val createdAt: String? = null,
) {
    val subscriptionStatus: String? get() = subscriptions.firstOrNull()?.status
}

@Serializable
data class AdminUser(
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val phone: String? = null,
    val isActive: Boolean = true,
    val isSuperAdmin: Boolean = false,
    val createdAt: String? = null,
)

@Serializable
data class Subscription(
    val id: String = "",
    val plan: String? = null,
    val status: String? = null,
    // Server field is `endDate`; hospital name is nested via `hospital: { name }`.
    val endDate: String? = null,
    val hospital: NamedRef? = null,
) {
    val hospitalName: String? get() = hospital?.name
    val expiresAt: String? get() = endDate
}

// ---------- Hospital map / wayfinding ----------
// Mirrors client/src/utils/mapModel.ts so web and app render the same doc.

@Serializable
data class MapCell(val r: Int = 0, val c: Int = 0)

@Serializable
data class MapAnchor(
    val id: String = "",
    val kind: String = "poi", // room | bed | entrance | poi
    val cell: MapCell = MapCell(),
    val label: String = "",
    val roomId: String? = null,
    val bedId: String? = null,
    val zone: String? = null,
)

@Serializable
data class MapFloor(
    val id: String = "",
    val label: String = "",
    val index: Int = 0,
    val cells: List<List<String>> = emptyList(), // AreaType per cell (rows x cols)
    val anchors: List<MapAnchor> = emptyList(),
)

@Serializable
data class HospitalMap(
    val id: String? = null,
    val hospitalId: String? = null,
    val name: String = "Main Building",
    val cols: Int = 20,
    val rows: Int = 14,
    val floors: List<MapFloor> = emptyList(),
    val isPublished: Boolean = false,
    val version: Int? = null,
)

@Serializable
data class LivePosition(
    val id: String = "",
    val subjectType: String = "PATIENT",
    val subjectId: String = "",
    val label: String? = null,
    val floorId: String = "",
    val cellR: Int = 0,
    val cellC: Int = 0,
    val note: String? = null,
    val status: String = "ACTIVE",
)

// Response of GET /patient/location
@Serializable
data class MyLocation(
    val admitted: Boolean = false,
    val hospital: Hospital? = null,
    val room: Room? = null,
    val bed: Bed? = null,
    val map: HospitalMap? = null,
    val position: LivePosition? = null,
)

// ---------- Patient privacy / data-access grants ----------
// GET /patient/access-grants returns one row per doctor with the grant status.
@Serializable
data class AccessGrant(
    val id: String = "",        // doctorId
    val name: String = "",
    val specialty: String? = null,
    val hospitalName: String? = null,
    val status: String = "ACTIVE", // ACTIVE | REVOKED
)

@Serializable
data class DoctorAccessRequest(val doctorId: String)

@Serializable
data class ShareLocationRequest(val expiresHours: Int = 24, val patientId: String? = null)

@Serializable
data class ShareLocationResponse(val shareToken: String? = null, val expiresAt: String? = null)
