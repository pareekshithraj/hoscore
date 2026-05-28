import { useEffect, useState } from 'react';
import { Activity, AlertCircle, Archive, Calculator, CheckCircle2, Database, HardDrive, RefreshCw, ServerCog, Users } from 'lucide-react';
import { api } from '../../services/api';

interface UsagePricing {
  neon: {
    storageUsdPerGbMonth: number;
    launchCuHourUsd: number;
    freeCuHoursPerProject: number;
    freeStorageGbMonthPerProject: number;
  };
  r2: {
    storageUsdPerGbMonth: number;
    classAUsdPerMillion: number;
    classBUsdPerMillion: number;
    freeStorageGbMonth: number;
    freeClassAOperations: number;
    freeClassBOperations: number;
  };
}

interface PlatformUsage {
  generatedAt: string;
  tenants: {
    hospitals: number;
    users: number;
    patients: number;
    activeSubscriptions: number;
  };
  neon: {
    databaseName: string;
    storageBytes: number;
    storageGb: number;
    estimatedStorageCostUsd: number;
    pricing: UsagePricing['neon'];
  };
  r2: {
    bucket: string;
    isConfigured: boolean;
    objectCount: number;
    storageBytes: number;
    storageGb: number;
    estimatedStorageCostUsd: number;
    pricing: UsagePricing['r2'];
  };
  notes: string[];
}

interface DeploymentAudit {
  generatedAt: string;
  environment: string;
  summary: {
    configured: number;
    missingRequired: number;
    missingRecommended: number;
  };
  checks: Array<{
    key: string;
    label: string;
    status: 'configured' | 'missing' | 'fallback';
    severity: 'required' | 'recommended';
    note: string;
  }>;
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
};

const formatUsd = (value: number) => `$${value.toFixed(value < 1 ? 4 : 2)}`;

export const UsageBilling = () => {
  const [usage, setUsage] = useState<PlatformUsage | null>(null);
  const [audit, setAudit] = useState<DeploymentAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsage = async () => {
    setLoading(true);
    setError('');
    try {
      const [usageData, auditData] = await Promise.all([
        api.get('/super-admin/usage'),
        api.get('/super-admin/deployment-readiness').catch(() => null),
      ]);
      setUsage(usageData);
      setAudit(auditData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsage();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !usage) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-red-500/20 text-red-300 flex items-center gap-3">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm font-bold">{error || 'Usage telemetry is unavailable'}</span>
      </div>
    );
  }

  const storageRows = [
    {
      label: 'Neon Postgres',
      icon: Database,
      primary: formatBytes(usage.neon.storageBytes),
      secondary: usage.neon.databaseName,
      cost: formatUsd(usage.neon.estimatedStorageCostUsd),
      free: `${usage.neon.pricing.freeStorageGbMonthPerProject} GB-month included per project`,
    },
    {
      label: 'Cloudflare R2',
      icon: HardDrive,
      primary: formatBytes(usage.r2.storageBytes),
      secondary: usage.r2.isConfigured ? `${usage.r2.objectCount.toLocaleString()} objects in ${usage.r2.bucket}` : 'R2 is not configured',
      cost: formatUsd(usage.r2.estimatedStorageCostUsd),
      free: `${usage.r2.pricing.freeStorageGbMonth} GB-month included`,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Usage & Costs</h1>
          <p className="text-sm text-slate-400 font-semibold mt-1">
            Live Neon and R2 storage telemetry with pricing assumptions.
          </p>
        </div>
        <button
          onClick={loadUsage}
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-xs font-bold text-slate-200 hover:bg-white/[0.06] transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Hospitals', value: usage.tenants.hospitals, icon: Archive },
          { label: 'Users', value: usage.tenants.users, icon: Users },
          { label: 'Patients', value: usage.tenants.patients, icon: Activity },
          { label: 'Active Subs', value: usage.tenants.activeSubscriptions, icon: Calculator },
        ].map((item) => (
          <div key={item.label} className="glass-card rounded-2xl p-5 border border-white/[0.04]">
            <item.icon className="w-5 h-5 text-rose-400 mb-4" />
            <div className="text-2xl font-black text-white tabular-nums">{item.value.toLocaleString()}</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-extrabold mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {storageRows.map((row) => (
          <div key={row.label} className="glass-card rounded-2xl p-6 border border-white/[0.04]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-sky-400">
                  <row.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-extrabold text-white">{row.label}</h2>
                  <p className="text-xs text-slate-400 truncate">{row.secondary}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xl font-black text-white tabular-nums">{row.primary}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-extrabold">Stored</div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <div className="text-xs text-slate-400 font-bold">Estimated Storage Cost</div>
                <div className="mt-1 text-lg font-black text-emerald-400">{row.cost}/mo</div>
              </div>
              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <div className="text-xs text-slate-400 font-bold">Free Allowance</div>
                <div className="mt-1 text-sm font-extrabold text-white">{row.free}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {audit && (
        <div className="glass-card rounded-2xl p-6 border border-white/[0.04]">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 text-white font-extrabold">
                <ServerCog className="w-5 h-5 text-sky-400" />
                Deployment Readiness
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Production configuration audit for {audit.environment}.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Ready', value: audit.summary.configured, color: 'text-emerald-300' },
                { label: 'Required', value: audit.summary.missingRequired, color: audit.summary.missingRequired ? 'text-rose-300' : 'text-slate-400' },
                { label: 'Recommended', value: audit.summary.missingRecommended, color: audit.summary.missingRecommended ? 'text-amber-300' : 'text-slate-400' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-white/[0.03] border border-white/[0.05] px-3 py-2">
                  <div className={`text-lg font-black tabular-nums ${item.color}`}>{item.value}</div>
                  <div className="text-[9px] uppercase tracking-widest text-slate-500 font-black">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {audit.checks.map((check) => {
              const ok = check.status === 'configured';
              return (
                <div key={check.key} className={`rounded-xl border p-4 ${ok ? 'border-emerald-500/15 bg-emerald-500/[0.03]' : check.severity === 'required' ? 'border-rose-500/20 bg-rose-500/[0.04]' : 'border-amber-500/20 bg-amber-500/[0.04]'}`}>
                  <div className="flex items-start gap-3">
                    {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" /> : <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${check.severity === 'required' ? 'text-rose-300' : 'text-amber-300'}`} />}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-slate-100">{check.label}</p>
                        <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400">{check.status}</span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{check.note}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[11px] text-slate-500 font-semibold">
            Last audited {new Date(audit.generatedAt).toLocaleString()}.
          </p>
        </div>
      )}

      <div className="glass-card rounded-2xl p-6 border border-white/[0.04]">
        <h2 className="text-base font-extrabold text-white mb-4">Pricing Inputs</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 space-y-2">
            <div className="font-black text-slate-200">Neon</div>
            <p className="text-slate-400">Storage: ${usage.neon.pricing.storageUsdPerGbMonth}/GB-month</p>
            <p className="text-slate-400">Launch compute: ${usage.neon.pricing.launchCuHourUsd}/CU-hour</p>
            <p className="text-slate-400">Free compute: {usage.neon.pricing.freeCuHoursPerProject} CU-hours/project/month</p>
          </div>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 space-y-2">
            <div className="font-black text-slate-200">Cloudflare R2 Standard</div>
            <p className="text-slate-400">Storage: ${usage.r2.pricing.storageUsdPerGbMonth}/GB-month</p>
            <p className="text-slate-400">Class A: ${usage.r2.pricing.classAUsdPerMillion}/million requests</p>
            <p className="text-slate-400">Class B: ${usage.r2.pricing.classBUsdPerMillion}/million requests</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            {usage.notes.map((note) => (
              <p key={note} className="text-xs leading-5 text-amber-100/80 font-semibold">{note}</p>
            ))}
            <p className="text-[11px] text-amber-100/60">
              Last refreshed {new Date(usage.generatedAt).toLocaleString()}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
