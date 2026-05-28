import { useState, useEffect } from 'react';
import { CalendarOff, Plus, Check, X as XIcon, User } from 'lucide-react';
import { api } from '../services/api';

const TYPE_COLORS: Record<string, string> = { CASUAL: 'bg-blue-50 text-blue-600 border-blue-100', SICK: 'bg-amber-50 text-amber-600 border-amber-100', EARNED: 'bg-violet-50 text-violet-600 border-violet-100' };
const STATUS_COLORS: Record<string, string> = { PENDING: 'bg-amber-50 text-amber-600', APPROVED: 'bg-emerald-50 text-emerald-600', REJECTED: 'bg-rose-50 text-rose-600' };

export const LeaveManagement = () => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [form, setForm] = useState({ staffName: '', role: 'Doctor', startDate: '', endDate: '', type: 'CASUAL', reason: '' });

  useEffect(() => { loadLeaves(); }, []);
  const loadLeaves = () => api.get('/leaves').then(setLeaves).catch(() => {});

  const handleCreate = async () => {
    try {
      await api.post('/leaves', form);
      setForm({ staffName: '', role: 'Doctor', startDate: '', endDate: '', type: 'CASUAL', reason: '' });
      setShowForm(false);
      loadLeaves();
    } catch (e) { console.error(e); }
  };

  const handleAction = async (id: string, status: string) => {
    try {
      await api.patch(`/leaves/${id}/status`, { status, reviewedBy: 'Admin' });
      loadLeaves();
    } catch (e) { console.error(e); }
  };

  const filtered = activeTab === 'ALL' ? leaves : leaves.filter(l => l.status === activeTab);

  const getDayCount = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Leave Management</h2>
          <p className="text-sm text-slate-400">Staff & doctor leave requests and approvals</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all text-sm">
          <Plus className="w-4 h-4" /> Apply Leave
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Total Requests', value: leaves.length, color: 'from-slate-500 to-slate-600' },
          { label: 'Pending', value: leaves.filter(l => l.status === 'PENDING').length, color: 'from-amber-500 to-amber-600' },
          { label: 'Approved', value: leaves.filter(l => l.status === 'APPROVED').length, color: 'from-emerald-500 to-emerald-600' },
          { label: 'Rejected', value: leaves.filter(l => l.status === 'REJECTED').length, color: 'from-rose-500 to-rose-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className={`h-1 bg-gradient-to-r ${s.color}`} />
            <div className="p-4"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p><p className="text-2xl font-extrabold text-slate-900 mt-1">{s.value}</p></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            {t === 'ALL' ? `All (${leaves.length})` : `${t.charAt(0) + t.slice(1).toLowerCase()} (${leaves.filter(l => l.status === t).length})`}
          </button>
        ))}
      </div>

      {/* Leave List */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="py-16 text-center"><CalendarOff className="w-12 h-12 text-slate-200 mx-auto mb-3" /><p className="text-slate-400 font-medium">No leave requests found</p></div>
          ) : filtered.map((leave: any) => (
            <div key={leave.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{leave.staffName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400">{leave.role}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${TYPE_COLORS[leave.type] || ''}`}>{leave.type}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-center">
                <div>
                  <p className="text-[10px] text-slate-400">Duration</p>
                  <p className="text-xs font-bold text-slate-900">{getDayCount(leave.startDate, leave.endDate)} days</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">From</p>
                  <p className="text-xs font-bold text-slate-700">{new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">To</p>
                  <p className="text-xs font-bold text-slate-700">{new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${STATUS_COLORS[leave.status] || ''}`}>{leave.status}</span>
                {leave.status === 'PENDING' && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleAction(leave.id, 'APPROVED')} className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleAction(leave.id, 'REJECTED')} className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all"><XIcon className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">Apply for Leave</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><XIcon className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-sm font-semibold text-slate-700 block mb-1">Name</label><input value={form.staffName} onChange={e => setForm(f => ({ ...f, staffName: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
              <div><label className="text-sm font-semibold text-slate-700 block mb-1">Role</label><select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"><option>Doctor</option><option>Nurse</option><option>Technician</option><option>Admin</option></select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-semibold text-slate-700 block mb-1">From</label><input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
                <div><label className="text-sm font-semibold text-slate-700 block mb-1">To</label><input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
              </div>
              <div><label className="text-sm font-semibold text-slate-700 block mb-1">Type</label><div className="flex gap-2">{['CASUAL', 'SICK', 'EARNED'].map(t => (<button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${form.type === t ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{t}</button>))}</div></div>
              <div><label className="text-sm font-semibold text-slate-700 block mb-1">Reason</label><textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" /></div>
              <button onClick={handleCreate} disabled={!form.staffName || !form.startDate || !form.endDate} className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
