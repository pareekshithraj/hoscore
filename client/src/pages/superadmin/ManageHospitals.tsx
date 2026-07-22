import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Building2, CheckCircle2, XCircle, MapPin } from 'lucide-react';

export const ManageHospitals = () => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => { api.get('/super-admin/hospitals').then(setHospitals).catch(console.error).finally(() => setLoading(false)); };
  useEffect(load, []);

  const toggle = async (id: string) => {
    await api.patch(`/super-admin/hospitals/${id}/toggle`, {});
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100">Manage Hospitals</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-450 mt-1">Configure and manage active hospital accounts on the network</p>
        </div>
        <span className="text-xs text-slate-500 dark:text-zinc-450 font-bold bg-slate-100 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/60 px-2.5 py-1 rounded-lg">{hospitals.length} total</span>
      </div>
      <div className="space-y-4">
        {hospitals.map((h: any) => (
          <div key={h.id} className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 p-6 shadow-sm transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/40 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-150">{h.name}</h3>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono mt-0.5">{h.slug}</p>
                  {h.city && (
                    <p className="text-xs text-slate-550 dark:text-zinc-450 flex items-center gap-1 mt-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                      {h.city}{h.state ? `, ${h.state}` : ''}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-3.5 text-xs text-slate-500 dark:text-zinc-400">
                    <span className="bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/60 px-2 py-0.5 rounded font-medium">{h._count?.memberships || 0} users</span>
                    <span className="bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/60 px-2 py-0.5 rounded font-medium">{h._count?.rooms || 0} rooms</span>
                    <span className="bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/60 px-2 py-0.5 rounded font-medium">{h._count?.doctors || 0} doctors</span>
                    {h.subscriptions?.[0] && <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-wider text-[9px]">{h.subscriptions[0].plan} plan</span>}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => toggle(h.id)} 
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 ${
                  h.isActive 
                    ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 hover:bg-rose-100 dark:hover:bg-rose-950/30 hover:text-rose-700 dark:hover:text-rose-400 border border-emerald-200/50 dark:border-emerald-500/20' 
                    : 'bg-rose-100 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-400 border border-rose-200/50 dark:border-rose-500/20'
                }`}
              >
                {h.isActive ? <><CheckCircle2 className="w-4 h-4" /> Active</> : <><XCircle className="w-4 h-4" /> Inactive</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
