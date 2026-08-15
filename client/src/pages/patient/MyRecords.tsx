import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Activity, FlaskConical, Bed, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageError } from '../../components/PageError';
import { printPrescription, printRecords, shareRecords } from '../../utils/medicines';

export const MyRecords = () => {
  const { selectedPatientId, user } = useAuth();
  const [data, setData] = useState<any>({ vitals: [], labs: [], admissions: [], prescriptions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRecords = () => {
    setLoading(true);
    setError('');
    const url = selectedPatientId ? `/patient/records?patientId=${selectedPatientId}` : '/patient/records';
    api.get(url)
      .then(setData)
      .catch((err) => setError(err?.message || 'Failed to load records.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRecords();
  }, [selectedPatientId]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <PageError message={error} onRetry={loadRecords} />;

  const vitals = data.vitals || [];
  const hrs = vitals.map((v: any) => Number(v.heartRate)).filter((n: number) => Number.isFinite(n) && n > 0);
  const maxHr = Math.max(1, ...hrs);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-slate-900">My Medical Records</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => printRecords({
              patientName: data.patient?.name || data.patientName || user?.name,
              vitals,
              labs: data.labs,
              admissions: data.admissions,
              prescriptions: data.prescriptions,
            })}
            className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
          >
            Print pack
          </button>
          <button
            type="button"
            onClick={() => shareRecords({
              patientName: data.patient?.name || data.patientName || user?.name,
              vitals,
              labs: data.labs,
              admissions: data.admissions,
              prescriptions: data.prescriptions,
            })}
            className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold"
          >
            Share
          </button>
        </div>
      </div>
      {hrs.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-sm font-black text-slate-900 mb-3">Heart rate trend</h2>
          <div className="flex items-end gap-1 h-24">
            {[...hrs].reverse().map((n: number, i: number) => (
              <div key={i} className="flex-1 bg-rose-400/80 rounded-t" style={{ height: `${(n / maxHr) * 100}%` }} title={`${n} bpm`} />
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">Latest {hrs[0]} bpm · {hrs.length} readings</p>
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-rose-500" /> Vitals</h2>
          {vitals.length === 0 ? <p className="text-slate-400 text-sm">No vitals recorded</p> : vitals.map((v: any) => (
            <div key={v.id} className="py-2 border-b border-slate-100 last:border-0 text-sm">
              <p className="text-slate-700">BP: {v.bloodPressure || '-'} | HR: {v.heartRate || '-'} | SpO2: {v.oxygenSaturation || '-'}%</p>
              <p className="text-xs text-slate-400">{v.recordedAt ? new Date(v.recordedAt).toLocaleString() : ''}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><FlaskConical className="w-5 h-5 text-purple-500" /> Lab Results</h2>
          {(data.labs || []).length === 0 ? <p className="text-slate-400 text-sm">No lab results</p> : data.labs.map((l: any) => (
            <div key={l.id} className="py-2 border-b border-slate-100 last:border-0 text-sm">
              <p className="font-semibold text-slate-700">{l.testName}</p>
              <p className={`text-xs font-bold ${String(l.result || '').toLowerCase().includes('abnormal') ? 'text-rose-600' : 'text-slate-500'}`}>
                {l.result || 'Pending'} · {l.status}
              </p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Bed className="w-5 h-5 text-blue-500" /> Admissions</h2>
          {(data.admissions || []).length === 0 ? <p className="text-slate-400 text-sm">No admissions</p> : data.admissions.map((a: any) => (
            <div key={a.id} className="py-2 border-b border-slate-100 last:border-0 text-sm">
              <p className="font-semibold text-slate-700">{a.reason || 'Admission'}</p>
              <p className="text-xs text-slate-500">{new Date(a.admissionDate).toLocaleDateString()} · {a.status} {a.bed?.room?.name ? `· ${a.bed.room.name}` : ''}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-500" /> Prescriptions</h2>
          {(data.prescriptions || []).length === 0 ? <p className="text-slate-400 text-sm">No prescriptions</p> : data.prescriptions.map((rx: any) => (
            <div key={rx.id} className="py-2 border-b border-slate-100 last:border-0 text-sm flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-700">{rx.diagnosis || 'Prescription'}</p>
                <p className="text-xs text-slate-500">Dr. {rx.doctor?.name || rx.doctorName || '—'} · {rx.status}</p>
              </div>
              <button
                onClick={() => printPrescription({ ...rx, patientName: rx.patientName, doctorName: rx.doctor?.name || rx.doctorName })}
                className="text-xs font-bold text-blue-600"
              >
                Print
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
