import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FileText, Plus } from 'lucide-react';

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
      <div className="flex justify-between">
        <div><h2 className="text-2xl font-extrabold">Discharge Summaries</h2></div>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 font-bold rounded-xl text-sm flex gap-2 items-center"><Plus className="w-4"/> New Summary</button>
      </div>

      <div className="grid gap-4">
        {docs.map(d => (
          <div key={d.id} className="bg-white p-5 rounded-2xl border flex justify-between items-start">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center"><FileText className="w-5" /></div>
              <div>
                <h3 className="font-bold">{d.patientName}</h3>
                <p className="text-xs text-slate-400">Dr. {d.doctorName} • {new Date(d.dischargeDate).toLocaleDateString()}</p>
                <div className="mt-3 text-sm">
                  <p><span className="font-semibold text-slate-600">Diagnosis:</span> {d.diagnosis}</p>
                  <p className="text-emerald-600 mt-1"><span className="font-semibold">Meds:</span> {d.medications}</p>
                </div>
              </div>
            </div>
            <span className="px-2 py-1 text-[10px] bg-slate-100 text-slate-600 font-bold rounded">{d.status}</span>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white p-6 rounded-2xl w-[400px] space-y-3 text-slate-800" onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold text-slate-900">New Discharge Summary</h3>
            <input placeholder="Patient Name" onChange={e=>setForm({...form, patientName: e.target.value})} className="w-full border p-2 rounded text-slate-800 bg-white" />
            <input placeholder="Doctor Name" onChange={e=>setForm({...form, doctorName: e.target.value})} className="w-full border p-2 rounded text-slate-800 bg-white" />
            <input placeholder="Diagnosis" onChange={e=>setForm({...form, diagnosis: e.target.value})} className="w-full border p-2 rounded text-slate-800 bg-white" />
            <textarea placeholder="Medications (comma separated)" onChange={e=>setForm({...form, medications: e.target.value})} className="w-full border p-2 rounded h-24 resize-none text-slate-800 bg-white" />
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">Status Sign Off</label>
              <select 
                value={form.status} 
                onChange={e=>setForm({...form, status: e.target.value})}
                className="w-full border p-2 rounded text-slate-800 bg-white cursor-pointer text-xs font-semibold"
              >
                <option value="SIGNED">Signed & Discharged (Triggers Cleaning)</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
            
            <button onClick={handleCreate} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-xl text-sm transition-all">Save Summary</button>
          </div>
        </div>
      )}
    </div>
  );
};
