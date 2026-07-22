import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { IndianRupee, Building2, Calendar, CheckCircle2, XCircle } from 'lucide-react';

export const ManageSubscriptions = () => {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/super-admin/subscriptions').then(setSubs).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  const totalRevenue = subs.reduce((s, sub) => s + (sub.pricePerUser * (sub.billedSeats || sub.hospital?._count?.memberships || 0)), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100">Subscriptions</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-450 mt-1">
            {subs.length} subscriptions active · Est. Revenue: <span className="font-bold text-slate-800 dark:text-zinc-300">₹{totalRevenue.toLocaleString()}/yr</span>
          </p>
        </div>
      </div>
      <div className="space-y-4">
        {subs.map((s: any) => (
          <div key={s.id} className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 p-6 shadow-sm transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/40 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-150">{s.hospital?.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-500/10 dark:bg-emerald-500/5 px-2 py-0.5 rounded tracking-wide border border-emerald-550/10">{s.plan} Plan</span>
                    <span className="flex items-center gap-0.5 font-medium"><IndianRupee className="w-3.5 h-3.5" />{s.pricePerUser}/user/yr</span>
                    <span className="font-medium">{s.hospital?._count?.memberships || 0} active · {s.billedSeats || 0} paid seats</span>
                    {s.autopayEnabled && <span className="text-blue-600 dark:text-sky-400 font-semibold bg-blue-500/10 dark:bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">Autopay</span>}
                    <span className="flex items-center gap-1 font-medium"><Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" /> Expires {new Date(s.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <span className={`inline-flex items-center justify-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border ${
                s.status === 'ACTIVE' 
                  ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/25' 
                  : s.status === 'TRIAL' 
                  ? 'bg-blue-100 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/25' 
                  : 'bg-rose-100 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 border-rose-200/50 dark:border-rose-500/25'
              }`}>
                {s.status === 'ACTIVE' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}{s.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
