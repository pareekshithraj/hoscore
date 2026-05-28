import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FileText } from 'lucide-react';

export const MyPrescriptions = () => {
  const [rxs, setRxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/patient/prescriptions').then(setRxs).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900">My Prescriptions</h1>
      {rxs.length === 0 ? <p className="text-slate-500">No prescriptions found.</p> : (
        <div className="space-y-3">
          {rxs.map((rx: any) => (
            <div key={rx.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5 text-emerald-600" /></div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{rx.diagnosis}</p>
                  <p className="text-sm text-slate-500">{rx.doctor?.name} · {rx.hospital?.name}</p>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">{rx.status}</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600">
                <p><strong>Medicines:</strong> {rx.medicines}</p>
                {rx.instructions && <p className="mt-1"><strong>Instructions:</strong> {rx.instructions}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
