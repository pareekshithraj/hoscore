import { useState, useEffect } from 'react';
import { Calendar, FileText, Heart, Clock, Activity, ChevronRight, User, AlertCircle, Users, Plus, Navigation, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';
import { WayfindingModal } from '../../components/WayfindingModal';
import { Modal } from '../../components/Modal';

import { BASE_URL } from '../../utils/apiConfig';
const getWsUrl = (token: string) => {
  const apiBase = BASE_URL;
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  let host = window.location.host;
  if (apiBase.startsWith('http')) {
    const url = new URL(apiBase);
    host = url.host;
  }
  return `${wsProtocol}//${host}/ws?token=${token}`;
};

const getPositionString = (pos: number) => {
  if (pos === 1) return '1st';
  if (pos === 2) return '2nd';
  if (pos === 3) return '3rd';
  return `${pos}th`;
};

export const PatientDashboard = () => {
  const { user, selectedPatientId, setSelectedPatientId, theme } = useAuth();
  const [data, setData] = useState<any>({ upcoming: [], recentRx: [], profile: null });
  const [loading, setLoading] = useState(true);
  const [dependents, setDependents] = useState<any[]>([]);
  const [showFamilyModal, setShowFamilyModal] = useState(false);

  // Live Queue state
  const [liveQueueAlert, setLiveQueueAlert] = useState<any>(null);
  const [wayfindingDest, setWayfindingDest] = useState<string>('');
  const [isWayfindingOpen, setIsWayfindingOpen] = useState(false);

  // Form state for creating dependents
  const [newDependent, setNewDependent] = useState({
    name: '',
    contact: '',
    email: '',
    dateOfBirth: '',
    gender: 'MALE',
    bloodGroup: 'O+',
  });

  const loadDashboard = (patientId?: string | null) => {
    setLoading(true);
    const url = patientId ? `/patient/dashboard?patientId=${patientId}` : '/patient/dashboard';
    api.get(url)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const loadDependents = () => {
    api.get('/patient/dependents')
      .then(setDependents)
      .catch(console.error);
  };

  useEffect(() => {
    loadDashboard(selectedPatientId);
  }, [selectedPatientId]);

  useEffect(() => {
    loadDependents();
  }, []);

  // WebSocket for Live Queue Position & Calling Alerts
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // WebSocket is not supported on Vercel serverless — skip silently
    const hostname = window.location.hostname;
    const isServerless =
      hostname.endsWith('.vercel.app') ||
      hostname === 'hoscore.in' ||
      hostname === 'www.hoscore.in';
    if (isServerless) return;

    const wsUrl = getWsUrl(token);
    let ws: WebSocket;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('🔌 Dashboard WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'queue_position_update') {
            setLiveQueueAlert({
              type: 'position',
              message: `You are ${getPositionString(payload.data.position)} in line for ${payload.data.doctorName}. Please prepare to head to ${payload.data.roomName}.`,
              roomName: payload.data.roomName,
            });
          } else if (payload.type === 'queue_called') {
            setLiveQueueAlert({
              type: 'called',
              message: `Your turn has arrived! You are called for ${payload.data.doctorName} (${payload.data.department}). Please head to ${payload.data.roomName} immediately.`,
              roomName: payload.data.roomName,
            });
          }
        } catch (err) {
          console.error('Error handling WebSocket message', err);
        }
      };

      ws.onclose = () => {
        console.log('🔌 Dashboard WebSocket closed');
      };
    } catch (error) {
      // Silently ignore WebSocket errors on unsupported environments
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const upcomingCount = useAnimatedCounter(data.upcoming?.length || 0);
  const prescriptionsCount = useAnimatedCounter(data.recentRx?.length || 0);

  const handleSkipAlert = async () => {
    try {
      await api.post('/patient/skip-alert', {});
      loadDashboard(selectedPatientId);
    } catch (err) {
      console.error('Failed to skip alert:', err);
    }
  };

  const handleCloseAppointment = async (apptId: string) => {
    try {
      await api.patch(`/patient/appointments/${apptId}/close`, {});
      loadDashboard(selectedPatientId);
    } catch (err) {
      console.error('Failed to close appointment:', err);
    }
  };

  const handleAddDependent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/patient/dependents', newDependent);
      loadDependents();
      setNewDependent({
        name: '',
        contact: '',
        email: '',
        dateOfBirth: '',
        gender: 'MALE',
        bloodGroup: 'O+',
      });
    } catch (err) {
      console.error('Failed to create dependent', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0ea5e9] rounded-full animate-spin" />
          <p className="text-slate-400 font-bold text-xs tracking-wider animate-pulse">
            Retrieving Medical Records...
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
      {/* Live Queue Alerts */}
      {liveQueueAlert && (
        <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden animate-fade-in-up ${liveQueueAlert.type === 'called'
          ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/25'
          : 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/25'
          }`}>
          <div className="relative z-10 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${liveQueueAlert.type === 'called'
              ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
              : 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30'
              }`}>
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                {liveQueueAlert.type === 'called' ? 'Consultation Room Call' : 'Live Queue Position'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-bold mt-1">
                {liveQueueAlert.message}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={() => {
                setWayfindingDest(liveQueueAlert.roomName);
                setIsWayfindingOpen(true);
              }}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all active:scale-95 cursor-pointer text-white ${liveQueueAlert.type === 'called'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-sky-600 hover:bg-sky-700'
                }`}
            >
              Open Indoor Walkway Map
            </button>
            <button
              onClick={() => setLiveQueueAlert(null)}
              className="px-3 py-2 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-white/[0.02] text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Follow-up Appointment Recommendation Alert */}
      {showAppointmentAlert && (
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Recommended Follow-up Visit</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-1">
                Your doctor set a check-up alert for {alertDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} ({data.profile?.nextAppointmentAlertInterval} interval reached).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={handleSkipAlert}
              className="px-4 py-2 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-white/[0.02] text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer"
            >
              Skip Alert
            </button>
            <Link
              to="/patient/find"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-all active:scale-95 text-center"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      )}

      {/* Hero Header & Identity Section (Asymmetric layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: HOSCORE digital healthcare card (4 columns) */}
        <div className={`lg:col-span-4 glass-card rounded-2xl p-6 relative overflow-hidden border transition-all duration-300 group ${theme === 'dark'
          ? "bg-slate-900 border-slate-800 shadow-2xl hover:border-blue-500/20"
          : "bg-gradient-to-br from-indigo-50/90 via-blue-50/70 to-slate-50/50 border-blue-200/50 hover:border-blue-400/40"
          }`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className={`flex items-center justify-between mb-8 border-b pb-4 ${theme === 'dark' ? 'border-white/[0.04]' : 'border-slate-200/60'}`}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase font-mono">DIGITAL HEALTH ID</span>
            </div>
            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 tracking-widest font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 dark:border-emerald-500/10">VERIFIED</span>
          </div>

          <div className="flex items-start gap-4 mb-6">
            <div className={`w-14 h-14 border rounded-xl flex items-center justify-center shadow-inner transition-colors ${theme === 'dark'
              ? 'bg-slate-800 border-slate-700 text-slate-300'
              : 'bg-gradient-to-tr from-slate-200 to-slate-300 border-slate-300 text-slate-700'
              }`}>
              <User className="w-7 h-7" />
            </div>
            <div>
              <h2 className={`text-lg font-black leading-tight tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {data.profile?.name || user?.name || 'Patient'}
              </h2>
              {data.profile?.sixDigitId && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] font-mono font-black text-blue-600 dark:text-sky-400 tracking-widest bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20 dark:border-blue-500/10">
                    HSC-{data.profile.sixDigitId}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={`grid grid-cols-2 gap-y-4 gap-x-2 border-t pt-5 ${theme === 'dark' ? 'border-white/[0.04]' : 'border-slate-200/60'}`}>
            <div>
              <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-widest block mb-0.5">BLOOD GROUP</span>
              <span className={`text-xs font-extrabold flex items-center gap-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                <Heart className="w-3.5 h-3.5 text-rose-500 inline" /> {data.profile?.bloodGroup || 'O+'}
              </span>
            </div>
            <div>
              <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-widest block mb-0.5">HEALTH STATUS</span>
              <span className="text-xs font-extrabold text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                {data.profile?.status || 'Active'}
              </span>
            </div>
            <div>
              <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-widest block mb-0.5">GENDER</span>
              <span className={`text-xs font-bold uppercase font-mono ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                {data.profile?.gender || 'MALE'}
              </span>
            </div>
            <div>
              <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-widest block mb-0.5">DATE OF BIRTH</span>
              <span className={`text-xs font-bold font-mono ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                {data.profile?.dateOfBirth ? new Date(data.profile.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </span>
            </div>
          </div>

          <div className={`mt-6 pt-4 border-t flex items-center justify-between ${theme === 'dark' ? 'border-white/[0.04]' : 'border-slate-200/60'}`}>
            <div className="flex items-center gap-1.5 opacity-70">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-bold text-slate-400">Verified Patient Identity</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500 font-bold">Hoscore Network</span>
          </div>
        </div>

        {/* Right: Greetings and Asymmetric KPIs (8 columns) */}
        <div className="lg:col-span-8 flex flex-col justify-between self-stretch gap-6">
          <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-card rounded-2xl relative overflow-hidden bg-gradient-to-r from-sky-500/[0.02] to-transparent border flex-1 ${theme === 'dark' ? 'border-white/[0.04]' : 'border-slate-200/60 shadow-sm'
            }`}>
            <div>
              <h1 className={`text-2xl lg:text-3xl font-black tracking-tight leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Welcome back, {(data.profile?.name || user?.name || 'Patient').split(' ')[0]} 👋
              </h1>
              <p className={`text-xs font-semibold mt-2.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Monitor your scheduled treatments, consultation timeline, and active prescriptions below.
              </p>
            </div>

            {/* Switcher & Book Appointments */}
            <div className="flex flex-wrap items-center gap-3">
              <div className={`flex items-center gap-2 border px-3 py-2 rounded-xl ${theme === 'dark' ? 'bg-slate-950/60 border-white/[0.08]' : 'bg-slate-50 border-slate-200'
                }`}>
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <select
                  value={selectedPatientId || ''}
                  onChange={(e) => setSelectedPatientId(e.target.value || null)}
                  className={`bg-transparent border-0 text-xs font-bold outline-none cursor-pointer p-0 pr-6 ${theme === 'dark' ? 'text-white' : 'text-slate-800'
                    }`}
                >
                  <option value="" className="text-slate-800 dark:text-white dark:bg-[#0a0f1d]">{user?.name} (Primary Profile)</option>
                  {dependents.map((dep) => (
                    <option key={dep.id} value={dep.id} className="text-slate-800 dark:text-white dark:bg-[#0a0f1d]">{dep.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowFamilyModal(true)}
                className="px-3.5 py-2 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-white/[0.02] text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                Manage Family
              </button>

              <Link
                to="/patient/find"
                className="btn-premium px-5 py-2.5 rounded-xl text-xs font-extrabold active:scale-95 transition-all text-center"
              >
                Book Appointment
              </Link>
            </div>
          </div>

          {/* Asymmetric Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Metric Tile 1: Consultations */}
            <div className="md:col-span-7 glass-card rounded-2xl p-5 border border-slate-200/60 dark:border-white/[0.04] relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-500 font-extrabold uppercase tracking-widest block mb-1">Scheduled Consultations</span>
                  <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums mt-1">{upcomingCount}</p>
                </div>
                <div className="w-10 h-10 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between">
                {data.upcoming && data.upcoming.length > 0 ? (
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-bold truncate max-w-[280px]">
                      Next: <span className="text-slate-900 dark:text-white">{data.upcoming[0].doctor?.name}</span> ({data.upcoming[0].time})
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">No upcoming appointments scheduled</p>
                )}
                <Link to="/patient/appointments" className="text-[10px] font-black text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 uppercase tracking-wider flex items-center gap-1 transition-colors">
                  Manage Slots <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Metric Tile 2: Rx prescriptions */}
            <div className="md:col-span-5 glass-card rounded-2xl p-5 border border-slate-200/60 dark:border-white/[0.04] relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-500 font-extrabold uppercase tracking-widest block mb-1">Active Prescriptions</span>
                  <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums mt-1">{prescriptionsCount}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between">
                {data.recentRx && data.recentRx.length > 0 ? (
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-bold truncate max-w-[180px]">
                    Latest Rx: <span className="text-slate-900 dark:text-white">{data.recentRx[0].diagnosis}</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">No active prescriptions</p>
                )}
                <Link to="/patient/prescriptions" className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 uppercase tracking-wider flex items-center gap-1 transition-colors">
                  View Rx <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Columns (Appointments & Prescriptions) */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upcoming Appointments */}
        <div className="glass-card rounded-2xl border border-slate-200/60 dark:border-white/[0.04] p-6">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-white/[0.04] pb-4">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-sky-500" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Upcoming Consultation Slots</h2>
            </div>
            <Link to="/patient/appointments" className="text-xs text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1 hover:text-sky-700 dark:hover:text-sky-300 transition-colors">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {data.upcoming?.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-600">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold tracking-tight">No upcoming consultations found</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Book an appointment online above to schedule a visit.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.upcoming?.map((a: any) => (
                <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200/60 dark:border-white/[0.04] bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-950/40 hover:border-sky-300 dark:hover:border-sky-500/20 hover:-translate-y-0.5 transition-all duration-200">
                  <div className="w-10 h-10 bg-sky-500/10 border border-sky-500/25 rounded-xl flex items-center justify-center text-sky-600 dark:text-sky-400 flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{a.doctor?.name || 'Medical Specialist'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">{a.hospital?.name} · {a.time}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded border tracking-wider ${a.status === 'CONFIRMED'
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                      }`}>
                      {a.status}
                    </span>
                    <button
                      onClick={() => handleCloseAppointment(a.id)}
                      className="px-2.5 py-1 text-[9px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 rounded-md tracking-wider hover:bg-rose-100 dark:hover:bg-rose-500/25 hover:border-rose-300 dark:hover:border-rose-500/40 transition-all cursor-pointer"
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
        <div className="glass-card rounded-2xl border border-slate-200/60 dark:border-white/[0.04] p-6">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-white/[0.04] pb-4">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-emerald-500" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Recent Prescriptions & Rx</h2>
            </div>
            <Link to="/patient/prescriptions" className="text-xs text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1 hover:text-sky-700 dark:hover:text-sky-300 transition-colors">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {data.recentRx?.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-600">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold tracking-tight">No active prescriptions yet</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Issued prescriptions will appear here automatically.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.recentRx?.map((rx: any) => (
                <div key={rx.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200/60 dark:border-white/[0.04] bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-950/40 hover:border-emerald-300 dark:hover:border-emerald-500/20 hover:-translate-y-0.5 transition-all duration-200">
                  <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{rx.diagnosis}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">{rx.doctor?.name} · {rx.hospital?.name}</p>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider border ${rx.status === 'ISSUED'
                    ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20'
                    : 'bg-slate-50 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/[0.08]'
                    }`}>
                    {rx.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Wayfinding Modal Overlay */}
      <WayfindingModal
        isOpen={isWayfindingOpen}
        onClose={() => setIsWayfindingOpen(false)}
        destination={wayfindingDest}
      />

      {/* Family dependents management modal */}
      <Modal isOpen={showFamilyModal} onClose={() => setShowFamilyModal(false)} title="Manage Family Members">
        <div className="space-y-6">
          <div>
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block mb-3">Registered Dependents</span>
            {dependents.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No dependents registered yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                {dependents.map((dep) => (
                  <div key={dep.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/[0.04]">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{dep.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">HSC-{dep.sixDigitId} · {dep.bloodGroup}</p>
                    </div>
                    <span className="text-[9px] font-black text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/25 px-2 py-0.5 rounded">DEPENDENT</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200/60 dark:border-white/[0.04] pt-4">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block mb-3">Add Dependents</span>
            <form onSubmit={handleAddDependent} className="space-y-3.5">
              <input
                type="text"
                placeholder="Full Name"
                value={newDependent.name}
                onChange={(e) => setNewDependent({ ...newDependent, name: e.target.value })}
                required
                className="w-full text-xs font-bold"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Contact Number"
                  value={newDependent.contact}
                  onChange={(e) => setNewDependent({ ...newDependent, contact: e.target.value })}
                  className="w-full text-xs"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newDependent.email}
                  onChange={(e) => setNewDependent({ ...newDependent, email: e.target.value })}
                  className="w-full text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Date of Birth</span>
                  <input
                    type="date"
                    value={newDependent.dateOfBirth}
                    onChange={(e) => setNewDependent({ ...newDependent, dateOfBirth: e.target.value })}
                    required
                    className="w-full text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Gender</span>
                  <select
                    value={newDependent.gender}
                    onChange={(e) => setNewDependent({ ...newDependent, gender: e.target.value })}
                    className="w-full text-xs font-bold cursor-pointer"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Blood Group</span>
                  <select
                    value={newDependent.bloodGroup}
                    onChange={(e) => setNewDependent({ ...newDependent, bloodGroup: e.target.value })}
                    className="w-full text-xs font-bold cursor-pointer"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full btn-premium py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Save Dependent Profile
              </button>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
};