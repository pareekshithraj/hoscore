package com.example.hoscore.core.network

import kotlinx.serialization.Serializable

// DTOs modelled from the fields the React web client reads (client/src/pages)
// against the same endpoints. All fields are nullable / defaulted and the Json
// parser ignores unknown keys, so server additions never crash the app.

// ---------- Auth ----------
@Serializable
data class LoginRequest(val identifier: String, val password: String)

@Serializable
data class OtpStartRequest(val identifier: String)

@Serializable
data class OtpVerifyRequest(val challengeId: String, val channel: String, val code: String)

@Serializable
data class OtpResendRequest(val challengeId: String, val channel: String)

@Serializable
data class SwitchContextRequest(val contextType: String, val hospitalId: String? = null)

@Serializable
data class SwitchContextResponse(val token: String? = null)

// ---------- Hospital: stats / dashboard ----------
@Serializable
data class Stats(
    val totalPatients: Int = 0,
    val totalRooms: Int = 0,
    val totalBeds: Int = 0,
    val occupiedBeds: Int = 0,
    val occupancyRate: Int = 0,
    val icuOccupancyRate: Int? = null,
    val dischargesThisMonth: Int = 0,
    val telemetry: Telemetry = Telemetry(),
)

@Serializable
data class Telemetry(
    val activeQueue: Int = 0,
    val pendingLabs: Int = 0,
    val pendingRx: Int = 0,
    val todaysShifts: Int = 0,
    val pendingClaims: Int = 0,
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

// ---------- Hospital: patients ----------
@Serializable
data class Patient(
    val id: String = "",
    val name: String = "",
    val age: Int? = null,
    val gender: String? = null,
    val phone: String? = null,
    val sixDigitId: String? = null,
    val bloodGroup: String? = null,
    val isHoscoreUser: Boolean? = null,
    val medicalHistory: String? = null,
    val createdAt: String? = null,
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
    val name: String = "",
    val status: String = "AVAILABLE", // AVAILABLE | OCCUPIED | MAINTENANCE
    val roomId: String? = null,
)

// ---------- Hospital: admissions ----------
@Serializable
data class Admission(
    val id: String = "",
    val patientName: String = "",
    val bedName: String? = null,
    val roomName: String? = null,
    val doctorName: String? = null,
    val reason: String? = null,
    val status: String = "Admitted",
    val admittedAt: String? = null,
)

// ---------- Patient portal ----------
@Serializable
data class Appointment(
    val id: String = "",
    val doctorName: String? = null,
    val hospitalName: String? = null,
    val department: String? = null,
    val date: String? = null,
    val time: String? = null,
    val status: String? = null,
    val reason: String? = null,
)

@Serializable
data class Prescription(
    val id: String = "",
    val doctorName: String? = null,
    val patientName: String? = null,
    val medicines: String? = null,
    val notes: String? = null,
    val status: String? = null,
    val createdAt: String? = null,
)

@Serializable
data class Bill(
    val id: String = "",
    val description: String? = null,
    val amount: Double? = null,
    val status: String? = null,
    val hospitalName: String? = null,
    val createdAt: String? = null,
)

@Serializable
data class Vaccination(
    val id: String = "",
    val name: String = "",
    val date: String? = null,
    val provider: String? = null,
    val notes: String? = null,
)

@Serializable
data class Hospital(
    val id: String = "",
    val name: String = "",
    val city: String? = null,
    val state: String? = null,
    val address: String? = null,
    val phone: String? = null,
    val logoUrl: String? = null,
    val type: String? = null,
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
    val specialization: String? = null,
    val department: String? = null,
    val phone: String? = null,
    val email: String? = null,
)

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
    val name: String = "",
    val category: String? = null,
    val quantity: Int = 0,
    val unit: String? = null,
    val minThreshold: Int? = 10,
    val unitPrice: Double? = null,
)

@Serializable
data class Expense(
    val id: String = "",
    val category: String = "",
    val description: String = "",
    val amount: Double = 0.0,
    val date: String? = null,
)

@Serializable
data class InsuranceClaim(
    val id: String = "",
    val patientName: String = "",
    val provider: String = "",
    val claimAmount: Double = 0.0,
    val status: String = "PENDING", // PENDING | APPROVED | REJECTED
    val createdAt: String? = null,
)

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
    val content: String = "",
    val isPinned: Boolean = false,
    val createdAt: String? = null,
)

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
    val memberCount: Int = 0,
)

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
    val monthlyRevenue: Double? = null,
)

@Serializable
data class AdminHospital(
    val id: String = "",
    val name: String = "",
    val city: String? = null,
    val isActive: Boolean = true,
    val subscriptionStatus: String? = null,
    val createdAt: String? = null,
)

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
    val hospitalName: String? = null,
    val plan: String? = null,
    val status: String? = null,
    val expiresAt: String? = null,
)
