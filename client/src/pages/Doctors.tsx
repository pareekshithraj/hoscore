import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Plus, Search, Stethoscope, User, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import { Modal } from '../components/Modal';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  email: string;
  status: string;
  rating?: number;
  patientsCount?: number;
}

export const Doctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState({ name: '', specialty: 'Cardiology', contact: '', email: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const specialties = ['Cardiology', 'Neurosurgery', 'Pulmonology', 'Orthopedics', 'Pediatrics', 'Dermatology', 'General Medicine'];

  const fetchDoctors = () => {
    setLoading(true);
    api.get('/doctors')
      .then(res => setDoctors(res))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDoctors(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/doctors/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchDoctors();
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.patch(`/doctors/${editingId}`, formData);
      } else {
        await api.post('/doctors', formData);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', specialty: 'Cardiology', contact: '', email: '' });
      fetchDoctors();
    } catch (err) { console.error(err); }
  };

  const filtered = doctors.filter(doc => {
    const matchesSearch = !searchQuery ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = specialtyFilter === 'All' || doc.specialty === specialtyFilter;
    return matchesSearch && matchesSpecialty;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 font-medium">
        <div className="animate-pulse">Loading medical staff...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Doctors</h2>
          <p className="text-slate-500">Manage doctor profiles, assignments, and schedules.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Add Doctor
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or specialty..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={specialtyFilter}
          onChange={e => setSpecialtyFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none"
        >
          <option value="All">All Specialties</option>
          {specialties.map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-slate-500 font-medium">{filtered.length} of {doctors.length}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((doc) => (
          <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
                  <Stethoscope className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{doc.name}</h3>
                  <p className="text-sm text-blue-600 font-medium">{doc.specialty}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${['On Duty', 'ON_DUTY', 'AVAILABLE'].includes(doc.status) ? 'bg-emerald-100 text-emerald-700' : doc.status === 'On Leave' || doc.status === 'ON_LEAVE' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                {doc.status === 'ON_DUTY' ? 'On Duty' : doc.status}
              </span>
            </div>

            <div className="space-y-2 text-sm text-slate-600 mb-5">
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400" />{doc.email}</div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">{doc.patientsCount || 0} linked records</span>
              </div>
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  setEditingId(doc.id);
                  setFormData({ name: doc.name, specialty: doc.specialty, contact: (doc as any).contact || '', email: doc.email });
                  setIsModalOpen(true);
                }}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <Link
                to={`/dashboard/patients?q=${encodeURIComponent(doc.name)}`}
                className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 text-center"
              >
                View Patients
              </Link>
              <button onClick={() => setDeleteTarget(doc)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-16 text-slate-400">
            <Stethoscope className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">No doctors match your search</p>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4 border border-red-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Remove Doctor</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="ml-auto text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-700 mb-5">Are you sure you want to remove <span className="font-semibold">{deleteTarget.name}</span> from the system?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Remove</button>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Doctor">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input type="text" placeholder="Dr. First Last" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Specialty</label>
              <select value={formData.specialty} onChange={e => setFormData(p => ({ ...p, specialty: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {specialties.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact</label>
              <input type="text" placeholder="+1 234 567 890" value={formData.contact} onChange={e => setFormData(p => ({ ...p, contact: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" placeholder="doctor@hospital.com" required value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Add Doctor</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
