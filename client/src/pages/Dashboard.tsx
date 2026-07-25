import { useEffect, useState } from "react";
import { api } from "../services/api";
import {
  Users,
  Bed,
  Activity,
  CalendarClock,
  HeartPulse,
  Clock,
  PlusCircle,
  Search,
  ArrowRight,
  FileText,
  Pill,
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

// ============================================================================
//  PER-ROLE THEME SYSTEM
//  Each user role gets a distinct, cohesive multi-hue palette. Accents layer on
//  top of the neutral surface tokens (--card-bg / --inner-bg) so light & dark
//  modes both stay clean — only the colour family changes per role.
// ============================================================================
type RoleTheme = {
  label: string;
  gradient: string;   // hero wash
  chip: string;       // portal pill
  iconWrap: string;   // tinted square behind section/KPI icons
  dot: string;        // status dot
  clock: string;      // clock icon tint
  primary: string;    // main chart / accent hex
  secondary: string;  // secondary chart hex
  chart: string[];    // cohesive ramp for the department breakdown
};

const ROLE_THEMES: Record<string, RoleTheme> = {
  ADMIN: {
    label: "Admin",
    gradient: "from-indigo-500/[0.12] via-violet-500/[0.06] to-transparent",
    chip: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 ring-1 ring-inset ring-indigo-500/20",
    iconWrap: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    dot: "bg-indigo-500",
    clock: "text-indigo-500 dark:text-indigo-400",
    primary: "#6366f1",
    secondary: "#8b5cf6",
    chart: ["#6366f1", "#818cf8", "#a78bfa", "#c4b5fd", "#8b5cf6", "#7c3aed"],
  },
  CLINICAL: {
    label: "Clinical",
    gradient: "from-emerald-500/[0.12] via-teal-500/[0.06] to-transparent",
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/20",
    iconWrap: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    clock: "text-emerald-500 dark:text-emerald-400",
    primary: "#10b981",
    secondary: "#14b8a6",
    chart: ["#10b981", "#14b8a6", "#0d9488", "#34d399", "#2dd4bf", "#5eead4"],
  },
  LAB: {
    label: "Pharmacy & Lab",
    gradient: "from-violet-500/[0.12] via-fuchsia-500/[0.06] to-transparent",
    chip: "bg-violet-500/10 text-violet-600 dark:text-violet-300 ring-1 ring-inset ring-violet-500/20",
    iconWrap: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
    clock: "text-violet-500 dark:text-violet-400",
    primary: "#8b5cf6",
    secondary: "#d946ef",
    chart: ["#8b5cf6", "#a855f7", "#c084fc", "#d946ef", "#e879f9", "#9333ea"],
  },
  FRONT: {
    label: "Front desk",
    gradient: "from-amber-500/[0.12] via-orange-500/[0.06] to-transparent",
    chip: "bg-amber-500/10 text-amber-600 dark:text-amber-300 ring-1 ring-inset ring-amber-500/20",
    iconWrap: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    clock: "text-amber-500 dark:text-amber-400",
    primary: "#f59e0b",
    secondary: "#fb923c",
    chart: ["#f59e0b", "#fb923c", "#f97316", "#fbbf24", "#fdba74", "#ea580c"],
  },
  DEFAULT: {
    label: "Staff",
    gradient: "from-blue-500/[0.12] via-sky-500/[0.06] to-transparent",
    chip: "bg-blue-500/10 text-blue-600 dark:text-blue-300 ring-1 ring-inset ring-blue-500/20",
    iconWrap: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
    clock: "text-blue-500 dark:text-blue-400",
    primary: "#3b82f6",
    secondary: "#0ea5e9",
    chart: ["#3b82f6", "#0ea5e9", "#38bdf8", "#60a5fa", "#818cf8", "#2563eb"],
  },
};

const resolveRoleTheme = (role?: string): RoleTheme => {
  switch (role) {
    case "ADMIN":
      return ROLE_THEMES.ADMIN;
    case "DOCTOR":
    case "NURSE":
      return ROLE_THEMES.CLINICAL;
    case "PHARMACIST":
    case "LAB_TECH":
      return ROLE_THEMES.LAB;
    case "RECEPTIONIST":
    case "STAFF":
      return ROLE_THEMES.FRONT;
    default:
      return ROLE_THEMES.DEFAULT;
  }
};

export const Dashboard = () => {
  const { user, activeContext } = useAuth();
  const role = activeContext?.role; // ADMIN, DOCTOR, NURSE, RECEPTIONIST, PHARMACIST, etc.
  const rt = resolveRoleTheme(role);

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

  // Live Activity Feed — starts empty; populated from real audit logs.
  const [activityFeed, setActivityFeed] = useState<any[]>([]);

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
        // No audit logs available — leave the feed empty rather than fabricate activity.
      });
  }, [stats]);

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
      setRxSuccessMsg("Prescription successfully dispensed.");
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
              upcomingAppointments: Array.isArray(prev.upcomingAppointments)
                ? prev.upcomingAppointments.filter((a: any) => a.id !== appointmentId)
                : [],
            }
          : null,
      );
      setActivityFeed(prev => [
        {
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
      setFormSuccess("Patient registered successfully.");
      setActivityFeed(prev => [
        {
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
      setFormSuccess(`Appointment confirmed. Token #${res.tokenNumber} generated.`);
      setActivityFeed(prev => [
        {
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
      setFormSuccess("Vitals recorded successfully.");
      setActivityFeed(prev => [
        {
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
      setFormSuccess("Prescription issued successfully.");
      setActivityFeed(prev => [
        {
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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

  const occupancyRateCount = useAnimatedCounter(stats?.occupancyRate || 0);
  const icuOccupancyRateCount = useAnimatedCounter(stats?.icuOccupancyRate ?? 0);
  const erOccupancyRateCount = useAnimatedCounter(stats?.erOccupancyRate ?? 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 border-4 border-[var(--card-border)] rounded-full animate-spin"
            style={{ borderTopColor: rt.primary }}
          />
          <p className="text-[var(--text-muted)] font-semibold text-sm animate-pulse">
            Loading your dashboard…
          </p>
        </div>
      </div>
    );
  }

  const weeklyData = (stats?.weeklyData?.length ? stats.weeklyData : []) as any[];
  const departmentData = ((stats?.departmentData?.length ? stats.departmentData : []) as any[])
    .map((d: any, i: number) => ({ ...d, color: d.color || rt.chart[i % rt.chart.length] }));

  const upcomingAppts = stats?.upcomingAppointments || [];

  const greeting = (() => {
    const h = currentTime.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();
  const firstName = user?.name ? user.name.split(" ")[0] : "";
  const hospitalName = activeContext?.hospitalName;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] px-3.5 py-2.5 rounded-xl shadow-lg">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] mb-1.5">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p
              key={i}
              className="text-xs font-semibold flex items-center gap-1.5 mt-1 text-[var(--text-primary)]"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Real, threshold-driven alerts only — nothing fabricated.
  const criticalAlerts: any[] = [];

  if (stats?.telemetry?.activeQueue > 8) {
    criticalAlerts.push({
      id: "queue_overload",
      type: "Attention",
      title: "OPD queue is building up",
      message: `${stats.telemetry.activeQueue} patients are waiting. Consider opening another counter.`,
      actionLabel: "Manage queue",
      path: "/dashboard/queue",
      tone: "text-rose-600 dark:text-rose-400 bg-rose-500/[0.07] border-rose-500/20",
    });
  }

  if (stats?.occupancyRate > 75) {
    criticalAlerts.push({
      id: "occupancy_warning",
      type: "Capacity",
      title: "Beds are filling up",
      message: `Occupancy is at ${stats.occupancyRate}%. Review pending discharges to free capacity.`,
      actionLabel: "Manage wards",
      path: "/dashboard/admissions",
      tone: "text-amber-600 dark:text-amber-400 bg-amber-500/[0.07] border-amber-500/20",
    });
  }

  if (stats?.telemetry?.pendingLabs > 5) {
    criticalAlerts.push({
      id: "labs_delay",
      type: "Labs",
      title: "Lab results are backing up",
      message: `${stats.telemetry.pendingLabs} samples are awaiting processing.`,
      actionLabel: "View orders",
      path: "/dashboard/labs",
      tone: "text-sky-600 dark:text-sky-400 bg-sky-500/[0.07] border-sky-500/20",
    });
  }

  const kpis = [
    {
      label: "OPD queue",
      sub: "Patients waiting",
      value: activeQueueCount,
      icon: Users,
      urgent: (stats?.telemetry?.activeQueue || 0) > 8,
    },
    {
      label: "Lab backlog",
      sub: "Samples pending",
      value: pendingLabsCount,
      icon: Activity,
      urgent: (stats?.telemetry?.pendingLabs || 0) > 5,
    },
    {
      label: "Active prescriptions",
      sub: "Awaiting dispense",
      value: pendingRxCount,
      icon: Pill,
      urgent: false,
    },
    {
      label: "Bed occupancy",
      sub: `${stats?.occupiedBeds || 0} of ${stats?.totalBeds || 0} beds`,
      value: `${occupancyRateCount}%`,
      icon: Bed,
      urgent: (stats?.occupancyRate || 0) > 85,
    },
  ];

  const quickActions = [
    { id: "PATIENT", label: "Register patient", icon: PlusCircle, roles: ["ADMIN", "RECEPTIONIST", "STAFF"] },
    { id: "APPOINTMENT", label: "Book a slot", icon: CalendarClock, roles: ["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE", "STAFF"] },
    { id: "VITALS", label: "Record vitals", icon: HeartPulse, roles: ["ADMIN", "NURSE", "RECEPTIONIST", "DOCTOR"] },
    { id: "PRESCRIPTION", label: "Write e-prescription", icon: FileText, roles: ["ADMIN", "DOCTOR"] },
  ].filter(a => !role || a.roles.includes(role));

  return (
    <div className="space-y-6 pb-10 animate-fade-in-up">

      {/* ==================== HERO ==================== */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 sm:p-8 shadow-sm">
        <div className={`absolute inset-0 bg-gradient-to-br ${rt.gradient} pointer-events-none`} />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2.5">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${rt.chip}`}>
              <span className="relative flex h-1.5 w-1.5">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${rt.dot} opacity-75`} />
                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${rt.dot}`} />
              </span>
              {rt.label} portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              {greeting}{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {hospitalName ? `${hospitalName} · ` : ""}
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] px-4 py-2.5">
              <Clock className={`h-4 w-4 ${rt.clock}`} />
              <div className="leading-tight">
                <p className="text-[11px] text-[var(--text-muted)]">Local time</p>
                <p className="font-mono text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                  {formatTime(currentTime)}
                </p>
              </div>
            </div>
            <Link
              to="/dashboard/simulator"
              className="flex items-center gap-2 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--inner-bg)] active:scale-[0.98]"
            >
              <Activity className={`h-4 w-4 ${rt.clock}`} />
              Simulator
            </Link>
          </div>
        </div>
      </div>

      {role === "PHARMACIST" ? (
        /* ==================== PHARMACIST PORTAL ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up">
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">
                Dispense prescriptions
              </h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)] mb-6">
                Enter the patient's 6-digit ID to verify identity and dispense their authorized prescriptions.
              </p>

              <form onSubmit={handleRxSearch} className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <input
                    type="text"
                    maxLength={6}
                    value={rxSearchId}
                    onChange={(e) => setRxSearchId(e.target.value.replace(/\D/g, ""))}
                    placeholder="Patient ID e.g. 123456"
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl pl-11 pr-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] font-semibold focus:outline-none focus:ring-2 font-mono tracking-[0.3em] text-center text-lg"
                    style={{ outlineColor: rt.primary }}
                  />
                  <Search className="absolute left-4 top-3.5 w-4 h-4 text-[var(--text-muted)]" />
                </div>
                <button
                  type="submit"
                  disabled={rxLoading}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-55"
                  style={{ backgroundColor: rt.primary }}
                >
                  {rxLoading ? "Retrieving…" : "Retrieve"}
                </button>
              </form>

              {rxError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium mb-4">
                  {rxError}
                </div>
              )}

              {rxSuccessMsg && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-4">
                  {rxSuccessMsg}
                </div>
              )}

              {rxPatient && (
                <div className="space-y-6 animate-fade-in-up mt-6 border-t border-[var(--card-border)] pt-6">
                  <div className="flex justify-between items-start bg-[var(--inner-bg)] p-4 rounded-xl border border-[var(--inner-border)]">
                    <div>
                      <h4 className="text-base font-semibold text-[var(--text-primary)]">{rxPatient.name}</h4>
                      <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                        {rxPatient.gender || "Unspecified"} · DOB {rxPatient.dateOfBirth ? new Date(rxPatient.dateOfBirth).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold font-mono" style={{ backgroundColor: `${rt.primary}1a`, color: rt.primary }}>
                      HSC-{rxPatient.sixDigitId}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-sm font-semibold text-[var(--text-secondary)]">Active prescriptions</h5>
                    {rxPatient.prescriptions?.length === 0 ? (
                      <p className="text-sm text-[var(--text-muted)] py-4 text-center">No prescriptions found for this patient at this hospital.</p>
                    ) : (
                      <div className="space-y-3">
                        {rxPatient.prescriptions.map((rx: any) => (
                          <div key={rx.id} className="p-4 rounded-xl border border-[var(--inner-border)] bg-[var(--inner-bg)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-[var(--text-primary)]">{rx.diagnosis}</span>
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                  rx.status === 'ISSUED'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  }`}>
                                  {rx.status}
                                </span>
                              </div>
                              <p className="text-sm text-[var(--text-secondary)] font-mono">{rx.medicines}</p>
                              {rx.instructions && <p className="text-[13px] text-[var(--text-muted)] italic">{rx.instructions}</p>}
                              <p className="text-[13px] text-[var(--text-muted)]">Prescribed by Dr. {rx.doctor?.name || "Medical Practitioner"} · {new Date(rx.date).toLocaleDateString()}</p>
                            </div>
                            {rx.status === "ISSUED" && (
                              <button
                                onClick={() => handleDispense(rx.id)}
                                className="px-4 py-2 text-white font-semibold rounded-xl text-sm transition-all active:scale-95 flex-shrink-0"
                                style={{ backgroundColor: rt.primary }}
                              >
                                Dispense
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
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Pharmacy overview</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-[var(--inner-border)] bg-[var(--inner-bg)]">
                  <p className="text-[13px] text-[var(--text-muted)]">Awaiting dispense</p>
                  <p className="text-3xl font-bold text-[var(--text-primary)] mt-1 tabular-nums">{pendingRxCount}</p>
                </div>
                <div className="p-4 rounded-xl border border-[var(--inner-border)] bg-[var(--inner-bg)]">
                  <p className="text-[13px] text-[var(--text-muted)]">Lab samples pending</p>
                  <p className="text-3xl font-bold text-[var(--text-primary)] mt-1 tabular-nums">{pendingLabsCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ==================== KPI ROW ==================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-in">
            {kpis.map((kpi, i) => (
              <div key={i} className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-sm transition-all hover:-translate-y-0.5">
                <div className="flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${rt.iconWrap}`}>
                    <kpi.icon className="h-5 w-5" />
                  </div>
                  {kpi.urgent && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      Needs attention
                    </span>
                  )}
                </div>
                <p className="mt-4 text-3xl font-bold tracking-tight tabular-nums text-[var(--text-primary)]">
                  {kpi.value}
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{kpi.label}</p>
                <p className="text-[13px] text-[var(--text-muted)]">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* ==================== OPERATIONS ==================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            <div className="lg:col-span-8 space-y-6">

              {/* Quick actions */}
              {quickActions.length > 0 && (
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Quick actions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {quickActions.map((a, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setFormError("");
                          setFormSuccess("");
                          setRegisteredPatientInfo(null);
                          setActiveModal(a.id as any);
                        }}
                        className="group flex flex-col items-start gap-3 rounded-xl border border-[var(--inner-border)] bg-[var(--inner-bg)] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--card-hover-border)]"
                      >
                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${rt.iconWrap}`}>
                          <a.icon className="h-5 w-5" />
                        </span>
                        <span className="text-sm font-medium text-[var(--text-primary)]">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointments */}
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-[var(--card-border)] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${rt.iconWrap}`}>
                      <CalendarClock className="h-4 w-4" />
                    </span>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Today's appointments</h3>
                  </div>
                  <span className="text-[13px] font-medium text-[var(--text-muted)]">
                    {upcomingAppts.length} waiting
                  </span>
                </div>

                <div className="divide-y divide-[var(--card-border)] max-h-[350px] overflow-y-auto">
                  {upcomingAppts.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                      <CalendarClock className="w-7 h-7 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
                      <p className="text-sm text-[var(--text-secondary)] font-medium">No appointments waiting</p>
                      <p className="text-[13px] text-[var(--text-muted)] mt-1">You're all caught up.</p>
                    </div>
                  ) : (
                    upcomingAppts.map((apt: any) => (
                      <div
                        key={apt.id}
                        className="group flex items-center justify-between px-6 py-3.5 hover:bg-[var(--inner-bg)] transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl font-semibold text-sm font-mono"
                            style={{ backgroundColor: `${rt.primary}14`, color: rt.primary }}
                          >
                            #{apt.tokenNumber}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                              {apt.patient?.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[13px] text-[var(--text-muted)] font-mono">
                                {apt.time}
                              </span>
                              <span
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                                  apt.isRepeat
                                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {apt.isRepeat ? "Follow-up" : "New"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCheckIn(apt.id)}
                          className="px-4 py-1.5 text-[13px] font-semibold text-white rounded-lg transition-all active:scale-95 sm:opacity-0 sm:group-hover:opacity-100"
                          style={{ backgroundColor: rt.primary }}
                        >
                          Check in
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Patient flow */}
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Patient flow</h3>
                    <p className="text-[13px] text-[var(--text-muted)] mt-0.5">Admissions vs. discharges this week</p>
                  </div>
                  <div className="flex gap-4 text-[13px] font-medium">
                    <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rt.primary }} />
                      Admissions
                    </span>
                    <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rt.secondary }} />
                      Discharges
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="admGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={rt.primary} stopOpacity={0.18} />
                          <stop offset="95%" stopColor={rt.primary} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="disGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={rt.secondary} stopOpacity={0.18} />
                          <stop offset="95%" stopColor={rt.secondary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.12)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="admissions" stroke={rt.primary} strokeWidth={2.5} fillOpacity={1} fill="url(#admGrad)" dot={false} activeDot={{ r: 4, fill: rt.primary, strokeWidth: 2, stroke: "#fff" }} />
                      <Area type="monotone" dataKey="discharges" stroke={rt.secondary} strokeWidth={2.5} fillOpacity={1} fill="url(#disGrad)" dot={false} activeDot={{ r: 4, fill: rt.secondary, strokeWidth: 2, stroke: "#fff" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Sidebar column */}
            <div className="lg:col-span-4 space-y-6">

              {/* Alerts */}
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Needs attention</h3>
                <div className="space-y-3">
                  {criticalAlerts.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3.5">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">All clear — nothing needs attention.</p>
                    </div>
                  ) : (
                    criticalAlerts.map((alert) => (
                      <div key={alert.id} className={`rounded-xl border p-4 ${alert.tone}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{alert.type}</span>
                          <Link to={alert.path} className="inline-flex items-center gap-1 text-[13px] font-semibold hover:underline">
                            {alert.actionLabel} <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{alert.title}</p>
                        <p className="text-[13px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">{alert.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bed capacity */}
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Bed capacity</h3>
                  <span className="text-[13px] text-[var(--text-muted)]">
                    {stats?.occupiedBeds || 0} / {stats?.totalBeds || 0}
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "ICU beds", value: icuOccupancyRateCount, color: "#f43f5e" },
                    { label: "General wards", value: occupancyRateCount, color: "#10b981" },
                    { label: "Emergency triage", value: erOccupancyRateCount, color: "#f59e0b" },
                  ].map((row) => (
                    <div key={row.label} className="space-y-1.5">
                      <div className="flex justify-between text-[13px] font-medium text-[var(--text-secondary)]">
                        <span>{row.label}</span>
                        <span className="tabular-nums" style={{ color: row.color }}>{row.value}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--inner-bg)] overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${row.value}%`, backgroundColor: row.color }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[var(--card-border)] pt-4 text-[13px]">
                  <span className="text-[var(--text-muted)]">Avg. triage to bed</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {stats?.avgTriageTime != null ? `${stats.avgTriageTime} min` : "—"}
                  </span>
                </div>
              </div>

              {/* Recent admissions */}
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Recent admissions</h3>
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {!stats?.recentAdmissions || stats.recentAdmissions.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)] py-4 text-center">No recent admissions.</p>
                  ) : (
                    stats.recentAdmissions.map((adm: any) => (
                      <div key={adm.id} className="p-3.5 rounded-xl bg-[var(--inner-bg)] border border-[var(--inner-border)] flex justify-between items-center gap-2">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{adm.patient?.name}</p>
                          <p className="text-[13px] text-[var(--text-muted)]">
                            {adm.bed?.room?.name} · Bed {adm.bed?.name}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold" style={{ backgroundColor: `${rt.primary}14`, color: rt.primary }}>
                          {adm.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Activity */}
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Recent activity</h3>
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                  {activityFeed.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)] py-4 text-center">No recent activity yet.</p>
                  ) : (
                    activityFeed.map((log) => (
                      <div key={log.id} className="flex gap-3">
                        <div className="flex flex-col items-center pt-1">
                          <span className={`h-2 w-2 rounded-full ${rt.dot}`} />
                          <span className="w-px flex-1 bg-[var(--card-border)] mt-1" />
                        </div>
                        <div className="pb-1 min-w-0">
                          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{log.details}</p>
                          <p className="text-[11px] text-[var(--text-muted)] mt-0.5 tabular-nums">
                            {log.createdAt instanceof Date ? log.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Department workload */}
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Department workload</h3>

                {(() => {
                  const totalDeptVal = departmentData.reduce((acc, curr) => acc + curr.value, 0);
                  if (totalDeptVal === 0) {
                    return <p className="text-sm text-[var(--text-muted)] py-8 text-center">No appointment data yet.</p>;
                  }
                  return (
                    <>
                      <div className="flex items-center justify-center py-2 relative">
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-[11px] text-[var(--text-muted)]">Total</span>
                          <span className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{totalDeptVal}</span>
                        </div>
                        <div className="w-32 h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={departmentData} cx="50%" cy="50%" innerRadius={44} outerRadius={56} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                {departmentData.map((entry, i) => (
                                  <Cell key={i} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="space-y-3 mt-4">
                        {departmentData.map((d) => (
                          <div key={d.name} className="space-y-1">
                            <div className="flex items-center justify-between text-[13px]">
                              <span className="text-[var(--text-secondary)] flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                                {d.name}
                              </span>
                              <span className="text-[var(--text-primary)] font-medium tabular-nums">
                                {Math.round((d.value / totalDeptVal) * 100)}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-[var(--inner-bg)] rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ backgroundColor: d.color, width: `${(d.value / totalDeptVal) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ==================== QUICK ACTION MODALS ==================== */}

      {/* 1. Register Patient */}
      <Modal isOpen={activeModal === "PATIENT"} onClose={() => { setActiveModal(null); setRegisteredPatientInfo(null); }} title="Register Walk-in Patient">
        <form onSubmit={handleRegisterPatient} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold">{formError}</div>}
          {formSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold space-y-2">
              <p>{formSuccess}</p>
              {registeredPatientInfo && (
                <div className="mt-2 p-3 bg-white dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-white/[0.06] space-y-1 font-mono text-[10px] text-slate-600 dark:text-slate-300">
                  <p className="text-slate-900 dark:text-white font-black text-xs font-sans">Patient Identity Card</p>
                  <p className="text-red-600 dark:text-red-400 mt-1 font-black">Patient ID: HSC-{registeredPatientInfo.sixDigitId}</p>
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
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-extrabold text-[9px] active:scale-95 transition-all cursor-pointer font-sans"
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
                  className="flex-1 p-2.5 font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-xs transition-colors"
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

      {/* 2. Book Slot */}
      <Modal isOpen={activeModal === "APPOINTMENT"} onClose={() => setActiveModal(null)} title="Book Consultation Queue Slot">
        <form onSubmit={handleBookAppointment} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold">{formError}</div>}
          {formSuccess && <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold">{formSuccess}</div>}

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
              className="flex-1 p-2.5 font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-xs transition-colors"
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

      {/* 3. Record Vitals */}
      <Modal isOpen={activeModal === "VITALS"} onClose={() => setActiveModal(null)} title="Record Vitals Log">
        <form onSubmit={handleRecordVitals} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold">{formError}</div>}

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
              className="flex-1 p-2.5 font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-xs transition-colors"
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

      {/* 4. E-Prescription */}
      <Modal isOpen={activeModal === "PRESCRIPTION"} onClose={() => setActiveModal(null)} title="Write E-Prescription Formulation">
        <form onSubmit={handleWritePrescription} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold">{formError}</div>}

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
              className="flex-1 p-2.5 font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-xs transition-colors"
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
