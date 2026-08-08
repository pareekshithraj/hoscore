import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Activity, BookOpen, Calendar, CheckCircle2, ChevronRight, Clock, Droplet,
  Edit3, FileText, HeartPulse, MonitorX, Pill, Play, Plus, RefreshCw,
  Save, Search, Shield, Stethoscope, Trash2, User, UserCheck, X,
} from 'lucide-react';
import { EmptyState, LoadingState, PageHeader, StatusPill, TokenBadge } from '../components/ui';
import { calcAge, patientIdLabel, relativeWaitMinutes } from '../utils/clinical';
import { cn } from '../lib/cn';

const LAB_TEST_OPTIONS = [
  'Complete Blood Count (CBC)',
  'Basic Metabolic Panel (BMP)',
  'Lipid Profile',
  'Liver Function Test (LFT)',
  'Kidney Function Test (KFT)',
  'Thyroid Profile (T3, T4, TSH)',
  'Blood Sugar (Fasting & PP)',
  'Urine Routine Analysis',
];

const calculateTargetDate = (interval: string) => {
  const date = new Date();
  const map: Record<string, () => void> = {
    '15 Days': () => date.setDate(date.getDate() + 15),
    '1 Month': () => date.setMonth(date.getMonth() + 1),
    '2 Months': () => date.setMonth(date.getMonth() + 2),
    '3 Months': () => date.setMonth(date.getMonth() + 3),
    '4 Months': () => date.setMonth(date.getMonth() + 4),
    '5 Months': () => date.setMonth(date.getMonth() + 5),
    '6 Months': () => date.setMonth(date.getMonth() + 6),
  };
  if (!map[interval]) return null;
  map[interval]();
  return date;
};

type Med = { name: string; dosage: string; duration: string; instructions: string };

const COLUMNS = [
  { key: 'WAITING', label: 'Waiting', tone: 'warning' as const, accent: 'border-t-amber-500' },
  { key: 'IN_CONSULTATION', label: 'In consult', tone: 'info' as const, accent: 'border-t-sky-500' },
  { key: 'COMPLETED', label: 'Done', tone: 'success' as const, accent: 'border-t-emerald-500' },
  { key: 'SKIPPED', label: 'No-show', tone: 'danger' as const, accent: 'border-t-rose-500' },
];

export const OPDQueue = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', doctorName: '', department: 'General',
    estimatedWait: 15, isHoscoreUser: true, manualCareNote: '',
  });
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [activePatient, setActivePatient] = useState<any>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [patientError, setPatientError] = useState('');
  const [manualCareMode, setManualCareMode] = useState(false);
  const [selectedQueueItem, setSelectedQueueItem] = useState<any>(null);
  const [searchId, setSearchId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState<Med[]>([]);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medDuration, setMedDuration] = useState('');
  const [medInstructions, setMedInstructions] = useState('');
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);
  const [labPriority, setLabPriority] = useState('ROUTINE');
  const [alertInterval, setAlertInterval] = useState('None');
  const [isEditingHistory, setIsEditingHistory] = useState(false);
  const [editedHistory, setEditedHistory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [filterDoctor, setFilterDoctor] = useState('ALL');
  const [now, setNow] = useState(Date.now());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [pendingAppointments, setPendingAppointments] = useState<any[]>([]);

  const loadQueue = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/queue?date=${selectedDate}`);
      setQueue(Array.isArray(res) ? res : []);
    } catch {
      /* keep last good state */
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedDate]);

  const loadPendingAppointments = useCallback(async () => {
    try {
      const res = await api.get(`/queue/pending-appointments?date=${selectedDate}`);
      if (Array.isArray(res)) {
        setPendingAppointments(res);
      }
    } catch {}
  }, [selectedDate]);

  useEffect(() => { loadQueue(); loadPendingAppointments(); }, [loadQueue, loadPendingAppointments]);
  useEffect(() => {
    const t = setInterval(() => { setNow(Date.now()); loadQueue(true); loadPendingAppointments(); }, 12000);
    return () => clearInterval(t);
  }, [loadQueue, loadPendingAppointments]);

  useEffect(() => {
    if (!user?.email) return;
    api.get('/doctors').then((res) => {
      setDoctors(res || []);
      const match = (res || []).find((d: any) => d.email?.toLowerCase() === user.email?.toLowerCase());
      setSelectedDoctor(match || res?.[0] || null);
      if (match) setFilterDoctor(match.name);
    }).catch(() => {});
  }, [user]);

  const filteredQueue = useMemo(() => {
    if (filterDoctor === 'ALL') return queue;
    return queue.filter((q) => q.doctorName === filterDoctor);
  }, [queue, filterDoctor]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { WAITING: 0, IN_CONSULTATION: 0, COMPLETED: 0, SKIPPED: 0 };
    filteredQueue.forEach((q) => { c[q.status] = (c[q.status] || 0) + 1; });
    return c;
  }, [filteredQueue]);

  const nextWaiting = useMemo(
    () => filteredQueue.find((q) => q.status === 'WAITING') || null,
    [filteredQueue]
  );

  const handleAdd = async () => {
    if (!form.patientName.trim()) return;
    try {
      await api.post('/queue', form);
      setShowForm(false);
      setForm({ patientName: '', doctorName: selectedDoctor?.name || '', department: 'General', estimatedWait: 15, isHoscoreUser: true, manualCareNote: '' });
      loadQueue(true);
    } catch (err: any) {
      alert(err?.message || 'Failed to add patient to queue.');
    }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/queue/${id}/status`, { status });
      loadQueue(true);
    } catch (err: any) {
      alert(err?.message || 'Failed to update queue status.');
    }
  };

  const loadPatientDetails = async (patientId: string) => {
    setLoadingPatient(true);
    setPatientError('');
    try {
      const res = await api.get(`/patients/${patientId}`);
      setActivePatient(res);
      setEditedHistory(res.medicalHistory || '');
    } catch (err: any) {
      setPatientError(err?.message || 'Error loading patient clinical records.');
      setActivePatient(null);
    } finally {
      setLoadingPatient(false);
    }
  };

  const handleSelectQueueItem = async (item: any) => {
    setSelectedQueueItem(item);
    setPatientError('');
    setManualCareMode(false);
    setActivePatient(null);
    setSubmitSuccess(false);

    if (item.status === 'WAITING') {
      try {
        await api.patch(`/queue/${item.id}/status`, { status: 'IN_CONSULTATION' });
        item = { ...item, status: 'IN_CONSULTATION' };
        setSelectedQueueItem(item);
        loadQueue(true);
      } catch { /* ignore */ }
    }

    if (item.patient?.isHoscoreUser === false) {
      setPatientError(item.patient.manualCareNote || 'Manual-care patient: continue consultation with paper/local records as needed.');
      setManualCareMode(true);
      return;
    }

    if (item.patientId) {
      loadPatientDetails(item.patientId);
      return;
    }

    setLoadingPatient(true);
    try {
      const patients = await api.get('/patients');
      const matched = (patients || []).find((p: any) => p.name?.toLowerCase() === item.patientName?.toLowerCase());
      if (matched) loadPatientDetails(matched.id);
      else {
        setPatientError('Token is not linked to a patient profile. Search by 6-digit HOSCORE ID or register the patient.');
        setLoadingPatient(false);
      }
    } catch {
      setPatientError('Could not resolve patient profile. Search by 6-digit HOSCORE ID.');
      setLoadingPatient(false);
    }
  };

  const handleSearchPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchId.trim();
    if (!trimmed) return;
    setLoadingPatient(true);
    setPatientError('');
    setManualCareMode(false);
    setActivePatient(null);
    setSelectedQueueItem(null);
    const formattedId = trimmed.toUpperCase().startsWith('HSC-') ? trimmed.slice(4) : trimmed;
    try {
      const res = await api.get(`/patients/search/${formattedId}`);
      setActivePatient(res);
      setEditedHistory(res.medicalHistory || '');
    } catch (err: any) {
      setPatientError(err?.message || 'Patient clinical record not found or access restricted.');
    } finally {
      setLoadingPatient(false);
    }
  };

  const handleSaveHistory = async () => {
    if (!activePatient) return;
    try {
      await api.put(`/patients/${activePatient.id}`, { medicalHistory: editedHistory });
      setActivePatient({ ...activePatient, medicalHistory: editedHistory });
      setIsEditingHistory(false);
    } catch { /* ignore */ }
  };

  const handleAddMedicine = () => {
    if (!medName.trim()) return;
    setMedicines([...medicines, {
      name: medName.trim(),
      dosage: medDosage.trim() || '1-0-1',
      duration: medDuration.trim() || '5 Days',
      instructions: medInstructions.trim() || 'After meals',
    }]);
    setMedName(''); setMedDosage(''); setMedDuration(''); setMedInstructions('');
  };

  const handleCompleteTreatment = async () => {
    if (!activePatient) return;
    setSubmitting(true);
    setSubmitSuccess(false);
    try {
      const docId = selectedDoctor?.id;
      if (!docId) {
        alert('No doctor profile resolved. Select or register a doctor first.');
        setSubmitting(false);
        return;
      }
      const serializedMedicines = medicines.map((m) => `${m.name} (${m.dosage} | ${m.duration} | ${m.instructions})`).join('\n');
      await api.post('/prescriptions', {
        doctorId: docId,
        patientId: activePatient.id,
        diagnosis: diagnosis || 'General Consultation',
        medicines: serializedMedicines || 'No medicines prescribed',
        instructions: 'Consultation notes: ' + (diagnosis || 'Routine checkup'),
      });
      if (selectedLabs.length > 0) {
        await api.post('/lab-orders', {
          patientName: activePatient.name,
          patientId: activePatient.id,
          doctorName: selectedDoctor.name,
          doctorId: docId,
          testName: selectedLabs.join(', '),
          testType: 'Diagnostic Panels',
          priority: labPriority,
        });
      }
      const patientUpdate: any = {};
      if (alertInterval !== 'None') {
        patientUpdate.nextAppointmentAlertInterval = alertInterval;
        patientUpdate.nextAppointmentAlertDate = calculateTargetDate(alertInterval);
        patientUpdate.nextAppointmentAlertStatus = 'ACTIVE';
      } else {
        patientUpdate.nextAppointmentAlertInterval = 'None';
        patientUpdate.nextAppointmentAlertDate = null;
        patientUpdate.nextAppointmentAlertStatus = 'INACTIVE';
      }
      await api.put(`/patients/${activePatient.id}`, patientUpdate);
      if (selectedQueueItem) {
        await api.patch(`/queue/${selectedQueueItem.id}/status`, { status: 'COMPLETED' });
      }
      setSubmitSuccess(true);
      setDiagnosis(''); setMedicines([]); setSelectedLabs([]); setAlertInterval('None');
      loadQueue(true);
      loadPatientDetails(activePatient.id);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const callNext = () => {
    if (nextWaiting) handleSelectQueueItem(nextWaiting);
  };

  const computedTargetDate = alertInterval !== 'None' ? calculateTargetDate(alertInterval) : null;
  void now; // drives re-render for wait timers

  const handleCheckInAppt = async (id: string) => {
    try {
      await api.patch(`/appointments/${id}/checkin`);
      loadPendingAppointments();
      loadQueue(true);
    } catch (err: any) {
      alert(err?.message || 'Failed to check in appointment');
    }
  };

  const handleCheckInAllAppts = async () => {
    try {
      for (const appt of pendingAppointments) {
        await api.patch(`/appointments/${appt.id}/checkin`);
      }
      loadPendingAppointments();
      loadQueue(true);
    } catch {}
  };

  if (loading) return <LoadingState label="Loading live OPD board…" />;

  return (
    <div className="space-y-5 pb-10 animate-fade-in-up">
      <PageHeader
        title="OPD Live Board"
        subtitle="Call the next patient, run consult, prescribe, and clear the queue — one flow."
        icon={<Stethoscope className="h-5 w-5" />}
        meta={
          <>
            <StatusPill tone="info" pulse>{counts.IN_CONSULTATION} in consult</StatusPill>
            <StatusPill tone="warning">{counts.WAITING} waiting</StatusPill>
            <StatusPill tone="success">{counts.COMPLETED} done today</StatusPill>
          </>
        }
        actions={
          <>
            {selectedDoctor && (
              <div className="flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--inner-bg)] px-3 py-2 text-xs font-bold text-[var(--text-secondary)]">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Dr. {selectedDoctor.name}
              </div>
            )}
            <button
              onClick={callNext}
              disabled={!nextWaiting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40"
            >
              <Play className="h-4 w-4" /> Call next
            </button>
            <button
              onClick={() => {
                setForm((f) => ({ ...f, doctorName: selectedDoctor?.name || f.doctorName }));
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-2.5 text-sm font-bold text-[var(--text-primary)] transition-all hover:bg-[var(--inner-bg)]"
            >
              <Plus className="h-4 w-4" /> Add token
            </button>
          </>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchPatient} className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Lookup HSC-123456"
              className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] py-2.5 pl-10 pr-3 text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
            Open chart
          </button>
        </form>
        <div className="flex items-center gap-2">
          <select
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)]"
          >
            <option value="ALL">All doctors</option>
            {[...new Set(queue.map((q) => q.doctorName).filter(Boolean))].map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)]"
          />
          <button
            onClick={() => { loadQueue(); loadPendingAppointments(); }}
            className="rounded-xl border border-[var(--card-border)] p-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 🔔 Pending Online Bookings Banner */}
      {pendingAppointments.length > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 shadow-sm animate-fade-in">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
              <span className="font-bold text-amber-700 dark:text-amber-300 text-sm">
                🔔 {pendingAppointments.length} Online Booking{pendingAppointments.length > 1 ? 's' : ''} Pending Check-In
              </span>
              <span className="hidden md:inline text-xs text-[var(--text-muted)] font-medium">
                (Click "Check In" to immediately add patient to the OPD Live Board)
              </span>
            </div>
            {pendingAppointments.length > 1 && (
              <button
                onClick={handleCheckInAllAppts}
                className="rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700 active:scale-95 transition-all"
              >
                Check In All ({pendingAppointments.length})
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingAppointments.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-[var(--card-bg)] p-3 shadow-xs hover:border-amber-500/40 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[var(--text-primary)] text-sm truncate">
                    {appt.patient?.name || appt.patientName || 'Patient'}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-semibold flex items-center gap-1.5 mt-0.5">
                    <span className="rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 font-bold">
                      #{appt.tokenNumber}
                    </span>
                    <span>{appt.time || '10:00 AM'}</span>
                    {appt.doctor?.name && <span className="truncate">· Dr. {appt.doctor.name}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleCheckInAppt(appt.id)}
                  className="shrink-0 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
                >
                  Check In →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kanban board */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = filteredQueue.filter((q) => q.status === col.key);
          return (
            <div
              key={col.key}
              className={cn(
                'flex min-h-[280px] flex-col rounded-2xl border border-[var(--card-border)] border-t-4 bg-[var(--inner-bg)]',
                col.accent
              )}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">{col.label}</h3>
                  <span className="rounded-md bg-[var(--card-bg)] px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-[var(--text-muted)] border border-[var(--card-border)]">
                    {items.length}
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3 max-h-[420px]">
                {items.length === 0 && (
                  <div className="rounded-xl border border-dashed border-[var(--card-border)] px-3 py-8 text-center text-xs text-[var(--text-muted)]">
                    Empty
                  </div>
                )}
                {items.map((q) => {
                  const wait = relativeWaitMinutes(q.createdAt ?? q.date);
                  const selected = selectedQueueItem?.id === q.id;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleSelectQueueItem(q)}
                      className={cn(
                        'w-full rounded-xl border bg-[var(--card-bg)] p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
                        selected
                          ? 'border-blue-500/50 ring-2 ring-blue-500/20 shadow-md'
                          : 'border-[var(--card-border)]'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <TokenBadge token={q.tokenNumber} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[var(--text-primary)]">{q.patientName}</p>
                          <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">
                            Dr. {q.doctorName} · {q.department}
                          </p>
                          {q.patient?.isHoscoreUser === false && (
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                              Manual care
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between border-t border-[var(--card-border)] pt-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--text-muted)]">
                          <Clock className="h-3 w-3" />
                          {wait != null ? `${wait}m` : `${q.estimatedWait}m est.`}
                        </span>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {q.status === 'WAITING' && (
                            <span
                              role="button"
                              onClick={() => handleStatus(q.id, 'IN_CONSULTATION')}
                              className="rounded-lg p-1 text-sky-600 hover:bg-sky-500/10"
                              title="Call"
                            >
                              <Play className="h-3.5 w-3.5" />
                            </span>
                          )}
                          {q.status === 'IN_CONSULTATION' && (
                            <span
                              role="button"
                              onClick={() => handleStatus(q.id, 'COMPLETED')}
                              className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-500/10"
                              title="Complete"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </span>
                          )}
                          {q.status !== 'COMPLETED' && q.status !== 'SKIPPED' && (
                            <span
                              role="button"
                              onClick={() => handleStatus(q.id, 'SKIPPED')}
                              className="rounded-lg p-1 text-rose-600 hover:bg-rose-500/10"
                              title="No-show"
                            >
                              <MonitorX className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Consultation workspace */}
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-rose-500" />
            <h2 className="text-sm font-black text-[var(--text-primary)]">Consultation workspace</h2>
          </div>
          {selectedQueueItem && (
            <StatusPill status={selectedQueueItem.status} pulse={selectedQueueItem.status === 'IN_CONSULTATION'}>
              Token #{selectedQueueItem.tokenNumber} · {selectedQueueItem.status.replace(/_/g, ' ')}
            </StatusPill>
          )}
        </div>

        <div className="p-5">
          {submitSuccess && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p>Consultation completed</p>
                <p className="mt-0.5 text-xs font-medium opacity-80">E-prescription saved, labs ordered, follow-up recorded, token closed.</p>
              </div>
            </div>
          )}

          {loadingPatient && <LoadingState label="Loading patient chart…" className="min-h-[200px]" />}

          {!loadingPatient && patientError && (
            <div className={cn(
              'rounded-2xl border p-6',
              manualCareMode
                ? 'border-amber-500/25 bg-amber-500/[0.06]'
                : 'border-rose-500/25 bg-rose-500/[0.06]'
            )}>
              <div className="flex items-start gap-4">
                <div className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
                  manualCareMode ? 'border-amber-500/20 bg-amber-500/10 text-amber-600' : 'border-rose-500/20 bg-rose-500/10 text-rose-600'
                )}>
                  {manualCareMode ? <FileText className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--text-primary)]">
                    {manualCareMode ? 'Manual care token' : 'Access restricted'}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)] leading-relaxed">{patientError}</p>
                </div>
              </div>
            </div>
          )}

          {!loadingPatient && !patientError && !activePatient && (
            <EmptyState
              icon={<Stethoscope className="h-6 w-6" />}
              title="Select a patient from the board"
              description="Click a waiting token to start consult, or look up a HOSCORE ID above. Call Next jumps straight into the next patient."
              action={
                nextWaiting ? (
                  <button onClick={callNext} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">
                    <Play className="h-4 w-4" /> Call token #{nextWaiting.tokenNumber}
                  </button>
                ) : undefined
              }
            />
          )}

          {!loadingPatient && !patientError && activePatient && (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
              {/* Patient strip + history */}
              <div className="xl:col-span-5 space-y-4">
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--inner-bg)] p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-black text-white shadow-md">
                      {activePatient.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-[var(--text-primary)] truncate">{activePatient.name}</h3>
                        <span className="rounded-md bg-blue-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-600 dark:text-sky-400">
                          {patientIdLabel(activePatient)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {calcAge(activePatient.dateOfBirth)}y · {activePatient.gender || '—'} ·{' '}
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                          <Droplet className="h-3 w-3" />{activePatient.bloodGroup || 'O+'}
                        </span>
                      </p>
                      {activePatient.id && (
                        <Link
                          to={`/dashboard/patients/${activePatient.id}`}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline"
                        >
                          Full chart <ChevronRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3.5">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                        <BookOpen className="h-3.5 w-3.5" /> History & allergies
                      </h4>
                      <button
                        onClick={() => (isEditingHistory ? handleSaveHistory() : setIsEditingHistory(true))}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-sky-400"
                      >
                        {isEditingHistory ? <><Save className="h-3.5 w-3.5" /> Save</> : <><Edit3 className="h-3.5 w-3.5" /> Edit</>}
                      </button>
                    </div>
                    {isEditingHistory ? (
                      <textarea
                        value={editedHistory}
                        onChange={(e) => setEditedHistory(e.target.value)}
                        className="min-h-[88px] w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] p-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    ) : (
                      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                        {activePatient.medicalHistory || 'No chronic conditions or allergies recorded.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Prior Rx */}
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--inner-bg)] p-4">
                  <h4 className="mb-3 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                    <Pill className="h-3.5 w-3.5" /> Prior prescriptions
                  </h4>
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {activePatient.prescriptions?.length ? activePatient.prescriptions.slice(0, 5).map((rx: any) => (
                      <div key={rx.id} className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[var(--text-primary)]">{rx.diagnosis}</span>
                          <StatusPill status={rx.status} />
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-[var(--text-secondary)] whitespace-pre-line line-clamp-3">{rx.medicines}</p>
                      </div>
                    )) : (
                      <p className="py-4 text-center text-xs text-[var(--text-muted)]">No prior Rx at this hospital.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Prescribe form */}
              <div className="xl:col-span-7 space-y-4">
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--inner-bg)] p-5 space-y-5">
                  <h3 className="flex items-center gap-2 text-sm font-black text-[var(--text-primary)] border-b border-[var(--card-border)] pb-3">
                    <Activity className="h-4 w-4 text-blue-600" /> Diagnose · Prescribe · Order
                  </h3>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Diagnosis / findings</label>
                    <textarea
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="e.g. Essential hypertension, Grade 2 · advise lifestyle + meds"
                      className="min-h-[84px] w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Medicines</label>
                    {medicines.length > 0 && (
                      <div className="mb-3 overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-[var(--card-border)] bg-[var(--inner-bg)] text-[var(--text-muted)]">
                            <tr>
                              <th className="px-3 py-2 font-bold">Drug</th>
                              <th className="px-3 py-2 font-bold">Dose</th>
                              <th className="px-3 py-2 font-bold">Duration</th>
                              <th className="px-3 py-2 font-bold">Notes</th>
                              <th className="px-3 py-2" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--card-border)]">
                            {medicines.map((m, i) => (
                              <tr key={i}>
                                <td className="px-3 py-2 font-bold text-[var(--text-primary)]">{m.name}</td>
                                <td className="px-3 py-2 font-mono">{m.dosage}</td>
                                <td className="px-3 py-2">{m.duration}</td>
                                <td className="px-3 py-2 text-[var(--text-muted)] italic">{m.instructions}</td>
                                <td className="px-3 py-2 text-right">
                                  <button onClick={() => setMedicines(medicines.filter((_, idx) => idx !== i))} className="text-rose-500 hover:text-rose-600">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                      <input value={medName} onChange={(e) => setMedName(e.target.value)} placeholder="Medicine" className="sm:col-span-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)]" />
                      <input value={medDosage} onChange={(e) => setMedDosage(e.target.value)} placeholder="1-0-1" className="rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-xs font-mono text-[var(--text-primary)]" />
                      <input value={medDuration} onChange={(e) => setMedDuration(e.target.value)} placeholder="5 days" className="rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-xs text-[var(--text-primary)]" />
                      <button type="button" onClick={handleAddMedicine} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                        + Add
                      </button>
                    </div>
                    <input value={medInstructions} onChange={(e) => setMedInstructions(e.target.value)} placeholder="Instructions (after meals…)" className="mt-2 w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-xs text-[var(--text-primary)]" />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Lab panels</label>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {LAB_TEST_OPTIONS.map((lab) => {
                        const checked = selectedLabs.includes(lab);
                        return (
                          <label key={lab} className={cn(
                            'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
                            checked
                              ? 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-sky-300'
                              : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-secondary)]'
                          )}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => setSelectedLabs(checked ? selectedLabs.filter((l) => l !== lab) : [...selectedLabs, lab])}
                              className="accent-blue-600"
                            />
                            {lab}
                          </label>
                        );
                      })}
                    </div>
                    {selectedLabs.length > 0 && (
                      <div className="mt-2 flex items-center gap-4 text-xs font-bold">
                        <label className="flex items-center gap-1.5"><input type="radio" checked={labPriority === 'ROUTINE'} onChange={() => setLabPriority('ROUTINE')} /> Routine</label>
                        <label className="flex items-center gap-1.5 text-rose-600"><input type="radio" checked={labPriority === 'URGENT'} onChange={() => setLabPriority('URGENT')} /> Urgent</label>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Follow-up alert</label>
                      <select
                        value={alertInterval}
                        onChange={(e) => setAlertInterval(e.target.value)}
                        className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
                      >
                        {['None', '15 Days', '1 Month', '2 Months', '3 Months', '4 Months', '5 Months', '6 Months'].map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <div className="flex w-full items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2.5 text-xs font-semibold text-[var(--text-muted)]">
                        <Calendar className="h-4 w-4" />
                        {computedTargetDate
                          ? `Target: ${computedTargetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
                          : 'No follow-up scheduled'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleCompleteTreatment}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-black text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50"
                  >
                    {submitting ? (
                      <><RefreshCw className="h-4 w-4 animate-spin" /> Signing & saving…</>
                    ) : (
                      <><UserCheck className="h-4 w-4" /> Complete consult & sign prescription</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add token modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-black text-[var(--text-primary)]">Add OPD token</h3>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--inner-bg)]"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Patient name', key: 'patientName', placeholder: 'Full name' },
                { label: 'Doctor', key: 'doctorName', placeholder: 'Dr. name' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{f.label}</label>
                  <input
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Department</label>
                  <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm">
                    {['General', 'Cardiology', 'Pediatrics', 'Neurology', 'Dermatology', 'Orthopedics'].map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Est. wait (min)</label>
                  <input type="number" value={form.estimatedWait} onChange={(e) => setForm({ ...form, estimatedWait: parseInt(e.target.value) || 15 })} className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm" />
                </div>
              </div>
              <label className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-bold text-amber-800 dark:text-amber-200">
                <input type="checkbox" checked={!form.isHoscoreUser} onChange={(e) => setForm({ ...form, isHoscoreUser: !e.target.checked })} className="mt-0.5" />
                Non-HOSCORE walk-in (manual care)
              </label>
              {!form.isHoscoreUser && (
                <textarea
                  value={form.manualCareNote}
                  onChange={(e) => setForm({ ...form, manualCareNote: e.target.value })}
                  placeholder="Note for doctor"
                  className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm"
                />
              )}
              <button onClick={handleAdd} className="mt-2 w-full rounded-xl bg-blue-600 py-3 text-sm font-black text-white hover:bg-blue-700">
                Generate token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
