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

  // Manual/Walk-in Appointment Booking States
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [bookingForm, setBookingForm] = useState({ doctorId: '', date: '', time: '' });
  const [createdAppointment, setCreatedAppointment] = useState<any>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const openBookingModal = (patient: any) => {
    setSelectedPatient(patient);
    setBookingSuccess(false);
    setCreatedAppointment(null);
    setBookingForm({ doctorId: '', date: '', time: '' });
    setIsBookModalOpen(true);
    if (doctors.length === 0) {
      api.get('/doctors').then(res => {
        setDoctors(res || []);
      }).catch(err => console.error(err));
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setBookingLoading(true);
    try {
      const payload = {
        patientName: selectedPatient.name,
        email: selectedPatient.email || undefined,
        contact: selectedPatient.contact || undefined,
        doctorId: bookingForm.doctorId || undefined,
        date: new Date(bookingForm.date).toISOString(),
        time: bookingForm.time,
        isHoscoreUser: selectedPatient.isHoscoreUser,
        manualCareNote: selectedPatient.manualCareNote
      };
      const res = await api.post('/appointments', payload);
      setCreatedAppointment(res);
      setBookingSuccess(true);
    } catch (err) {
      console.error(err);
      setAlertMessage('Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

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

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await api.delete(`/patients/${confirmDeleteId}`);
      setConfirmDeleteId(null);
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

      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800/80 shadow-sm">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search by name, ID or phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-lg text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 border border-slate-200/60 dark:border-zinc-800/80 rounded-lg text-sm text-slate-600 dark:text-zinc-350 hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-2 border border-slate-200/60 dark:border-zinc-800/80 rounded-lg text-sm text-slate-600 dark:text-zinc-350 hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer">
            <Calendar className="w-4 h-4" />
            Date Range
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 dark:bg-zinc-900/40 border-b border-slate-200/60 dark:border-zinc-800/80">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Patient Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Info</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Blood Group</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Last Visit</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
            {(() => {
              const filteredPatients = patients.filter(patient => 
                patient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                patient.contact?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                patient.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (patient.sixDigitId || patient.id).toLowerCase().includes(searchQuery.toLowerCase())
              );
              return filteredPatients.map((patient) => (
              <tr key={patient.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-zinc-900 rounded-full flex items-center justify-center font-bold text-slate-500 dark:text-zinc-400 border border-slate-200/30 dark:border-zinc-800/40">
                      {patient.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-zinc-150 block">{patient.name}</span>
                      <span className="text-xs text-slate-500 dark:text-zinc-500 font-medium">
                        {patient.isHoscoreUser === false ? 'Manual walk-in' : `HSC-${patient.sixDigitId || patient.id.padStart(5, '0')}`}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs font-semibold text-slate-600 dark:text-zinc-350 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-550" />
                      {calculateAge(patient.dateOfBirth)}y, {patient.gender || 'Unknown'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-550" />
                      {patient.contact || 'N/A'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 bg-red-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded text-xs font-bold font-mono">
                    {patient.bloodGroup || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-semibold text-slate-650 dark:text-zinc-400">{getLastVisit(patient.admissions)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    patient.isHoscoreUser === false ? 'bg-slate-900 dark:bg-zinc-900 text-white dark:text-zinc-300 border-slate-800 dark:border-zinc-800' :
                    patient.status === 'In-Patient' ? 'bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/25' : 
                    patient.status === 'Out-Patient' ? 'bg-amber-100 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/25' : 
                    'bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-zinc-305 border-slate-200/40 dark:border-zinc-800/50'
                  }`}>
                    {patient.isHoscoreUser === false ? 'Manual Care' : patient.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openBookingModal(patient)} 
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 hover:bg-blue-50 dark:hover:bg-zinc-900 rounded-md cursor-pointer transition-colors" 
                      title="Book Appointment"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 hover:bg-blue-50 dark:hover:bg-zinc-900 rounded-md cursor-pointer transition-colors">
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
            ));
          })()}
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

      {/* Manual / Walk-in Booking Modal */}
      <Modal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} title="Book Walk-in / Phone Appointment">
        {bookingSuccess && createdAppointment ? (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Appointment Booked Successfully!</h3>
              <p className="text-sm text-slate-500">The manual booking is now active in the OPD queue.</p>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 max-w-sm mx-auto space-y-3">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Queue Token Number</div>
              <div className="text-4xl font-black text-blue-600">#{createdAppointment.tokenNumber}</div>
              <div className="border-t border-slate-200 pt-3 text-left space-y-1.5 text-sm text-slate-650">
                <div><span className="font-semibold text-slate-800">Patient:</span> {selectedPatient?.name}</div>
                <div><span className="font-semibold text-slate-800">Doctor:</span> {doctors.find(d => d.id === bookingForm.doctorId)?.name || 'General OPD'}</div>
                <div><span className="font-semibold text-slate-800">Date:</span> {new Date(bookingForm.date).toLocaleDateString()}</div>
                <div><span className="font-semibold text-slate-800">Time Slot:</span> {bookingForm.time}</div>
                {selectedPatient?.isHoscoreUser === false && (
                  <div className="mt-2 p-2 bg-slate-900 text-white text-xs rounded font-medium text-center">
                    ⚠️ Walk-in Manual Care Warning Active
                  </div>
                )}
              </div>
            </div>

            <button 
              type="button" 
              onClick={() => setIsBookModalOpen(false)} 
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleBookAppointment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name</label>
              <input 
                type="text" 
                readOnly 
                value={selectedPatient?.name || ''} 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 focus:outline-none" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assign Doctor</label>
              <select 
                value={bookingForm.doctorId} 
                onChange={e => setBookingForm({...bookingForm, doctorId: e.target.value})} 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">General OPD / No Assigned Doctor</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.specialty || 'General Practice'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Appointment Date</label>
                <input 
                  type="date" 
                  required 
                  value={bookingForm.date} 
                  onChange={e => setBookingForm({...bookingForm, date: e.target.value})} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Time Slot / Schedule</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. 10:30 AM" 
                  value={bookingForm.time} 
                  onChange={e => setBookingForm({...bookingForm, time: e.target.value})} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="button" 
                onClick={() => setIsBookModalOpen(false)} 
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={bookingLoading} 
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                {bookingLoading ? 'Booking...' : 'Book & Generate Token'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Delete Patient Record">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Are you sure you want to delete this patient record? This action is permanent and clears EMR history.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold">Delete</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!alertMessage} onClose={() => setAlertMessage(null)} title="Alert">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">{alertMessage}</p>
          <div className="flex justify-end">
            <button onClick={() => setAlertMessage(null)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold">OK</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
