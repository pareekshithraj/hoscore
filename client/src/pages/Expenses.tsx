import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Receipt, Plus } from 'lucide-react';

export const Expenses = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'GENERAL', amount: '', vendor: '' });

  useEffect(() => { loadExpenses(); }, []);
  const loadExpenses = () => api.get('/expenses').then(setExpenses);

  const handleAdd = async () => {
    await api.post('/expenses', { ...form, amount: Number(form.amount) });
    setShowForm(false);
    loadExpenses();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-extrabold">Expense Tracker</h2></div>
        <button onClick={() => setShowForm(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex gap-2"><Plus className="w-4"/> Log Expense</button>
      </div>

      <div className="grid gap-4">
        {expenses.map(e => (
          <div key={e.id} className="bg-white p-5 rounded-2xl border flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-slate-50 text-slate-500 rounded-xl"><Receipt className="w-6 h-6"/></div>
              <div>
                <h3 className="font-bold">{e.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{e.vendor} • {new Date(e.paidDate).toLocaleDateString()}</p>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded mt-2 inline-block">{e.category}</span>
              </div>
            </div>
            <p className="text-xl font-extrabold text-rose-500">-${e.amount.toFixed(2)}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white p-6 w-[400px] rounded-2xl space-y-3" onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold">Log Expense</h3>
            <input placeholder="Title / Description" onChange={e=>setForm({...form, title: e.target.value})} className="w-full border p-2 rounded" />
            <select onChange={e=>setForm({...form, category: e.target.value})} className="w-full border p-2 rounded"><option>GENERAL</option><option>SUPPLIES</option><option>MAINTENANCE</option><option>EQUIPMENT</option></select>
            <input placeholder="Amount ($)" type="number" onChange={e=>setForm({...form, amount: e.target.value})} className="w-full border p-2 rounded" />
            <input placeholder="Vendor (Optional)" onChange={e=>setForm({...form, vendor: e.target.value})} className="w-full border p-2 rounded" />
            <button onClick={handleAdd} className="w-full bg-slate-900 text-white font-bold p-2 rounded">Save Expense</button>
          </div>
        </div>
      )}
    </div>
  );
};
