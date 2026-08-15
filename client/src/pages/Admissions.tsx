import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Plus, Search, Calendar, User, Bed, Clock, Edit2, LogOut, Activity, MapPin } from 'lucide-react';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { StatusPill } from '../components/ui/StatusPill';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { PatientPicker } from '../components/clinical/PatientPicker';

export const Admissions = () => {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Discharged'>('All');
  const [formData, setFormData] = useState({ patientName: '', patientId: '', doctorId: '', bedId: '', reason: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [dischargeId, setDischargeId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/admissions'),
      api.get('/doctors'),
      api.get('/beds')
    ]).then(([admRes, docRes, bedRes]) => {
      setAdmissions(admRes || []);
      setDoctors(docRes || []);
      setBeds(bedRes || []);
      if (docRes && docRes.length > 0 && !formData.doctorId) setFormData(p => ({...p, doctorId: docRes[0].id}));
      if (bedRes && bedRes.length > 0 && !formData.bedId) {
        const available = bedRes.find((b:any) => b.status === 'AVAILABLE');
        if (available) setFormData(p => ({...p, bedId: available.id}));
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDischarge = (id: string) => {
    setDischargeId(id);
  };

  const confirmDischarge = async () => {
    if (!dischargeId) return;
    try {
      await api.patch(`/admissions/${dischargeId}/discharge`, {});
      setDischargeId(null);
      fetchData(); // Refresh the list
    } catch (err) {
      console.error(err);
    }
  };

  // Place an admitted patient on the hospital map at the anchor linked to their
  // bed/room, so the patient app & family share link show a live "you are here".
  const locateOnMap = async (a: any) => {
    if (!a.patient?.id) return setAlertMessage('This admission has no linked patient profile to locate.');
    try {
      const map = await api.get('/map');
      const floors: any[] = map?.floors || [];
      let match: { floorId: string; r: number; c: number; label: string } | null = null;
      for (const f of floors) {
        const anchor = (f.anchors || []).find((an: any) =>
          (a.bed?.id && an.bedId === a.bed.id) || (a.bed?.room?.id && an.roomId === a.bed.room.id));
        if (anchor) { match = { floorId: f.id, r: anchor.cell.r, c: anchor.cell.c, label: `${a.patient?.name || 'Patient'} · Bed ${a.bed?.bedNumber || ''}`.trim() }; break; }
      }
      if (!match) return setAlertMessage('No map anchor is linked to this bed/room yet. Add one in the Map Builder.');
      await api.post('/map/positions', {
        subjectType: 'PATIENT', subjectId: a.patient.id, label: match.label,
        floorId: match.floorId, cellR: match.r, cellC: match.c,
        note: `Admitted to ${a.bed?.room?.name || 'ward'}${a.bed?.bedNumber ? `, Bed ${a.bed.bedNumber}` : ''}.`,
      });
      setAlertMessage('Patient located on map — visible to staff occupancy preview, the patient app, and family share.');
    } catch (err: any) {
      setAlertMessage(err?.message || 'Could not set map location.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.patientId) return setAlertMessage('Select a registered patient.');
      if (!formData.bedId) return setAlertMessage('No beds available!');
      await api.post('/admissions', formData);
      setIsModalOpen(false);
      setFormData(p => ({ ...p, patientName: '', patientId: '', reason: '' }));
      fetchData();
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return <LoadingState label="Loading admissions records..." />;
  }

  const activeCount = admissions.filter(a => a.status === 'Active').length;
  const dischargedCount = admissions.filter(a => a.status === 'Discharged').length;
  const avgDaysLabel = (() => {
    const discharged = admissions.filter(a => a.status === 'Discharged' && a.dischargeDate && a.admissionDate);
    if (discharged.length === 0) return '0.0';
    const totalStayMs = discharged.reduce((sum, a) => {
      const start = new Date(a.admissionDate).getTime();
      const end = new Date(a.dischargeDate).getTime();
      return sum + Math.max(0, end - start);
    }, 0);
    const avgDays = totalStayMs / (1000 * 60 * 60 * 24);
    return avgDays.toFixed(1);
  })();

  const filtered = admissions.filter(a => {
    const matchesFilter = filter === 'All' || a.status === filter;
    const matchesSearch = 
      a.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.bed?.bedNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inpatient Admissions"
        subtitle="Track and manage bed occupancy, patient admissions, and hospital discharges"
        icon={<Bed className="w-5 h-5" />}
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Admission
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Active Inpatients"
          value={activeCount}
          accent="#2563eb"
          icon={<Bed className="w-5 h-5" />}
        />
        <StatCard
          label="Discharged (Month)"
          value={dischargedCount}
          accent="#10b981"
          icon={<LogOut className="w-5 h-5" />}
        />
        <StatCard
          label="Avg. Inpatient Stay"
          value={`${avgDaysLabel} days`}
          accent="#f59e0b"
          icon={<Activity className="w-5 h-5" />}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input 
            type="text" 
            placeholder="Search admissions..." 
            className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-[var(--inner-bg)] p-1.5 rounded-xl border border-[var(--card-border)]">
          {(['All', 'Active', 'Discharged'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filter === f
                  ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--inner-bg)] border-b border-[var(--card-border)]">
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Admission ID</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Patient</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Bed / Room</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Reason</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Dates</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)]">
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-[var(--inner-bg)] transition-colors group">
                <td className="px-6 py-4 font-mono text-xs text-blue-600 dark:text-sky-400 font-bold">ADM-{String(a.id).slice(0, 6).toUpperCase()}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[var(--inner-bg)] rounded-full flex items-center justify-center font-bold text-xs text-[var(--text-primary)] border border-[var(--card-border)]">
                      {initials(a.patient?.name || a.patientName)}
                    </div>
                    <span className="font-bold text-[var(--text-primary)]">{a.patient?.name || a.patientName || 'Unknown'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-semibold text-[var(--text-primary)]">
                  <p className="flex items-center gap-1.5 text-[var(--text-primary)] font-bold"><Bed className="w-3.5 h-3.5 text-[var(--text-muted)]" /> Bed {a.bed?.bedNumber || '—'}</p>
                  <p className="text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">{a.bed?.room?.name || 'Inpatient Room'}</p>
                </td>
                <td className="px-6 py-4 text-xs text-[var(--text-secondary)] font-medium max-w-[160px] truncate">{a.reason || 'Not specified'}</td>
                <td className="px-6 py-4 text-xs font-semibold">
                  <p className="flex items-center gap-1.5 text-[var(--text-primary)]"><Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" /> {new Date(a.admissionDate).toLocaleDateString()}</p>
                  {a.dischargeDate ? (
                    <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mt-0.5 font-bold"><Clock className="w-3.5 h-3.5" /> {new Date(a.dischargeDate).toLocaleDateString()}</p>
                  ) : <p className="text-[11px] text-sky-600 dark:text-sky-400 font-bold mt-0.5">Ongoing Stay</p>}
                </td>
                <td className="px-6 py-4">
                  <StatusPill status={a.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {a.status === 'Active' && (
                      <>
                        <button onClick={() => locateOnMap(a)} title="Locate on hospital map" className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-sky-700 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-300 rounded-lg hover:bg-sky-100 cursor-pointer transition-all"><MapPin className="w-3.5 h-3.5" />Locate</button>
                        <button onClick={() => handleDischarge(a.id)} className="px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300 rounded-lg hover:bg-emerald-100 cursor-pointer transition-all">Discharge</button>
                      </>
                    )}
                    <button onClick={() => setDischargeId(a.id)} className="p-1.5 text-[var(--text-muted)] hover:text-emerald-600 hover:bg-[var(--inner-bg)] rounded-lg cursor-pointer transition-colors" title="Discharge">
                      <LogOut className="w-4 h-4" />
                    </button>
                    {a.patient?.id && (
                      <Link to={`/dashboard/patients/${a.patient.id}`} className="p-1.5 text-[var(--text-muted)] hover:text-blue-600 dark:hover:text-sky-400 hover:bg-[var(--inner-bg)] rounded-lg cursor-pointer transition-colors" title="Edit chart">
                        <Edit2 className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <EmptyState
            icon={<Bed className="w-8 h-8 text-[var(--text-muted)]" />}
            title="No admissions found"
            description="Register a new inpatient admission to assign beds and track stay duration"
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Admission">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <PatientPicker
                value={formData.patientId}
                onChange={(p) => setFormData({ ...formData, patientId: p?.id || '', patientName: p?.name || '' })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Assign Doctor</label>
              <select value={formData.doctorId} onChange={e => setFormData({...formData, doctorId: e.target.value})} className="w-full px-3 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] rounded-xl text-sm font-semibold text-[var(--text-primary)] focus:outline-none">
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Assign Bed</label>
              <select required value={formData.bedId} onChange={e => setFormData({...formData, bedId: e.target.value})} className="w-full px-3 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] rounded-xl text-sm font-semibold text-[var(--text-primary)] focus:outline-none">
                <option value="">Select Bed</option>
                {beds.filter(b => b.status === 'AVAILABLE').map(b => <option key={b.id} value={b.id}>{b.bedNumber} - {b.room?.name || 'Room'}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Reason for Admission</label>
              <textarea value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} rows={3} placeholder="Describe the reason or diagnosis..." className="w-full px-3 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] rounded-xl text-sm font-semibold text-[var(--text-primary)] focus:outline-none resize-none" />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border border-[var(--card-border)] rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--inner-bg)] cursor-pointer">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md cursor-pointer">Admit Patient</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!dischargeId} onClose={() => setDischargeId(null)} title="Discharge Patient">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-primary)]">Are you sure you want to discharge this patient? This will update the bed status to cleaning.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDischargeId(null)} className="px-4 py-2 border border-[var(--card-border)] rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--inner-bg)] cursor-pointer">Cancel</button>
            <button onClick={confirmDischarge} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer">Discharge</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!alertMessage} onClose={() => setAlertMessage(null)} title="Alert">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-primary)]">{alertMessage}</p>
          <div className="flex justify-end">
            <button onClick={() => setAlertMessage(null)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer">OK</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

