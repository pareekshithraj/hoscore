import { useState, useEffect } from 'react';
import { Calendar, FileText, Heart, Clock, Activity, ChevronRight, User, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';

export const PatientDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>({ upcoming: [], recentRx: [], profile: null });
  const [loading, setLoading] = useState(true);

  const loadDashboard = () => {
    setLoading(true);
    api.get('/patient/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const upcomingCount = useAnimatedCounter(data.upcoming?.length || 0);
  const prescriptionsCount = useAnimatedCounter(data.recentRx?.length || 0);

  const handleSkipAlert = async () => {
    try {
      await api.post('/patient/skip-alert', {});
      loadDashboard();
    } catch (err) {
      console.error('Failed to skip alert:', err);
    }
  };

  const handleCloseAppointment = async (apptId: string) => {
    try {
      await api.patch(`/patient/appointments/${apptId}/close`, {});
      loadDashboard();
    } catch (err) {
      console.error('Failed to close appointment:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-white/10 border-t-[#0ea5e9] rounded-full animate-spin" />
          <p className="text-slate-400 font-bold text-xs tracking-wider animate-pulse">
            LOADING MEDICAL RECORDS...
          </p>
        </div>
      </div>
    );
  }

  const patientStats = [
    { icon: Calendar, label: 'Scheduled Visits', value: upcomingCount, color: 'text-sky-400', badgeBg: 'bg-sky-500/10 border-sky-500/20' },
    { icon: FileText, label: 'Prescriptions Issued', value: prescriptionsCount, color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 border-emerald-500/20' },
    { icon: Heart, label: 'Blood Group Type', value: data.profile?.bloodGroup || 'O+', color: 'text-rose-400', badgeBg: 'bg-rose-500/10 border-rose-500/20' },
    { icon: Activity, label: 'Clinical Status', value: data.profile?.status || 'Active', color: 'text-violet-400', badgeBg: 'bg-violet-500/10 border-violet-500/20' },
  ];

  // Follow-up Alert Calculations
  const alertDateStr = data.profile?.nextAppointmentAlertDate;
  const alertDate = alertDateStr ? new Date(alertDateStr) : null;
  const isAlertActive = data.profile?.nextAppointmentAlertStatus === 'ACTIVE';
  const showAppointmentAlert = alertDate && isAlertActive && alertDate <= new Date();

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Follow-up Appointment Recommendation Alert */}
      {showAppointmentAlert && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden animate-pulse">
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Physician Recommended Sovereign Check-up</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your doctor set a check-up alert for {alertDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} ({data.profile?.nextAppointmentAlertInterval} interval reached).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={handleSkipAlert}
              className="px-4 py-2 border border-white/10 hover:border-white/20 bg-white/[0.02] text-slate-300 text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer"
            >
              Skip Alert
            </button>
            <Link
              to="/patient/find"
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-orange-500/20 transition-all active:scale-95 text-center"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      )}

      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 glass-card rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center border border-sky-400/20 shadow-lg shadow-sky-500/25">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                Welcome back, {user?.name?.split(' ')[0] || 'Patient'} 👋
              </h1>
              {data.profile?.sixDigitId && (
                <span className="inline-flex items-center px-3 py-1 bg-sky-500/10 border border-sky-500/25 rounded-md text-[10px] font-black text-sky-400 tracking-wider">
                  HSC-{data.profile.sixDigitId}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 font-semibold mt-1">Here is your digital health command panel</p>
          </div>
        </div>
        <div className="flex gap-2.5 relative z-10">
          <Link
            to="/patient/find"
            className="btn-premium px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md hover:shadow-sky-500/20 active:scale-95 transition-all text-center"
          >
            Book Appointment
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 stagger-in">
        {patientStats.map((s, i) => (
          <div key={i} className="glass-card glass-card-hover rounded-2xl p-5">
            <div className={`w-10 h-10 ${s.badgeBg} border rounded-xl flex items-center justify-center mb-4 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-white tracking-tight tabular-nums">{s.value}</p>
            <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Content Columns */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Upcoming Appointments */}
        <div className="glass-card rounded-2xl border border-white/[0.04] p-6">
          <div className="flex items-center justify-between mb-6 border-b border-white/[0.04] pb-4">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-sky-400" />
              <h2 className="text-base font-extrabold text-white tracking-tight">Upcoming Consultation Slots</h2>
            </div>
            <Link to="/patient/appointments" className="text-xs text-sky-400 font-bold flex items-center gap-1 hover:text-sky-300 transition-colors">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          {data.upcoming?.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-bold tracking-tight">No upcoming consultations found</p>
              <p className="text-[10px] text-slate-500 mt-1">Book an appointment online above to schedule a visit.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.upcoming?.map((a: any) => (
                <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] transition-all">
                  <div className="w-10 h-10 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center text-sky-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-white truncate">{a.doctor?.name || 'Medical Specialist'}</p>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{a.hospital?.name} · {a.time}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                      a.status === 'CONFIRMED' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {a.status}
                    </span>
                    <button
                      onClick={() => handleCloseAppointment(a.id)}
                      className="px-2.5 py-1 text-[9px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md tracking-wider hover:bg-rose-500/20 transition-all cursor-pointer"
                      title="Close Consultation Slot"
                    >
                      Close Slot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Prescriptions */}
        <div className="glass-card rounded-2xl border border-white/[0.04] p-6">
          <div className="flex items-center justify-between mb-6 border-b border-white/[0.04] pb-4">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-extrabold text-white tracking-tight">Recent Prescriptions & Rx</h2>
            </div>
            <Link to="/patient/prescriptions" className="text-xs text-sky-400 font-bold flex items-center gap-1 hover:text-sky-300 transition-colors">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {data.recentRx?.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-bold tracking-tight">No active prescriptions yet</p>
              <p className="text-[10px] text-slate-500 mt-1">Issued prescriptions will appear here automatically.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.recentRx?.map((rx: any) => (
                <div key={rx.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] transition-all">
                  <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-white truncate">{rx.diagnosis}</p>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{rx.doctor?.name} · {rx.hospital?.name}</p>
                  </div>
                  <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider ${
                    rx.status === 'ISSUED' 
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' 
                      : 'bg-white/[0.05] text-slate-400 border border-white/[0.08]'
                  }`}>
                    {rx.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
