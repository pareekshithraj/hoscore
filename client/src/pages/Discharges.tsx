import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FileText, Plus, X } from 'lucide-react';

export const Discharges = () => {
  const [docs, setDocs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientName: '', doctorName: '', diagnosis: '', medications: '', status: 'SIGNED' });

  useEffect(() => { api.get('/discharges').then(setDocs); }, []);

  const handleCreate = async () => {
    await api.post('/discharges', form);
    setShowForm(false);
    setForm({ patientName: '', doctorName: '', diagnosis: '', medications: '', status: 'SIGNED' });
    api.get('/discharges').then(setDocs);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100">Discharge Summaries</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-450 mt-1">Manage patient exit sign-offs and instructions</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-bold rounded-xl text-sm flex gap-2 items-center transition-all cursor-pointer shadow-sm active:scale-95"><Plus className="w-4 h-4"/> New Summary</button>
      </div>

      <div className="grid gap-4">
        {docs.map(d => (
          <div key={d.id} className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 flex justify-between items-start shadow-sm transition-all duration-300">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-slate-50 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 rounded-xl flex items-center justify-center"><FileText className="w-5 h-5" /></div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-zinc-150">{d.patientName}</h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Dr. {d.doctorName} • {new Date(d.dischargeDate).toLocaleDateString()}</p>
                <div className="mt-3 text-sm space-y-1">
                  <p className="text-slate-700 dark:text-zinc-350"><span className="font-semibold text-slate-500 dark:text-zinc-400">Diagnosis:</span> {d.diagnosis}</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-medium"><span className="font-semibold text-slate-500 dark:text-zinc-400">Meds:</span> {d.medications}</p>
                </div>
              </div>
            </div>
            <span className="px-2 py-1 text-[10px] bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-405 font-bold rounded border border-slate-200/40 dark:border-zinc-800/50">{d.status}</span>
          </div>
        ))}

        {docs.length === 0 && (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/20">
            <FileText className="w-8 h-8 text-slate-350 dark:text-zinc-700 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-500 dark:text-zinc-450">No discharge summaries recorded</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 p-6 rounded-2xl w-full max-w-md space-y-4 text-slate-800 dark:text-zinc-200 shadow-2xl animate-scale-in" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-900 dark:text-zinc-100 uppercase tracking-tight text-sm">New Discharge Summary</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg text-slate-400 dark:text-zinc-500 cursor-pointer"><X className="w-4.5 h-4.5" /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Patient Name" onChange={e=>setForm({...form, patientName: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs font-bold text-slate-800 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <input placeholder="Doctor Name" onChange={e=>setForm({...form, doctorName: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs font-bold text-slate-800 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <input placeholder="Diagnosis" onChange={e=>setForm({...form, diagnosis: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs font-bold text-slate-800 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <textarea placeholder="Medications (comma separated)" onChange={e=>setForm({...form, medications: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg h-24 resize-none text-xs font-bold text-slate-800 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-wider block">Status Sign Off</label>
                <select 
                  value={form.status} 
                  onChange={e=>setForm({...form, status: e.target.value})}
                  className="w-full border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs font-bold text-slate-800 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-900 focus:outline-none cursor-pointer"
                >
                  <option value="SIGNED" className="bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-semibold">Signed & Discharged (Triggers Cleaning)</option>
                  <option value="DRAFT" className="bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-semibold">Draft</option>
                </select>
              </div>
            </div>
            
            <button onClick={handleCreate} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95 cursor-pointer">Save Summary</button>
          </div>
        </div>
      )}
    </div>
  );
};
