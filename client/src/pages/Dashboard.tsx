import { useEffect, useState } from "react";
import { api } from "../services/api";
import {
  Users,
  Bed,
  Activity,
  CalendarClock,
  HeartPulse,
  ShieldCheck,
  Zap,
  Clock,
  CreditCard,
  PlusCircle,
  Search,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  FileText,
  Pill,
  Heart,
  Plus,
  RefreshCw,
  UserCheck,
  History,
  User
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAnimatedCounter } from "../hooks/useAnimatedCounter";
import { useAuth } from "../context/AuthContext";
import { Modal } from "../components/Modal";

export const Dashboard = () => {
  const { activeContext, theme } = useAuth();
  const role = activeContext?.role; // ADMIN, DOCTOR, NURSE, RECEPTIONIST, PHARMACIST, etc.

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real data lists for quick actions
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);

  // Pharmacist portal state
  const [rxSearchId, setRxSearchId] = useState("");
  const [rxPatient, setRxPatient] = useState<any>(null);
  const [rxLoading, setRxLoading] = useState(false);
  const [rxError, setRxError] = useState("");
  const [rxSuccessMsg, setRxSuccessMsg] = useState("");

  // Live Activity Feed state
  const [activityFeed, setActivityFeed] = useState<any[]>([
    { id: "1", action: "SYS_INIT", entity: "System", details: "Clinical Command center online.", createdAt: new Date() },
  ]);

  // Quick Action modal states
  const [activeModal, setActiveModal] = useState<"PATIENT" | "APPOINTMENT" | "VITALS" | "PRESCRIPTION" | null>(null);
  
  // Quick Action form states
  const [patientForm, setPatientForm] = useState({ name: "", email: "", contact: "", dateOfBirth: "", gender: "Male", bloodGroup: "O+" });
  const [registeredPatientInfo, setRegisteredPatientInfo] = useState<any>(null);

  const [appointmentForm, setAppointmentForm] = useState({ patientId: "", doctorId: "", date: "", time: "" });
  const [vitalsForm, setVitalsForm] = useState({ patientName: "", bloodPressure: "", heartRate: "", temperature: "", oxygenSaturation: "" });
  const [prescriptionForm, setPrescriptionForm] = useState({ patientId: "", doctorId: "", diagnosis: "", medicines: "", instructions: "" });

  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");

  const loadStatsAndData = async (showPulse = false) => {
    if (!showPulse) setLoading(true);
    try {
      const [statsRes, ptsRes, docsRes, bedsRes] = await Promise.all([
        api.get("/stats"),
        api.get("/patients").catch(() => []),
        api.get("/doctors").catch(() => []),
        api.get("/beds").catch(() => [])
      ]);
      setStats(statsRes);
      setPatients(ptsRes || []);
      setDoctors(docsRes || []);
      setBeds(bedsRes || []);
    } catch (err) {
      console.error("Failed to load dashboard core statistics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatsAndData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch actual audit logs as activity feed
  useEffect(() => {
    api.get("/audit-logs")
      .then((res: any) => {
        if (res && res.length > 0) {
          setActivityFeed(res.map((r: any) => ({
            id: r.id,
            action: r.action,
            entity: r.entity,
            details: r.details || `${r.action} action on ${r.entity}`,
            createdAt: new Date(r.createdAt)
          })));
        }
      })
      .catch(() => {
        // Fallback to dynamic clinical mock activities
        const fallbackLogs = [
          { id: "2", action: "CHECKIN", entity: "Patient", details: "Patient check-in recorded for General OPD.", createdAt: new Date(Date.now() - 4 * 60 * 1000) },
          { id: "3", action: "DISPENSE", entity: "Pharmacy", details: "Formulation marked as DISPENSED at counter.", createdAt: new Date(Date.now() - 10 * 60 * 1000) },
          { id: "4", action: "ADMIT", entity: "Admission", details: "Admitted patient to General Ward Bed #A14.", createdAt: new Date(Date.now() - 18 * 60 * 1000) },
        ];
        setActivityFeed(prev => [...prev, ...fallbackLogs]);
      });
  }, [stats]);

  // Dynamic activity simulator ticks to keep feed live
  useEffect(() => {
    const mockActions = [
      { action: "CHECKIN", entity: "Patient", details: "Walk-in patient checked in at front desk." },
      { action: "VITALS", entity: "Clinical", details: "Vital signs recorded: BP 120/80, heart rate normal." },
      { action: "PRESCRIPTION", entity: "E-Rx", details: "Electronic Rx formulation dispatched to database." },
      { action: "LAB_ORDER", entity: "Laboratory", details: "STAT lab assay order dispatched to Pathology." },
      { action: "ADMIT", entity: "Admission", details: "General ward bed check-in recorded." }
    ];
    
    const interval = setInterval(() => {
      const action = mockActions[Math.floor(Math.random() * mockActions.length)];
      const names = ["Aditya", "Meera", "Rajesh", "Kavita", "Siddharth", "Neha"];
      const randomName = names[Math.floor(Math.random() * names.length)];
      
      let details = action.details;
      if (action.action === "CHECKIN") details = `Walk-in patient ${randomName} checked in for consultation.`;
      else if (action.action === "VITALS") details = `Logged vitals for ${randomName}: heart rate ${70 + Math.floor(Math.random()*15)} bpm.`;
      else if (action.action === "PRESCRIPTION") details = `Doctor issued Rx formulation for patient ${randomName}.`;
      else if (action.action === "LAB_ORDER") details = `STAT lab order registered for patient ${randomName}.`;

      setActivityFeed(prev => [
        {
          id: Math.random().toString(),
          action: action.action,
          entity: action.entity,
          details,
          createdAt: new Date()
        },
        ...prev.slice(0, 5) // limit size
      ]);
    }, 30000); // 30s ticks

    return () => clearInterval(interval);
  }, []);

  const handleRxSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxSearchId.trim()) return;
    setRxLoading(true);
    setRxError("");
    setRxPatient(null);
    setRxSuccessMsg("");
    try {
      const patient = await api.get(`/patients/search/${rxSearchId}`);
      setRxPatient(patient);
    } catch (err: any) {
      setRxError(err.response?.data?.error || "Patient profile not found or access restricted.");
    } finally {
      setRxLoading(false);
    }
  };

  const handleDispense = async (rxId: string) => {
    try {
      await api.patch(`/prescriptions/${rxId}/status`, { status: "DISPENSED" });
      setRxSuccessMsg("Prescription successfully dispensed!");
      // Refresh patient prescriptions data
      const updatedPatient = await api.get(`/patients/search/${rxSearchId}`);
      setRxPatient(updatedPatient);
      loadStatsAndData(true);
    } catch (err) {
      setRxError("Failed to dispense prescription.");
    }
  };

  const handleCheckIn = async (appointmentId: string) => {
    try {
      await api.patch(`/appointments/${appointmentId}/checkin`, {});
      setStats((prev: any) =>
        prev
          ? {
              ...prev,
              upcomingAppointments: prev.upcomingAppointments.filter(
                (a: any) => a.id !== appointmentId,
              ),
            }
          : null,
      );
      setActivityFeed(prev => [
        {
          id: Math.random().toString(),
          action: "CHECKIN",
          entity: "Patient",
          details: "Upcoming appointment patient checked in & queued.",
          createdAt: new Date()
        },
        ...prev
      ]);
      loadStatsAndData(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Action form handlers
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    setRegisteredPatientInfo(null);
    try {
      const res = await api.post("/patients", {
        ...patientForm,
        dateOfBirth: patientForm.dateOfBirth ? new Date(patientForm.dateOfBirth).toISOString() : undefined
      });
      setRegisteredPatientInfo(res);
      setFormSuccess("Patient registered successfully!");
      setActivityFeed(prev => [
        {
          id: Math.random().toString(),
          action: "REGISTER",
          entity: "Patient",
          details: `Registered new patient ${res.name} (HSC-${res.sixDigitId}).`,
          createdAt: new Date()
        },
        ...prev
      ]);
      setPatientForm({ name: "", email: "", contact: "", dateOfBirth: "", gender: "Male", bloodGroup: "O+" });
      loadStatsAndData(true);
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to register patient.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      const selectedPt = patients.find(p => p.id === appointmentForm.patientId);
      const selectedDoc = doctors.find(d => d.id === appointmentForm.doctorId);
      
      const payload = {
        patientName: selectedPt?.name || "Unknown Patient",
        email: selectedPt?.email || undefined,
        contact: selectedPt?.contact || undefined,
        doctorId: appointmentForm.doctorId || undefined,
        date: new Date(appointmentForm.date).toISOString(),
        time: appointmentForm.time,
        isHoscoreUser: selectedPt ? selectedPt.isHoscoreUser : true
      };
      
      const res = await api.post("/appointments", payload);
      setFormSuccess(`Appointment confirmed! Token #${res.tokenNumber} generated.`);
      setActivityFeed(prev => [
        {
          id: Math.random().toString(),
          action: "APPOINTMENT",
          entity: "Booking",
          details: `Booked appointment for ${selectedPt?.name} with Dr. ${selectedDoc?.name} (Token #${res.tokenNumber}).`,
          createdAt: new Date()
        },
        ...prev
      ]);
      setActiveModal(null);
      setAppointmentForm({ patientId: "", doctorId: "", date: "", time: "" });
      loadStatsAndData(true);
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to book appointment.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleRecordVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      const payload = {
        ...vitalsForm,
        heartRate: Number(vitalsForm.heartRate),
        temperature: Number(vitalsForm.temperature),
        oxygenSaturation: Number(vitalsForm.oxygenSaturation)
      };
      await api.post("/vitals", payload);
      setFormSuccess("Vitals recorded successfully!");
      setActivityFeed(prev => [
        {
          id: Math.random().toString(),
          action: "VITALS",
          entity: "Clinical",
          details: `Recorded vitals for ${vitalsForm.patientName}: BP ${vitalsForm.bloodPressure}, SpO2 ${vitalsForm.oxygenSaturation}%.`,
          createdAt: new Date()
        },
        ...prev
      ]);
      setActiveModal(null);
      setVitalsForm({ patientName: "", bloodPressure: "", heartRate: "", temperature: "", oxygenSaturation: "" });
      loadStatsAndData(true);
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to record vitals.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleWritePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      const selectedPt = patients.find(p => p.id === prescriptionForm.patientId);
      const selectedDoc = doctors.find(d => d.id === prescriptionForm.doctorId);

      const payload = {
        ...prescriptionForm,
        patientId: prescriptionForm.patientId,
        doctorId: prescriptionForm.doctorId
      };
      
      await api.post("/prescriptions", payload);
      setFormSuccess("Prescription issued successfully!");
      setActivityFeed(prev => [
        {
          id: Math.random().toString(),
          action: "PRESCRIPTION",
          entity: "E-Rx",
          details: `Dr. ${selectedDoc?.name} issued Rx for ${selectedPt?.name}: ${prescriptionForm.diagnosis}.`,
          createdAt: new Date()
        },
        ...prev
      ]);
      setActiveModal(null);
      setPrescriptionForm({ patientId: "", doctorId: "", diagnosis: "", medicines: "", instructions: "" });
      loadStatsAndData(true);
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to issue prescription.");
    } finally {
      setFormLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
  };

  // Animating stat counters
  const activeQueueCount = useAnimatedCounter(stats?.telemetry?.activeQueue || 0);
  const pendingLabsCount = useAnimatedCounter(stats?.telemetry?.pendingLabs || 0);
  const pendingRxCount = useAnimatedCounter(stats?.telemetry?.pendingRx || 0);
  const todaysShiftsCount = useAnimatedCounter(stats?.telemetry?.todaysShifts || 0);

  const occupancyRateCount = useAnimatedCounter(stats?.occupancyRate || 0);
  const pendingClaimsCount = useAnimatedCounter(stats?.telemetry?.pendingClaims || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0ea5e9] rounded-full animate-spin" />
          <p className="text-slate-400 font-bold text-xs tracking-wider animate-pulse">
            Loading Dashboard data...
          </p>
        </div>
      </div>
    );
  }

  const weeklyData = [
    { name: "Mon", admissions: 24, discharges: 18, revenue: 4200 },
    { name: "Tue", admissions: 31, discharges: 22, revenue: 5100 },
    { name: "Wed", admissions: 28, discharges: 30, revenue: 4800 },
    { name: "Thu", admissions: 45, discharges: 35, revenue: 6200 },
    { name: "Fri", admissions: 38, discharges: 25, revenue: 5600 },
    { name: "Sat", admissions: 22, discharges: 20, revenue: 3800 },
    { name: "Sun", admissions: 15, discharges: 12, revenue: 2800 },
  ];

  const departmentData = [
    { name: "Cardiology", value: 35, color: "#38bdf8" },
    { name: "Neurology", value: 25, color: "#6366f1" },
    { name: "Orthopedics", value: 20, color: "#a78bfa" },
    { name: "Pediatrics", value: 20, color: "#34d399" },
  ];

  const upcomingAppts = stats?.upcomingAppointments || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#080d1e]/95 border border-white/[0.08] text-white px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl">
          <p className="text-xs font-bold text-slate-500 mb-1.5">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p
              key={i}
              className="text-xs font-extrabold flex items-center gap-1.5 mt-1"
              style={{ color: entry.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Compile active alerts (Persistent Critical Alerts Panel)
  const criticalAlerts: any[] = [];
  
  if (stats?.telemetry?.activeQueue > 8) {
    criticalAlerts.push({
      id: "queue_overload",
      type: "CRITICAL",
      title: "OPD Queue Saturation",
      message: `${stats.telemetry.activeQueue} patients currently waiting. Check-in backlog detected.`,
      actionLabel: "Clear Queue",
      path: "/dashboard/queue",
      color: "border-red-500/30 bg-red-500/10 text-red-400"
    });
  }
  
  if (stats?.occupancyRate > 75) {
    criticalAlerts.push({
      id: "occupancy_warning",
      type: "WARNING",
      title: "Capacity Limit Warning",
      message: `Bed occupancy rate at ${stats.occupancyRate}%. Coordinate general ward discharges.`,
      actionLabel: "Manage Wards",
      path: "/dashboard/admissions",
      color: "border-amber-500/30 bg-amber-500/10 text-amber-400"
    });
  }

  if (stats?.telemetry?.pendingLabs > 5) {
    criticalAlerts.push({
      id: "labs_delay",
      type: "INFO",
      title: "STAT Lab Assay Backlog",
      message: `${stats.telemetry.pendingLabs} samples waiting processing. Check with laboratory.`,
      actionLabel: "View Orders",
      path: "/dashboard/labs",
      color: "border-sky-500/30 bg-sky-500/10 text-sky-400"
    });
  }

  // Simulated static/clinical alert to guarantee at least one persistent alert
  criticalAlerts.push({
    id: "low_supplies",
    type: "WARNING",
    title: "Critical Supplies Low",
    message: "Reorder level reached for: Saline IV Bags. Remaining stock under 15 units.",
    actionLabel: "Verify Stock",
    path: "/dashboard/inventory",
    color: "border-amber-500/30 bg-amber-500/10 text-amber-400"
  });

  return (
    <div className="space-y-6 pb-10 animate-fade-in-up">
      
      {/* 1. Command Center Header Panel */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 border rounded-2xl relative overflow-hidden transition-all duration-300 ${
        theme === 'dark'
          ? "bg-slate-900 border-slate-800 shadow-2xl"
          : "bg-white border-slate-200/60 shadow-sm"
      }`}>
        <div className="relative z-10 space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            <h2 className={`text-xl lg:text-2xl font-black tracking-tight flex items-center gap-2 ${
              theme === 'dark' ? "text-white" : "text-slate-900"
            }`}>
              Clinical Operations Command Center
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest font-mono border border-red-500/25 bg-red-500/10 text-red-500">
              Live System Active
            </span>
          </div>
          <p className={`text-xs font-semibold ${
            theme === 'dark' ? "text-slate-400" : "text-slate-600"
          }`}>
            Real-time multi-department operational overview · {" "}
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Global Clock & Live simulator toggle */}
        <div className="flex flex-wrap items-center gap-4 relative z-10">
          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs shadow-inner border ${
            theme === 'dark'
              ? "bg-slate-800/50 border-slate-700 text-slate-300"
              : "bg-slate-50 border-slate-200 text-slate-600"
          }`}>
            <Clock className={`w-3.5 h-3.5 ${theme === 'dark' ? "text-slate-400" : "text-blue-500"}`} />
            <span className={`text-[10px] font-black uppercase tracking-wider font-mono ${
              theme === 'dark' ? "text-slate-500" : "text-slate-400"
            }`}>SYSTEM TIME</span>
            <span className={`font-mono font-bold tracking-widest tabular-nums ${
              theme === 'dark' ? "text-slate-200" : "text-blue-600"
            }`}>
              {formatTime(currentTime)}
            </span>
          </div>
          <Link
            to="/dashboard/simulator"
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-indigo-600 text-white rounded-xl text-xs font-black tracking-wider uppercase shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Simulation Control
          </Link>
        </div>
      </div>

      {/* Role-based Pharmacist Dashboard OR Layered Hospital Command Center */}
      {role === "PHARMACIST" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up">
          {/* Pharmacist Dispenser Hub */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-card rounded-2xl border p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-1">
                Prescription Dispensing Portal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-semibold">
                Verify patient identity and dispense authorized prescriptions. Enter the patient's unique 6-digit Patient ID.
              </p>

              <form onSubmit={handleRxSearch} className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <input
                    type="text"
                    maxLength={6}
                    value={rxSearchId}
                    onChange={(e) => setRxSearchId(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit Patient ID (e.g. 123456)"
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl pl-11 pr-4 py-3.5 text-slate-900 dark:text-white placeholder-slate-500 font-bold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono tracking-widest text-center text-lg shadow-inner"
                  />
                  <Search className="absolute left-4 top-4.5 w-5 h-5 text-slate-500" />
                </div>
                <button
                  type="submit"
                  disabled={rxLoading}
                  className="px-6 py-3.5 bg-gradient-to-r from-red-600 to-indigo-600 text-white font-black tracking-wider uppercase rounded-xl hover:shadow-lg hover:shadow-red-950/30 active:scale-95 transition-all text-xs cursor-pointer disabled:opacity-55"
                >
                  {rxLoading ? "Retrieving..." : "Retrieve Patient Rx"}
                </button>
              </form>

              {rxError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold mb-4">
                  {rxError}
                </div>
              )}

              {rxSuccessMsg && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-4">
                  {rxSuccessMsg}
                </div>
              )}

              {rxPatient && (
                <div className="space-y-6 animate-fade-in-up mt-6 border-t border-slate-200/60 dark:border-white/[0.06] pt-6">
                  <div className="flex justify-between items-start bg-[var(--inner-bg)] p-4 rounded-xl border border-[var(--inner-border)]">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{rxPatient.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                        Gender: {rxPatient.gender || "Unspecified"} · DOB: {rxPatient.dateOfBirth ? new Date(rxPatient.dateOfBirth).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/25 rounded-md text-[10px] font-black text-red-600 dark:text-red-400 tracking-wider font-mono">
                      HSC-{rxPatient.sixDigitId}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Active Prescriptions</h5>
                    {rxPatient.prescriptions?.length === 0 ? (
                      <p className="text-xs text-slate-500 font-medium py-4 text-center">No prescriptions found for this patient at this hospital.</p>
                    ) : (
                      <div className="space-y-3">
                        {rxPatient.prescriptions.map((rx: any) => (
                          <div key={rx.id} className="p-4 rounded-xl border border-[var(--inner-border)] bg-[var(--inner-bg)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800 dark:text-white">Diagnosis: {rx.diagnosis}</span>
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                                  rx.status === 'ISSUED' 
                                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20' 
                                    : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08]'
                                  }`}>
                                  {rx.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium font-mono">Meds: {rx.medicines}</p>
                              {rx.instructions && <p className="text-[10px] text-slate-500 font-medium italic">Instructions: {rx.instructions}</p>}
                              <p className="text-[10px] text-slate-500 font-semibold">Prescribed by Dr. {rx.doctor?.name || "Medical Practitioner"} on {new Date(rx.date).toLocaleDateString()}</p>
                            </div>
                            {rx.status === "ISSUED" && (
                              <button
                                onClick={() => handleDispense(rx.id)}
                                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black tracking-wider uppercase rounded-lg text-[10px] hover:shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer flex-shrink-0"
                              >
                                Dispense Medicines
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="glass-card rounded-2xl border p-6 shadow-xl">
              <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4">
                Pharmacy Monitor Stats
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-[var(--inner-border)] bg-[var(--inner-bg)]">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Dispensed Today</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">12 Patients</p>
                </div>
                <div className="p-4 rounded-xl border border-[var(--inner-border)] bg-[var(--inner-bg)]">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Formulation Queue</p>
                  <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{pendingRxCount} Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* ==================== LAYER 1: CRITICAL INFORMATION (TOP LAYER) ==================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 stagger-in">
            
            {/* 1.1 Alert & Emergency Rail (5 Columns) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#0b0f1a]/80 border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm dark:shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/[0.02] rounded-full blur-[80px] pointer-events-none" />
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.04] pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <h3 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest">
                      Live Triage Alerts Rail
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/25 rounded-md text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest font-mono">
                    System Control
                  </span>
                </div>

                <div className="space-y-3 max-h-[190px] overflow-y-auto pr-1">
                  {criticalAlerts.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No active clinical triage emergencies detected.
                    </div>
                  ) : (
                    criticalAlerts.map((alert, i) => (
                      <div key={i} className={`p-3 rounded-xl border ${alert.color} relative overflow-hidden`}>
                        <div className="flex items-center gap-2 justify-between mb-1">
                          <span className="text-[8px] font-black tracking-widest uppercase font-mono">{alert.type}</span>
                          <Link to={alert.path} className="text-[8px] font-black underline uppercase tracking-wider font-mono cursor-pointer">
                            {alert.actionLabel} →
                          </Link>
                        </div>
                        <p className="text-xs font-bold dark:text-white">{alert.title}</p>
                        <p className="text-[9px] dark:text-slate-300 leading-normal font-semibold opacity-85 mt-0.5">{alert.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Code Indicators */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.04] text-[9px] font-black font-mono tracking-wider text-center">
                <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                  CODE RED: NORMAL
                </div>
                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 animate-pulse">
                  CODE BLUE: 1 ACT
                </div>
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
                  CODE GOLD: NORMAL
                </div>
              </div>
            </div>

            {/* 1.2 ICU & Bed Capacity Monitor (4 Columns) */}
            <div className="lg:col-span-4 bg-white dark:bg-[#0b0f1a]/80 border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.04] pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Bed className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest">
                      Bed Capacity Monitor
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {stats?.occupiedBeds || 0} / {stats?.totalBeds || 0} Occupied
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>ICU Beds</span>
                      <span className="text-red-500">88% Capacity</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-white/[0.03] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-red-500" style={{ width: "88%" }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>General Wards</span>
                      <span className="text-emerald-500">{occupancyRateCount}% Capacity</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-white/[0.03] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${occupancyRateCount}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Emergency Triage Beds</span>
                      <span className="text-amber-500">92% Capacity</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-white/[0.03] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: "92%" }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-slate-400 font-bold border-t border-slate-100 dark:border-white/[0.04] pt-3 mt-4 flex items-center justify-between">
                <span>Avg Triage to Bed Entry</span>
                <span className="text-slate-700 dark:text-white font-black">~8.5 Mins</span>
              </div>
            </div>

            {/* 1.3 Active Telemetry Backlog Counters (3 Columns) */}
            <div className="lg:col-span-3 grid grid-cols-2 gap-4">
              
              <div className="bg-white dark:bg-[#0b0f1a]/80 border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between shadow-sm dark:shadow-xl">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">OPD Queue</span>
                <p className="text-3xl font-black text-red-500 tracking-tight tabular-nums mt-1">{activeQueueCount}</p>
                <span className="text-[8px] font-bold text-slate-400 mt-2">Waiting Triage</span>
              </div>

              <div className="bg-white dark:bg-[#0b0f1a]/80 border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between shadow-sm dark:shadow-xl">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Lab Delays</span>
                <p className="text-3xl font-black text-amber-500 tracking-tight tabular-nums mt-1">{pendingLabsCount}</p>
                <span className="text-[8px] font-bold text-slate-400 mt-2">STAT Backlog</span>
              </div>

              <div className="bg-white dark:bg-[#0b0f1a]/80 border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between shadow-sm dark:shadow-xl">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Rx</span>
                <p className="text-3xl font-black text-blue-500 tracking-tight tabular-nums mt-1">{pendingRxCount}</p>
                <span className="text-[8px] font-bold text-slate-400 mt-2">To Dispense</span>
              </div>

              <div className="bg-white dark:bg-[#0b0f1a]/80 border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between shadow-sm dark:shadow-xl">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Claims</span>
                <p className="text-3xl font-black text-slate-700 dark:text-white tracking-tight tabular-nums mt-1">{pendingClaimsCount}</p>
                <span className="text-[8px] font-bold text-slate-400 mt-2">Under Review</span>
              </div>

            </div>

          </div>

          {/* ==================== LAYER 2: OPERATIONS CONSOLE (MIDDLE LAYER) ==================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* 2.1 OPD Flow & Quick Actions Console (8 Columns) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Actions Console */}
              <div className="bg-white dark:bg-[#0b0f1a]/80 rounded-2xl p-5 border border-slate-200/60 dark:border-white/[0.06] shadow-sm dark:shadow-xl">
                <div className="mb-4 pb-3 border-b border-slate-100 dark:border-white/[0.04] flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest">
                      Quick Operations Control
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Direct entry portal for clinician check-ins and logs</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { id: "PATIENT", label: "Register Patient", icon: PlusCircle, color: "hover:border-red-500/30 hover:bg-red-500/5 text-red-500 border-slate-200 dark:border-white/[0.04]", roles: ["ADMIN", "RECEPTIONIST", "STAFF"] },
                    { id: "APPOINTMENT", label: "Book Queue Slot", icon: CalendarClock, color: "hover:border-blue-500/30 hover:bg-blue-500/5 text-blue-500 border-slate-200 dark:border-white/[0.04]", roles: ["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE", "STAFF"] },
                    { id: "VITALS", label: "Record Vitals", icon: HeartPulse, color: "hover:border-indigo-500/30 hover:bg-indigo-500/5 text-indigo-500 border-slate-200 dark:border-white/[0.04]", roles: ["ADMIN", "NURSE", "RECEPTIONIST", "DOCTOR"] },
                    { id: "PRESCRIPTION", label: "Write E-Prescription", icon: FileText, color: "hover:border-amber-500/30 hover:bg-amber-500/5 text-amber-500 border-slate-200 dark:border-white/[0.04]", roles: ["ADMIN", "DOCTOR"] },
                  ].filter(a => !role || a.roles.includes(role)).map((a, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setFormError("");
                        setFormSuccess("");
                        setRegisteredPatientInfo(null);
                        setActiveModal(a.id as any);
                      }}
                      className={`flex flex-col items-center justify-center p-3 border bg-slate-50/50 dark:bg-slate-950/20 rounded-xl transition-all duration-300 hover:-translate-y-0.5 ${a.color} text-center cursor-pointer`}
                    >
                      <a.icon className="w-5 h-5 mb-2 transition-transform group-hover:scale-105" />
                      <span className="text-xs font-bold tracking-tight">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Consultation Calendar Roster (Denser layout) */}
              <div className="bg-white dark:bg-[#0b0f1a]/80 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] overflow-hidden shadow-sm dark:shadow-xl">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.04] flex items-center justify-between bg-gradient-to-r from-red-500/[0.02] to-transparent">
                  <div className="flex items-center gap-2.5">
                    <CalendarClock className="w-4 h-4 text-red-500" />
                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">
                      Active consultations Queue & appointments
                    </h3>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-wider font-mono">
                    {upcomingAppts.length} PENDING INBOX
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-white/[0.04] max-h-[350px] overflow-y-auto">
                  {upcomingAppts.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                      <CalendarClock className="w-7 h-7 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 dark:text-slate-400 font-bold tracking-tight">No Pending Appointments Today</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Check-in slot buffer is empty.</p>
                    </div>
                  ) : (
                    upcomingAppts.map((apt: any) => (
                      <div
                        key={apt.id}
                        className="group flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center font-bold text-xs text-red-500 transition-colors font-mono">
                            #{apt.tokenNumber}
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                              {apt.patient?.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] text-slate-500 dark:text-slate-500 font-mono font-bold">
                                {apt.time}
                              </span>
                              <span
                                className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider font-mono ${
                                  apt.isRepeat
                                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20"
                                    : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                                }`}
                              >
                                {apt.isRepeat ? "Follow-up" : "New"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCheckIn(apt.id)}
                          className="px-3 py-1.5 text-[9px] font-black text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 uppercase tracking-widest font-mono"
                        >
                          Check In
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* 2.2 Admissions & System Feed (4 Columns) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Admissions Registry */}
              <div className="bg-white dark:bg-[#0b0f1a]/80 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] p-5 shadow-sm dark:shadow-xl">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/[0.04] pb-3 mb-4 justify-between">
                  <div className="flex items-center gap-2">
                    <Bed className="w-4 h-4 text-blue-500" />
                    <h3 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest">
                      Recent Active Admissions
                    </h3>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {!stats?.recentAdmissions || stats.recentAdmissions.length === 0 ? (
                    <p className="text-xs text-slate-500 font-medium py-4 text-center">No recent admissions recorded.</p>
                  ) : (
                    stats.recentAdmissions.map((adm: any) => (
                      <div key={adm.id} className="p-3 border rounded-xl bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-white/[0.03] flex justify-between items-center gap-2">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800 dark:text-white">{adm.patient?.name}</p>
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold">
                            {adm.bed?.room?.name} · Bed {adm.bed?.name}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest font-mono">
                          {adm.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Live Activity Feed */}
              <div className="bg-white dark:bg-[#0b0f1a]/80 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] p-5 shadow-sm dark:shadow-xl relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/[0.02] rounded-full blur-[80px] pointer-events-none" />
                
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/[0.04] pb-3 mb-4 justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <h3 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest">
                      Live Hospital Operations Log
                    </h3>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>

                <div className="space-y-3 max-h-[170px] overflow-y-auto pr-1">
                  {activityFeed.map((log) => (
                    <div key={log.id} className="p-2.5 rounded-lg border border-slate-100 dark:border-white/[0.03] bg-slate-50/50 dark:bg-slate-950/20 flex flex-col gap-1 transition-all duration-200">
                      <div className="flex justify-between items-center text-[8px] font-black font-mono">
                        <span className={`px-1.5 py-0.5 rounded tracking-widest uppercase ${
                          log.action === "SYS_INIT" ? "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10" :
                          log.action === "CHECKIN" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20" :
                          log.action === "PRESCRIPTION" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20" :
                          log.action === "REGISTER" ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20" :
                          "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20"
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 tabular-nums font-bold">
                          {log.createdAt instanceof Date ? log.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "N/A"}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-600 dark:text-slate-300 font-semibold leading-normal">{log.details}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* ==================== LAYER 3: ANALYTICS & MONITORING (BOTTOM LAYER) ==================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* 3.1 Patient Flow Curve (8 Columns) */}
            <div className="lg:col-span-8 bg-white dark:bg-gradient-to-br dark:from-[#0c1020]/90 dark:to-[#04060e]/95 rounded-2xl overflow-hidden p-5 border border-slate-200/60 dark:border-white/[0.06] shadow-sm dark:shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-slate-100 dark:border-white/[0.04] pb-3">
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-widest uppercase">
                    Weekly Patient Flow analytics
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Admissions and discharges comparison weekly curve
                  </p>
                </div>
                <div className="flex gap-4 text-[10px] font-black font-mono">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />{" "}
                    Admissions
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />{" "}
                    Discharges
                  </span>
                </div>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="admGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="disGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.08)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 700 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 700 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="admissions" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#admGrad)" dot={false} activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }} />
                    <Area type="monotone" dataKey="discharges" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#disGrad)" dot={false} activeDot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3.2 Department Workload & Financial Operations (4 Columns) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Department Workload pie chart */}
              <div className="bg-white dark:bg-[#0b0f1a]/80 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] p-5 shadow-sm dark:shadow-xl">
                <h3 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-white/[0.04] pb-2">
                  Department Workload Load
                </h3>
                
                <div className="flex items-center justify-center py-2 relative">
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-black tracking-widest">TOTAL</span>
                    <span className="text-base font-black text-slate-900 dark:text-white mt-0.5">4 Units</span>
                  </div>

                  <div className="w-28 h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={departmentData} cx="50%" cy="50%" innerRadius={38} outerRadius={46} paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {departmentData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-2.5 mt-3">
                  {departmentData.map((d) => (
                    <div key={d.name} className="space-y-0.5 text-[10px]">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                          {d.name}
                        </span>
                        <span className="text-slate-800 dark:text-white font-bold">{d.value}%</span>
                      </div>
                      <div className="h-1 bg-slate-100 dark:bg-white/[0.03] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ backgroundColor: d.color, width: `${d.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* QUICK ACTIONS MODALS */}

      {/* 1. Modal: Register Patient */}
      <Modal isOpen={activeModal === "PATIENT"} onClose={() => { setActiveModal(null); setRegisteredPatientInfo(null); }} title="Register Walk-in Patient">
        <form onSubmit={handleRegisterPatient} className="space-y-4">
          {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold">{formError}</div>}
          {formSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold space-y-2">
              <p>{formSuccess}</p>
              {registeredPatientInfo && (
                <div className="mt-2 p-3 bg-slate-950/60 rounded-lg border border-white/[0.06] space-y-1 font-mono text-[10px]">
                  <p className="text-white font-black text-xs font-sans">Patient Identity Card</p>
                  <p className="text-red-400 mt-1 font-black">Patient ID: HSC-{registeredPatientInfo.sixDigitId}</p>
                  <p>Name: {registeredPatientInfo.name}</p>
                  <p>Blood Group: {registeredPatientInfo.bloodGroup}</p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAppointmentForm(p => ({ ...p, patientId: registeredPatientInfo.id }));
                        setFormSuccess("");
                        setFormError("");
                        setRegisteredPatientInfo(null);
                        setActiveModal("APPOINTMENT");
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded font-extrabold text-[9px] hover:scale-102 active:scale-95 transition-all cursor-pointer font-sans"
                    >
                      Process Queue Booking Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!registeredPatientInfo && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="Enter patient full name"
                  value={patientForm.name}
                  onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                  className="w-full text-xs font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Contact Number</label>
                  <input
                    type="text"
                    placeholder="Enter phone number"
                    value={patientForm.contact}
                    onChange={(e) => setPatientForm({ ...patientForm, contact: e.target.value })}
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@email.com"
                    value={patientForm.email}
                    onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                    className="w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={patientForm.dateOfBirth}
                    onChange={(e) => setPatientForm({ ...patientForm, dateOfBirth: e.target.value })}
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Gender</label>
                  <select
                    value={patientForm.gender}
                    onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                    className="w-full text-xs font-bold cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Blood Group</label>
                  <select
                    value={patientForm.bloodGroup}
                    onChange={(e) => setPatientForm({ ...patientForm, bloodGroup: e.target.value })}
                    className="w-full text-xs font-bold cursor-pointer"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 p-2.5 font-bold text-slate-400 bg-slate-900 border border-white/10 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 btn-premium py-2.5 rounded-xl text-xs font-extrabold cursor-pointer"
                >
                  {formLoading ? "Registering..." : "Register Patient"}
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* 2. Modal: Book Slot */}
      <Modal isOpen={activeModal === "APPOINTMENT"} onClose={() => setActiveModal(null)} title="Book Consultation Queue Slot">
        <form onSubmit={handleBookAppointment} className="space-y-4">
          {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold">{formError}</div>}
          {formSuccess && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold">{formSuccess}</div>}

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Select Patient</label>
            <select
              required
              value={appointmentForm.patientId}
              onChange={(e) => setAppointmentForm({ ...appointmentForm, patientId: e.target.value })}
              className="w-full text-xs font-bold cursor-pointer"
            >
              <option value="">-- Choose Registered Patient --</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} (HSC-{p.sixDigitId || "WALK_IN"})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Assign Doctor</label>
            <select
              required
              value={appointmentForm.doctorId}
              onChange={(e) => setAppointmentForm({ ...appointmentForm, doctorId: e.target.value })}
              className="w-full text-xs font-bold cursor-pointer"
            >
              <option value="">-- Choose Doctor on Duty --</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>Dr. {d.name} ({d.specialty})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Appointment Date</label>
              <input
                type="date"
                required
                value={appointmentForm.date}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Time Slot</label>
              <input
                type="text"
                required
                placeholder="e.g. 10:00 AM"
                value={appointmentForm.time}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
                className="w-full text-xs"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="flex-1 p-2.5 font-bold text-slate-400 bg-slate-900 border border-white/10 rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 btn-premium py-2.5 rounded-xl text-xs font-extrabold cursor-pointer"
            >
              {formLoading ? "Confirming..." : "Confirm Slot & Token"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Modal: Record Vitals */}
      <Modal isOpen={activeModal === "VITALS"} onClose={() => setActiveModal(null)} title="Record Vitals Log">
        <form onSubmit={handleRecordVitals} className="space-y-4">
          {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold">{formError}</div>}
          
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Patient Name</label>
            <input
              type="text"
              required
              placeholder="Full name of the patient"
              value={vitalsForm.patientName}
              onChange={(e) => setVitalsForm({ ...vitalsForm, patientName: e.target.value })}
              className="w-full text-xs font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Blood Pressure</label>
              <input
                type="text"
                required
                placeholder="e.g. 120/80"
                value={vitalsForm.bloodPressure}
                onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressure: e.target.value })}
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Heart Rate (bpm)</label>
              <input
                type="number"
                required
                placeholder="e.g. 72"
                value={vitalsForm.heartRate}
                onChange={(e) => setVitalsForm({ ...vitalsForm, heartRate: e.target.value })}
                className="w-full text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Temperature (°F)</label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="e.g. 98.6"
                value={vitalsForm.temperature}
                onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Oxygen Saturation (%)</label>
              <input
                type="number"
                required
                placeholder="e.g. 98"
                value={vitalsForm.oxygenSaturation}
                onChange={(e) => setVitalsForm({ ...vitalsForm, oxygenSaturation: e.target.value })}
                className="w-full text-xs"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="flex-1 p-2.5 font-bold text-slate-400 bg-slate-900 border border-white/10 rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 btn-premium py-2.5 rounded-xl text-xs font-extrabold cursor-pointer"
            >
              {formLoading ? "Recording..." : "Record Vitals Log"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. Modal: E-Prescription */}
      <Modal isOpen={activeModal === "PRESCRIPTION"} onClose={() => setActiveModal(null)} title="Write E-Prescription Formulation">
        <form onSubmit={handleWritePrescription} className="space-y-4">
          {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold">{formError}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Select Patient</label>
              <select
                required
                value={prescriptionForm.patientId}
                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, patientId: e.target.value })}
                className="w-full text-xs font-bold cursor-pointer"
              >
                <option value="">Select Patient</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Select Doctor</label>
              <select
                required
                value={prescriptionForm.doctorId}
                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, doctorId: e.target.value })}
                className="w-full text-xs font-bold cursor-pointer"
              >
                <option value="">Select Doctor</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>Dr. {d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Diagnosis</label>
            <input
              type="text"
              required
              placeholder="e.g. Acute Pharyngitis"
              value={prescriptionForm.diagnosis}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })}
              className="w-full text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Formulations & Medications</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Paracetamol 500mg 1-0-1 after meals (5 days)"
              value={prescriptionForm.medicines}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medicines: e.target.value })}
              className="w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Special Instructions</label>
            <input
              type="text"
              placeholder="e.g. Drink plenty of warm water. Rest for 3 days."
              value={prescriptionForm.instructions}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
              className="w-full text-xs"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="flex-1 p-2.5 font-bold text-slate-400 bg-slate-900 border border-white/10 rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 btn-premium py-2.5 rounded-xl text-xs font-extrabold cursor-pointer"
            >
              {formLoading ? "Generating..." : "Generate E-Rx"}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
