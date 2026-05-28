import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, Calendar, Phone, Activity, Eye } from 'lucide-react';
import { Modal } from '../components/Modal';

export const Patients = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', contact: '', email: '', dateOfBirth: '', gender: 'Male', bloodGroup: 'O+', isHoscoreUser: true, manualCareNote: ''
  });
  const [today] = useState(() => new Date());

  const fetchPatients = () => {
    setLoading(true);
    api.get('/patients')
      .then(res => setPatients(res))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/patients', {
        ...formData,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined
      });
      setIsModalOpen(false);
      setFormData({ name: '', contact: '', email: '', dateOfBirth: '', gender: 'Male', bloodGroup: 'O+', isHoscoreUser: true, manualCareNote: '' });
      fetchPatients();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return;
    try {
      await api.delete(`/patients/${id}`);
      fetchPatients();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 font-medium">
        <div className="animate-pulse">Loading patient registry...</div>
      </div>
    );
  }

  const calculateAge = (dobString: string | null) => {
    if (!dobString) return 'N/A';
    const dob = new Date(dobString);
    const ageDifMs = today.getTime() - dob.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const getLastVisit = (admissions: any[]) => {
    if (!admissions || admissions.length === 0) return 'No visits';
    const dates = admissions.map(a => new Date(a.admissionDate).getTime());
    return new Date(Math.max(...dates)).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Patient Management</h2>
          <p className="text-slate-500">View and manage patient clinical records and history.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Register New Patient
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, ID or phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            <Calendar className="w-4 h-4" />
            Date Range
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Info</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Blood Group</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Visit</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                      {patient.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 block">{patient.name}</span>
                      <span className="text-xs text-slate-500">
                        {patient.isHoscoreUser === false ? 'Manual walk-in' : `HSC-${patient.sixDigitId || patient.id.padStart(5, '0')}`}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      {calculateAge(patient.dateOfBirth)}y, {patient.gender || 'Unknown'}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Phone className="w-3.5 h-3.5" />
                      {patient.contact || 'N/A'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-bold">
                    {patient.bloodGroup || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{getLastVisit(patient.admissions)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    patient.isHoscoreUser === false ? 'bg-slate-900 text-white' :
                    patient.status === 'In-Patient' ? 'bg-blue-100 text-blue-800' : 
                    patient.status === 'Out-Patient' ? 'bg-amber-100 text-amber-800' : 
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {patient.isHoscoreUser === false ? 'Manual Care' : patient.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(patient.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <Link to={`/dashboard/patients/${patient.id}`} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md" title="View Timeline">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Patient">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" placeholder="Full name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
              <input value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} type="text" placeholder="+1 234 567 890" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" placeholder="patient@example.com" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
              <input required value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
              <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
              <select value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div className="col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={!formData.isHoscoreUser}
                  onChange={e => setFormData({...formData, isHoscoreUser: !e.target.checked})}
                  className="mt-1"
                />
                Register as non-HOSCORE walk-in patient
              </label>
              <p className="text-xs text-slate-500 mt-1 ml-6">
                Use this for patients who cannot use phone/app login. Doctors will see a manual-care warning on their token.
              </p>
              {!formData.isHoscoreUser && (
                <textarea
                  value={formData.manualCareNote}
                  onChange={e => setFormData({...formData, manualCareNote: e.target.value})}
                  placeholder="Manual handling note for doctor/reception"
                  className="mt-3 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Register</button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
