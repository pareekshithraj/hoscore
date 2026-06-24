import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Building2, Users, IndianRupee, Activity, TrendingUp, ShieldAlert, Cpu, HardDrive } from 'lucide-react';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';
import { useAuth } from '../../context/AuthContext';
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
  const { theme } = useAuth();
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
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0ea5e9] rounded-full animate-spin" />
          <p className="text-slate-400 font-bold text-xs tracking-wider animate-pulse">
            Loading Platform Statistics...
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
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 glass-card rounded-2xl relative overflow-hidden bg-gradient-to-r from-red-500/[0.02] to-transparent border ${
        theme === 'dark' ? 'border-white/[0.04]' : 'border-slate-200/60 shadow-sm'
      }`}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <div>
            <h1 className={`text-2xl lg:text-3xl font-black tracking-tight font-sans ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Platform Admin Dashboard</h1>
            <p className={`text-xs font-semibold mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Multi-Tenant Network Administration Console</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl relative z-10 font-mono text-[10px] font-bold ${
          theme === 'dark' ? 'bg-slate-950/40 border-white/[0.06] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          SYSTEM STATUS: <span className="text-emerald-500 dark:text-emerald-400 font-black">ONLINE</span>
        </div>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 stagger-in">
        {/* Primary Metric Panel: Revenue Control */}
        <div className={`lg:col-span-5 glass-card rounded-2xl p-6 border relative overflow-hidden group transition-all duration-300 ${
          theme === 'dark'
            ? "bg-gradient-to-br from-[#0c0f1d] via-[#10172e] to-[#1e0f14] border-white/[0.06]"
            : "bg-gradient-to-br from-red-50/90 via-slate-50/80 to-blue-50/50 border-blue-200/50 shadow-sm"
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-red-500/10 transition-all duration-500" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block mb-1">PLATFORM REVENUE</span>
              <h2 className={`text-4xl font-black tracking-tight leading-none mt-2 font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                ₹{revenueCount.toLocaleString()}
              </h2>
            </div>
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-500 shadow-md">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>
          
          {/* Revenue Context subtext */}
          <div className={`mt-4 pt-4 border-t flex items-center justify-between ${theme === 'dark' ? 'border-white/[0.04]' : 'border-slate-200/60'}`}>
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Direct Subscription Billings Active
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              +14.8% MoM
            </span>
          </div>
        </div>

        {/* Secondary Grid of metrics (4 cards - 7 columns) */}
        <div className="lg:col-span-7 grid grid-cols-2 gap-6">
          {[
            { icon: Building2, label: 'Total Hospitals', value: totalHospitalsCount, color: 'text-sky-500 dark:text-sky-400', badgeBg: 'bg-sky-500/10 border-sky-500/20', subtext: 'Registered clients' },
            { icon: Users, label: 'Active Users', value: totalUsersCount, color: 'text-emerald-500 dark:text-emerald-400', badgeBg: 'bg-emerald-500/10 border-emerald-500/20', subtext: 'Staff & doctor logs' },
            { icon: Activity, label: 'Active Patients', value: totalPatientsCount, color: 'text-violet-500 dark:text-violet-400', badgeBg: 'bg-violet-500/10 border-violet-500/20', subtext: 'Medical profiles' },
            { icon: TrendingUp, label: 'Active Subscriptions', value: activeSubsCount, color: 'text-amber-500 dark:text-amber-400', badgeBg: 'bg-amber-500/10 border-amber-500/20', subtext: 'Paid recurring plans' },
          ].map((s, i) => (
            <div key={i} className={`glass-card glass-card-hover rounded-2xl p-5 border flex flex-col justify-between ${
              theme === 'dark' ? 'border-white/[0.04]' : 'border-slate-200/50'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest truncate">{s.label}</span>
                <div className={`w-8 h-8 ${s.badgeBg} border rounded-lg flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className={`text-2xl font-black tracking-tight tabular-nums mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{s.value}</p>
                <p className={`text-[10px] font-semibold mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{s.subtext}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Growth area chart (8 columns) */}
        <div className={`lg:col-span-8 glass-card rounded-2xl p-6 border flex flex-col justify-between ${
          theme === 'dark' ? 'border-white/[0.04] bg-gradient-to-b from-[#0b0f19]/80 to-transparent' : 'border-slate-200/60 shadow-sm'
        }`}>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className={`text-base font-extrabold tracking-tight uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Hospital Registrations Growth
              </h3>
              <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Accumulated hospital network expansion curve
              </p>
            </div>
            <div className="flex items-center gap-1 bg-sky-500/10 px-2.5 py-1 border border-sky-500/20 rounded-md text-[10px] font-black text-sky-500 dark:text-sky-400 tracking-wider font-mono">
              YTD GROWTH
            </div>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.05)"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="registrations"
                  name="Hospitals"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#growthGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#0ea5e9", strokeWidth: 2, stroke: theme === 'dark' ? "#070b16" : "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription distribution (4 columns) */}
        <div className={`lg:col-span-4 glass-card rounded-2xl p-6 border flex flex-col justify-between ${
          theme === 'dark' ? 'border-white/[0.04] bg-gradient-to-b from-[#0b0f19]/80 to-transparent' : 'border-slate-200/60 shadow-sm'
        }`}>
          <div className="mb-4">
            <h3 className={`text-sm font-extrabold tracking-tight uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Subscription Plan Share
            </h3>
            <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Client tier distribution
            </p>
          </div>
          
          <div className="relative flex items-center justify-center my-4">
            {/* Center Label */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[8px] text-slate-500 font-black tracking-widest uppercase">SHARES</span>
              <span className={`text-xl font-black mt-0.5 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>3 Tiers</span>
            </div>

            <div className="w-36 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
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

          <div className={`space-y-2 mt-4 pt-3 border-t ${theme === 'dark' ? 'border-white/[0.04]' : 'border-slate-200/60'}`}>
            {subscriptionData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-slate-500 dark:text-slate-400 font-semibold truncate">{d.name}</span>
                <span className={`font-extrabold ml-auto ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* System Health Indicators & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* System Health Indicators */}
        <div className={`glass-card rounded-2xl p-6 border ${
          theme === 'dark' ? 'border-white/[0.04] bg-gradient-to-b from-[#0b0f19]/80 to-transparent' : 'border-slate-200/60 shadow-sm'
        }`}>
          <div className={`mb-6 pb-4 border-b ${theme === 'dark' ? 'border-white/[0.04]' : 'border-slate-200/60'}`}>
            <h3 className={`text-base font-extrabold tracking-tight uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Infrastructure Status
            </h3>
            <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Realtime platform database & object storage health</p>
          </div>
          
          <div className="space-y-6">
            {/* Neon Postgres */}
            <div className="p-4 rounded-xl border border-[var(--inner-border)] bg-[var(--inner-bg)] shadow-inner">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-500 dark:text-sky-400">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs font-bold block font-sans ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Neon Postgres Database</span>
                    <span className="text-[9px] text-slate-500 font-semibold">Active primary multi-tenant DB</span>
                  </div>
                </div>
                <span className={`text-xs font-extrabold font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{formatBytes(stats?.usage?.neon.storageBytes)}</span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.03] dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.04] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full" 
                  style={{ width: `${Math.min(100, ((stats?.usage?.neon.storageBytes || 0) / (10 * 1024 * 1024 * 1024)) * 100)}%` }} 
                />
              </div>
            </div>

            {/* R2 Cloudflare */}
            <div className="p-4 rounded-xl border border-[var(--inner-border)] bg-[var(--inner-bg)] shadow-inner">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 dark:text-emerald-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs font-bold block font-sans ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Cloudflare R2 Object Storage</span>
                    <span className="text-[9px] text-slate-500 font-semibold">Medical records, lab uploads, PDF reports</span>
                  </div>
                </div>
                <span className={`text-xs font-extrabold font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {stats?.usage?.r2.isConfigured ? formatBytes(stats?.usage?.r2.storageBytes) : "Not Configured"}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.03] dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.04] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full" 
                  style={{ width: stats?.usage?.r2.isConfigured ? `${Math.min(100, ((stats?.usage?.r2.storageBytes || 0) / (100 * 1024 * 1024 * 1024)) * 100)}%` : '0%' }} 
                />
              </div>
            </div>

            {/* Storage Cost Est */}
            <div className="p-4 rounded-xl border border-[var(--inner-border)] bg-[var(--inner-bg)] flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-500 dark:text-violet-400">
                  <ShieldAlert className="w-4 h-4 animate-glow-pulse" />
                </div>
                <div>
                  <span className={`text-xs font-bold block font-sans ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Storage Accrued Estimate</span>
                  <span className="text-[9px] text-slate-500 font-semibold">Neon & Cloudflare billing projection</span>
                </div>
              </div>
              <span className="text-sm font-extrabold text-violet-600 dark:text-violet-400 font-mono bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-lg">
                ${((stats?.usage?.neon.estimatedStorageCostUsd || 0) + (stats?.usage?.r2.estimatedStorageCostUsd || 0)).toFixed(4)}/mo
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions Shortcuts */}
        <div className={`glass-card rounded-2xl p-6 border ${
          theme === 'dark' ? 'border-white/[0.04] bg-gradient-to-b from-[#0b0f19]/80 to-transparent' : 'border-slate-200/60 shadow-sm'
        }`}>
          <div className={`mb-6 pb-4 border-b ${theme === 'dark' ? 'border-white/[0.04]' : 'border-slate-200/60'}`}>
            <h2 className={`text-base font-extrabold tracking-tight uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Administration Shortcuts</h2>
            <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Quick access shortcuts to tenant registries & logs</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Manage Hospitals', href: '/super-admin/hospitals', color: 'hover:border-sky-500/30 hover:bg-sky-500/5 text-sky-600 dark:text-sky-400 font-mono border-[var(--inner-border)] bg-[var(--inner-bg)] shadow-sm' },
              { label: 'View All Users', href: '/super-admin/users', color: 'hover:border-emerald-500/30 hover:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-mono border-[var(--inner-border)] bg-[var(--inner-bg)] shadow-sm' },
              { label: 'Subscriptions', href: '/super-admin/subscriptions', color: 'hover:border-amber-500/30 hover:bg-amber-500/5 text-amber-600 dark:text-amber-400 font-mono border-[var(--inner-border)] bg-[var(--inner-bg)] shadow-sm' },
              { label: 'Platform Portal', href: '/', color: 'hover:border-rose-500/30 hover:bg-rose-500/5 text-rose-600 dark:text-rose-400 font-mono border-[var(--inner-border)] bg-[var(--inner-bg)] shadow-sm' },
            ].map((a, i) => (
              <a
                key={i}
                href={a.href}
                className={`flex flex-col items-center justify-center py-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 ${a.color} font-black text-xs text-center tracking-wider uppercase border`}
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
