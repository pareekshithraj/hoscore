import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Receipt, IndianRupee } from 'lucide-react';

export const MyBills = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/patient/bills').then(setBills).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900">My Bills</h1>
      {bills.length === 0 ? <p className="text-slate-500">No bills found.</p> : (
        <div className="space-y-3">
          {bills.map((b: any, i: number) => (
            <div key={b.id || i} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center"><Receipt className="w-6 h-6 text-amber-600" /></div>
              <div className="flex-1">
                <p className="font-bold text-slate-900">{b.hospitalName || 'Hospital'}</p>
                <p className="text-sm text-slate-500">Room: ₹{b.roomCharges} · Doctor: ₹{b.doctorFees} · Lab: ₹{b.labFees}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-slate-900 flex items-center gap-0.5"><IndianRupee className="w-4 h-4" />{b.totalAmount}</p>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${b.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{b.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
