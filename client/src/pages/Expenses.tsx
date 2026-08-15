import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Receipt, Plus, FileText } from 'lucide-react';
import { StaffPicker } from '../components/clinical/StaffPicker';
import { formatINR } from '../utils/clinical';
import { Modal } from '../components/Modal';

export const Expenses = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'GENERAL', amount: '', vendor: '', paidBy: '', paidById: '', receipt: '' });

  const loadExpenses = () => {
    setLoading(true);
    setError('');
    api.get('/expenses')
      .then(setExpenses)
      .catch((err) => setError(err?.message || 'Failed to load expenses.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadExpenses(); }, []);

  const handleReceipt = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'expenses');
      const res = await api.upload('/upload/image', fd);
      if (res.key || res.url) setForm((f) => ({ ...f, receipt: res.key || res.url }));
    } catch {
      setError('Receipt upload failed. You can still save the expense.');
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async () => {
    try {
      await api.post('/expenses', { ...form, amount: Number(form.amount) });
      setShowForm(false);
      setForm({ title: '', category: 'GENERAL', amount: '', vendor: '', paidBy: '', paidById: '', receipt: '' });
      loadExpenses();
    } catch (err: any) {
      setError(err?.message || 'Failed to save expense.');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading expenses...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Expense Tracker</h2>
          <p className="text-sm text-[var(--text-muted)]">Who paid, and a receipt when you have one</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex gap-2"><Plus className="w-4"/> Log Expense</button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium">{error}</div>}

      <div className="grid gap-4">
        {expenses.map(e => (
          <div key={e.id} className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-slate-50 text-slate-500 rounded-xl"><Receipt className="w-6 h-6"/></div>
              <div>
                <h3 className="font-bold text-[var(--text-primary)]">{e.title}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">{e.vendor || '—'} • {e.paidBy ? `Paid by ${e.paidBy} • ` : ''}{new Date(e.paidDate).toLocaleDateString()}</p>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded mt-2 inline-block">{e.category}</span>
                {e.receipt && (
                  <a href={e.receipt} target="_blank" rel="noreferrer" className="ml-2 text-[10px] font-bold text-sky-600 inline-flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Receipt
                  </a>
                )}
              </div>
            </div>
            <p className="text-xl font-extrabold text-rose-500">-{formatINR(e.amount)}</p>
          </div>
        ))}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Log expense">
        <div className="space-y-3">
          <input placeholder="Title / Description" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] p-2 rounded-xl text-sm" />
          <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] p-2 rounded-xl text-sm">
            <option>GENERAL</option><option>SUPPLIES</option><option>MAINTENANCE</option><option>EQUIPMENT</option>
          </select>
          <input placeholder="Amount (₹)" type="number" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] p-2 rounded-xl text-sm" />
          <input placeholder="Vendor (Optional)" value={form.vendor} onChange={e=>setForm({...form, vendor: e.target.value})} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] p-2 rounded-xl text-sm" />
          <StaffPicker value={form.paidById} onChange={(s) => setForm({ ...form, paidById: s?.id || '', paidBy: s?.name || '' })} label="Paid by" required={false} />
          <label className="block text-xs font-bold text-[var(--text-muted)]">
            Receipt
            <input type="file" accept="image/*,.pdf" className="mt-1 block w-full text-xs" onChange={(e) => handleReceipt(e.target.files?.[0])} />
          </label>
          {uploading && <p className="text-xs text-sky-600">Uploading…</p>}
          <button onClick={handleAdd} disabled={!form.title || !form.amount} className="w-full bg-slate-900 text-white font-bold p-2 rounded-xl disabled:opacity-50">Save Expense</button>
        </div>
      </Modal>
    </div>
  );
};
