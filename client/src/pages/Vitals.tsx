import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { Heart, HeartPulse, Plus, X } from 'lucide-react';
import { EmptyState, LoadingState, PageHeader, StatusPill, StatCard } from '../components/ui';
import { formatShortDate, vitalsFlags } from '../utils/clinical';
import { PatientPicker } from '../components/clinical/PatientPicker';
import { cn } from '../lib/cn';

export const Vitals = () => {
  const [vitals, setVitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '',
    patientId: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    oxygenSaturation: '',
  });

  const load = () => {
    setLoading(true);
    api.get('/vitals')
      .then((res) => setVitals(Array.isArray(res) ? res : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.patientName.trim()) return;
    await api.post('/vitals', {
      ...form,
      heartRate: Number(form.heartRate),
      temperature: Number(form.temperature),
      oxygenSaturation: Number(form.oxygenSaturation),
    });
    setShowForm(false);
    setForm({ patientName: '', patientId: '', bloodPressure: '', heartRate: '', temperature: '', oxygenSaturation: '' });
    load();
  };

  const alerts = useMemo(
    () => vitals.filter((v) => vitalsFlags(v).includes('critical') || vitalsFlags(v).includes('high')).length,
    [vitals]
  );

  if (loading) return <LoadingState label="Loading vitals rounds…" />;

  return (
    <div className="space-y-5 pb-10 animate-fade-in-up">
      <PageHeader
        title="Vitals Rounds"
        subtitle="Capture BP, HR, temp, SpO₂ — flags fire when values leave safe range."
        icon={<HeartPulse className="h-5 w-5" />}
        meta={
          <>
            <StatusPill tone="info">{vitals.length} logged</StatusPill>
            {alerts > 0 && <StatusPill tone="danger" pulse>{alerts} need review</StatusPill>}
          </>
        }
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Record vitals
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total readings" value={vitals.length} icon={<Heart className="h-5 w-5" />} accent="#e11d48" />
        <StatCard label="Flagged" value={alerts} sub="Out of range" icon={<HeartPulse className="h-5 w-5" />} accent="#f59e0b" urgent={alerts > 0} />
        <StatCard
          label="Avg HR"
          value={
            vitals.length
              ? Math.round(vitals.reduce((s, v) => s + (v.heartRate || 0), 0) / vitals.filter((v) => v.heartRate).length || 1)
              : '—'
          }
          sub="bpm"
          icon={<Heart className="h-5 w-5" />}
          accent="#f43f5e"
        />
        <StatCard
          label="Low SpO₂"
          value={vitals.filter((v) => v.oxygenSaturation != null && v.oxygenSaturation < 95).length}
          sub="< 95%"
          icon={<HeartPulse className="h-5 w-5" />}
          accent="#0ea5e9"
        />
      </div>

      {vitals.length === 0 ? (
        <EmptyState
          icon={<HeartPulse className="h-6 w-6" />}
          title="No vitals recorded yet"
          description="Start a round — record BP, heart rate, temperature, and SpO₂ for any patient."
          action={
            <button onClick={() => setShowForm(true)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">
              Record first reading
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {vitals.map((v) => {
            const flags = vitalsFlags(v);
            const critical = flags.includes('critical');
            return (
              <div
                key={v.id}
                className={cn(
                  'relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-0.5',
                  critical
                    ? 'border-rose-500/35 bg-rose-500/[0.06]'
                    : 'border-[var(--card-border)] bg-[var(--card-bg)]'
                )}
              >
                <Heart className="absolute -bottom-3 -right-3 h-20 w-20 text-rose-500/[0.05]" />
                <div className="relative z-10">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-black text-[var(--text-primary)]">{v.patientName}</h3>
                      <p className="text-[11px] font-mono text-[var(--text-muted)]">{formatShortDate(v.recordedAt)} · {v.recordedAt ? new Date(v.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                    </div>
                    {flags.length > 0 && (
                      <StatusPill tone={critical ? 'danger' : 'warning'} pulse={critical}>
                        {flags[0]}
                      </StatusPill>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { l: 'BP', v: v.bloodPressure || '—', c: '' },
                      { l: 'Heart rate', v: v.heartRate ? `${v.heartRate} bpm` : '—', c: 'text-rose-600 dark:text-rose-400' },
                      { l: 'Temp', v: v.temperature ? `${v.temperature}°F` : '—', c: '' },
                      { l: 'SpO₂', v: v.oxygenSaturation != null ? `${v.oxygenSaturation}%` : '—', c: 'text-sky-600 dark:text-sky-400' },
                    ].map((cell) => (
                      <div key={cell.l} className="rounded-xl border border-[var(--card-border)] bg-[var(--inner-bg)] px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{cell.l}</p>
                        <p className={cn('mt-0.5 text-sm font-black tabular-nums text-[var(--text-primary)]', cell.c)}>{cell.v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-tight text-[var(--text-primary)]">Record patient vitals</h3>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--inner-bg)]"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <PatientPicker
                value={form.patientId}
                onChange={(p) => setForm({ ...form, patientId: p?.id || '', patientName: p?.name || '' })}
              />
              {[
                { ph: 'BP (e.g. 120/80)', k: 'bloodPressure', type: 'text' },
                { ph: 'Heart rate (bpm)', k: 'heartRate', type: 'number' },
                { ph: 'Temp (°F)', k: 'temperature', type: 'number' },
                { ph: 'SpO₂ (%)', k: 'oxygenSaturation', type: 'number' },
              ].map((f) => (
                <input
                  key={f.k}
                  type={f.type}
                  placeholder={f.ph}
                  value={(form as any)[f.k]}
                  onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                  className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)]"
                />
              ))}
            </div>
            <button onClick={handleAdd} className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
              Save vitals
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
