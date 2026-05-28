import { useState, useEffect } from 'react';
import { Megaphone, Plus, Pin, Trash2, X, AlertTriangle, Info, Bell } from 'lucide-react';
import { api } from '../services/api';

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  INFO:    { label: 'Info',    color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-100', icon: Info },
  WARNING: { label: 'Warning', color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100', icon: AlertTriangle },
  URGENT:  { label: 'Urgent',  color: 'text-rose-600',   bg: 'bg-rose-50 border-rose-100', icon: Bell },
};

export const NoticeBoard = () => {
  const [notices, setNotices] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [form, setForm] = useState({ title: '', body: '', priority: 'INFO', isPinned: false, expiresAt: '' });

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = () => api.get('/notices').then(setNotices).catch(() => {});

  const handleCreate = async () => {
    try {
      await api.post('/notices', { ...form, expiresAt: form.expiresAt || null });
      setForm({ title: '', body: '', priority: 'INFO', isPinned: false, expiresAt: '' });
      setShowForm(false);
      loadNotices();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/notices/${id}`);
      loadNotices();
    } catch (e) { console.error(e); }
  };

  const handleTogglePin = async (notice: any) => {
    try {
      await api.put(`/notices/${notice.id}`, { isPinned: !notice.isPinned });
      loadNotices();
    } catch (e) { console.error(e); }
  };

  const filtered = filter === 'ALL' ? notices : notices.filter(n => n.priority === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Notice Board</h2>
          <p className="text-sm text-slate-400">Announcements and alerts for all staff</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all text-sm">
          <Plus className="w-4 h-4" /> New Notice
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['ALL', 'INFO', 'WARNING', 'URGENT'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            {f === 'ALL' ? 'All' : PRIORITY_CONFIG[f].label}
          </button>
        ))}
      </div>

      {/* Notices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {filtered.map((notice: any) => {
          const cfg = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.INFO;
          const PIcon = cfg.icon;
          const isExpired = notice.expiresAt && new Date(notice.expiresAt) < new Date();
          return (
            <div key={notice.id} className={`bg-white rounded-2xl border border-slate-100 overflow-hidden group hover:shadow-lg transition-all ${isExpired ? 'opacity-50' : ''}`}>
              <div className={`h-1 ${notice.priority === 'URGENT' ? 'bg-rose-500' : notice.priority === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border ${cfg.bg} ${cfg.color}`}>
                    <PIcon className="w-3 h-3" /> {cfg.label}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleTogglePin(notice)} className={`p-1.5 rounded-lg transition-all ${notice.isPinned ? 'text-blue-600 bg-blue-50' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'}`}>
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(notice.id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                  {notice.isPinned && <Pin className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                  {notice.title}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{notice.body}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                  <span className="text-[10px] text-slate-400">{new Date(notice.createdAt).toLocaleDateString()}</span>
                  {isExpired && <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">Expired</span>}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16">
            <Megaphone className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No notices posted yet</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">New Notice</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="Notice title..." />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Message</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={4} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" placeholder="Write your announcement..." />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Priority</label>
                  <div className="flex gap-2">
                    {['INFO', 'WARNING', 'URGENT'].map(p => (
                      <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${form.priority === p ? (p === 'URGENT' ? 'bg-rose-500 text-white' : p === 'WARNING' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white') : 'bg-slate-100 text-slate-500'}`}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.isPinned} onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))} className="rounded" />
                  <Pin className="w-3.5 h-3.5" /> Pin to top
                </label>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Expires</label>
                  <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none" />
                </div>
              </div>
              <button onClick={handleCreate} disabled={!form.title || !form.body} className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Post Notice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
