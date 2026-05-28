import { useState, useEffect } from 'react';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { api } from '../services/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const CalendarSchedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [defaults, setDefaults] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [form, setForm] = useState({ isOpen: true, openTime: '08:00', closeTime: '20:00', note: '' });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    api.get('/schedules/defaults').then(setDefaults).catch(() => {});
    api.get(`/schedules/overrides?month=${month + 1}&year=${year}`).then(setOverrides).catch(() => {});
  }, [month, year]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const getScheduleForDate = (day: number) => {
    const date = new Date(year, month, day);
    const override = overrides.find((o: any) => new Date(o.date).toDateString() === date.toDateString());
    if (override) return { ...override, isOverride: true };
    const dow = date.getDay();
    const def = defaults.find((d: any) => d.dayOfWeek === dow);
    if (def) return { ...def, isOverride: false };
    return { isOpen: true, openTime: '08:00', closeTime: '20:00', isOverride: false };
  };

  const handleDateClick = (day: number) => {
    const date = new Date(year, month, day);
    const sched = getScheduleForDate(day);
    setSelectedDate(date);
    setForm({ isOpen: sched.isOpen, openTime: sched.openTime, closeTime: sched.closeTime, note: sched.note || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedDate) return;
    try {
      await api.post('/schedules/overrides', { date: selectedDate.toISOString(), ...form });
      const res = await api.get(`/schedules/overrides?month=${month + 1}&year=${year}`);
      setOverrides(res);
      setShowModal(false);
    } catch (e) { console.error(e); }
  };

  const handleSaveDefault = async (dayOfWeek: number, isOpen: boolean, openTime: string, closeTime: string) => {
    try {
      await api.post('/schedules/defaults', { dayOfWeek, isOpen, openTime, closeTime });
      const res = await api.get('/schedules/defaults');
      setDefaults(res);
    } catch (e) { console.error(e); }
  };

  const navigate = (dir: number) => setCurrentDate(new Date(year, month + dir, 1));

  const isToday = (day: number) => today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Calendar & Schedule</h2>
          <p className="text-sm text-slate-400">Manage hospital operating hours and special dates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-extrabold text-slate-900">{MONTHS[month]} {year}</h3>
            </div>
            <div className="flex gap-1">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-lg transition-all"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-all">Today</button>
              <button onClick={() => navigate(1)} className="p-2 hover:bg-slate-50 rounded-lg transition-all"><ChevronRight className="w-4 h-4 text-slate-400" /></button>
            </div>
          </div>
          <div className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(d => <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider py-2">{d}</div>)}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const sched = getScheduleForDate(day);
                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`relative p-2 rounded-xl text-left transition-all hover:shadow-md group min-h-[72px] ${
                      isToday(day) ? 'ring-2 ring-blue-500 bg-blue-50/50' : 'hover:bg-slate-50'
                    } ${sched.isOverride ? 'bg-amber-50/50' : ''}`}
                  >
                    <span className={`text-sm font-bold ${isToday(day) ? 'text-blue-600' : 'text-slate-700'}`}>{day}</span>
                    <div className="mt-1">
                      {sched.isOpen ? (
                        <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                          {sched.openTime}-{sched.closeTime}
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">Closed</span>
                      )}
                    </div>
                    {sched.note && <p className="text-[8px] text-slate-400 mt-1 truncate">{sched.note}</p>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Default Schedule */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" /> Default Hours
          </h3>
          <div className="space-y-3">
            {DAYS.map((d, i) => {
              const def = defaults.find((x: any) => x.dayOfWeek === i) || { isOpen: i !== 0, openTime: '08:00', closeTime: '20:00' };
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700 w-10">{d}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveDefault(i, !def.isOpen, def.openTime, def.closeTime)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${def.isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}
                    >
                      {def.isOpen ? 'Open' : 'Closed'}
                    </button>
                    {def.isOpen && (
                      <span className="text-[10px] text-slate-400 font-medium">{def.openTime}-{def.closeTime}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Schedule Override Modal */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-slate-700 w-20">Status</label>
                <div className="flex gap-2">
                  <button onClick={() => setForm(f => ({ ...f, isOpen: true }))} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${form.isOpen ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>Open</button>
                  <button onClick={() => setForm(f => ({ ...f, isOpen: false }))} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!form.isOpen ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500'}`}>Closed</button>
                </div>
              </div>
              {form.isOpen && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-slate-700 w-20">Hours</label>
                  <input type="time" value={form.openTime} onChange={e => setForm(f => ({ ...f, openTime: e.target.value }))} className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                  <span className="text-slate-400">to</span>
                  <input type="time" value={form.closeTime} onChange={e => setForm(f => ({ ...f, closeTime: e.target.value }))} className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Note</label>
                <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="e.g., Public Holiday" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <button onClick={handleSave} className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all">Save Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
