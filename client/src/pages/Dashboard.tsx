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

export const Dashboard = () => {
  const { activeContext } = useAuth();
  const role = activeContext?.role; // ADMIN, DOCTOR, NURSE, RECEPTIONIST, PHARMACIST, etc.

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Pharmacist portal state
  const [rxSearchId, setRxSearchId] = useState("");
  const [rxPatient, setRxPatient] = useState<any>(null);
  const [rxLoading, setRxLoading] = useState(false);
  const [rxError, setRxError] = useState("");
  const [rxSuccessMsg, setRxSuccessMsg] = useState("");

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
    } catch (err) {
      setRxError("Failed to dispense prescription.");
    }
  };

  useEffect(() => {
    api
      .get("/stats")
      .then((res) => setStats(res))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Animating stat counters
  const activeQueueCount = useAnimatedCounter(stats?.telemetry?.activeQueue || 0);
  const pendingLabsCount = useAnimatedCounter(stats?.telemetry?.pendingLabs || 0);
  const pendingRxCount = useAnimatedCounter(stats?.telemetry?.pendingRx || 0);
  const todaysShiftsCount = useAnimatedCounter(stats?.telemetry?.todaysShifts || 0);

  const totalPatientsCount = useAnimatedCounter(stats?.totalPatients || 0);
  const occupancyRateCount = useAnimatedCounter(stats?.occupancyRate || 0);
  const totalRoomsCount = useAnimatedCounter(stats?.totalRooms || 0);
  const pendingClaimsCount = useAnimatedCounter(stats?.telemetry?.pendingClaims || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/10 border-t-[#0ea5e9] rounded-full animate-spin" />
          <p className="text-slate-400 font-bold text-sm tracking-wide animate-pulse">
            INITIALIZING HOSCORE SYSTEMS...
          </p>
        </div>
      </div>
    );
  }

  const kpiData = [
    {
      label: "Active Queue",
      value: activeQueueCount,
      change: "Live",
      trend: "neutral",
      icon: Activity,
      gradient: "from-cyan-500 to-blue-500",
      badgeColor: "badge-premium-cyan",
      textColor: "text-cyan-400",
    },
    {
      label: "Pending Labs",
      value: pendingLabsCount,
      change: "Live",
      trend: "neutral",
      icon: HeartPulse,
      gradient: "from-amber-500 to-orange-500",
      badgeColor: "badge-premium-amber",
      textColor: "text-amber-400",
    },
    {
      label: "Active Prescriptions",
      value: pendingRxCount,
      change: "Live",
      trend: "neutral",
      icon: Zap,
      gradient: "from-violet-500 to-purple-600",
      badgeColor: "badge-premium-violet",
      textColor: "text-violet-400",
    },
    {
      label: "Today's Staff Shifts",
      value: todaysShiftsCount,
      change: "Live",
      trend: "neutral",
      icon: Users,
      gradient: "from-emerald-500 to-teal-500",
      badgeColor: "badge-premium-emerald",
      textColor: "text-emerald-400",
    },
  ];

  const overallData = [
    { label: "Total Patients", value: totalPatientsCount, icon: Users, color: "text-[#0ea5e9]" },
    { label: "Occupancy Rate", value: `${occupancyRateCount}%`, icon: Bed, color: "text-emerald-400" },
    { label: "Total Rooms", value: totalRoomsCount, icon: Activity, color: "text-violet-400" },
    { label: "Pending Claims", value: pendingClaimsCount, icon: ShieldCheck, color: "text-amber-400" },
  ];

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
    { name: "Cardiology", value: 35, color: "#06b6d4" },
    { name: "Neurology", value: 25, color: "#6366f1" },
    { name: "Orthopedics", value: 20, color: "#8b5cf6" },
    { name: "Pediatrics", value: 20, color: "#10b981" },
  ];

  const upcomingAppts = stats?.upcomingAppointments || [];

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
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0b0f19]/90 border border-white/10 text-white px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl">
          <p className="text-xs font-bold text-slate-400 mb-1.5">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p
              key={i}
              className="text-xs font-bold flex items-center gap-1.5"
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

  return (
    <div className="space-y-8 pb-8 animate-fade-in-up">
      {/* Header / Command Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-card rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-sky-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1.5">
            <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Hospital Command Center
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Active System
            </span>
          </div>
          <p className="text-sm text-slate-400 font-medium">
            Real-time analytics and management overview · {" "}
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-slate-300">
            <Clock className="w-4 h-4 text-sky-400" />
            <span className="font-mono font-bold tracking-wider tabular-nums">
              {formatTime(currentTime)}
            </span>
          </div>
          <Link
            to="/dashboard/simulator"
            className="btn-premium px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-sky-500/25 active:scale-95 transition-transform"
          >
            <Activity className="w-4 h-4" />
            Launch Simulator
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-in">
        {kpiData.map((stat) => {
          const isQueue = stat.label === "Today's Patient Count" || stat.label === "Active Queue";
          const CardBody = (
            <div className="h-full group glass-card glass-card-hover rounded-2xl overflow-hidden p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} bg-opacity-20 shadow-md`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${stat.badgeColor}`}>
                    {stat.change}
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  {stat.label}
                </p>
              </div>
              <p className="text-3xl font-black text-white tracking-tight tabular-nums mt-4">
                {stat.value}
              </p>
            </div>
          );

          if (isQueue && role === "DOCTOR") {
            return (
              <Link key={stat.label} to="/dashboard/queue" className="block hover:no-underline">
                {CardBody}
              </Link>
            );
          }

          return <div key={stat.label}>{CardBody}</div>;
        })}
      </div>

      {/* Role-tailored Workspace Section */}
      {role === "PHARMACIST" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up">
          {/* Pharmacist Dispenser Module */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-card rounded-2xl border border-white/[0.04] p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />
              <h3 className="text-lg font-black text-white tracking-tight mb-2">
                Sovereign Prescription Dispenser Hub
              </h3>
              <p className="text-xs text-slate-400 mb-6 font-semibold">
                Verify medical identity and dispatch authorized formulations. Enter the patient's unique 6-digit HOSCORE ID.
              </p>

              <form onSubmit={handleRxSearch} className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <input
                    type="text"
                    maxLength={6}
                    value={rxSearchId}
                    onChange={(e) => setRxSearchId(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit Patient ID (e.g. 123456)"
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 font-bold focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono tracking-widest text-center text-lg"
                  />
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                </div>
                <button
                  type="submit"
                  disabled={rxLoading}
                  className="px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-sky-500/20 active:scale-95 transition-all text-sm cursor-pointer disabled:opacity-55"
                >
                  {rxLoading ? "Retrieving..." : "Retrieve Patient Rx"}
                </button>
              </form>

              {rxError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold mb-4">
                  {rxError}
                </div>
              )}

              {rxSuccessMsg && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-4">
                  {rxSuccessMsg}
                </div>
              )}

              {rxPatient && (
                <div className="space-y-6 animate-fade-in-up mt-6 border-t border-white/[0.04] pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-extrabold text-white">{rxPatient.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 font-semibold">
                        Gender: {rxPatient.gender || "Unspecified"} · DOB: {rxPatient.dateOfBirth ? new Date(rxPatient.dateOfBirth).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-sky-500/10 border border-sky-500/25 rounded-md text-[10px] font-black text-sky-400 tracking-wider font-mono">
                      HSC-{rxPatient.sixDigitId}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Active Prescriptions</h5>
                    {rxPatient.prescriptions?.length === 0 ? (
                      <p className="text-xs text-slate-500 font-medium py-4 text-center">No prescriptions found for this patient at this hospital.</p>
                    ) : (
                      <div className="space-y-3">
                        {rxPatient.prescriptions.map((rx: any) => (
                          <div key={rx.id} className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">Diagnosis: {rx.diagnosis}</span>
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                                  rx.status === 'ISSUED' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-white/[0.05] text-slate-400 border border-white/[0.08]'
                                }`}>
                                  {rx.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 font-medium font-mono">Meds: {rx.medicines}</p>
                              {rx.instructions && <p className="text-[10px] text-slate-500 font-medium italic">Instructions: {rx.instructions}</p>}
                              <p className="text-[10px] text-slate-500 font-semibold">Prescribed by Dr. {rx.doctor?.name || "Medical Practitioner"} on {new Date(rx.date).toLocaleDateString()}</p>
                            </div>
                            {rx.status === "ISSUED" && (
                              <button
                                onClick={() => handleDispense(rx.id)}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-lg text-xs hover:shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer flex-shrink-0"
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
            <div className="glass-card rounded-2xl border border-white/[0.04] p-6">
              <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest mb-4">
                Pharmacy Stats
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01]">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dispensed Today</p>
                  <p className="text-2xl font-black text-white mt-1">12 Patients</p>
                </div>
                <div className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01]">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending Prescriptions</p>
                  <p className="text-2xl font-black text-amber-400 mt-1">{pendingRxCount} Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Charts area (8 columns) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 4 Core Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {overallData.map((d) => (
                <div
                  key={d.label}
                  className="glass-card p-4 rounded-xl border border-white/[0.04] flex items-center justify-between hover:border-white/10 transition-colors"
                >
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      {d.label}
                    </p>
                    <p className="text-xl font-extrabold text-white tracking-tight tabular-nums">{d.value}</p>
                  </div>
                  <div className={`bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.05] ${d.color}`}>
                    <d.icon className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>

            {/* Main Chart */}
            <div className="glass-card rounded-2xl overflow-hidden p-6 border border-white/[0.04]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-tight">
                    Hospital Patient Flow
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Admissions vs Discharges weekly comparison
                  </p>
                </div>
                <div className="flex gap-4 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 bg-[#0ea5e9] rounded-full shadow-[0_0_8px_rgba(14,165,233,0.5)]" />{" "}
                    Admissions
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 bg-[#10b981] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />{" "}
                    Discharges
                  </span>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={weeklyData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="admGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="disGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="admissions"
                      stroke="#0ea5e9"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#admGrad)"
                      dot={false}
                      activeDot={{ r: 5, fill: "#0ea5e9", strokeWidth: 2, stroke: "#070b16" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="discharges"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#disGrad)"
                      dot={false}
                      activeDot={{ r: 5, fill: "#10b981", strokeWidth: 2, stroke: "#070b16" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="glass-card rounded-2xl p-6 border border-white/[0.04]">
              <h3 className="text-base font-extrabold text-white tracking-tight mb-4">
                Quick Management Shortcuts
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "New Patient", path: "/dashboard/patients", icon: PlusCircle, color: "hover:border-sky-500/30 hover:bg-sky-500/5 text-sky-400", roles: ["ADMIN", "RECEPTIONIST", "STAFF"] },
                  { label: "Book Appointment", path: "/dashboard/calendar", icon: CalendarClock, color: "hover:border-emerald-500/30 hover:bg-emerald-500/5 text-emerald-400", roles: ["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE", "STAFF"] },
                  { label: "Admit Patient", path: "/dashboard/admissions", icon: Bed, color: "hover:border-violet-500/30 hover:bg-violet-500/5 text-violet-400", roles: ["ADMIN", "NURSE", "RECEPTIONIST"] },
                  { label: "Create Bill", path: "/dashboard/billing", icon: CreditCard, color: "hover:border-amber-500/30 hover:bg-amber-500/5 text-amber-400", roles: ["ADMIN"] },
                ].filter((act) => !role || act.roles.includes(role)).map((act, i) => (
                  <Link
                    key={i}
                    to={act.path}
                    className={`flex flex-col items-center justify-center p-4 border border-white/[0.04] bg-white/[0.01] rounded-2xl transition-all duration-300 hover:-translate-y-1 ${act.color} group`}
                  >
                    <act.icon className="w-6 h-6 mb-2.5 transition-transform group-hover:scale-110" />
                    <span className="text-xs font-bold text-slate-300 text-center tracking-tight">{act.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Quick Telemetry & Roster (4 columns) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Radial System Health Card */}
            <div className="bg-gradient-to-br from-[#0c142c] via-[#080d1e] to-[#04060e] rounded-2xl p-6 border border-white/[0.06] text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500 rounded-full blur-[90px] opacity-20 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-400 rounded-full blur-[80px] opacity-10 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6 border-b border-white/[0.04] pb-4">
                  <HeartPulse className="w-4 h-4 text-[#0ea5e9]" />
                  <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest">
                    Live Operations Telemetry
                  </h3>
                </div>

                <div className="flex items-center gap-6 mb-6">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="rgba(255,255,255,0.03)"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="url(#radialHealthGrad)"
                        strokeWidth="3"
                        strokeDasharray="85, 100"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="radialHealthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#0ea5e9" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-black text-xl text-white">85%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-0.5">High Efficiency</p>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      Calculated from active clinical flow & minimal bed delays.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Patient Satisfaction
                      </span>
                      <span className="text-xs font-extrabold text-emerald-400">92%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.02]">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                        style={{ width: "92%" }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-rose-400 animate-pulse" /> Critical Incidents
                      </span>
                      <span className="text-xs font-extrabold text-rose-400">0 Active</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.02]">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                        style={{ width: "0%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie Chart: Department Distribution */}
            <div className="glass-card rounded-2xl border border-white/[0.04] p-6">
              <h3 className="text-sm font-extrabold text-white tracking-tight mb-4 border-b border-white/[0.04] pb-3">
                Department Workload
              </h3>
              <div className="flex items-center justify-center">
                <div className="w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {departmentData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-5">
                {departmentData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-slate-400 font-semibold truncate">
                      {d.name}
                    </span>
                    <span className="text-slate-200 font-bold ml-auto">
                      {d.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Appointments Timeline */}
            <div className="glass-card rounded-2xl border border-white/[0.04] overflow-hidden">
              <div className="px-6 py-5 border-b border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg">
                    <CalendarClock className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white tracking-tight">
                      Appointments Calendar
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {upcomingAppts.length} active slots
                    </p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-white/[0.04] max-h-72 overflow-y-auto">
                {upcomingAppts.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <CalendarClock className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <p className="text-xs text-slate-400 font-bold tracking-tight">
                      No Scheduled Appointments
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">
                      Calendar is completely free today.
                    </p>
                  </div>
                ) : (
                  upcomingAppts.map((apt: any) => (
                    <div
                      key={apt.id}
                      className="group flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-center font-black text-xs text-slate-400 group-hover:border-sky-500/30 group-hover:text-sky-400 transition-colors">
                          #{apt.tokenNumber}
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-white">
                            {apt.patient?.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 font-mono font-bold">
                              {apt.time}
                            </span>
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                                apt.isRepeat
                                  ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              }`}
                            >
                              {apt.isRepeat ? "Follow-up" : "New Visit"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCheckIn(apt.id)}
                        className="px-3.5 py-1.5 text-[10px] font-black text-white bg-sky-500 hover:bg-sky-400 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        Check In
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
