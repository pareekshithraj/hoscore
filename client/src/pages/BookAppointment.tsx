import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Activity, Clock, User, Phone, Mail, CheckCircle, ArrowLeft, ShieldCheck, Ticket, MapPin, Star, Stethoscope, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

import { BASE_URL } from '../utils/apiConfig';
import { encodeVisitQr, qrImageUrl } from '../utils/hoscoreQr';

export const BookAppointment = () => {
  const { hospitalId } = useParams();
  const { pathname } = useLocation();
  const isDashboardRoute = pathname.startsWith('/patient');
  const { user, activeContext } = useAuth();
  
  // Bug fix: activeContext is null during initial mount (async load). 
  // If pathname starts with /patient, we are definitely within the Patient Portal.
  const isPatient = isDashboardRoute || activeContext?.type === 'patient';
  const backPath = isPatient ? '/patient/find' : '/';
  const homePath = isPatient ? '/patient' : '/';

  const [hospital, setHospital] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [booked, setBooked] = useState<any>(null);
  const availableDoctors = doctors.filter((d: any) => !['OFF_DUTY', 'On Leave', 'Inactive'].includes(d.status));

  const [dependents, setDependents] = useState<any[]>([]);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string>('');

  const [formData, setFormData] = useState({
    patientName: '',
    email: '',
    contact: '',
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    time: ''
  });

  const [availableSlots, setAvailableSlots] = useState<{ isOpen: boolean; slots: { time: string; isBooked: boolean }[] }>({ isOpen: true, slots: [] });
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (!hospitalId || !formData.date) return;
    setSlotsLoading(true);
    fetch(`${BASE_URL}/hospitals/${hospitalId}/available-slots?date=${formData.date}&doctorId=${formData.doctorId}`)
      .then(r => r.json())
      .then(data => {
        setAvailableSlots(data);
        setSlotsLoading(false);
        if (data.isOpen && data.slots && data.slots.length > 0) {
          const firstAvail = data.slots.find((s: any) => !s.isBooked)?.time;
          if (firstAvail && (!formData.time || data.slots.find((s: any) => s.time === formData.time)?.isBooked)) {
            setFormData(prev => ({ ...prev, time: firstAvail }));
          }
        }
      })
      .catch(() => setSlotsLoading(false));
  }, [hospitalId, formData.date, formData.doctorId]);

  useEffect(() => {
    if (!user) return;
    api.get('/patient/dependents')
      .then(setDependents)
      .catch(console.error);
  }, [user]);

  useEffect(() => {
    if (!selectedFamilyMemberId) {
      if (user) {
        setFormData((prev) => ({
          ...prev,
          patientName: user.name,
          email: user.email,
          contact: '',
        }));
      }
    } else {
      const dep = dependents.find(d => d.id === selectedFamilyMemberId);
      if (dep) {
        setFormData((prev) => ({
          ...prev,
          patientName: dep.name,
          email: dep.email || '',
          contact: dep.contact || '',
        }));
      }
    }
  }, [selectedFamilyMemberId, dependents, user]);

  useEffect(() => {
    if (!hospitalId) return;
    fetch(`${BASE_URL}/hospitals/${hospitalId}`)
      .then(r => r.json())
      .then(data => {
        setHospital(data);
        setDoctors(data.doctors || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Hospital not found');
        setLoading(false);
      });
  }, [hospitalId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        hospitalId,
        doctorId: formData.doctorId || undefined,
        date: formData.date,
        time: formData.time,
        patientId: selectedFamilyMemberId || undefined,
      };
      const data = await api.post('/patient/appointments', payload);
      setBooked({
        id: data.id,
        token: data.tokenNumber,
        time: data.time,
        date: new Date(data.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        doctorName: data.doctor?.name,
        hospitalName: data.hospital?.name || hospital.name,
        sixDigitId: data.patient?.sixDigitId || user?.id?.slice(-6) || '882910',
        patientName: data.patient?.name || formData.patientName || user?.name || 'Patient'
      });
    } catch (err) {
      setError('Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={isDashboardRoute ? "flex items-center justify-center h-64 w-full" : "min-h-screen bg-[#060913] flex items-center justify-center relative overflow-hidden"}>
        {!isDashboardRoute && (
          <>
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#1e1b4b] opacity-40 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#881337] opacity-20 blur-[120px] pointer-events-none" />
          </>
        )}
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium text-sm">Securing network connection...</p>
        </div>
      </div>
    );
  }

  if (!hospital || error === 'Hospital not found') {
    return (
      <div className={isDashboardRoute ? "flex items-center justify-center p-6 w-full" : "min-h-screen bg-[#060913] flex items-center justify-center p-6 relative overflow-hidden"}>
        {!isDashboardRoute && (
          <>
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#1e1b4b] opacity-40 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#881337] opacity-20 blur-[120px] pointer-events-none" />
          </>
        )}
        <div className="max-w-md w-full text-center space-y-6 glass-card p-10 rounded-[32px] border border-white/5 relative z-10">
          <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-rose-950/20">
            <Activity className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-white">Hospital Not Found</h2>
          <p className="text-slate-400 text-sm leading-relaxed">This hospital doesn't exist or is no longer active on the HOSCORE network.</p>
          <Link to={homePath} className="inline-block px-8 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-950/20 transition-all cursor-pointer">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (booked) {
    const qrData = encodeVisitQr(booked.sixDigitId || '', booked.id, booked.token);
    return (
      <div className={isDashboardRoute ? "flex items-center justify-center p-6 w-full" : "min-h-screen bg-[#060913] flex items-center justify-center p-6 relative overflow-hidden"}>
        {!isDashboardRoute && (
          <>
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#1e1b4b] opacity-40 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#881337] opacity-20 blur-[120px] pointer-events-none" />
          </>
        )}
        <div className="max-w-md w-full glass-card border border-white/10 rounded-[40px] p-8 text-center space-y-6 relative z-10 shadow-2xl" style={{ animation: 'slideUp 0.5s ease-out' }}>
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Appointment Confirmed</span>
            </div>
            <span className="text-[11px] font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">HOSCORE PASS</span>
          </div>

          {/* Modern Digital Ticket Pass Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-[#0f172a] rounded-3xl p-6 border border-rose-500/30 text-white relative overflow-hidden shadow-2xl">
            <Ticket className="absolute -top-6 -right-6 w-32 h-32 text-rose-500/10 -rotate-12 pointer-events-none" />

            <div className="text-left space-y-1 mb-4 border-b border-white/10 pb-4">
              <p className="text-xs text-rose-400 font-bold uppercase tracking-wider">{booked.hospitalName}</p>
              <p className="text-lg font-black text-white">{booked.patientName}</p>
              <p className="text-xs text-slate-400">HOSCORE ID: <span className="font-mono font-bold text-rose-300">#{booked.sixDigitId}</span></p>
            </div>

            <div className="flex items-center justify-between my-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
              <div className="text-left">
                <p className="text-[10px] text-rose-300 font-black uppercase tracking-widest">Token Number</p>
                <p className="text-5xl font-black text-white">#{booked.token}</p>
              </div>
              <div className="bg-white p-2 rounded-xl shadow-lg">
                <img
                  src={qrImageUrl(qrData, 140)}
                  alt="HOSCORE QR"
                  className="w-20 h-20 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left border-t border-white/10 pt-4 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Time Slot</p>
                <p className="font-extrabold text-white">{booked.time}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Date</p>
                <p className="font-extrabold text-white">{booked.date}</p>
              </div>
            </div>
            {booked.doctorName && (
              <div className="mt-3 text-left pt-3 border-t border-white/5 text-xs">
                <p className="text-slate-400">Attending Doctor</p>
                <p className="font-bold text-rose-300">{booked.doctorName}</p>
              </div>
            )}
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 text-left flex items-start gap-3">
            <span className="text-lg">📱</span>
            <p className="text-xs text-emerald-300 font-medium leading-relaxed">Present this QR code or Token #{booked.token} at the hospital reception kiosk for automated check-in.</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => window.print()} className="flex-1 py-3.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold rounded-2xl transition-all cursor-pointer text-sm">
              🖨️ Print Pass
            </button>
            <Link to={homePath} className="flex-1 py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-2xl transition-all cursor-pointer text-sm text-center">
              Dashboard →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isDashboardRoute ? "py-4 w-full" : "min-h-screen bg-[#060913] text-[#f8fafc] py-12 px-6 relative overflow-hidden"}>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .slide-up { animation: slideUp 0.4s ease-out; }
      `}</style>

      {!isDashboardRoute && (
        <>
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#1e1b4b] opacity-40 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#881337] opacity-20 blur-[120px] pointer-events-none" />
        </>
      )}

      <div className="max-w-5xl mx-auto space-y-8 slide-up relative z-10">
        <Link to={backPath} className="inline-flex items-center gap-2 text-slate-400 font-bold hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Search
        </Link>

        {/* Hospital Banner */}
        <div className="glass-card rounded-[32px] p-8 border border-white/5 flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-500/20">
            {hospital.logo ? (
              <img src={hospital.logo} alt={hospital.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <Activity className="w-10 h-10 text-white" />
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-black text-white">{hospital.name}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-1 text-sm text-slate-400">
              {hospital.city && <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-slate-500" /> {hospital.city}{hospital.state ? `, ${hospital.state}` : ''}</span>}
              {hospital.rating > 0 && <span className="flex items-center gap-1 text-amber-400"><Star className="w-4 h-4 fill-amber-500 text-amber-500" /> {hospital.rating}</span>}
              <span className="flex items-center gap-1"><Stethoscope className="w-4 h-4 text-slate-500" /> {doctors.length} specialists</span>
            </div>
          </div>
          {hospital.isPartnered && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold shadow-sm">
              <ShieldCheck className="w-4 h-4" /> Verified Partner
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-[32px] p-10 border border-white/5 space-y-8">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-rose-500" />
                <h2 className="text-xl font-bold text-white">Book Your Appointment</h2>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-6 py-3 rounded-2xl text-sm font-medium">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isPatient && (
                  <div className="md:col-span-2 space-y-2 animate-fade-in-up">
                    <label className="text-sm font-bold text-slate-300">Book Appointment For</label>
                    <select
                      value={selectedFamilyMemberId}
                      onChange={(e) => setSelectedFamilyMemberId(e.target.value)}
                      className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-rose-500/50 transition-all appearance-none cursor-pointer text-sm font-bold"
                    >
                      <option value="" className="bg-[#0a0f1d] text-white">Myself ({user?.name})</option>
                      {dependents.map((dep) => (
                        <option key={dep.id} value={dep.id} className="bg-[#0a0f1d] text-white">Dependent: {dep.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-300">Patient Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input required type="text" placeholder="Your full name"
                      className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-rose-500/50 transition-all placeholder-slate-600 text-sm"
                      value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input required type="tel" placeholder="+91 98765..."
                      className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-rose-500/50 transition-all placeholder-slate-600 text-sm"
                      value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input type="email" placeholder="john@example.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-rose-500/50 transition-all placeholder-slate-600 text-sm"
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-300">Select Doctor (Optional)</label>
                  <select className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-rose-500/50 transition-all appearance-none cursor-pointer text-sm"
                    value={formData.doctorId} onChange={e => setFormData({...formData, doctorId: e.target.value})}>
                    <option value="" className="bg-[#0a0f1d] text-white">Any Available Specialist</option>
                    {availableDoctors.map((d: any) => (
                      <option key={d.id} value={d.id} className="bg-[#0a0f1d] text-white">{d.name} — {d.specialty}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300">Preferred Date</label>
                  <input required type="date" min={new Date().toISOString().split('T')[0]}
                    onClick={(e) => (e.currentTarget as any).showPicker?.()}
                    className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-rose-500/50 transition-all text-sm color-scheme-dark cursor-pointer"
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300">Preferred Time Slot (30-min intervals)</label>
                  {slotsLoading ? (
                    <div className="text-slate-400 text-xs py-3 px-4 bg-black/20 border border-white/5 rounded-2xl animate-pulse">Loading hospital 30-min slots...</div>
                  ) : !availableSlots.isOpen ? (
                    <div className="text-rose-400 text-xs font-bold py-3 px-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">Hospital is closed on this date.</div>
                  ) : (
                    <select required className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-rose-500/50 transition-all appearance-none cursor-pointer text-sm font-semibold"
                      value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}>
                      {availableSlots.slots.map((s: any) => (
                        <option key={s.time} value={s.time} disabled={s.isBooked} className={s.isBooked ? 'bg-[#0a0f1d] text-slate-500' : 'bg-[#0a0f1d] text-white font-bold'}>
                          {s.time} {s.isBooked ? '— (Booked)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <button type="submit" disabled={submitting}
                  className="md:col-span-2 mt-4 py-4 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-2xl hover:from-rose-500 hover:to-red-500 shadow-xl shadow-rose-950/20 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer">
                  {submitting ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Booking...</>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Available Doctors */}
            {doctors.length > 0 && (
              <div className="glass-card rounded-[32px] p-8 border border-white/5 space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Available Doctors</h3>
                <div className="space-y-3">
                  {availableDoctors.slice(0, 5).map((d: any) => (
                    <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all duration-300 cursor-pointer"
                      onClick={() => setFormData({...formData, doctorId: d.id})}>
                      <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md shadow-rose-950/20">
                        {d.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{d.name}</p>
                        <p className="text-[11px] text-slate-400">{d.specialty}</p>
                      </div>
                      {d.rating > 0 && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          ★ {d.rating}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trust Panel */}
            <div className="glass-card rounded-[32px] p-8 border border-white/5 space-y-5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">HOSCORE Sovereign</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-400 font-medium">
                <li className="flex gap-2">✓ Board-certified medical specialists</li>
                <li className="flex gap-2">✓ Advanced diagnostic & lab facilities</li>
                <li className="flex gap-2">✓ Instant token, confirmation, cancellation, and rescheduling</li>
                <li className="flex gap-2">✓ Digital prescriptions & records</li>
              </ul>
            </div>

            {/* Wait Policy */}
            <div className="glass-card rounded-[32px] p-8 border border-white/5 space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-bold">Wait Time Policy</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                Token numbers are generated based on real-time inflow. Actual wait time may vary by 15-20 minutes depending on consultations.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 pb-4">
          <p className="text-xs text-slate-500">Powered by <span className="font-bold text-slate-400 font-mono">HOSCORE</span> — Sovereign Digital Health Standard</p>
        </div>
      </div>
    </div>
  );
};
