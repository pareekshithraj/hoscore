import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Star, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';

export const Feedback = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'MINE' | 'UNREPLIED'>('ALL');
  const [replyTarget, setReplyTarget] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');

  const load = () => api.get('/feedback').then(setReviews).catch(() => []);
  useEffect(() => { load(); }, []);

  const mineName = (user?.name || '').toLowerCase();
  const filtered = reviews.filter((r) => {
    if (filter === 'UNREPLIED') return !r.reply;
    if (filter === 'MINE') return (r.doctorName || '').toLowerCase() === mineName;
    return true;
  });

  const handleReply = async () => {
    if (!replyTarget || !replyText.trim()) return;
    await api.patch(`/feedback/${replyTarget.id}/reply`, { reply: replyText.trim() });
    setReplyTarget(null);
    setReplyText('');
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Patient Feedback</h2>
          <p className="text-[var(--text-muted)] text-sm">Satisfaction ratings & reviews</p>
        </div>
        <div className="flex gap-2">
          {(['ALL', 'UNREPLIED', 'MINE'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold ${filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
            >
              {f === 'ALL' ? 'All' : f === 'UNREPLIED' ? 'Needs reply' : 'About me'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.map(r => (
          <div key={r.id} className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)]">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500">{r.category}</span>
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({length: 5}).map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-current' : 'text-slate-200'}`} />)}
              </div>
            </div>
            <p className="font-bold mb-1 text-[var(--text-primary)]">{r.isAnonymous ? 'Anonymous' : r.patientName}</p>
            {r.doctorName && <p className="text-xs text-blue-500 font-medium mb-3">Re: Dr. {r.doctorName}</p>}
            {r.comment && <div className="bg-[var(--inner-bg)] p-3 rounded-xl text-sm text-[var(--text-secondary)] flex gap-2"><MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-300"/> <p>{r.comment}</p></div>}
            {r.reply ? (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 p-3">
                <p className="text-[10px] font-black uppercase text-emerald-700">Reply · {r.repliedBy}</p>
                <p className="text-xs mt-1 text-[var(--text-primary)]">{r.reply}</p>
              </div>
            ) : (
              <button onClick={() => { setReplyTarget(r); setReplyText(''); }} className="mt-3 text-xs font-bold text-blue-600">Reply</button>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="col-span-full py-10 text-center text-slate-400">No feedback in this filter</p>}
      </div>

      <Modal isOpen={!!replyTarget} onClose={() => setReplyTarget(null)} title="Reply to review">
        <p className="text-sm text-[var(--text-muted)] mb-3">{replyTarget?.comment}</p>
        <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={4} className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] p-3 text-sm" placeholder="Thank the patient or address the issue…" />
        <button onClick={handleReply} disabled={!replyText.trim()} className="mt-3 w-full rounded-xl bg-blue-600 py-2 text-sm font-bold text-white disabled:opacity-50">Send reply</button>
      </Modal>
    </div>
  );
};
