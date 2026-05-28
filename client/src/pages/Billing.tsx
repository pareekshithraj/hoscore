import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Receipt, Download, Search, CheckCircle, Clock, XCircle, Eye } from 'lucide-react';

const statusIcons = {
  Paid: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  Pending: <Clock className="w-4 h-4 text-amber-500" />,
  Partial: <XCircle className="w-4 h-4 text-blue-500" />,
  Cancelled: <XCircle className="w-4 h-4 text-red-500" />,
};
const statusStyles: Record<string, string> = {
  Paid: 'bg-emerald-100 text-emerald-800',
  Pending: 'bg-amber-100 text-amber-800',
  Partial: 'bg-blue-100 text-blue-800',
  Cancelled: 'bg-red-100 text-red-800',
};

export const Billing = () => {
  const [billing, setBilling] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchBillings = () => {
    setLoading(true);
    api.get('/billing')
      .then(res => setBilling(res))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBillings();
  }, []);

  const handleMarkPaid = async (id: string) => {
    try {
      await api.patch(`/billing/${id}/status`, { status: 'Paid' });
      fetchBillings();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 font-medium">
        <div className="animate-pulse">Loading financial records...</div>
      </div>
    );
  }

  const filtered = statusFilter === 'All' ? billing : billing.filter(b => b.status === statusFilter);
  const totalRevenue = billing.filter(b => b.status === 'Paid').reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalPending = billing.filter(b => b.status === 'Pending').reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Billing & Invoices</h2>
          <p className="text-slate-500">Track payments, invoices, and financial records.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Total Collected</p>
          <p className="text-3xl font-bold text-emerald-600">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Outstanding</p>
          <p className="text-3xl font-bold text-amber-600">${totalPending.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Total Invoices</p>
          <p className="text-3xl font-bold text-slate-800">{billing.length}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by patient name or invoice..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {['All', 'Paid', 'Pending', 'Partial'].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${statusFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Breakdown</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((bill) => (
              <tr key={bill.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Receipt className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-mono font-semibold text-slate-900 text-sm">{bill.id}</p>
                      <p className="text-xs text-slate-400">{bill.createdAt}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{bill.admission?.patient?.name || 'Unknown'}</td>
                <td className="px-6 py-4 text-xs text-slate-500 space-y-0.5">
                  <p>Room: <span className="font-medium text-slate-700">${bill.roomCharges}</span></p>
                  <p>Doctor: <span className="font-medium text-slate-700">${bill.doctorFees}</span></p>
                  <p>Lab: <span className="font-medium text-slate-700">${bill.labFees}</span></p>
                </td>
                <td className="px-6 py-4 text-lg font-bold text-slate-900">${(bill.totalAmount || 0).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    {statusIcons[bill.status as keyof typeof statusIcons]}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[bill.status]}`}>{bill.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="View Invoice"><Eye className="w-4 h-4" /></button>
                    <button className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md" title="Download PDF"><Download className="w-4 h-4" /></button>
                    {bill.status !== 'Paid' && (
                      <button onClick={() => handleMarkPaid(bill.id)} className="px-2.5 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700">Mark Paid</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
