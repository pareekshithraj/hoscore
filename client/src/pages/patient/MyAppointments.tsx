import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyAppointments = () => {
  const [appts, setAppts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/patient/appointments').then(setAppts).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
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
          {appts.map((a: any) => (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><Calendar className="w-6 h-6 text-blue-600" /></div>
              <div className="flex-1">
                <p className="font-bold text-slate-900">{a.doctor?.name || 'Doctor'}</p>
                <p className="text-sm text-slate-500">{a.hospital?.name} · {new Date(a.date).toLocaleDateString()} · {a.time}</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${a.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : a.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>{a.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
