import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Activity, Clock, User, Phone, Mail, CheckCircle, ArrowLeft, ShieldCheck, Ticket, MapPin, Star, Stethoscope, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

export const BookAppointment = () => {
  const { hospitalId } = useParams();
  const { pathname } = useLocation();
  const isDashboardRoute = pathname.startsWith('/patient');
  const { activeContext } = useAuth();
  
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

  const [formData, setFormData] = useState({
    patientName: '',
    email: '',
    contact: '',
    doctorId: '',
    date: '',
    time: '09:00 AM'
  });

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
        patientName: formData.patientName,
        email: formData.email,
        contact: formData.contact,
        doctorId: formData.doctorId || undefined,
        date: formData.date,
        time: formData.time,
      };
      const res = await fetch(`${BASE_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Booking failed');
      const data = await res.json();
      setBooked({
        token: data.tokenNumber,
        time: data.time,
        date: new Date(data.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
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
    return (
      <div className={isDashboardRoute ? "flex items-center justify-center p-6 w-full" : "min-h-screen bg-[#060913] flex items-center justify-center p-6 relative overflow-hidden"}>
        {!isDashboardRoute && (
          <>
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#1e1b4b] opacity-40 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#881337] opacity-20 blur-[120px] pointer-events-none" />
          </>
        )}
        <div className="max-w-md w-full glass-card border border-white/5 rounded-[40px] p-10 text-center space-y-8 relative z-10" style={{ animation: 'slideUp 0.5s ease-out' }}>
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/20 animate-bounce">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white">Appointment Confirmed!</h2>
            <p className="text-slate-400 text-sm">Your clinical session is successfully registered at <span className="font-bold text-white">{hospital.name}</span></p>
          </div>

          <div className="bg-gradient-to-br from-rose-600 to-red-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-rose-950/30">
            <Ticket className="absolute -top-4 -right-4 w-24 h-24 text-white/10 -rotate-12" />
            <p className="text-rose-200 text-xs font-bold uppercase tracking-widest mb-1">Your Token Number</p>
            <p className="text-6xl font-black mb-6">#{booked.token}</p>
            <div className="grid grid-cols-2 gap-4 text-left border-t border-white/20 pt-6">
              <div>
                <p className="text-rose-200 text-[10px] font-bold uppercase">Time Slot</p>
                <p className="font-extrabold">{booked.time}</p>
              </div>
              <div>
                <p className="text-rose-200 text-[10px] font-bold uppercase">Date</p>
                <p className="font-extrabold">{booked.date}</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-left">
            <p className="text-sm text-amber-400 font-medium leading-relaxed">📋 Please arrive 15 minutes before your scheduled time with a valid HOSCORE ID.</p>
          </div>
          
          <Link to={homePath} className="block w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer">
            Return to Dashboard
          </Link>
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
                    {doctors.filter((d: any) => d.status === 'ACTIVE').map((d: any) => (
                      <option key={d.id} value={d.id} className="bg-[#0a0f1d] text-white">{d.name} — {d.specialty}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300">Preferred Date</label>
                  <input required type="date" min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-rose-500/50 transition-all text-sm color-scheme-dark"
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300">Preferred Time</label>
                  <select required className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-rose-500/50 transition-all appearance-none cursor-pointer text-sm"
                    value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}>
                    <option value="09:00 AM" className="bg-[#0a0f1d] text-white">09:00 AM</option>
                    <option value="09:30 AM" className="bg-[#0a0f1d] text-white">09:30 AM</option>
                    <option value="10:00 AM" className="bg-[#0a0f1d] text-white">10:00 AM</option>
                    <option value="10:30 AM" className="bg-[#0a0f1d] text-white">10:30 AM</option>
                    <option value="11:00 AM" className="bg-[#0a0f1d] text-white">11:00 AM</option>
                    <option value="11:30 AM" className="bg-[#0a0f1d] text-white">11:30 AM</option>
                    <option value="12:00 PM" className="bg-[#0a0f1d] text-white">12:00 PM</option>
                    <option value="02:00 PM" className="bg-[#0a0f1d] text-white">02:00 PM</option>
                    <option value="02:30 PM" className="bg-[#0a0f1d] text-white">02:30 PM</option>
                    <option value="03:00 PM" className="bg-[#0a0f1d] text-white">03:00 PM</option>
                    <option value="03:30 PM" className="bg-[#0a0f1d] text-white">03:30 PM</option>
                    <option value="04:00 PM" className="bg-[#0a0f1d] text-white">04:00 PM</option>
                    <option value="04:30 PM" className="bg-[#0a0f1d] text-white">04:30 PM</option>
                  </select>
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
                  {doctors.filter((d: any) => d.status === 'ACTIVE').slice(0, 5).map((d: any) => (
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
                <li className="flex gap-2">✓ Instant token & confirmation</li>
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
