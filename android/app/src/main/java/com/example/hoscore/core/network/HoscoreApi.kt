package com.example.hoscore.core.network

import com.example.hoscore.core.model.Session
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface HoscoreApi {

    // ---------- Auth ----------
    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): Session

    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): Session

    @POST("auth/start-otp-login")
    suspend fun startOtpLogin(@Body body: OtpStartRequest): Session

    @POST("auth/verify-otp")
    suspend fun verifyOtp(@Body body: OtpVerifyRequest): Session

    @POST("auth/resend-otp")
    suspend fun resendOtp(@Body body: OtpResendRequest): Session

    @POST("auth/forgot-password")
    suspend fun forgotPassword(@Body body: ForgotPasswordRequest): MessageResponse

    @POST("auth/reset-password")
    suspend fun resetPassword(@Body body: ResetPasswordRequest): MessageResponse

    @POST("auth/switch-context")
    suspend fun switchContext(@Body body: SwitchContextRequest): SwitchContextResponse

    // ---------- Hospital core ----------
    @GET("stats")
    suspend fun getStats(): Stats

    @GET("analytics")
    suspend fun getAnalytics(): Analytics

    @GET("queue")
    suspend fun getQueue(@Query("date") date: String? = null): List<QueueItem>

    @GET("queue/pending-appointments")
    suspend fun getPendingAppointments(@Query("date") date: String? = null): List<Appointment>

    @POST("queue")
    suspend fun createQueueItem(@Body body: CreateQueueRequest): QueueItem

    @PATCH("queue/{id}/status")
    suspend fun updateQueueStatus(@Path("id") id: String, @Body body: Map<String, String>)

    @DELETE("queue/{id}")
    suspend fun deleteQueueItem(@Path("id") id: String)

    @GET("patients")
    suspend fun getPatients(): List<Patient>

    @GET("patients/{id}")
    suspend fun getPatient(@Path("id") id: String): Patient

    @GET("patients/search/{sixDigitId}")
    suspend fun getPatientBySixDigitId(@Path("sixDigitId") sixDigitId: String): PatientRecordChart

    @POST("patients")
    suspend fun createPatient(@Body body: CreatePatientRequest): Patient

    @GET("rooms")
    suspend fun getRooms(): List<Room>

    @POST("rooms")
    suspend fun createRoom(@Body body: CreateRoomRequest): Room

    @GET("beds")
    suspend fun getBeds(): List<Bed>

    @POST("beds")
    suspend fun createBed(@Body body: CreateBedRequest): Bed

    @PATCH("beds/{id}/status")
    suspend fun updateBedStatus(@Path("id") id: String, @Body body: Map<String, String>)

    @GET("admissions")
    suspend fun getAdmissions(): List<Admission>

    @POST("admissions")
    suspend fun createAdmission(@Body body: CreateAdmissionRequest): Admission

    @PATCH("admissions/{id}/discharge")
    suspend fun dischargeAdmission(@Path("id") id: String)

    @GET("discharges")
    suspend fun getDischarges(): List<DischargeSummary>

    // ---------- Hospital appointments / calendar ----------
    @GET("appointments")
    suspend fun getHospitalAppointments(): List<Appointment>

    @POST("appointments")
    suspend fun createHospitalAppointment(@Body body: CreateHospitalAppointmentRequest): Appointment

    @PATCH("appointments/{id}/checkin")
    suspend fun checkInAppointment(@Path("id") id: String)

    @DELETE("appointments/{id}")
    suspend fun deleteHospitalAppointment(@Path("id") id: String)

    // ---------- Clinical modules ----------
    @GET("prescriptions")
    suspend fun getPrescriptions(): List<Prescription>

    @POST("prescriptions")
    suspend fun createPrescription(@Body body: CreatePrescriptionRequest): Prescription

    @PATCH("prescriptions/{id}/status")
    suspend fun updatePrescriptionStatus(@Path("id") id: String, @Body body: Map<String, String>)

    @GET("lab-orders")
    suspend fun getLabOrders(): List<LabOrder>

    @POST("lab-orders")
    suspend fun createLabOrder(@Body body: CreateLabOrderRequest): LabOrder

    @PUT("lab-orders/{id}")
    suspend fun updateLabOrder(@Path("id") id: String, @Body body: Map<String, String>): LabOrder

    @PATCH("admissions/{id}/discharge")
    suspend fun dischargePatient(@Path("id") id: String): Admission

    @GET("vitals")
    suspend fun getVitals(): List<VitalRecord>

    @POST("vitals")
    suspend fun recordVitals(@Body body: RecordVitalsRequest): VitalRecord

    @GET("billing")
    suspend fun getBillings(): List<Bill>

    @POST("billing")
    suspend fun createBilling(@Body body: CreateBillingRequest): Bill

    @PATCH("billing/{id}/status")
    suspend fun updateBillingStatus(@Path("id") id: String, @Body body: Map<String, String>)

    @GET("doctors")
    suspend fun getDoctors(): List<Doctor>

    @POST("doctors")
    suspend fun createDoctor(@Body body: CreateDoctorRequest): Doctor

    @GET("staff")
    suspend fun getStaff(): List<StaffMember>

    @POST("staff")
    suspend fun createStaff(@Body body: CreateStaffRequest): StaffMember

    @GET("inventory")
    suspend fun getInventory(): List<InventoryItem>

    @POST("inventory")
    suspend fun createInventoryItem(@Body body: CreateInventoryRequest): InventoryItem

    @PATCH("inventory/{id}/stock")
    suspend fun updateInventoryStock(@Path("id") id: String, @Body body: Map<String, Int>)

    @GET("expenses")
    suspend fun getExpenses(): List<Expense>

    @POST("expenses")
    suspend fun createExpense(@Body body: CreateExpenseRequest): Expense

    @GET("insurance")
    suspend fun getInsuranceClaims(): List<InsuranceClaim>

    @POST("insurance")
    suspend fun createInsuranceClaim(@Body body: CreateClaimRequest): InsuranceClaim

    @PATCH("insurance/{id}/status")
    suspend fun updateClaimStatus(@Path("id") id: String, @Body body: Map<String, String>)

    @GET("shifts")
    suspend fun getShifts(): List<ShiftRecord>

    @POST("shifts")
    suspend fun createShift(@Body body: CreateShiftRequest): ShiftRecord

    @GET("notices")
    suspend fun getNotices(): List<NoticeItem>

    @POST("notices")
    suspend fun createNotice(@Body body: CreateNoticeRequest): NoticeItem

    @GET("leaves")
    suspend fun getLeaves(): List<LeaveRequest>

    @POST("leaves")
    suspend fun createLeave(@Body body: CreateLeaveRequest): LeaveRequest

    @PATCH("leaves/{id}/status")
    suspend fun updateLeaveStatus(@Path("id") id: String, @Body body: Map<String, String>)

    @GET("groups")
    suspend fun getGroups(): List<GroupItem>

    @POST("groups")
    suspend fun createGroup(@Body body: CreateGroupRequest): GroupItem

    @GET("feedback")
    suspend fun getFeedback(): List<FeedbackItem>

    @GET("audit-logs")
    suspend fun getAuditLogs(): List<AuditLogItem>

    @GET("staff-types")
    suspend fun getStaffTypes(): List<StaffType>

    @POST("staff-types")
    suspend fun createStaffType(@Body body: CreateStaffTypeRequest): StaffType

    @GET("hospital/current")
    suspend fun getCurrentHospital(): Hospital

    @PATCH("hospital/update")
    suspend fun updateHospital(@Body body: HospitalProfileUpdate): Hospital

    @GET("payments/subscription")
    suspend fun getSubscriptionStatus(): SubscriptionStatus

    @GET("payments/plans")
    suspend fun getPaymentPlans(): List<PaymentPlan>

    @GET("payments/history")
    suspend fun getPaymentHistory(): List<Subscription>

    // ---------- Hospital map / wayfinding ----------
    @GET("map")
    suspend fun getMap(): HospitalMap

    @PUT("map")
    suspend fun saveMap(@Body body: HospitalMap): HospitalMap

    @GET("map/positions")
    suspend fun getLivePositions(): List<LivePosition>

    @POST("map/positions")
    suspend fun upsertLivePosition(@Body body: LivePosition): LivePosition

    // ---------- Patient portal ----------
    @GET("patient/dashboard")
    suspend fun getPatientDashboard(): PatientDashboard

    @GET("patient/location")
    suspend fun getMyLocation(): MyLocation

    @POST("patient/location/share")
    suspend fun shareMyLocation(@Body body: ShareLocationRequest): ShareLocationResponse

    @GET("patient/appointments")
    suspend fun getMyAppointments(): List<Appointment>

    @POST("patient/appointments")
    suspend fun bookAppointment(@Body body: BookAppointmentRequest): Appointment

    @GET("hospitals/{hospitalId}/available-slots")
    suspend fun getAvailableSlots(
        @Path("hospitalId") hospitalId: String,
        @Query("date") date: String? = null,
        @Query("doctorId") doctorId: String? = null
    ): AvailableSlotsResponse

    @PATCH("patient/appointments/{id}/cancel")
    suspend fun cancelAppointment(@Path("id") id: String)

    @PATCH("patient/appointments/{id}/reschedule")
    suspend fun rescheduleAppointment(@Path("id") id: String, @Body body: RescheduleRequest)

    @PATCH("patient/appointments/{id}/close")
    suspend fun closeAppointment(@Path("id") id: String)

    @GET("patient/prescriptions")
    suspend fun getMyPrescriptions(): List<Prescription>

    @GET("patient/records")
    suspend fun getMyRecords(): PatientRecords

    @GET("patient/bills")
    suspend fun getMyBills(): List<Bill>

    @GET("patient/vaccinations")
    suspend fun getMyVaccinations(): List<Vaccination>

    @POST("patient/vaccinations")
    suspend fun recordVaccination(@Body body: RecordVaccinationRequest): Vaccination

    @GET("patient/dependents")
    suspend fun getDependents(): List<Patient>

    @POST("patient/dependents")
    suspend fun createDependent(@Body body: CreateDependentRequest): Patient

    @GET("patient/access-grants")
    suspend fun getAccessGrants(): List<AccessGrant>

    @GET("patient/access-logs")
    suspend fun getAccessLogs(): List<AccessLogItem>

    @POST("patient/access-grants/revoke")
    suspend fun revokeDoctorAccess(@Body body: DoctorAccessRequest)

    @POST("patient/access-grants/restore")
    suspend fun restoreDoctorAccess(@Body body: DoctorAccessRequest)

    @GET("hospitals")
    suspend fun searchHospitals(@Query("q") query: String? = null): List<Hospital>

    @GET("hospitals/{id}")
    suspend fun getHospitalDetail(@Path("id") id: String): HospitalDetail

    // ---------- Super admin ----------
    @GET("super-admin/stats")
    suspend fun getSuperAdminStats(): SuperAdminStats

    @GET("super-admin/usage")
    suspend fun getPlatformUsage(): PlatformUsage

    @GET("super-admin/deployment-readiness")
    suspend fun getDeploymentReadiness(): DeploymentReadiness

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

    @GET("super-admin/staff-types")
    suspend fun getGlobalStaffTypes(): List<StaffType>

    @POST("super-admin/staff-types")
    suspend fun createGlobalStaffType(@Body body: CreateStaffTypeRequest): StaffType

    @DELETE("super-admin/staff-types/{id}")
    suspend fun deactivateGlobalStaffType(@Path("id") id: String)
}
