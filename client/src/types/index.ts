// Centralized HOSCORE Type Definitions

export type Role = "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECH" | "STAFF" | "CLEANER";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  avatar?: string | null;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  hospitalId: string;
  role: Role;
  department: string;
  status: "ACTIVE" | "SUSPENDED" | "INVITED";
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  activeContext: {
    hospitalId: string;
    hospitalName: string;
    role: Role;
    department: string;
  } | null;
  logout: () => void;
}

export interface Hospital {
  id: string;
  name: string;
  slug: string;
  address?: string | null;
  country?: string | null;
  city?: string | null;
  state?: string | null;
  contact?: string | null;
  email?: string | null;
  description?: string | null;
  logo?: string | null;
  photos?: string[] | null;
  rating: number;
  isPartnered: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  hospitalId: string;
  plan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
  pricePerUser: number;
  maxUsers: number;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "TRIAL";
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  userId?: string | null;
  hospitalId?: string | null;
  name: string;
  contact?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  status: string; // e.g. "Out-Patient", "In-Patient"
  medicalHistory?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  hospitalId?: string | null;
  name: string;
  specialty: string;
  contact?: string | null;
  email?: string | null;
  status: "Available" | "In Surgery" | "On Duty" | "On Leave" | "Off Duty";
  rating: number;
  patientsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  id: string;
  hospitalId?: string | null;
  name: string;
  role: string;
  department: string;
  shift: string;
  status: string;
  contact?: string | null;
  email?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  hospitalId: string;
  name: string;
  type: string;
  capacity: number;
  basePrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface Bed {
  id: string;
  roomId: string;
  bedNumber: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  pricePerDay: number;
  createdAt: string;
  updatedAt: string;
}

export interface Admission {
  id: string;
  patientId: string;
  patient?: Patient;
  bedId: string;
  bed?: Bed;
  admissionDate: string;
  dischargeDate?: string | null;
  reason?: string | null;
  status: "Active" | "Discharged";
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  hospitalId: string;
  patientId: string;
  patient?: Patient;
  doctorId?: string | null;
  doctor?: Doctor | null;
  time: string;
  date: string;
  tokenNumber: number;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  isRepeat: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Billing {
  id: string;
  hospitalId?: string | null;
  admissionId: string;
  admission?: Admission;
  roomCharges: number;
  doctorFees: number;
  pharmacyFees: number;
  labFees: number;
  totalAmount: number;
  status: "PENDING" | "PAID" | "OVERDUE";
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: string;
  hospitalId?: string | null;
  itemName: string;
  type: string;
  stock: number;
  reorderLevel: number;
  unit: string;
  supplier?: string | null;
  price?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: string;
  hospitalId?: string | null;
  doctorId: string;
  doctor?: Doctor;
  patientId: string;
  patient?: Patient;
  diagnosis: string;
  medicines: string; // JSON string or text list
  instructions?: string | null;
  status: "ISSUED" | "DISPENSED" | "CANCELLED";
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface OPDQueueItem {
  id: string;
  hospitalId?: string | null;
  patientName: string;
  patientId?: string | null;
  doctorName: string;
  doctorId?: string | null;
  tokenNumber: number;
  department: string;
  status: "WAITING" | "CHECKED_IN" | "CALLED" | "COMPLETED";
  estimatedWait: number;
  notes?: string | null;
  date: string;
  calledAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LabOrder {
  id: string;
  hospitalId?: string | null;
  patientName: string;
  patientId?: string | null;
  doctorName: string;
  doctorId?: string | null;
  testName: string;
  testType: string;
  priority: "ROUTINE" | "STAT" | "URGENT";
  status: "ORDERED" | "COLLECTED" | "COMPLETED" | "CANCELLED";
  result?: string | null;
  normalRange?: string | null;
  unit?: string | null;
  remarks?: string | null;
  orderedAt: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VitalRecord {
  id: string;
  hospitalId?: string | null;
  patientName: string;
  patientId?: string | null;
  recordedBy?: string | null;
  bloodPressure?: string | null;
  heartRate?: number | null;
  temperature?: number | null;
  oxygenSaturation?: number | null;
  respiratoryRate?: number | null;
  weight?: number | null;
  bloodSugar?: number | null;
  notes?: string | null;
  recordedAt: string;
  createdAt: string;
}

export interface DischargeSummary {
  id: string;
  hospitalId?: string | null;
  patientName: string;
  patientId?: string | null;
  admissionId?: string | null;
  admissionDate?: string | null;
  dischargeDate: string;
  diagnosis: string;
  treatmentGiven?: string | null;
  surgeryPerformed?: string | null;
  medications?: string | null;
  followUpDate?: string | null;
  followUpNotes?: string | null;
  doctorName: string;
  status: "DRAFT" | "FINALIZED";
  createdAt: string;
  updatedAt: string;
}

export interface Notice {
  id: string;
  hospitalId?: string | null;
  title: string;
  body: string;
  priority: "INFO" | "WARNING" | "CRITICAL";
  isPinned: boolean;
  expiresAt?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  hospitalId?: string | null;
  staffId?: string | null;
  doctorId?: string | null;
  staffName: string;
  role: string;
  startDate: string;
  endDate: string;
  type: string;
  reason?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftSchedule {
  id: string;
  hospitalId?: string | null;
  staffName: string;
  staffId?: string | null;
  role: string;
  department: string;
  shiftType: "MORNING" | "AFTERNOON" | "NIGHT" | "GENERAL";
  date: string;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "COMPLETED" | "ABSENT";
  swapRequested: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  id: string;
  hospitalId?: string | null;
  patientName: string;
  patientId?: string | null;
  doctorName?: string | null;
  department?: string | null;
  rating: number;
  category: string;
  comment?: string | null;
  isAnonymous: boolean;
  createdAt: string;
}

export interface InsuranceClaim {
  id: string;
  hospitalId?: string | null;
  patientName: string;
  patientId?: string | null;
  policyNumber: string;
  insuranceCompany: string;
  claimAmount: number;
  approvedAmount?: number | null;
  status: "SUBMITTED" | "APPROVED" | "REJECTED" | "PENDING_DOCUMENTS";
  admissionId?: string | null;
  diagnosis?: string | null;
  documents?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  hospitalId?: string | null;
  title: string;
  category: string;
  amount: number;
  vendor?: string | null;
  paidBy?: string | null;
  paidDate: string;
  receipt?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  hospitalId?: string | null;
  userId?: string | null;
  userName: string;
  userRole?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalPatients: number;
  occupancyRate: number;
  totalRooms: number;
  upcomingAppointments: Appointment[];
  telemetry: {
    activeQueue: number;
    pendingLabs: number;
    pendingRx: number;
    todaysShifts: number;
    pendingClaims: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
