import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TIMES = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];

export const MyAppointments = () => {
  const { selectedPatientId } = useAuth();
  const [appts, setAppts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleId, setRescheduleId] = useState('');
  const [reschedule, setReschedule] = useState({ date: '', time: '09:00 AM' });

  const loadAppointments = () => {
    setLoading(true);
    const url = selectedPatientId ? `/patient/appointments?patientId=${selectedPatientId}` : '/patient/appointments';
    api.get(url)
      .then(setAppts)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAppointments();
  }, [selectedPatientId]);

  const cancelAppointment = async (id: string) => {
    if (!window.confirm('Cancel this appointment?')) return;
    await api.patch(`/patient/appointments/${id}/cancel`, {});
    loadAppointments();
  };

  const submitReschedule = async (id: string) => {
    await api.patch(`/patient/appointments/${id}/reschedule`, reschedule);
    setRescheduleId('');
    setReschedule({ date: '', time: '09:00 AM' });
    loadAppointments();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Appointments</h1>
        <Link to="/patient/find" className="btn-premium px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-md hover:shadow-sky-500/20 active:scale-95 transition-all text-center">
          + Book Consultation
        </Link>
      </div>

      {appts.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center max-w-lg mx-auto border border-white/[0.04]">
          <Calendar className="w-12 h-12 text-sky-400/80 mx-auto mb-4 animate-float" />
          <h3 className="text-lg font-black text-white mb-2">No Active Appointments</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">You do not have any scheduled consultations at this time. Initialize a new secure booking at any hospital in our network.</p>
          <Link to="/patient/find" className="inline-block btn-premium px-6 py-3 rounded-xl text-xs font-extrabold shadow-lg hover:shadow-sky-500/20 active:scale-95 transition-all">
            Browse Hospitals & Book Now
          </Link>
        </div>
      ) : (
        <div className="space-y-3 stagger-in">
          {appts.map((a: any) => {
            const canManage = ['PENDING', 'CONFIRMED'].includes(a.status);
            return (
              <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><Calendar className="w-6 h-6 text-blue-600" /></div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{a.doctor?.name || 'Doctor'}</p>
                    <p className="text-sm text-slate-500">{a.hospital?.name} - {new Date(a.date).toLocaleDateString()} - {a.time}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${a.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : a.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' : a.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{a.status}</span>
                  {canManage && (
                    <div className="flex gap-2">
                      <button onClick={() => setRescheduleId(rescheduleId === a.id ? '' : a.id)} className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold">Reschedule</button>
                      <button onClick={() => cancelAppointment(a.id)} className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">Cancel</button>
                    </div>
                  )}
                </div>
                {rescheduleId === a.id && (
                  <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 border-t border-slate-100 pt-4">
                    <input type="date" min={new Date().toISOString().split('T')[0]} value={reschedule.date} onChange={(e) => setReschedule({ ...reschedule, date: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 text-sm" />
                    <select value={reschedule.time} onChange={(e) => setReschedule({ ...reschedule, time: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 text-sm">
                      {TIMES.map((time) => <option key={time}>{time}</option>)}
                    </select>
                    <button disabled={!reschedule.date} onClick={() => submitReschedule(a.id)} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold disabled:opacity-50">Save</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
