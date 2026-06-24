import { useState, useEffect } from 'react';
import { 
  Calendar as CalIcon, ChevronLeft, ChevronRight, Clock, X, 
  Megaphone, AlertTriangle, Info, Bell, Users, Zap, 
  CalendarCheck, FileText, Activity, Plus, Pin
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bgClass: string; icon: any; dot: string }> = {
  INFO:    { label: 'Info',    color: 'text-sky-700 dark:text-sky-400',    bgClass: 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20',    icon: Info,          dot: 'bg-sky-500' },
  WARNING: { label: 'Warning', color: 'text-amber-700 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20', icon: AlertTriangle,  dot: 'bg-amber-500' },
  URGENT:  { label: 'Urgent',  color: 'text-rose-700 dark:text-rose-400',   bgClass: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',   icon: Bell,          dot: 'bg-rose-500' },
};

const ACTION_COLORS: Record<string, string> = {
  CHECKIN:      'bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20',
  ADMIT:        'bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20',
  DISCHARGE:    'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  VITALS:       'bg-pink-100 dark:bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-500/20',
  PRESCRIPTION: 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
  LAB_ORDER:    'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20',
  DISPENSE:     'bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/20',
  APPOINTMENT:  'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  REGISTER:     'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20',
};

type TabType = 'calendar' | 'updates' | 'shifts';

export const CalendarSchedule = () => {
  const { addNotification } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [defaults, setDefaults] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [form, setForm] = useState({ isOpen: true, openTime: '08:00', closeTime: '20:00', note: '' });
  const [activeTab, setActiveTab] = useState<TabType>('calendar');

  // Notices
  const [notices, setNotices] = useState<any[]>([]);
  const [noticeFilter, setNoticeFilter] = useState('ALL');
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ title: '', body: '', priority: 'INFO', isPinned: false, expiresAt: '' });

  // Shifts
  const [shifts, setShifts] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  // Live feed for updates tab
  const [activityFeed] = useState<any[]>([
    { id: '1', action: 'ADMIT', entity: 'Patient', details: 'Patient admitted to General Ward Bed A12.', createdAt: new Date(Date.now() - 5 * 60000) },
    { id: '2', action: 'VITALS', entity: 'Clinical', details: 'Vitals recorded for patient Meera K. — SpO2 98%, BP 118/76.', createdAt: new Date(Date.now() - 12 * 60000) },
    { id: '3', action: 'LAB_ORDER', entity: 'Laboratory', details: 'STAT haematology panel dispatched for patient Rajan S.', createdAt: new Date(Date.now() - 25 * 60000) },
    { id: '4', action: 'DISCHARGE', entity: 'Discharge', details: 'Patient Priya D. discharged from Orthopaedics.', createdAt: new Date(Date.now() - 42 * 60000) },
    { id: '5', action: 'PRESCRIPTION', entity: 'E-Rx', details: 'Dr. Arun issued electronic Rx for patient Vikram N.', createdAt: new Date(Date.now() - 60 * 60000) },
  ]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    api.get('/schedules/defaults').then(setDefaults).catch(() => {});
    api.get(`/schedules/overrides?month=${month + 1}&year=${year}`).then(setOverrides).catch(() => {});
  }, [month, year]);

  useEffect(() => {
    api.get('/notices').then(setNotices).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/shifts').catch(() => []),
      api.get('/staff').catch(() => []),
    ]).then(([shiftsRes, staffRes]) => {
      setShifts(Array.isArray(shiftsRes) ? shiftsRes : []);
      setStaff(Array.isArray(staffRes) ? staffRes : []);
    });
  }, []);

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
      addNotification('Schedule Updated', `Hospital schedule for ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} has been updated.`, 'SUCCESS');
    } catch (e) { console.error(e); }
  };

  const handleSaveDefault = async (dayOfWeek: number, isOpen: boolean, openTime: string, closeTime: string) => {
    try {
      await api.post('/schedules/defaults', { dayOfWeek, isOpen, openTime, closeTime });
      const res = await api.get('/schedules/defaults');
      setDefaults(res);
    } catch (e) { console.error(e); }
  };

  const handleCreateNotice = async () => {
    try {
      await api.post('/notices', { ...noticeForm, expiresAt: noticeForm.expiresAt || null });
      setNoticeForm({ title: '', body: '', priority: 'INFO', isPinned: false, expiresAt: '' });
      setShowNoticeForm(false);
      const res = await api.get('/notices');
      setNotices(res);
      addNotification('Notice Posted', noticeForm.title, noticeForm.priority === 'URGENT' ? 'URGENT' : noticeForm.priority === 'WARNING' ? 'WARNING' : 'INFO');
    } catch (e) { console.error(e); }
  };

  const handleDeleteNotice = async (id: string) => {
    try {
      await api.delete(`/notices/${id}`);
      setNotices(prev => prev.filter((n: any) => n.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleTogglePin = async (notice: any) => {
    try {
      await api.put(`/notices/${notice.id}`, { isPinned: !notice.isPinned });
      setNotices(prev => prev.map((n: any) => n.id === notice.id ? { ...n, isPinned: !n.isPinned } : n));
    } catch (e) { console.error(e); }
  };

  const navigate = (dir: number) => setCurrentDate(new Date(year, month + dir, 1));
  const isToday = (day: number) => today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  const filteredNotices = noticeFilter === 'ALL' ? notices : notices.filter((n: any) => n.priority === noticeFilter);
  const sortedNotices = [...filteredNotices].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const todayShifts = shifts.filter((s: any) => {
    if (!s.date) return false;
    return new Date(s.date).toDateString() === today.toDateString();
  });

  const timeAgo = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const tabs: { key: TabType; label: string; icon: any; badge?: number }[] = [
    { key: 'calendar', label: 'Hospital Schedule', icon: CalIcon },
    { key: 'updates', label: 'Staff Updates', icon: Megaphone, badge: notices.filter((n: any) => !n.isRead).length || undefined },
    { key: 'shifts', label: 'Shift Roster', icon: Users },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Calendar & Updates</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
            Hospital schedule, staff announcements and shift roster
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.03] px-3.5 py-2 rounded-xl border border-slate-200/60 dark:border-white/[0.05]">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Notices', value: notices.length, icon: Megaphone, color: 'from-indigo-500/10 to-violet-500/5 border-indigo-200/60 dark:border-indigo-500/20', iconColor: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10', numColor: 'text-indigo-700 dark:text-indigo-400' },
          { label: 'Urgent Alerts', value: notices.filter((n: any) => n.priority === 'URGENT').length, icon: Bell, color: 'from-rose-500/10 to-red-500/5 border-rose-200/60 dark:border-rose-500/20', iconColor: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', numColor: 'text-rose-700 dark:text-rose-400' },
          { label: "Today's Shifts", value: todayShifts.length || shifts.length, icon: Users, color: 'from-emerald-500/10 to-teal-500/5 border-emerald-200/60 dark:border-emerald-500/20', iconColor: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', numColor: 'text-emerald-700 dark:text-emerald-400' },
          { label: 'Pinned Notices', value: notices.filter((n: any) => n.isPinned).length, icon: Pin, color: 'from-amber-500/10 to-orange-500/5 border-amber-200/60 dark:border-amber-500/20', iconColor: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', numColor: 'text-amber-700 dark:text-amber-400' },
        ].map((stat) => (
          <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border rounded-xl p-4 flex items-center gap-3`}>
            <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center`}>
              <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
            </div>
            <div>
              <p className={`text-2xl font-black ${stat.numColor} leading-none`}>{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-white/[0.04] p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all relative ${
              activeTab === tab.key
                ? 'bg-white dark:bg-white/[0.08] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ===== TAB: CALENDAR ===== */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3 bg-white dark:bg-white/[0.02] rounded-2xl border border-slate-200/60 dark:border-white/[0.06] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.04] flex items-center justify-between bg-gradient-to-r from-blue-500/5 to-indigo-500/5 dark:from-blue-500/5 dark:to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <CalIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">{MONTHS[month]} {year}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operating Schedule</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-lg transition-all">
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                </button>
                <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all">
                  Today
                </button>
                <button onClick={() => navigate(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-lg transition-all">
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
            <div className="p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-wider py-2">{d}</div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const sched = getScheduleForDate(day);
                  const hasEvent = overrides.some((o: any) => new Date(o.date).getDate() === day && new Date(o.date).getMonth() === month);
                  return (
                    <button
                      key={day}
                      onClick={() => handleDateClick(day)}
                      className={`relative p-2 rounded-xl text-left transition-all hover:shadow-md group min-h-[72px] border ${
                        isToday(day)
                          ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30'
                          : hasEvent
                          ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 hover:border-amber-300 dark:hover:border-amber-500/40'
                          : 'border-transparent hover:bg-slate-50 dark:hover:bg-white/[0.03] hover:border-slate-200 dark:hover:border-white/[0.05]'
                      }`}
                    >
                      <span className={`text-sm font-bold ${isToday(day) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{day}</span>
                      <div className="mt-1 space-y-0.5">
                        {sched.isOpen ? (
                          <span className="block text-[8px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md leading-none">
                            {sched.openTime}–{sched.closeTime}
                          </span>
                        ) : (
                          <span className="block text-[8px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded-md leading-none">Closed</span>
                        )}
                        {hasEvent && (
                          <span className="block text-[7px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Override</span>
                        )}
                      </div>
                      {sched.note && <p className="text-[8px] text-slate-400 mt-1 truncate">{sched.note}</p>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="px-4 pb-4 flex gap-4 flex-wrap">
              {[
                { color: 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-500/10', label: 'Today' },
                { color: 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20', label: 'Override Set' },
                { color: 'bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05]', label: 'Default Hours' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`w-4 h-4 rounded-md ${l.color}`} />
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Default Schedule Sidebar */}
          <div className="bg-white dark:bg-white/[0.02] rounded-2xl border border-slate-200/60 dark:border-white/[0.06] p-5 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Default Hours
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mb-4">Click a day to toggle open/closed</p>
            <div className="space-y-2">
              {DAYS.map((d, i) => {
                const def = defaults.find((x: any) => x.dayOfWeek === i) || { isOpen: i !== 0, openTime: '08:00', closeTime: '20:00' };
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/[0.04] last:border-0">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-10">{d}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveDefault(i, !def.isOpen, def.openTime, def.closeTime)}
                        className={`text-[9px] font-black px-2 py-1 rounded-md transition-all border ${
                          def.isOpen
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                        }`}
                      >
                        {def.isOpen ? 'Open' : 'Closed'}
                      </button>
                      {def.isOpen && (
                        <span className="text-[9px] text-slate-400 font-semibold">{def.openTime}–{def.closeTime}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB: STAFF UPDATES ===== */}
      {activeTab === 'updates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notices panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex gap-2 flex-wrap">
                {['ALL', 'INFO', 'WARNING', 'URGENT'].map(f => (
                  <button
                    key={f}
                    onClick={() => setNoticeFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${
                      noticeFilter === f
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                        : 'bg-white dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.1]'
                    }`}
                  >
                    {f === 'ALL' ? 'All Notices' : PRIORITY_CONFIG[f]?.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowNoticeForm(!showNoticeForm)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> New Notice
              </button>
            </div>

            {/* Notice Create Form */}
            {showNoticeForm && (
              <div className="bg-white dark:bg-white/[0.03] border border-blue-200 dark:border-blue-500/20 rounded-2xl p-5 shadow-sm animate-fade-in">
                <h4 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" /> Create Notice
                </h4>
                <div className="space-y-3">
                  <input
                    value={noticeForm.title}
                    onChange={e => setNoticeForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Notice title..."
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.03] text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  />
                  <textarea
                    value={noticeForm.body}
                    onChange={e => setNoticeForm(f => ({ ...f, body: e.target.value }))}
                    placeholder="Notice body / description..."
                    rows={3}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.03] text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
                  />
                  <div className="flex gap-3 flex-wrap">
                    <select
                      value={noticeForm.priority}
                      onChange={e => setNoticeForm(f => ({ ...f, priority: e.target.value }))}
                      className="flex-1 min-w-[120px] px-3 py-2 text-xs border border-slate-200 dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.03] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="INFO">Info</option>
                      <option value="WARNING">Warning</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                    <input
                      type="date"
                      value={noticeForm.expiresAt}
                      onChange={e => setNoticeForm(f => ({ ...f, expiresAt: e.target.value }))}
                      className="flex-1 min-w-[120px] px-3 py-2 text-xs border border-slate-200 dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.03] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={noticeForm.isPinned}
                        onChange={e => setNoticeForm(f => ({ ...f, isPinned: e.target.checked }))}
                        className="w-4 h-4 rounded accent-blue-500"
                      />
                      Pin
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateNotice}
                      className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl text-xs hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                    >
                      Post Notice
                    </button>
                    <button
                      onClick={() => setShowNoticeForm(false)}
                      className="px-4 py-2.5 border border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 font-bold rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notice Cards */}
            {sortedNotices.length === 0 ? (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-semibold">No notices to display</p>
                <p className="text-xs mt-1">Post a new notice to inform your staff</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedNotices.map((notice: any) => {
                  const cfg = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.INFO;
                  const PIcon = cfg.icon;
                  const isExpired = notice.expiresAt && new Date(notice.expiresAt) < new Date();
                  return (
                    <div
                      key={notice.id}
                      className={`bg-white dark:bg-white/[0.02] rounded-2xl border overflow-hidden transition-all hover:shadow-md group ${
                        isExpired ? 'opacity-50' : ''
                      } ${notice.isPinned ? 'border-amber-300 dark:border-amber-500/30' : 'border-slate-200/60 dark:border-white/[0.06]'}`}
                    >
                      <div className={`h-1 ${notice.priority === 'URGENT' ? 'bg-gradient-to-r from-rose-500 to-pink-500' : notice.priority === 'WARNING' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-sky-500 to-blue-500'}`} />
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className={`p-1.5 rounded-lg border ${cfg.bgClass}`}>
                              <PIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-black text-slate-800 dark:text-white">{notice.title}</h4>
                                {notice.isPinned && (
                                  <span className="text-[8px] font-black bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    📌 Pinned
                                  </span>
                                )}
                                {isExpired && (
                                  <span className="text-[8px] font-black bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06] px-1.5 py-0.5 rounded uppercase">
                                    Expired
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1 leading-relaxed">{notice.body}</p>
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-semibold">
                                <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wide ${cfg.bgClass} ${cfg.color}`}>
                                  {cfg.label}
                                </span>
                                <span>{new Date(notice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                {notice.expiresAt && (
                                  <span>Expires: {new Date(notice.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleTogglePin(notice)}
                              className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all"
                              title={notice.isPinned ? 'Unpin' : 'Pin notice'}
                            >
                              <Pin className={`w-3.5 h-3.5 ${notice.isPinned ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                            </button>
                            <button
                              onClick={() => handleDeleteNotice(notice.id)}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                            >
                              <X className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500 transition-colors" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Activity Feed */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-white/[0.02] rounded-2xl border border-slate-200/60 dark:border-white/[0.06] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                  <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white">Live Activity</h3>
                <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Live
                </span>
              </div>
              <div className="space-y-3">
                {activityFeed.map((item) => {
                  const colorClass = ACTION_COLORS[item.action] || ACTION_COLORS['CHECKIN'];
                  return (
                    <div key={item.id} className="flex gap-3 group">
                      <div className="flex flex-col items-center">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${colorClass} whitespace-nowrap`}>
                          {item.action}
                        </span>
                        <div className="w-px flex-1 bg-slate-100 dark:bg-white/[0.04] mt-1.5" />
                      </div>
                      <div className="pb-3 flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug">{item.details}</p>
                        <span className="text-[9px] text-slate-400 font-medium">{timeAgo(new Date(item.createdAt))}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick stats */}
            <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 dark:from-blue-500/5 dark:to-indigo-500/5 border border-blue-200/60 dark:border-blue-500/20 rounded-2xl p-5">
              <h3 className="text-sm font-black text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" /> Today's Snapshot
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Total Notices', value: notices.length, color: 'text-indigo-600 dark:text-indigo-400' },
                  { label: 'Urgent Alerts', value: notices.filter((n: any) => n.priority === 'URGENT').length, color: 'text-rose-600 dark:text-rose-400' },
                  { label: 'Warnings', value: notices.filter((n: any) => n.priority === 'WARNING').length, color: 'text-amber-600 dark:text-amber-400' },
                  { label: 'Info Notices', value: notices.filter((n: any) => n.priority === 'INFO').length, color: 'text-sky-600 dark:text-sky-400' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{s.label}</span>
                    <span className={`text-sm font-black ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB: SHIFTS ===== */}
      {activeTab === 'shifts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Shift Roster</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Staff scheduled shifts and duty assignments</p>
            </div>
          </div>

          {shifts.length === 0 ? (
            <div className="bg-white dark:bg-white/[0.02] rounded-2xl border border-slate-200/60 dark:border-white/[0.06] p-16 text-center shadow-sm">
              <CalendarCheck className="w-12 h-12 text-slate-200 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">No shifts scheduled</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Create shifts from the Shift Roster page to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {shifts.slice(0, 12).map((shift: any) => {
                const staffMember = staff.find((s: any) => s.id === shift.staffId);
                const shiftDate = new Date(shift.date || shift.startTime);
                const isTodayShift = shiftDate.toDateString() === today.toDateString();
                return (
                  <div
                    key={shift.id}
                    className={`bg-white dark:bg-white/[0.02] rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${
                      isTodayShift
                        ? 'border-emerald-200 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-500/5 dark:to-transparent'
                        : 'border-slate-200/60 dark:border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white ${
                          shift.type === 'MORNING' ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                          shift.type === 'EVENING' ? 'bg-gradient-to-br from-violet-500 to-indigo-600' :
                          'bg-gradient-to-br from-slate-600 to-slate-800'
                        }`}>
                          {(staffMember?.name || shift.staffName || 'S')?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 dark:text-white">{staffMember?.name || shift.staffName || 'Staff Member'}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{staffMember?.role || shift.role || 'Staff'}</p>
                        </div>
                      </div>
                      {isTodayShift && (
                        <span className="text-[8px] font-black bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-semibold">Shift</span>
                        <span className={`font-black px-2 py-0.5 rounded text-[9px] uppercase tracking-wide border ${
                          shift.type === 'MORNING' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' :
                          shift.type === 'EVENING' ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20' :
                          'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.08]'
                        }`}>
                          {shift.type || 'General'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-semibold">Date</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{shiftDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      {shift.department && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-semibold">Dept</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{shift.department}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Schedule Override Modal */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-[#0c1120] rounded-2xl shadow-2xl w-full max-w-md border border-slate-200/60 dark:border-white/[0.08] animate-scale-in overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 dark:border-white/[0.05] bg-gradient-to-r from-blue-500/5 to-indigo-500/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Set schedule override for this date</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-xl transition-all">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 w-20">Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm(f => ({ ...f, isOpen: true }))}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${form.isOpen ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-white dark:bg-white/[0.03] text-slate-500 border-slate-200 dark:border-white/[0.08]'}`}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => setForm(f => ({ ...f, isOpen: false }))}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${!form.isOpen ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20' : 'bg-white dark:bg-white/[0.03] text-slate-500 border-slate-200 dark:border-white/[0.08]'}`}
                  >
                    Closed
                  </button>
                </div>
              </div>
              {form.isOpen && (
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 w-20">Hours</label>
                  <input
                    type="time"
                    value={form.openTime}
                    onChange={e => setForm(f => ({ ...f, openTime: e.target.value }))}
                    className="px-3 py-2 border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs bg-white dark:bg-white/[0.03] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <span className="text-slate-400 text-xs font-semibold">to</span>
                  <input
                    type="time"
                    value={form.closeTime}
                    onChange={e => setForm(f => ({ ...f, closeTime: e.target.value }))}
                    className="px-3 py-2 border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs bg-white dark:bg-white/[0.03] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Note</label>
                <input
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="e.g., Public Holiday, Special Event..."
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs bg-white dark:bg-white/[0.03] text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <button
                onClick={handleSave}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black rounded-xl text-xs hover:shadow-lg hover:shadow-blue-500/20 transition-all"
              >
                Save Schedule Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
