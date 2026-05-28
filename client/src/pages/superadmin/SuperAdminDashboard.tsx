import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Building2, Users, IndianRupee, Activity, TrendingUp, ShieldAlert, Cpu, HardDrive } from 'lucide-react';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';
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
} from 'recharts';

interface SuperAdminStats {
  totalHospitals: number;
  totalUsers: number;
  totalPatients: number;
  activeSubscriptions: number;
  totalRevenue: number;
  usage?: {
    neon: { storageBytes: number; estimatedStorageCostUsd: number };
    r2: { storageBytes: number; objectCount: number; estimatedStorageCostUsd: number; isConfigured: boolean };
  };
}

const formatBytes = (bytes = 0) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
};

export const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/super-admin/stats')
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalHospitalsCount = useAnimatedCounter(stats?.totalHospitals || 0);
  const totalUsersCount = useAnimatedCounter(stats?.totalUsers || 0);
  const totalPatientsCount = useAnimatedCounter(stats?.totalPatients || 0);
  const activeSubsCount = useAnimatedCounter(stats?.activeSubscriptions || 0);
  const revenueCount = useAnimatedCounter(stats?.totalRevenue || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-white/10 border-t-[#0ea5e9] rounded-full animate-spin" />
          <p className="text-slate-400 font-bold text-xs tracking-wider animate-pulse">
            LOADING PLATFORM TELEMETRY...
          </p>
        </div>
      </div>
    );
  }

  const superAdminStats = [
    { icon: Building2, label: 'Total Hospitals', value: totalHospitalsCount, color: 'text-sky-400', badgeBg: 'bg-sky-500/10 border-sky-500/20' },
    { icon: Users, label: 'Active Users', value: totalUsersCount, color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 border-emerald-500/20' },
    { icon: Activity, label: 'Active Patients', value: totalPatientsCount, color: 'text-violet-400', badgeBg: 'bg-violet-500/10 border-violet-500/20' },
    { icon: TrendingUp, label: 'Active Subs', value: activeSubsCount, color: 'text-amber-400', badgeBg: 'bg-amber-500/10 border-amber-500/20' },
    { icon: IndianRupee, label: 'Est. Revenue', value: `₹${revenueCount.toLocaleString()}`, color: 'text-rose-400', badgeBg: 'bg-rose-500/10 border-rose-500/20' },
  ];

  // Registry registrations over time
  const growthData = [
    { name: "Jan", registrations: 4 },
    { name: "Feb", registrations: 8 },
    { name: "Mar", registrations: 12 },
    { name: "Apr", registrations: 18 },
    { name: "May", registrations: stats?.totalHospitals || 22 },
  ];

  const subscriptionData = [
    { name: "Starter Plan", value: 45, color: "#06b6d4" },
    { name: "Professional Plan", value: 35, color: "#6366f1" },
    { name: "Enterprise Plan", value: 20, color: "#8b5cf6" },
  ];

  const systemHealth = [
    { label: "Neon Storage Used", value: formatBytes(stats?.usage?.neon.storageBytes), icon: HardDrive, color: "text-sky-400" },
    { label: "R2 Storage Used", value: stats?.usage?.r2.isConfigured ? formatBytes(stats?.usage?.r2.storageBytes) : "Not configured", icon: Cpu, color: "text-emerald-400" },
    { label: "Storage Cost Est.", value: `$${((stats?.usage?.neon.estimatedStorageCostUsd || 0) + (stats?.usage?.r2.estimatedStorageCostUsd || 0)).toFixed(4)}/mo`, icon: ShieldAlert, color: "text-violet-400" },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0b0f19]/90 border border-white/10 text-white px-4.5 py-3 rounded-xl shadow-2xl backdrop-blur-xl">
          <p className="text-xs font-bold text-slate-400 mb-1.5">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p
              key={i}
              className="text-xs font-bold flex items-center gap-1.5"
              style={{ color: entry.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name || 'Hospitals'}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 glass-card rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Platform Control Center</h1>
          <p className="text-sm text-slate-400 font-semibold mt-1">HOSCORE Multi-Tenant Network Administration Dashboard</p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5 stagger-in">
        {superAdminStats.map((s, i) => (
          <div key={i} className="glass-card glass-card-hover rounded-2xl p-5 border border-white/[0.04]">
            <div className={`w-10 h-10 ${s.badgeBg} border rounded-xl flex items-center justify-center mb-4 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl lg:text-3xl font-black text-white tracking-tight tabular-nums truncate">{s.value}</p>
            <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-1.5 truncate">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Growth area chart (8 columns) */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-6 border border-white/[0.04] flex flex-col justify-between">
          <div className="mb-6">
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Hospital Registrations Growth
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Accumulated hospital network expansion curve
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="registrations"
                  name="Hospitals"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#growthGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#0ea5e9", strokeWidth: 2, stroke: "#070b16" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription distribution (4 columns) */}
        <div className="lg:col-span-4 glass-card rounded-2xl p-6 border border-white/[0.04]">
          <h3 className="text-sm font-extrabold text-white tracking-tight mb-4 border-b border-white/[0.04] pb-3">
            Subscription Plan Share
          </h3>
          <div className="flex items-center justify-center">
            <div className="w-36 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={55}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {subscriptionData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-2 mt-5">
            {subscriptionData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-slate-400 font-semibold truncate">{d.name}</span>
                <span className="text-slate-200 font-bold ml-auto">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* System Health Indicators & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* System Health Indicators */}
        <div className="glass-card rounded-2xl p-6 border border-white/[0.04]">
          <h3 className="text-base font-extrabold text-white tracking-tight mb-6 border-b border-white/[0.04] pb-4">
            System Infrastructure Telemetry
          </h3>
          <div className="space-y-4">
            {systemHealth.map((health, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-white/[0.04] bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-white/[0.03] border border-white/[0.06] rounded-xl ${health.color}`}>
                    <health.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-300">{health.label}</span>
                </div>
                <span className="text-sm font-extrabold text-white font-mono">{health.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Shortcuts */}
        <div className="glass-card rounded-2xl p-6 border border-white/[0.04]">
          <h2 className="text-base font-extrabold text-white tracking-tight mb-6 border-b border-white/[0.04] pb-4">Administration Shortcuts</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Manage Hospitals', href: '/super-admin/hospitals', color: 'hover:border-sky-500/30 hover:bg-sky-500/5 text-sky-400' },
              { label: 'View All Users', href: '/super-admin/users', color: 'hover:border-emerald-500/30 hover:bg-emerald-500/5 text-emerald-400' },
              { label: 'Subscriptions', href: '/super-admin/subscriptions', color: 'hover:border-amber-500/30 hover:bg-amber-500/5 text-amber-400' },
              { label: 'Platform Portal', href: '/', color: 'hover:border-rose-500/30 hover:bg-rose-500/5 text-rose-400' },
            ].map((a, i) => (
              <a
                key={i}
                href={a.href}
                className={`flex flex-col items-center justify-center py-4 border border-white/[0.04] bg-white/[0.01] rounded-2xl transition-all duration-300 hover:-translate-y-1 ${a.color} font-bold text-xs text-center`}
              >
                {a.label}
              </a>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
