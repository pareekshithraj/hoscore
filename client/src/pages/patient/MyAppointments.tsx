import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { encodeVisitQr, qrImageUrl } from '../../utils/hoscoreQr';

export const MyAppointments = () => {
  const { selectedPatientId } = useAuth();
  const [appts, setAppts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleId, setRescheduleId] = useState('');
  const [reschedule, setReschedule] = useState({ date: '', time: '' });
  const [confirmCancelId, setConfirmCancelId] = useState('');
  const [slotOptions, setSlotOptions] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

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

  const rescheduleAppt = appts.find((a) => a.id === rescheduleId);
  useEffect(() => {
    const hospitalId = rescheduleAppt?.hospitalId || rescheduleAppt?.hospital?.id;
    if (!hospitalId || !reschedule.date) {
      setSlotOptions([]);
      return;
    }
    setSlotsLoading(true);
    api.get(`/hospitals/${hospitalId}/available-slots?date=${reschedule.date}${rescheduleAppt?.doctorId ? `&doctorId=${rescheduleAppt.doctorId}` : ''}`)
      .then((res: any) => {
        const open = (res?.slots || []).filter((s: any) => s.isBooked !== true).map((s: any) => s.time);
        setSlotOptions(open);
        if (open.length && !open.includes(reschedule.time)) {
          setReschedule((prev) => ({ ...prev, time: open[0] }));
        }
      })
      .catch(() => setSlotOptions([]))
      .finally(() => setSlotsLoading(false));
  }, [rescheduleId, reschedule.date, rescheduleAppt?.hospitalId, rescheduleAppt?.hospital?.id, rescheduleAppt?.doctorId]);

  const cancelAppointment = async (id: string) => {
    await api.patch(`/patient/appointments/${id}/cancel`, {});
    setConfirmCancelId('');
    loadAppointments();
  };

  const submitReschedule = async (id: string) => {
    await api.patch(`/patient/appointments/${id}/reschedule`, reschedule);
    setRescheduleId('');
    setReschedule({ date: '', time: '' });
    loadAppointments();
  };

  const [selectedPassAppt, setSelectedPassAppt] = useState<any | null>(null);

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
              <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center cursor-pointer" onClick={() => setSelectedPassAppt(a)}>
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 cursor-pointer" onClick={() => setSelectedPassAppt(a)}>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{a.doctor?.name || 'Consultation'}</p>
                      <span className="text-xs font-black bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full border border-blue-200">
                        Token #{a.tokenNumber || 1}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{a.hospital?.name} • {new Date(a.date).toLocaleDateString()} at <span className="font-bold text-slate-700">{a.time}</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedPassAppt(a)} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-1">
                      🎟️ View Pass
                    </button>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${a.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : a.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' : a.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{a.status}</span>
                    {canManage && (
                      <div className="flex gap-2">
                        <button onClick={() => setRescheduleId(rescheduleId === a.id ? '' : a.id)} className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold">Reschedule</button>
                        {confirmCancelId === a.id ? (
                          <div className="flex gap-1.5 items-center">
                            <span className="text-xs text-rose-600 font-medium">Confirm?</span>
                            <button onClick={() => cancelAppointment(a.id)} className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold">Yes</button>
                            <button onClick={() => setConfirmCancelId('')} className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmCancelId(a.id)} className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">Cancel</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {rescheduleId === a.id && (
                  <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 border-t border-slate-100 pt-4">
                    <input type="date" min={new Date().toISOString().split('T')[0]} value={reschedule.date} onChange={(e) => setReschedule({ ...reschedule, date: e.target.value, time: '' })} className="px-3 py-2 rounded-xl border border-slate-200 text-sm" />
                    {slotsLoading ? (
                      <p className="text-xs text-slate-500 self-center">Loading open slots…</p>
                    ) : slotOptions.length === 0 ? (
                      <p className="text-xs text-amber-700 self-center font-semibold">
                        {reschedule.date ? 'No open slots — hospital may be closed or fully booked.' : 'Pick a date to load real slots.'}
                      </p>
                    ) : (
                      <select value={reschedule.time} onChange={(e) => setReschedule({ ...reschedule, time: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 text-sm">
                        {slotOptions.map((time) => <option key={time}>{time}</option>)}
                      </select>
                    )}
                    <button disabled={!reschedule.date || !reschedule.time || slotOptions.length === 0} onClick={() => submitReschedule(a.id)} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold disabled:opacity-50">Save</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedPassAppt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full glass-card border border-white/10 rounded-[32px] p-6 text-center space-y-6 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Appointment Pass
              </span>
              <button onClick={() => setSelectedPassAppt(null)} className="text-slate-400 hover:text-white font-bold text-sm px-2.5 py-1 rounded-lg bg-white/5 cursor-pointer">✕</button>
            </div>

            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-[#0f172a] rounded-2xl p-6 border border-rose-500/30 text-white relative overflow-hidden text-left shadow-2xl">
              <div className="space-y-1 mb-4 border-b border-white/10 pb-3">
                <p className="text-xs text-rose-400 font-bold uppercase tracking-wider">{selectedPassAppt.hospital?.name}</p>
                <p className="text-lg font-black text-white">{selectedPassAppt.patient?.name || 'Patient'}</p>
                <p className="text-xs text-slate-400">HOSCORE ID: <span className="font-mono font-bold text-rose-300">#{selectedPassAppt.patient?.sixDigitId || '—'}</span></p>
              </div>

              <div className="flex items-center justify-between my-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5">
                <div>
                  <p className="text-[10px] text-rose-300 font-black uppercase tracking-widest">Token Number</p>
                  <p className="text-4xl font-black text-white">#{selectedPassAppt.tokenNumber || 1}</p>
                </div>
                <div className="bg-white p-1.5 rounded-lg shadow-md">
                  <img
                    src={qrImageUrl(encodeVisitQr(selectedPassAppt.patient?.sixDigitId || '', selectedPassAppt.id, selectedPassAppt.tokenNumber || 1), 120)}
                    alt="Check-in QR"
                    className="w-16 h-16 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-xs">
                <div>
                  <p className="text-slate-400">Time Slot</p>
                  <p className="font-extrabold text-white">{selectedPassAppt.time}</p>
                </div>
                <div>
                  <p className="text-slate-400">Date</p>
                  <p className="font-extrabold text-white">{new Date(selectedPassAppt.date).toLocaleDateString()}</p>
                </div>
              </div>
              {selectedPassAppt.doctor?.name && (
                <div className="mt-2 pt-2 border-t border-white/5 text-xs">
                  <p className="text-slate-400">Attending Doctor</p>
                  <p className="font-bold text-rose-300">{selectedPassAppt.doctor?.name}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => window.print()} className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs cursor-pointer">
                🖨️ Print Pass
              </button>
              <button onClick={() => setSelectedPassAppt(null)} className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs cursor-pointer">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
