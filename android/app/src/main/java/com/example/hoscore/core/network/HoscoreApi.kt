package com.example.hoscore.core.network

import com.example.hoscore.core.model.Session
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PATCH
import retrofit2.http.PUT
import retrofit2.http.DELETE
import retrofit2.http.Path
import retrofit2.http.Query

interface HoscoreApi {

    // ---------- Auth ----------
    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): Session

    @POST("auth/start-otp-login")
    suspend fun startOtpLogin(@Body body: OtpStartRequest): Session

    @POST("auth/verify-otp")
    suspend fun verifyOtp(@Body body: OtpVerifyRequest): Session

    @POST("auth/resend-otp")
    suspend fun resendOtp(@Body body: OtpResendRequest): Session

    @POST("auth/switch-context")
    suspend fun switchContext(@Body body: SwitchContextRequest): SwitchContextResponse

    // ---------- Hospital ----------
    @GET("stats")
    suspend fun getStats(): Stats

    @GET("queue")
    suspend fun getQueue(): List<QueueItem>

    @PATCH("queue/{id}/status")
    suspend fun updateQueueStatus(@Path("id") id: String, @Body body: Map<String, String>)

    @DELETE("queue/{id}")
    suspend fun deleteQueueItem(@Path("id") id: String)

    @GET("patients")
    suspend fun getPatients(): List<Patient>

    @GET("patients/{id}")
    suspend fun getPatient(@Path("id") id: String): Patient

    @GET("rooms")
    suspend fun getRooms(): List<Room>

    @GET("beds")
    suspend fun getBeds(): List<Bed>

    @PATCH("beds/{id}/status")
    suspend fun updateBedStatus(@Path("id") id: String, @Body body: Map<String, String>)

    @GET("admissions")
    suspend fun getAdmissions(): List<Admission>

    @PATCH("admissions/{id}/discharge")
    suspend fun dischargeAdmission(@Path("id") id: String)

    // ---------- Additional Hospital Feature Endpoints ----------
    @GET("prescriptions")
    suspend fun getPrescriptions(): List<Prescription>

    @PATCH("prescriptions/{id}/status")
    suspend fun updatePrescriptionStatus(@Path("id") id: String, @Body body: Map<String, String>)

    @GET("lab-orders")
    suspend fun getLabOrders(): List<LabOrder>

    @GET("vitals")
    suspend fun getVitals(): List<VitalRecord>

    @POST("vitals")
    suspend fun recordVitals(@Body body: Map<String, String>): VitalRecord

    @GET("billing")
    suspend fun getBillings(): List<Bill>

    @GET("doctors")
    suspend fun getDoctors(): List<Doctor>

    @GET("staff")
    suspend fun getStaff(): List<StaffMember>

    @GET("inventory")
    suspend fun getInventory(): List<InventoryItem>

    @PATCH("inventory/{id}/stock")
    suspend fun updateInventoryStock(@Path("id") id: String, @Body body: Map<String, Int>)

    @GET("expenses")
    suspend fun getExpenses(): List<Expense>

    @GET("insurance")
    suspend fun getInsuranceClaims(): List<InsuranceClaim>

    @GET("shifts")
    suspend fun getShifts(): List<ShiftRecord>

    @GET("notices")
    suspend fun getNotices(): List<NoticeItem>

    @GET("leaves")
    suspend fun getLeaves(): List<LeaveRequest>

    @GET("groups")
    suspend fun getGroups(): List<GroupItem>

    @GET("feedback")
    suspend fun getFeedback(): List<FeedbackItem>

    @GET("audit-logs")
    suspend fun getAuditLogs(): List<AuditLogItem>

    @GET("staff-types")
    suspend fun getStaffTypes(): List<StaffType>

    @GET("hospital/current")
    suspend fun getCurrentHospital(): Hospital

    // ---------- Patient portal ----------
    @GET("patient/appointments")
    suspend fun getMyAppointments(): List<Appointment>

    @PATCH("patient/appointments/{id}/cancel")
    suspend fun cancelAppointment(@Path("id") id: String)

    @GET("patient/prescriptions")
    suspend fun getMyPrescriptions(): List<Prescription>

    @GET("patient/bills")
    suspend fun getMyBills(): List<Bill>

    @GET("patient/vaccinations")
    suspend fun getMyVaccinations(): List<Vaccination>

    @GET("hospitals")
    suspend fun searchHospitals(@Query("q") query: String? = null): List<Hospital>

    // ---------- Super admin ----------
    @GET("super-admin/stats")
    suspend fun getSuperAdminStats(): SuperAdminStats

    @GET("super-admin/hospitals")
    suspend fun getAdminHospitals(): List<AdminHospital>

    @PATCH("super-admin/hospitals/{id}/toggle")
    suspend fun toggleHospital(@Path("id") id: String)

    @GET("super-admin/users")
    suspend fun getAdminUsers(): List<AdminUser>

    @PATCH("super-admin/users/{id}/toggle")
    suspend fun toggleUser(@Path("id") id: String)

    @GET("super-admin/subscriptions")
    suspend fun getSubscriptions(): List<Subscription>
}
