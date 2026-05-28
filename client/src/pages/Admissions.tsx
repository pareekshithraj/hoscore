import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Plus, Search, Calendar, User, Bed, Clock, Edit2, Trash2 } from 'lucide-react';
import { Modal } from '../components/Modal';

export const Admissions = () => {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Discharged'>('All');
  const [formData, setFormData] = useState({ patientName: '', doctorId: '', bedId: '', reason: '' });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/admissions'),
      api.get('/doctors'),
      api.get('/beds')
    ]).then(([admRes, docRes, bedRes]) => {
      setAdmissions(admRes);
      setDoctors(docRes);
      setBeds(bedRes);
      if (docRes.length > 0 && !formData.doctorId) setFormData(p => ({...p, doctorId: docRes[0].id}));
      if (bedRes.length > 0 && !formData.bedId) {
        const available = bedRes.find((b:any) => b.status === 'AVAILABLE');
        if (available) setFormData(p => ({...p, bedId: available.id}));
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDischarge = async (id: string) => {
    if (!window.confirm('Are you sure you want to discharge this patient?')) return;
    try {
      await api.patch(`/admissions/${id}/discharge`, {});
      fetchData(); // Refresh the list
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.bedId) return alert('No beds available!');
      await api.post('/admissions', formData);
      setIsModalOpen(false);
      setFormData(p => ({ ...p, patientName: '', reason: '' }));
      fetchData();
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 font-medium">
        <div className="animate-pulse">Loading admissions records...</div>
      </div>
    );
  }

  const activeCount = admissions.filter(a => a.status === 'Active').length;
  const dischargedCount = admissions.filter(a => a.status === 'Discharged').length;

  const filtered = admissions.filter(a => filter === 'All' || a.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Admissions</h2>
          <p className="text-slate-500">Track and manage patient admissions and discharges.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Admission
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Active Admissions</p>
          <p className="text-3xl font-bold text-blue-600">{activeCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Discharged This Month</p>
          <p className="text-3xl font-bold text-emerald-600">{dischargedCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Avg. Stay Duration</p>
          <p className="text-3xl font-bold text-amber-600">4.2 <span className="text-sm font-medium text-slate-500">days</span></p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search admissions..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {(['All', 'Active', 'Discharged'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Admission ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor / Bed</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dates</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 font-mono text-sm text-blue-600 font-semibold">{a.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-xs text-slate-500">
                      {a.patient?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                    </div>
                    <span className="font-medium text-slate-900">{a.patient?.name || 'Unknown'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <p className="font-medium text-slate-800 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> N/A (Assigned via Appt)</p>
                  <p className="text-slate-500 flex items-center gap-1.5 mt-0.5"><Bed className="w-3.5 h-3.5" /> {a.bed?.bedNumber} · {a.bed?.room?.name}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 max-w-[150px] truncate">{a.reason || 'Not specified'}</td>
                <td className="px-6 py-4 text-sm">
                  <p className="flex items-center gap-1.5 text-slate-600"><Calendar className="w-3.5 h-3.5" /> {new Date(a.admissionDate).toLocaleDateString()}</p>
                  {a.dischargeDate ? (
                    <p className="flex items-center gap-1.5 text-emerald-600 mt-0.5"><Clock className="w-3.5 h-3.5" /> {new Date(a.dischargeDate).toLocaleDateString()}</p>
                  ) : <p className="text-xs text-slate-400 mt-0.5">Ongoing</p>}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${a.status === 'Active' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}>{a.status}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {a.status === 'Active' && (
                      <button onClick={() => handleDischarge(a.id)} className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-md hover:bg-emerald-100">Discharge</button>
                    )}
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"><Edit2 className="w-4 h-4" /></button>
                    <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Admission">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name</label>
              <input required value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} type="text" placeholder="Full name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assign Doctor</label>
              <select value={formData.doctorId} onChange={e => setFormData({...formData, doctorId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assign Bed</label>
              <select required value={formData.bedId} onChange={e => setFormData({...formData, bedId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Bed</option>
                {beds.filter(b => b.status === 'AVAILABLE').map(b => <option key={b.id} value={b.id}>{b.bedNumber} - {b.room?.name || 'Room'}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Admission</label>
              <textarea value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} rows={3} placeholder="Describe the reason or diagnosis..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Admit Patient</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
