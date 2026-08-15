import { Router } from 'express';
import { authenticate, requireFeature, requireAnyFeature, requireHospitalContext, requirePatientContext, requireSuperAdmin } from '../middleware/authMiddleware.js';
import * as authController from '../controllers/authController.js';
import * as hospitalController from '../controllers/hospitalController.js';
import * as superAdminController from '../controllers/superAdminController.js';
import * as patientPortalController from '../controllers/patientPortalController.js';
import * as roomController from '../controllers/roomController.js';
import * as bedController from '../controllers/bedController.js';
import * as patientController from '../controllers/patientController.js';
import * as admissionController from '../controllers/admissionController.js';
import * as billingController from '../controllers/billingController.js';
import * as miscController from '../controllers/miscController.js';
import * as statsController from '../controllers/statsController.js';
import * as appointmentController from '../controllers/appointmentController.js';
import * as scheduleController from '../controllers/scheduleController.js';
import * as noticeController from '../controllers/noticeController.js';
import * as leaveController from '../controllers/leaveController.js';
import * as groupController from '../controllers/groupController.js';
import * as queueController from '../controllers/queueController.js';
import * as labController from '../controllers/labController.js';
import * as vitalsController from '../controllers/vitalsController.js';
import * as dischargeController from '../controllers/dischargeController.js';
import * as reportController from '../controllers/reportController.js';
import * as auditController from '../controllers/auditController.js';
import * as shiftController from '../controllers/shiftController.js';
import * as feedbackController from '../controllers/feedbackController.js';
import * as insuranceController from '../controllers/insuranceController.js';
import * as expenseController from '../controllers/expenseController.js';
import * as prescriptionController from '../controllers/prescriptionController.js';
import * as uploadController from '../controllers/uploadController.js';
import * as staffTypeController from '../controllers/staffTypeController.js';
import * as paymentController from '../controllers/paymentController.js';
import * as mapController from '../controllers/mapController.js';
import { upload } from '../controllers/uploadController.js';
import {
  validate,
  loginSchema,
  otpLoginSchema,
  registerSchema,
  hospitalRegisterSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyMsg91Schema,
  switchContextSchema,
  initiateHospitalRegisterSchema,
  completeHospitalRegisterSchema,
} from '../utils/validators.js';
import { FEATURES } from '../utils/features.js';

const router = Router();

// ================= PUBLIC ROUTES =================
router.post('/auth/register', validate(registerSchema), authController.register);
router.post('/auth/login', validate(loginSchema), authController.login);
router.post('/auth/start-otp-login', validate(otpLoginSchema), authController.startOtpLogin);
router.post('/auth/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/auth/resend-otp', validate(resendOtpSchema), authController.resendOtp);
router.get('/auth/challenge/:challengeId', authController.getChallengeStatus);
router.post('/auth/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/auth/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.post('/auth/verify-msg91-access-token', validate(verifyMsg91Schema), authController.verifyMsg91AccessToken);
router.get('/auth/msg91-widget-config', authController.getMsg91WidgetConfig);
router.get('/internal/cron/cleanup-challenges', authController.runChallengeCleanup);
router.post('/create-order', paymentController.createRazorpayOrder);
router.post('/verify-payment', paymentController.verifyRazorpayPayment);
router.post('/payments/demo-order', paymentController.createDemoPaymentOrder);
router.post('/payments/demo-verify', paymentController.verifyDemoPaymentOrder);
router.get('/hospitals', hospitalController.listHospitals);
router.get('/hospitals/:id', hospitalController.getHospital);
router.get('/hospitals/:hospitalId/available-slots', hospitalController.getAvailableSlots);
// Public wayfinding: patient-facing published map + family location-share link.
router.get('/hospitals/:hospitalId/public-map', mapController.getPublicMap);
router.get('/shared-location/:token', mapController.getSharedLocation);
router.post('/hospitals/register/initiate', validate(initiateHospitalRegisterSchema), hospitalController.initiateHospitalRegistration);
router.post('/hospitals/register/complete', validate(completeHospitalRegisterSchema), hospitalController.completeHospitalRegistration);
router.post('/hospitals/register', authenticate, validate(hospitalRegisterSchema), hospitalController.registerHospital);


// ================= AUTHENTICATED ROUTES =================
router.use(authenticate);

// File uploads
router.post('/upload/image', requireAnyFeature(FEATURES.SETTINGS, FEATURES.CLAIMS, FEATURES.EXPENSES), upload.single('file'), uploadController.uploadImage);
router.post('/upload/documents', requireAnyFeature(FEATURES.PATIENTS, FEATURES.CLAIMS, FEATURES.EXPENSES), upload.array('files', 5), uploadController.uploadDocuments);
router.delete('/upload/file', requireFeature(FEATURES.PATIENTS), uploadController.deleteFile);

// Auth context
router.get('/auth/me', authController.getMe);
router.get('/auth/contexts', authController.getMyContexts);
router.post('/auth/switch-context', validate(switchContextSchema), authController.switchContext);
router.post('/auth/verify-switch-password', authController.verifySwitchPassword);
router.post('/device-token', patientPortalController.registerDevice);



// ================= PAYMENTS / SUBSCRIPTIONS =================
// (webhook is registered separately in index.ts with a raw body parser)
router.get('/payments/plans', paymentController.getPlans);
router.get('/payments/subscription', requireHospitalContext, paymentController.getSubscriptionStatus);
router.post('/payments/order', requireHospitalContext, paymentController.createPaymentOrder);
router.post('/payments/verify', requireHospitalContext, paymentController.verifyPaymentOrder);
router.post('/payments/autopay/start', requireHospitalContext, paymentController.startAutopay);
router.post('/payments/autopay/confirm', requireHospitalContext, paymentController.confirmAutopay);
router.post('/payments/autopay/cancel', requireHospitalContext, paymentController.cancelAutopay);
router.get('/payments/history', requireHospitalContext, paymentController.getPaymentHistory);

// Hospital management
router.put('/hospitals/current', requireFeature(FEATURES.SETTINGS), hospitalController.updateHospital);
router.post('/hospitals/invite', requireFeature(FEATURES.STAFF), hospitalController.inviteStaff);
router.get('/hospitals/staff', requireFeature(FEATURES.STAFF), hospitalController.getHospitalStaff);
router.patch('/hospitals/staff/:id', requireFeature(FEATURES.STAFF), hospitalController.updateStaffMembership);

// ================= PATIENT PORTAL =================
router.get('/patient/dashboard', requirePatientContext, patientPortalController.getPatientDashboard);
router.get('/patient/visit', requirePatientContext, patientPortalController.getMyVisit);
router.post('/patient/skip-alert', requirePatientContext, patientPortalController.skipAlert);
router.get('/patient/dependents', requirePatientContext, patientPortalController.getDependents);
router.post('/patient/dependents', requirePatientContext, patientPortalController.createDependent);
router.patch('/patient/appointments/:id/close', requirePatientContext, patientPortalController.closeAppointment);
router.patch('/patient/appointments/:id/cancel', requirePatientContext, patientPortalController.cancelAppointment);
router.patch('/patient/appointments/:id/reschedule', requirePatientContext, patientPortalController.rescheduleAppointment);
router.get('/patient/appointments', requirePatientContext, patientPortalController.getMyAppointments);
router.post('/patient/appointments', requirePatientContext, appointmentController.createPatientAppointment);
router.get('/patient/prescriptions', requirePatientContext, patientPortalController.getMyPrescriptions);
router.get('/patient/records', requirePatientContext, patientPortalController.getMyRecords);
router.get('/patient/bills', requirePatientContext, patientPortalController.getMyBills);
// Patients pay their own bills from patient context (requireFeature(BILLING) can never
// pass here); both endpoints authorise by bill ownership, not by hospital feature flags.
router.post('/patient/bills/:id/pay-order', requirePatientContext, billingController.createPatientBillOrder);
router.post('/patient/bills/pay-verify', requirePatientContext, billingController.verifyPatientBillPayment);

// Sovereign Health Features: Vaccinations & Access Controls
router.get('/patient/vaccinations', requirePatientContext, patientPortalController.getVaccinations);
router.post('/patient/vaccinations', requirePatientContext, patientPortalController.recordVaccination);
router.get('/patient/access-grants', requirePatientContext, patientPortalController.getAccessGrants);
router.get('/patient/access-logs', requirePatientContext, patientPortalController.getAccessLogs);
router.post('/patient/access-grants/revoke', requirePatientContext, patientPortalController.revokeDoctorAccess);
router.post('/patient/access-grants/restore', requirePatientContext, patientPortalController.restoreDoctorAccess);
// Patient indoor location + family share
router.get('/patient/location', requirePatientContext, mapController.getMyLocation);
router.post('/patient/location/share', requirePatientContext, mapController.shareMyLocation);

// ================= SUPER ADMIN =================
router.get('/super-admin/stats', requireSuperAdmin, superAdminController.getDashboardStats);
router.get('/super-admin/usage', requireSuperAdmin, superAdminController.getUsage);
router.get('/super-admin/deployment-readiness', requireSuperAdmin, superAdminController.getDeploymentReadiness);
router.get('/super-admin/hospitals', requireSuperAdmin, superAdminController.getAllHospitals);
router.get('/super-admin/users', requireSuperAdmin, superAdminController.getAllUsers);
router.get('/super-admin/subscriptions', requireSuperAdmin, superAdminController.getAllSubscriptions);
router.get('/super-admin/staff-types', requireSuperAdmin, staffTypeController.listGlobalStaffTypes);
router.post('/super-admin/staff-types', requireSuperAdmin, staffTypeController.createGlobalStaffType);
router.put('/super-admin/staff-types/:id', requireSuperAdmin, staffTypeController.updateGlobalStaffType);
router.delete('/super-admin/staff-types/:id', requireSuperAdmin, staffTypeController.deactivateGlobalStaffType);
router.patch('/super-admin/hospitals/:id/toggle', requireSuperAdmin, superAdminController.toggleHospitalStatus);
router.post('/super-admin/hospitals/:id/impersonate', requireSuperAdmin, superAdminController.impersonateHospital);
router.get('/super-admin/payments', requireSuperAdmin, superAdminController.getPayments);
router.patch('/super-admin/users/:id/toggle', requireSuperAdmin, superAdminController.toggleUserStatus);

// ================= HOSPITAL-SCOPED ROUTES =================
router.use(requireHospitalContext);

// Feature catalog / staff type permissions
router.get('/features', staffTypeController.getFeatureCatalog);
router.get('/staff-types', requireFeature(FEATURES.STAFF_TYPES), staffTypeController.listHospitalStaffTypes);
router.post('/staff-types', requireFeature(FEATURES.STAFF_TYPES), staffTypeController.createHospitalStaffType);
router.put('/staff-types/:id', requireFeature(FEATURES.STAFF_TYPES), staffTypeController.updateHospitalStaffType);
router.delete('/staff-types/:id', requireFeature(FEATURES.STAFF_TYPES), staffTypeController.deactivateHospitalStaffType);

// Hospital profile
router.get('/hospital/current', requireFeature(FEATURES.SETTINGS), hospitalController.getCurrentHospital);
router.patch('/hospital/update', requireFeature(FEATURES.SETTINGS), hospitalController.updateHospital);
router.get('/hospital/usage', requireFeature(FEATURES.SETTINGS), hospitalController.getHospitalUsageTelemetry);

// Stats
router.get('/stats', requireFeature(FEATURES.DASHBOARD), statsController.getStats);

// ================= HOSPITAL MAP / WAYFINDING =================
router.get('/map', requireAnyFeature(FEATURES.MAP, FEATURES.ADMISSIONS), mapController.getMap);
router.put('/map', requireFeature(FEATURES.MAP), mapController.saveMap);
router.get('/map/positions', requireAnyFeature(FEATURES.MAP, FEATURES.ADMISSIONS), mapController.getLivePositions);
router.post('/map/positions', requireAnyFeature(FEATURES.MAP, FEATURES.ADMISSIONS), mapController.upsertLivePosition);
router.delete('/map/positions/:id', requireFeature(FEATURES.MAP), mapController.endLivePosition);
router.get('/analytics', requireFeature(FEATURES.ANALYTICS), statsController.getAnalytics);

// Appointments
router.get('/appointments', requireFeature(FEATURES.CALENDAR), appointmentController.getAllAppointments);
router.post('/appointments', requireFeature(FEATURES.CALENDAR), appointmentController.createAppointment);
router.patch('/appointments/:id/checkin', requireFeature(FEATURES.QUEUE), appointmentController.checkInAppointment);
router.patch('/appointments/:id/check-in', requireFeature(FEATURES.QUEUE), appointmentController.checkInAppointment);
router.delete('/appointments/:id', requireFeature(FEATURES.CALENDAR), appointmentController.deleteAppointment);

// Rooms
router.get('/rooms', requireAnyFeature(FEATURES.ROOMS, FEATURES.ADMISSIONS), roomController.getAllRooms);
router.post('/rooms', requireFeature(FEATURES.ROOMS), roomController.createRoom);
router.patch('/rooms/:id', requireFeature(FEATURES.ROOMS), roomController.updateRoom);
router.get('/rooms/:id', requireFeature(FEATURES.ROOMS), roomController.getRoomById);
router.delete('/rooms/:id', requireFeature(FEATURES.ROOMS), roomController.deleteRoom);

// Beds
router.get('/beds', requireAnyFeature(FEATURES.ROOMS, FEATURES.ADMISSIONS), bedController.getAllBeds);
router.post('/beds', requireFeature(FEATURES.ROOMS), bedController.createBed);
router.patch('/beds/:id/status', requireFeature(FEATURES.ROOMS), bedController.updateBedStatus);
router.delete('/beds/:id', requireFeature(FEATURES.ROOMS), bedController.deleteBed);

// Patients
router.get('/patients', requireFeature(FEATURES.PATIENTS), patientController.getAllPatients);
router.get('/patients/search/:sixDigitId', requireFeature(FEATURES.PATIENTS), patientController.getPatientBySixDigitId);
router.post('/patients', requireFeature(FEATURES.PATIENTS), patientController.createPatient);
router.get('/patients/:id', requireFeature(FEATURES.PATIENTS), patientController.getPatientById);
router.put('/patients/:id', requireFeature(FEATURES.PATIENTS), patientController.updatePatient);
router.patch('/patients/:id/convert-hoscore', requireFeature(FEATURES.PATIENTS), patientController.convertManualPatientToHoscore);
router.delete('/patients/:id', requireFeature(FEATURES.PATIENTS), patientController.deletePatient);
router.patch('/vaccinations/:id/complete', requireFeature(FEATURES.PATIENTS), patientController.completeVaccination);

// Admissions
router.get('/admissions', requireFeature(FEATURES.ADMISSIONS), admissionController.getAllAdmissions);
router.post('/admissions', requireFeature(FEATURES.ADMISSIONS), admissionController.createAdmission);
router.patch('/admissions/:id/discharge', requireFeature(FEATURES.ADMISSIONS), admissionController.dischargePatient);

// Billing
router.get('/billing', requireAnyFeature(FEATURES.BILLING, FEATURES.CLAIMS), billingController.getAllBillings);
router.post('/billing', requireFeature(FEATURES.BILLING), billingController.createBilling);
router.patch('/billing/:id/status', requireFeature(FEATURES.BILLING), billingController.updateBillingStatus);
router.put('/billing/:id/pay-offline', requireFeature(FEATURES.BILLING), billingController.payOffline);
router.post('/billing/:id/razorpay-order', requireFeature(FEATURES.BILLING), billingController.createRazorpayOrder);
router.post('/billing/razorpay-verify', requireFeature(FEATURES.BILLING), billingController.verifyRazorpayPayment);
router.delete('/billing/:id', requireFeature(FEATURES.BILLING), billingController.deleteBilling);

// Doctors
router.get('/doctors', requireAnyFeature(FEATURES.DOCTORS, FEATURES.CALENDAR), miscController.getAllDoctors);
router.post('/doctors', requireFeature(FEATURES.DOCTORS), miscController.createDoctor);
router.patch('/doctors/:id', requireFeature(FEATURES.DOCTORS), miscController.updateDoctor);
router.delete('/doctors/:id', requireFeature(FEATURES.DOCTORS), miscController.deleteDoctor);

// Inventory
router.get('/inventory', requireFeature(FEATURES.INVENTORY), miscController.getAllInventory);
router.post('/inventory', requireFeature(FEATURES.INVENTORY), miscController.createInventoryItem);
router.patch('/inventory/:id/stock', requireFeature(FEATURES.INVENTORY), miscController.updateInventoryStock);
router.delete('/inventory/:id', requireFeature(FEATURES.INVENTORY), miscController.deleteInventory);

// Staff
router.get('/staff', requireAnyFeature(FEATURES.STAFF, FEATURES.LEAVES, FEATURES.GROUPS, FEATURES.SHIFTS, FEATURES.CALENDAR, FEATURES.EXPENSES), miscController.getAllStaff);
router.get('/roster', requireAnyFeature(FEATURES.STAFF, FEATURES.LEAVES, FEATURES.GROUPS, FEATURES.SHIFTS, FEATURES.CALENDAR, FEATURES.EXPENSES, FEATURES.FEEDBACK), miscController.getRoster);
router.post('/staff', requireFeature(FEATURES.STAFF), miscController.createStaff);
router.delete('/staff/:id', requireFeature(FEATURES.STAFF), miscController.deleteStaff);

// Schedule / Calendar
router.get('/schedules/defaults', requireFeature(FEATURES.CALENDAR), scheduleController.getDefaultSchedules);
router.post('/schedules/defaults', requireFeature(FEATURES.CALENDAR), scheduleController.upsertDefaultSchedule);
router.get('/schedules/overrides', requireFeature(FEATURES.CALENDAR), scheduleController.getScheduleOverrides);
router.post('/schedules/overrides', requireFeature(FEATURES.CALENDAR), scheduleController.upsertScheduleOverride);
router.delete('/schedules/overrides/:id', requireFeature(FEATURES.CALENDAR), scheduleController.deleteScheduleOverride);

// Notices
router.get('/notices', requireFeature(FEATURES.NOTICES), noticeController.getAllNotices);
router.post('/notices', requireFeature(FEATURES.NOTICES), noticeController.createNotice);
router.put('/notices/:id', requireFeature(FEATURES.NOTICES), noticeController.updateNotice);
router.delete('/notices/:id', requireFeature(FEATURES.NOTICES), noticeController.deleteNotice);

// Leaves
router.get('/leaves', requireFeature(FEATURES.LEAVES), leaveController.getAllLeaves);
router.post('/leaves', requireFeature(FEATURES.LEAVES), leaveController.createLeave);
router.patch('/leaves/:id/status', requireFeature(FEATURES.LEAVES), leaveController.updateLeaveStatus);
router.delete('/leaves/:id', requireFeature(FEATURES.LEAVES), leaveController.deleteLeave);

// Groups
router.get('/groups', requireFeature(FEATURES.GROUPS), groupController.getAllGroups);
router.post('/groups', requireFeature(FEATURES.GROUPS), groupController.createGroup);
router.put('/groups/:id', requireFeature(FEATURES.GROUPS), groupController.updateGroup);
router.delete('/groups/:id', requireFeature(FEATURES.GROUPS), groupController.deleteGroup);
router.post('/groups/members', requireFeature(FEATURES.GROUPS), groupController.addMember);
router.delete('/groups/members/:id', requireFeature(FEATURES.GROUPS), groupController.removeMember);

// OPD Queue
router.get('/queue', requireFeature(FEATURES.QUEUE), queueController.getQueue);
router.get('/queue/pending-appointments', requireFeature(FEATURES.QUEUE), queueController.getPendingAppointments);
router.post('/queue', requireFeature(FEATURES.QUEUE), queueController.addToQueue);
router.patch('/queue/:id/status', requireFeature(FEATURES.QUEUE), queueController.updateQueueStatus);
router.delete('/queue/:id', requireFeature(FEATURES.QUEUE), queueController.deleteFromQueue);

// Prescriptions
router.get('/prescriptions', requireFeature(FEATURES.PRESCRIPTIONS), prescriptionController.getAll);
router.post('/prescriptions', requireFeature(FEATURES.PRESCRIPTIONS), prescriptionController.create);
router.patch('/prescriptions/:id/status', requireFeature(FEATURES.PRESCRIPTIONS), prescriptionController.updateStatus);
router.delete('/prescriptions/:id', requireFeature(FEATURES.PRESCRIPTIONS), prescriptionController.remove);

// Lab Orders
router.get('/lab-orders', requireFeature(FEATURES.LABS), labController.getAllLabOrders);
router.post('/lab-orders', requireFeature(FEATURES.LABS), labController.createLabOrder);
router.put('/lab-orders/:id', requireFeature(FEATURES.LABS), labController.updateLabOrder);
router.delete('/lab-orders/:id', requireFeature(FEATURES.LABS), labController.deleteLabOrder);

// Vitals
router.get('/vitals', requireFeature(FEATURES.VITALS), vitalsController.getVitals);
router.post('/vitals', requireFeature(FEATURES.VITALS), vitalsController.recordVitals);
router.delete('/vitals/:id', requireFeature(FEATURES.VITALS), vitalsController.deleteVital);

// Discharge Summaries
router.get('/discharges', requireFeature(FEATURES.DISCHARGES), dischargeController.getAll);
router.post('/discharges', requireFeature(FEATURES.DISCHARGES), dischargeController.create);
router.put('/discharges/:id', requireFeature(FEATURES.DISCHARGES), dischargeController.update);
router.delete('/discharges/:id', requireFeature(FEATURES.DISCHARGES), dischargeController.remove);

// Audit Logs
router.get('/audit-logs', requireFeature(FEATURES.AUDIT_LOGS), auditController.getLogs);
router.post('/audit-logs', requireFeature(FEATURES.AUDIT_LOGS), auditController.createLog);

// Shift Scheduling
router.get('/shifts', requireFeature(FEATURES.SHIFTS), shiftController.getShifts);
router.post('/shifts', requireFeature(FEATURES.SHIFTS), shiftController.createShift);
router.put('/shifts/:id', requireFeature(FEATURES.SHIFTS), shiftController.updateShift);
router.delete('/shifts/:id', requireFeature(FEATURES.SHIFTS), shiftController.deleteShift);

// Feedback
router.get('/feedback', requireFeature(FEATURES.FEEDBACK), feedbackController.getAll);
router.post('/feedback', requireFeature(FEATURES.FEEDBACK), feedbackController.create);
router.patch('/feedback/:id/reply', requireFeature(FEATURES.FEEDBACK), feedbackController.reply);
router.delete('/feedback/:id', requireFeature(FEATURES.FEEDBACK), feedbackController.remove);

// Insurance Claims
router.get('/insurance', requireFeature(FEATURES.CLAIMS), insuranceController.getAll);
router.post('/insurance', requireFeature(FEATURES.CLAIMS), insuranceController.create);
router.patch('/insurance/:id/status', requireFeature(FEATURES.CLAIMS), insuranceController.updateStatus);
router.delete('/insurance/:id', requireFeature(FEATURES.CLAIMS), insuranceController.remove);

// Expenses
router.get('/expenses', requireFeature(FEATURES.EXPENSES), expenseController.getAll);
router.post('/expenses', requireFeature(FEATURES.EXPENSES), expenseController.create);
router.put('/expenses/:id', requireFeature(FEATURES.EXPENSES), expenseController.update);
router.delete('/expenses/:id', requireFeature(FEATURES.EXPENSES), expenseController.remove);
// Reports
router.get('/reports/billing', requireFeature(FEATURES.BILLING), reportController.billingReport);
router.get('/reports/patients', requireFeature(FEATURES.PATIENTS), reportController.patientReport);
router.get('/reports/analytics', requireFeature(FEATURES.ANALYTICS), reportController.analyticsReport);

export default router;
