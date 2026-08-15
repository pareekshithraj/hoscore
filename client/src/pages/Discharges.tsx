import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FileText, Plus, X } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusPill } from '../components/ui/StatusPill';
import { PatientPicker } from '../components/clinical/PatientPicker';
import { printDischarge } from '../utils/medicines';

export const Discharges = () => {
  const [docs, setDocs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientName: '', patientId: '', doctorName: '', diagnosis: '', medications: '', status: 'SIGNED' });

  const [bypassBillingCheck, setBypassBillingCheck] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => { api.get('/discharges').then(setDocs); }, []);

  const handleCreate = async () => {
    setErrorMsg("");
    try {
      await api.post('/discharges', { ...form, bypassBillingCheck });
      setShowForm(false);
      setForm({ patientName: '', patientId: '', doctorName: '', diagnosis: '', medications: '', status: 'SIGNED' });
      setBypassBillingCheck(false);
      api.get('/discharges').then(setDocs);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to create discharge summary.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discharge Summaries"
        subtitle="Manage patient exit sign-offs and post-discharge care instructions"
        icon={<FileText className="w-5 h-5" />}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 font-bold rounded-xl text-sm flex gap-2 items-center transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> New Summary
          </button>
        }
      />

      <div className="grid gap-4">
        {docs.map(d => (
          <div
            key={d.id}
            className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 flex flex-col sm:flex-row justify-between items-start gap-4 shadow-sm transition-all duration-300"
          >
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-[var(--inner-bg)] text-[var(--text-muted)] rounded-xl flex items-center justify-center border border-[var(--card-border)] shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-primary)]">{d.patientName}</h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                  Dr. {d.doctorName} • {new Date(d.dischargeDate).toLocaleDateString()}
                </p>
                <div className="mt-3 text-sm space-y-1.5 bg-[var(--inner-bg)] p-3 rounded-xl border border-[var(--card-border)]">
                  <p className="text-[var(--text-primary)]">
                    <span className="font-bold text-[var(--text-muted)] text-xs uppercase tracking-wider block mb-0.5">Diagnosis:</span>
                    {d.diagnosis}
                  </p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="font-bold text-[var(--text-muted)] text-xs uppercase tracking-wider block mb-0.5">Medications:</span>
                    {d.medications}
                  </p>
                </div>
              </div>
            </div>
            <StatusPill status={d.status} />
            <button onClick={() => printDischarge(d)} className="text-xs font-bold text-blue-600">Print</button>
          </div>
        ))}

        {docs.length === 0 && (
          <EmptyState
            icon={<FileText className="w-8 h-8 text-[var(--text-muted)]" />}
            title="No discharge summaries recorded"
            description="Create a discharge summary when a patient completes inpatient care"
          />
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 w-full max-w-md space-y-4 shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <h3 className="font-black uppercase tracking-tight text-sm text-[var(--text-primary)]">New Discharge Summary</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-[var(--inner-bg)] rounded-lg text-[var(--text-muted)] cursor-pointer"><X className="w-4.5 h-4.5" /></button>
            </div>
            <div className="space-y-3">
              <PatientPicker
                value={form.patientId}
                onChange={(p) => setForm({ ...form, patientId: p?.id || '', patientName: p?.name || '' })}
              />
              {[
                { ph: 'Doctor Name', k: 'doctorName' },
                { ph: 'Diagnosis', k: 'diagnosis' },
              ].map(f => (
                <input
                  key={f.k}
                  placeholder={f.ph}
                  value={(form as any)[f.k]}
                  onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                  className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] p-2.5 rounded-xl text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              ))}
              <textarea
                placeholder="Medications (comma separated)"
                value={form.medications}
                onChange={e => setForm({ ...form, medications: e.target.value })}
                className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] p-2.5 rounded-xl h-24 resize-none text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider block">Status Sign Off</label>
                <select 
                  value={form.status} 
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] p-2.5 rounded-xl text-xs font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer"
                >
                  <option value="SIGNED">Signed & Discharged (Triggers Cleaning)</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>

              <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bypassBillingCheck}
                  onChange={(e) => setBypassBillingCheck(e.target.checked)}
                  className="rounded border-[var(--input-border)] text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  Bypass Billing Check (Emergency Discharge)
                </span>
              </label>

              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-medium">
                  {errorMsg}
                </div>
              )}
            </div>
            
            <button onClick={handleCreate} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95 cursor-pointer mt-4">Save Summary</button>
          </div>
        </div>
      )}
    </div>
  );
};

