import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Activity, FlaskConical, Bed } from 'lucide-react';

export const MyRecords = () => {
  const [data, setData] = useState<any>({ vitals: [], labs: [], admissions: [] });
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/patient/records').then(setData).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black text-slate-900">My Medical Records</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-rose-500" /> Vitals</h2>
          {data.vitals.length === 0 ? <p className="text-slate-400 text-sm">No vitals recorded</p> : data.vitals.slice(0, 5).map((v: any) => (
            <div key={v.id} className="py-2 border-b border-slate-100 last:border-0 text-sm">
              <p className="text-slate-700">BP: {v.bloodPressure || '-'} | HR: {v.heartRate || '-'} | SpO2: {v.oxygenSaturation || '-'}%</p>
              <p className="text-xs text-slate-400">{new Date(v.recordedAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><FlaskConical className="w-5 h-5 text-purple-500" /> Lab Results</h2>
          {data.labs.length === 0 ? <p className="text-slate-400 text-sm">No lab results</p> : data.labs.slice(0, 5).map((l: any) => (
            <div key={l.id} className="py-2 border-b border-slate-100 last:border-0 text-sm">
              <p className="font-semibold text-slate-700">{l.testName}</p>
              <p className="text-xs text-slate-500">{l.result || 'Pending'} · {l.status}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Bed className="w-5 h-5 text-blue-500" /> Admissions</h2>
          {data.admissions.length === 0 ? <p className="text-slate-400 text-sm">No admissions</p> : data.admissions.slice(0, 5).map((a: any) => (
            <div key={a.id} className="py-2 border-b border-slate-100 last:border-0 text-sm">
              <p className="font-semibold text-slate-700">{a.reason || 'Admission'}</p>
              <p className="text-xs text-slate-500">{new Date(a.admissionDate).toLocaleDateString()} · {a.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
