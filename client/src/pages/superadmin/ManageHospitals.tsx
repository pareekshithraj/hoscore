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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">Manage Hospitals</h1>
        <span className="text-sm text-slate-500 font-medium">{hospitals.length} total</span>
      </div>
      <div className="space-y-4">
        {hospitals.map((h: any) => (
          <div key={h.id} className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{h.name}</h3>
                  <p className="text-sm text-slate-500">{h.slug}</p>
                  {h.city && <p className="text-sm text-slate-400 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{h.city}{h.state ? `, ${h.state}` : ''}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>{h._count?.memberships || 0} users</span>
                    <span>{h._count?.rooms || 0} rooms</span>
                    <span>{h._count?.doctors || 0} doctors</span>
                    {h.subscriptions?.[0] && <span className="text-emerald-600 font-bold">{h.subscriptions[0].plan} plan</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => toggle(h.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${h.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700' : 'bg-red-100 text-red-700 hover:bg-emerald-100 hover:text-emerald-700'}`}>
                {h.isActive ? <><CheckCircle2 className="w-4 h-4" /> Active</> : <><XCircle className="w-4 h-4" /> Inactive</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
