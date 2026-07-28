import React, { useState } from 'react';
import { Modal } from './Modal';
import { QrCode, Search, User, Calendar, FileText, Heart, Activity, ShieldCheck, CheckCircle2, Clock, Plus, Stethoscope } from 'lucide-react';
import { api } from '../services/api';

interface HoscoreIDScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppointmentBooked?: () => void;
}

export const HoscoreIDScannerModal: React.FC<HoscoreIDScannerModalProps> = ({
  isOpen,
  onClose,
  onAppointmentBooked
}) => {
  const [sixDigitId, setSixDigitId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'vitals' | 'prescriptions' | 'labs' | 'admissions' | 'vaccinations' | 'book'>('profile');

  // Booking form state
  const [doctors, setDoctors] = useState<any[]>([]);
  const [bookingForm, setBookingForm] = useState({ doctorId: '', date: new Date().toISOString().split('T')[0], time: '10:00 AM' });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = sixDigitId.replace(/[^0-9]/g, '');
    if (!cleanId || cleanId.length !== 6) {
      setError('Please enter a valid 6-digit Hoscore ID (e.g., 882910)');
      return;
    }
    setLoading(true);
    setError(null);
    setPatientData(null);
    setBookingSuccess(null);

    try {
      const res = await api.get(`/patients/search/${cleanId}`);
      setPatientData(res);
      setActiveTab('profile');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No patient record found for this Hoscore ID.');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = () => {
    if (doctors.length === 0) {
      api.get('/doctors').then(res => setDoctors(res || [])).catch(console.error);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientData) return;
    setBookingLoading(true);
    try {
      const res = await api.post('/appointments', {
        patientId: patientData.id,
        patientName: patientData.name,
        sixDigitId: patientData.sixDigitId,
        doctorId: bookingForm.doctorId || undefined,
        date: new Date(bookingForm.date).toISOString(),
        time: bookingForm.time,
        isHoscoreUser: patientData.isHoscoreUser
      });
      setBookingSuccess(res);
      if (onAppointmentBooked) onAppointmentBooked();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to book appointment.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hoscore ID Scanner & Clinical Search">
      <div className="space-y-5 p-1">
        {/* Search / Scan Header */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Enter 6-digit Hoscore ID (e.g. 882910 or HSC-882910)"
              value={sixDigitId}
              onChange={(e) => setSixDigitId(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 text-white font-mono text-sm font-bold rounded-xl focus:border-sky-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <QrCode className="w-4 h-4" />}
            Lookup
          </button>
        </form>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl">
            {error}
          </div>
        )}

        {/* Patient Record Output */}
        {patientData && (
          <div className="space-y-4 border-t border-slate-800 pt-4">
            {/* Header info card */}
            <div className="flex items-center justify-between p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-sky-500/20 border border-sky-500/30 rounded-xl flex items-center justify-center text-sky-400 font-bold">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{patientData.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono font-black text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      HSC-{patientData.sixDigitId}
                    </span>
                    <span className="text-xs text-slate-400">{patientData.gender} · Blood: {patientData.bloodGroup || 'O+'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  loadDoctors();
                  setActiveTab('book');
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" /> Book Visit
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 overflow-x-auto text-xs font-bold gap-2">
              {(['profile', 'vitals', 'prescriptions', 'labs', 'admissions', 'vaccinations', 'book'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    if (tab === 'book') loadDoctors();
                    setActiveTab(tab);
                  }}
                  className={`pb-2.5 px-3 border-b-2 capitalize transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-sky-500 text-sky-400 font-extrabold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="max-h-80 overflow-y-auto space-y-3 pr-1 text-xs">
              {activeTab === 'profile' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                  <div><span className="text-slate-400 block font-semibold">Contact</span> <span className="font-bold text-white">{patientData.contact || 'N/A'}</span></div>
                  <div><span className="text-slate-400 block font-semibold">Email</span> <span className="font-bold text-white">{patientData.email || 'N/A'}</span></div>
                  <div><span className="text-slate-400 block font-semibold">DOB</span> <span className="font-bold text-white">{patientData.dateOfBirth ? new Date(patientData.dateOfBirth).toLocaleDateString() : 'N/A'}</span></div>
                  <div><span className="text-slate-400 block font-semibold">User Mode</span> <span className="font-bold text-emerald-400">{patientData.isHoscoreUser ? 'HOSCORE Digital' : 'Manual Walk-in'}</span></div>
                </div>
              )}

              {activeTab === 'vitals' && (
                <div className="space-y-2">
                  {patientData.vitals?.length > 0 ? (
                    patientData.vitals.map((v: any) => (
                      <div key={v.id} className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">BP: {v.bloodPressure || '--'} | HR: {v.heartRate || '--'} bpm</p>
                          <p className="text-slate-400">SpO₂: {v.oxygenSaturation || '--'}% | Temp: {v.temperature || '--'}°</p>
                        </div>
                        <span className="text-slate-400 font-mono">{v.recordedAt?.take ? v.recordedAt.take(10) : new Date(v.recordedAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                    ))
                  ) : <p className="text-slate-400 text-center py-4">No vital records found.</p>}
                </div>
              )}

              {activeTab === 'prescriptions' && (
                <div className="space-y-3">
                  {patientData.prescriptions?.length > 0 ? (
                    patientData.prescriptions.map((rx: any) => {
                      const status = (rx.status || 'UNCLAIMED').toUpperCase();
                      return (
                        <div key={rx.id} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-white text-sm">Dr. {rx.doctorName || rx.doctor?.name || 'Practitioner'}</span>
                              <p className="text-[11px] text-slate-400">{rx.date ? new Date(rx.date).toLocaleDateString() : ''}</p>
                            </div>
                            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                              status === 'UNCLAIMED' || status === 'ISSUED'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : status === 'CURRENT'
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}>
                              {status === 'ISSUED' ? 'UNCLAIMED' : status}
                            </span>
                          </div>

                          <p className="text-sm font-semibold text-sky-300">
                            {typeof rx.medicines === 'string' ? rx.medicines : (Array.isArray(rx.medicines) ? rx.medicines.map((m: any) => m.name || m.itemName).join(', ') : rx.instructions)}
                          </p>

                          {/* Pharmacist Status Transition Controls */}
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-medium">Pharmacist Action:</span>
                            <div className="flex gap-2">
                              {(status === 'UNCLAIMED' || status === 'ISSUED') && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await api.patch(`/prescriptions/${rx.id}/status`, { status: 'CURRENT' });
                                      handleSearch(); // Refresh data
                                    } catch (err: any) {
                                      setError(err?.response?.data?.error || 'Failed to update prescription to CURRENT.');
                                    }
                                  }}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-sm"
                                >
                                  Claim & Make CURRENT
                                </button>
                              )}
                              {status === 'CURRENT' && (
                                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                                  ✓ Active Prescription (CURRENT)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : <p className="text-slate-400 text-center py-4">No prescriptions found.</p>}
                </div>
              )}

              {activeTab === 'labs' && (
                <div className="space-y-3">
                  {patientData.labOrders?.length > 0 ? (
                    patientData.labOrders.map((lab: any) => {
                      const labStatus = (lab.status || 'PENDING').toUpperCase();
                      return (
                        <div key={lab.id} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-white text-sm">{lab.testName}</p>
                              <p className="text-xs text-slate-400">Ordered by Dr. {lab.doctorName || 'Practitioner'}</p>
                            </div>
                            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                              labStatus === 'PENDING'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : labStatus === 'PROCESSING'
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}>
                              {labStatus}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-medium">Lab Action:</span>
                            <div className="flex gap-2">
                              {labStatus === 'PENDING' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await api.put(`/lab-orders/${lab.id}`, { status: 'PROCESSING' });
                                      handleSearch();
                                    } catch (err: any) {
                                      setError(err?.response?.data?.error || 'Failed to update lab order.');
                                    }
                                  }}
                                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg cursor-pointer"
                                >
                                  Start Test (PROCESSING)
                                </button>
                              )}
                              {labStatus === 'PROCESSING' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await api.put(`/lab-orders/${lab.id}`, { status: 'COMPLETED' });
                                      handleSearch();
                                    } catch (err: any) {
                                      setError(err?.response?.data?.error || 'Failed to complete lab order.');
                                    }
                                  }}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg cursor-pointer"
                                >
                                  Complete Test (COMPLETED)
                                </button>
                              )}
                              {labStatus === 'COMPLETED' && (
                                <span className="text-xs font-bold text-emerald-400">✓ Test Completed</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : <p className="text-slate-400 text-center py-4">No lab orders found.</p>}
                </div>
              )}

              {activeTab === 'admissions' && (
                <div className="space-y-3">
                  {patientData.admissions?.length > 0 ? (
                    patientData.admissions.map((adm: any) => {
                      const isDischarged = adm.dischargeDate || adm.status === 'Discharged';
                      return (
                        <div key={adm.id} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-white text-sm">Room: {adm.bed?.room?.name || 'N/A'} (Bed {adm.bed?.bedNumber || adm.bed?.name || 'N/A'})</p>
                              <p className="text-xs text-slate-400">
                                Admitted: {new Date(adm.admissionDate || adm.createdAt).toLocaleDateString()}
                                {isDischarged ? ` · Discharged: ${new Date(adm.dischargeDate).toLocaleDateString()}` : ''}
                              </p>
                            </div>
                            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                              isDischarged ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}>
                              {isDischarged ? 'DISCHARGED' : 'ADMITTED'}
                            </span>
                          </div>

                          {!isDischarged && (
                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                              <span className="text-[11px] text-slate-400 font-medium">IPD Action:</span>
                              <button
                                onClick={async () => {
                                  try {
                                    await api.patch(`/admissions/${adm.id}/discharge`, {});
                                    handleSearch();
                                  } catch (err: any) {
                                    setError(err?.response?.data?.error || 'Failed to discharge patient.');
                                  }
                                }}
                                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg cursor-pointer"
                              >
                                Discharge Patient & Free Bed
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : <p className="text-slate-400 text-center py-4">No admission history.</p>}
                </div>
              )}

              {activeTab === 'vaccinations' && (
                <div className="space-y-3">
                  {patientData.vaccinations?.length > 0 ? (
                    patientData.vaccinations.map((vax: any) => {
                      const vaxStatus = (vax.status || 'PENDING').toUpperCase();
                      const isCompleted = vaxStatus === 'COMPLETED' || vaxStatus === 'ADMINISTERED' || vaxStatus === 'VERIFIED';
                      return (
                        <div key={vax.id} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-white text-sm">{vax.vaccineName || vax.name}</p>
                              <p className="text-xs text-slate-400">Target Disease: {vax.targetDisease || 'General'}</p>
                            </div>
                            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                              isCompleted ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}>
                              {isCompleted ? 'ADMINISTERED' : 'DUE / PENDING'}
                            </span>
                          </div>

                          {!isCompleted && (
                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                              <span className="text-[11px] text-slate-400 font-medium">Nurse Action:</span>
                              <button
                                onClick={async () => {
                                  try {
                                    await api.post('/patient/vaccinations', { id: vax.id, status: 'COMPLETED' });
                                    handleSearch();
                                  } catch (err: any) {
                                    setError(err?.response?.data?.error || 'Failed to record vaccination.');
                                  }
                                }}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg cursor-pointer"
                              >
                                Mark Administered
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : <p className="text-slate-400 text-center py-4">No vaccination records found.</p>}
                </div>
              )}

              {activeTab === 'book' && (
                <form onSubmit={handleBookAppointment} className="space-y-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <h4 className="font-extrabold text-white text-sm">Book Appointment for {patientData.name}</h4>
                  {bookingSuccess ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl text-center">
                      <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                      Appointment Booked Successfully! (Token #{bookingSuccess.tokenNumber})
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-slate-400 block mb-1">Doctor (Optional)</label>
                        <select
                          value={bookingForm.doctorId}
                          onChange={(e) => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
                          className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-lg"
                        >
                          <option value="">Any Available General Practitioner</option>
                          {doctors.map((d: any) => (
                            <option key={d.id} value={d.id}>Dr. {d.name} ({d.specialization || 'General'})</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-400 block mb-1">Date</label>
                          <input
                            type="date"
                            value={bookingForm.date}
                            onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                            className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Time</label>
                          <input
                            type="text"
                            value={bookingForm.time}
                            onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                            className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-lg"
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={bookingLoading}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all cursor-pointer"
                      >
                        {bookingLoading ? 'Booking...' : 'Confirm Appointment'}
                      </button>
                    </>
                  )}
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
