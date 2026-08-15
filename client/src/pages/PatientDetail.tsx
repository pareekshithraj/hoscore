import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import {
  Activity, ArrowLeft, Bed, Calendar, Clock, Droplet, FileText, Heart,
  HeartPulse, Phone, Pill, Receipt, Stethoscope, TestTube2, UserCheck,
} from 'lucide-react';
import { EmptyState, LoadingState, StatusPill } from '../components/ui';
import { calcAge, formatINR, formatShortDate, initials, patientIdLabel, vitalsFlags } from '../utils/clinical';
import { cn } from '../lib/cn';
import { printPrescription } from '../utils/medicines';
import { useAuth } from '../context/AuthContext';

type Tab = 'overview' | 'appointments' | 'vitals' | 'rx' | 'labs' | 'admissions' | 'bills';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'appointments', label: 'Visits', icon: Stethoscope },
  { id: 'vitals', label: 'Vitals', icon: HeartPulse },
  { id: 'rx', label: 'Rx', icon: Pill },
  { id: 'labs', label: 'Labs', icon: TestTube2 },
  { id: 'admissions', label: 'IPD', icon: Bed },
  { id: 'bills', label: 'Bills', icon: Receipt },
];

export const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const { user } = useAuth();
  const [chartAction, setChartAction] = useState<'rx' | 'lab' | 'vitals' | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [rxForm, setRxForm] = useState({ diagnosis: '', medicines: '', instructions: '' });
  const [labForm, setLabForm] = useState({ testName: '', testType: 'Blood Test', priority: 'ROUTINE' });
  const [vitalsForm, setVitalsForm] = useState({ bloodPressure: '', heartRate: '', temperature: '', oxygenSaturation: '' });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/patients/${id}`)
      .then(setPatient)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const age = useMemo(() => calcAge(patient?.dateOfBirth, today), [patient, today]);

  const bills = useMemo(() => {
    if (!patient?.admissions) return [];
    return patient.admissions
      .filter((a: any) => a.billing)
      .map((a: any) => ({ ...a.billing, admission: a }));
  }, [patient]);

  const reload = () => {
    if (!id) return;
    api.get(`/patients/${id}`).then(setPatient).catch(console.error);
  };

  const submitChartAction = async () => {
    if (!patient) return;
    setActionBusy(true);
    try {
      if (chartAction === 'rx') {
        await api.post('/prescriptions', {
          patientId: patient.id,
          diagnosis: rxForm.diagnosis,
          medicines: rxForm.medicines.split('\n').filter(Boolean).map((name) => ({ name, dosage: '', duration: '', instructions: '', quantity: 1 })),
          instructions: rxForm.instructions,
        });
      } else if (chartAction === 'lab') {
        await api.post('/lab-orders', {
          patientId: patient.id,
          patientName: patient.name,
          doctorName: user?.name,
          testName: labForm.testName,
          testType: labForm.testType,
          priority: labForm.priority,
        });
      } else if (chartAction === 'vitals') {
        await api.post('/vitals', {
          patientId: patient.id,
          patientName: patient.name,
          ...vitalsForm,
          heartRate: Number(vitalsForm.heartRate),
          temperature: Number(vitalsForm.temperature),
          oxygenSaturation: Number(vitalsForm.oxygenSaturation),
        });
      }
      setChartAction(null);
      reload();
    } finally {
      setActionBusy(false);
    }
  };

  const convertToHoscore = async () => {
    if (!id) return;
    setConverting(true);
    try {
      const updated = await api.patch(`/patients/${id}/convert-hoscore`, {});
      setPatient((p: any) => ({ ...p, ...updated }));
    } finally {
      setConverting(false);
    }
  };

  if (loading) return <LoadingState label="Opening patient chart…" />;
  if (!patient) {
    return (
      <EmptyState
        title="Patient not found"
        description="This chart may have been removed or you don't have access."
        action={<Link to="/dashboard/patients" className="text-sm font-bold text-blue-600">Back to patients</Link>}
      />
    );
  }

  return (
    <div className="space-y-5 pb-10 animate-fade-in-up">
      {/* Back */}
      <Link
        to="/dashboard/patients"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" /> Patient registry
      </Link>

      {/* Chart header */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 sm:p-6 shadow-sm">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.07),transparent_50%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-xl font-black text-white shadow-lg shadow-blue-600/20">
              {initials(patient.name)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] truncate">{patient.name}</h1>
                <StatusPill status={patient.isHoscoreUser === false ? undefined : patient.status} tone={patient.isHoscoreUser === false ? 'warning' : undefined}>
                  {patient.isHoscoreUser === false ? 'Manual care' : patient.status}
                </StatusPill>
              </div>
              <p className="mt-1 font-mono text-sm font-bold text-blue-600 dark:text-sky-400">
                {patientIdLabel(patient)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--inner-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                  <Calendar className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  {age}y · {patient.gender || '—'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/15 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                  <Droplet className="h-3.5 w-3.5" />
                  {patient.bloodGroup || 'N/A'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--inner-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                  <Phone className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  {patient.contact || 'No phone'}
                </span>
              </div>
              {patient.isHoscoreUser === false && (
                <div className="mt-3 max-w-xl space-y-2">
                  <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200">
                    {patient.manualCareNote || 'Walk-in without HOSCORE app access. Continue manual care as needed.'}
                  </p>
                  <button
                    onClick={convertToHoscore}
                    disabled={converting}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    <UserCheck className="h-4 w-4" />
                    {converting ? 'Converting…' : 'Convert to HOSCORE user'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Snapshot KPIs */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-auto">
            {[
              { label: 'Visits', value: patient.appointments?.length || 0 },
              { label: 'Rx', value: patient.prescriptions?.length || 0 },
              { label: 'Labs', value: patient.labOrders?.length || 0 },
              { label: 'IPD', value: patient.admissions?.length || 0 },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-[var(--card-border)] bg-[var(--inner-bg)] px-3 py-2.5 text-center min-w-[72px]">
                <p className="text-lg font-black tabular-nums text-[var(--text-primary)]">{k.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{k.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setChartAction('rx')} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white">Write Rx</button>
        <button onClick={() => setChartAction('lab')} className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-xs font-bold">Order lab</button>
        <button onClick={() => setChartAction('vitals')} className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-xs font-bold">Record vitals</button>
        <Link to="/dashboard/admissions" className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-xs font-bold">Admit</Link>
        <Link to="/dashboard/discharges" className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-xs font-bold">Discharge</Link>
        <Link to="/dashboard/queue" className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-xs font-bold">Open in OPD</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all',
                active
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--inner-bg)]'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 sm:p-6 shadow-sm">
        {tab === 'overview' && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--inner-bg)] p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-[var(--text-primary)]">
                <Heart className="h-4 w-4 text-rose-500" /> Medical context
              </h3>
              {patient.medicalHistory ? (
                <p className="text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">{patient.medicalHistory}</p>
              ) : (
                <p className="text-sm italic text-[var(--text-muted)]">No historical conditions logged.</p>
              )}
            </div>
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--inner-bg)] p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-[var(--text-primary)]">
                <FileText className="h-4 w-4 text-blue-500" /> Contact & identity
              </h3>
              <dl className="space-y-3 text-sm">
                {[
                  ['Email', patient.email || '—'],
                  ['Phone', patient.contact || '—'],
                  ['DOB', formatShortDate(patient.dateOfBirth)],
                  ['Registration', patient.registrationMode || (patient.isHoscoreUser === false ? 'WALK_IN_MANUAL' : 'HOSCORE')],
                  ['Follow-up', patient.nextAppointmentAlertInterval && patient.nextAppointmentAlertInterval !== 'None'
                    ? `${patient.nextAppointmentAlertInterval} · ${formatShortDate(patient.nextAppointmentAlertDate)}`
                    : 'None'],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex items-center justify-between gap-4 border-b border-[var(--card-border)] pb-2 last:border-0">
                    <dt className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{k}</dt>
                    <dd className="font-semibold text-[var(--text-primary)] text-right">{v as string}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Recent activity timeline */}
            <div className="lg:col-span-2">
              <h3 className="mb-3 text-sm font-black text-[var(--text-primary)]">Recent clinical activity</h3>
              <div className="space-y-2">
                {[
                  ...(patient.appointments || []).slice(0, 3).map((a: any) => ({
                    id: `a-${a.id}`,
                    title: `Visit · ${a.doctor?.name || 'Doctor'}`,
                    sub: a.time,
                    date: a.date,
                    status: a.status,
                  })),
                  ...(patient.prescriptions || []).slice(0, 2).map((r: any) => ({
                    id: `r-${r.id}`,
                    title: `Rx · ${r.diagnosis}`,
                    sub: r.medicines?.slice(0, 60),
                    date: r.date,
                    status: r.status,
                  })),
                  ...(patient.vitals || []).slice(0, 2).map((v: any) => ({
                    id: `v-${v.id}`,
                    title: `Vitals · BP ${v.bloodPressure || '—'} · HR ${v.heartRate || '—'}`,
                    sub: `SpO₂ ${v.oxygenSaturation ?? '—'}%`,
                    date: v.recordedAt,
                    status: vitalsFlags(v).includes('critical') ? 'URGENT' : 'COMPLETED',
                  })),
                ]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 8)
                  .map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--inner-bg)] px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[var(--text-primary)]">{item.title}</p>
                        <p className="truncate text-xs text-[var(--text-muted)]">{item.sub}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusPill status={item.status} />
                        <span className="text-[11px] text-[var(--text-muted)]">{formatShortDate(item.date)}</span>
                      </div>
                    </div>
                  ))}
                {!patient.appointments?.length && !patient.prescriptions?.length && !patient.vitals?.length && (
                  <EmptyState compact title="No clinical activity yet" description="Appointments, vitals, and prescriptions will appear here." />
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'appointments' && (
          patient.appointments?.length ? (
            <div className="space-y-2">
              {patient.appointments.map((apt: any) => (
                <div key={apt.id} className="flex flex-col gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--inner-bg)] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-blue-500/10 text-blue-700 dark:text-sky-300">
                      <span className="text-base font-black leading-none">{new Date(apt.date).getDate()}</span>
                      <span className="text-[9px] font-bold uppercase">{new Date(apt.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">{apt.doctor?.name || 'Unassigned doctor'}</p>
                      <p className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                        <Clock className="h-3.5 w-3.5" /> {apt.time}
                        {apt.tokenNumber != null && <> · Token #{apt.tokenNumber}</>}
                      </p>
                    </div>
                  </div>
                  <StatusPill status={apt.status} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState compact icon={<Stethoscope className="h-5 w-5" />} title="No appointments on record" />
          )
        )}

        {tab === 'vitals' && (
          patient.vitals?.length ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {patient.vitals.map((v: any) => {
                const flags = vitalsFlags(v);
                return (
                  <div
                    key={v.id}
                    className={cn(
                      'rounded-xl border p-4',
                      flags.includes('critical')
                        ? 'border-rose-500/30 bg-rose-500/[0.06]'
                        : 'border-[var(--card-border)] bg-[var(--inner-bg)]'
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-muted)]">{formatShortDate(v.recordedAt)}</span>
                      {flags.length > 0 && <StatusPill tone={flags.includes('critical') ? 'danger' : 'warning'}>{flags[0]}</StatusPill>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">BP</p><p className="font-bold">{v.bloodPressure || '—'}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">HR</p><p className="font-bold text-rose-600">{v.heartRate ? `${v.heartRate} bpm` : '—'}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Temp</p><p className="font-bold">{v.temperature ? `${v.temperature}°F` : '—'}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">SpO₂</p><p className="font-bold">{v.oxygenSaturation != null ? `${v.oxygenSaturation}%` : '—'}</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState compact icon={<HeartPulse className="h-5 w-5" />} title="No vitals recorded" description="Record vitals from the Vitals module during rounds." />
          )
        )}

        {tab === 'rx' && (
          patient.prescriptions?.length ? (
            <div className="space-y-3">
              {patient.prescriptions.map((rx: any) => (
                <div key={rx.id} className="rounded-xl border border-[var(--card-border)] bg-[var(--inner-bg)] p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">{rx.diagnosis}</p>
                      <p className="text-xs text-[var(--text-muted)]">Dr. {rx.doctor?.name || '—'} · {formatShortDate(rx.date)}</p>
                    </div>
                    <StatusPill status={rx.status} />
                  </div>
                  <pre className="whitespace-pre-wrap rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-3 font-mono text-xs text-[var(--text-secondary)]">{rx.medicines}</pre>
                  {rx.instructions && <p className="mt-2 text-xs italic text-[var(--text-muted)]">{rx.instructions}</p>}
                  <button
                    onClick={() => printPrescription({
                      patientName: patient.name,
                      doctorName: rx.doctor?.name,
                      diagnosis: rx.diagnosis,
                      medicines: rx.medicines,
                      instructions: rx.instructions,
                      date: rx.date,
                    })}
                    className="mt-2 text-[10px] font-bold uppercase text-blue-600"
                  >
                    Print Rx
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState compact icon={<Pill className="h-5 w-5" />} title="No prescriptions" />
          )
        )}

        {tab === 'labs' && (
          patient.labOrders?.length ? (
            <div className="space-y-2">
              {patient.labOrders.map((lab: any) => (
                <div key={lab.id} className="flex flex-col gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--inner-bg)] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-[var(--text-primary)]">{lab.testName}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {lab.testType} · Dr. {lab.doctorName || '—'} · {formatShortDate(lab.orderedAt)}
                    </p>
                    {lab.result && <p className="mt-1 text-sm font-semibold text-[var(--text-secondary)]">Result: {lab.result} {lab.unit || ''}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {lab.priority === 'URGENT' && <StatusPill tone="danger">Urgent</StatusPill>}
                    <StatusPill status={lab.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState compact icon={<TestTube2 className="h-5 w-5" />} title="No lab orders" />
          )
        )}

        {tab === 'admissions' && (
          patient.admissions?.length ? (
            <div className="space-y-3">
              {patient.admissions.map((adm: any) => (
                <div key={adm.id} className="rounded-xl border border-[var(--card-border)] bg-[var(--inner-bg)] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-[var(--text-primary)]">
                        {adm.bed?.room?.name || 'Ward'} · Bed {adm.bed?.bedNumber || '—'}
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{adm.reason || 'General observation'}</p>
                    </div>
                    <StatusPill status={adm.status} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-6 border-t border-[var(--card-border)] pt-4 text-sm">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Admitted</p>
                      <p className="font-semibold">{formatShortDate(adm.admissionDate)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Discharged</p>
                      <p className="font-semibold">{adm.dischargeDate ? formatShortDate(adm.dischargeDate) : 'Present'}</p>
                    </div>
                    {adm.billing && (
                      <div className="ml-auto text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Bill</p>
                        <p className={cn('font-bold', adm.billing.status === 'Paid' || adm.billing.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600')}>
                          {formatINR(adm.billing.totalAmount)} · {adm.billing.status}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState compact icon={<Bed className="h-5 w-5" />} title="No admissions" />
          )
        )}

        {tab === 'bills' && (
          bills.length ? (
            <div className="space-y-2">
              {bills.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-[var(--inner-bg)] p-4">
                  <div>
                    <p className="font-bold text-[var(--text-primary)]">{formatINR(b.totalAmount)}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Room {formatINR(b.roomCharges)} · Doctor {formatINR(b.doctorFees)} · Lab {formatINR(b.labFees)}
                    </p>
                  </div>
                  <StatusPill status={b.status} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState compact icon={<Receipt className="h-5 w-5" />} title="No bills linked" />
          )
        )}
      </div>

      {chartAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setChartAction(null)}>
          <div className="w-full max-w-md space-y-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-black">{chartAction === 'rx' ? 'Write prescription' : chartAction === 'lab' ? 'Order lab' : 'Record vitals'}</h3>
            {chartAction === 'rx' && (
              <>
                <input value={rxForm.diagnosis} onChange={(e) => setRxForm({ ...rxForm, diagnosis: e.target.value })} placeholder="Diagnosis" className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm" />
                <textarea value={rxForm.medicines} onChange={(e) => setRxForm({ ...rxForm, medicines: e.target.value })} placeholder="One medicine per line" rows={4} className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm" />
                <input value={rxForm.instructions} onChange={(e) => setRxForm({ ...rxForm, instructions: e.target.value })} placeholder="Instructions" className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm" />
              </>
            )}
            {chartAction === 'lab' && (
              <>
                <input value={labForm.testName} onChange={(e) => setLabForm({ ...labForm, testName: e.target.value })} placeholder="Test name" className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm" />
                <select value={labForm.priority} onChange={(e) => setLabForm({ ...labForm, priority: e.target.value })} className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm">
                  <option value="ROUTINE">Routine</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </>
            )}
            {chartAction === 'vitals' && (
              <div className="grid grid-cols-2 gap-2">
                {(['bloodPressure', 'heartRate', 'temperature', 'oxygenSaturation'] as const).map((k) => (
                  <input key={k} value={(vitalsForm as any)[k]} onChange={(e) => setVitalsForm({ ...vitalsForm, [k]: e.target.value })} placeholder={k} className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm" />
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setChartAction(null)} className="px-3 py-2 text-xs font-bold">Cancel</button>
              <button onClick={submitChartAction} disabled={actionBusy} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white">{actionBusy ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
