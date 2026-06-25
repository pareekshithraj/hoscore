import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { IndianRupee, Building2, Calendar, CheckCircle2, XCircle } from 'lucide-react';

export const ManageSubscriptions = () => {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/super-admin/subscriptions').then(setSubs).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>;

  const totalRevenue = subs.reduce((s, sub) => s + (sub.pricePerUser * (sub.billedSeats || sub.hospital?._count?.memberships || 0)), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Subscriptions</h1>
          <p className="text-sm text-slate-500">{subs.length} subscriptions · Est. Revenue: ₹{totalRevenue.toLocaleString()}/yr</p>
        </div>
      </div>
      <div className="space-y-4">
        {subs.map((s: any) => (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center"><Building2 className="w-6 h-6 text-amber-600" /></div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{s.hospital?.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    <span className="font-semibold text-emerald-600">{s.plan} Plan</span>
                    <span className="flex items-center gap-0.5"><IndianRupee className="w-3 h-3" />{s.pricePerUser}/user/yr</span>
                    <span>{s.hospital?._count?.memberships || 0} active · {s.billedSeats || 0} paid seats</span>
                    {s.autopayEnabled && <span className="text-blue-600 font-semibold">Autopay on</span>}
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Expires {new Date(s.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <span className={`flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-full ${s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : s.status === 'TRIAL' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                {s.status === 'ACTIVE' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}{s.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
