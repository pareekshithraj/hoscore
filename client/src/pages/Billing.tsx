import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Receipt, Download, Search, Eye, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { StatusPill } from '../components/ui/StatusPill';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { formatINR } from '../utils/clinical';

export const Billing = () => {
  const [billing, setBilling] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBillings = () => {
    setLoading(true);
    api.get('/billing')
      .then(res => setBilling(res || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBillings();
  }, []);

  const handleMarkPaid = async (id: string) => {
    const method = window.prompt('Enter Payment Method (CASH, UPI, CARD)', 'CASH');
    if (!method) return;
    try {
      await api.put(`/billing/${id}/pay-offline`, { paymentMethod: method });
      fetchBillings();
    } catch (err) {
      console.error(err);
      alert('Failed to process offline payment.');
    }
  };

  if (loading) {
    return <LoadingState label="Loading financial records..." />;
  }

  const byStatus = statusFilter === 'All' ? billing : billing.filter(b => b.status === statusFilter);
  const filtered = !searchQuery ? byStatus : byStatus.filter(b =>
    (b.admission?.patient?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.id.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalRevenue = billing.filter(b => b.status === 'Paid' || b.status === 'PAID').reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalPending = billing.filter(b => b.status === 'Pending' || b.status === 'PENDING').reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Invoices"
        subtitle="Track payments, patient invoices, and financial records"
        icon={<Receipt className="w-5 h-5" />}
        actions={
          <button className="flex items-center gap-2 px-4 py-2.5 border border-[var(--card-border)] bg-[var(--card-bg)] rounded-xl text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--inner-bg)] transition-colors cursor-pointer shadow-sm">
            <Download className="w-4 h-4 text-[var(--text-muted)]" />
            Export Report
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Revenue Collected"
          value={formatINR(totalRevenue)}
          accent="#10b981"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <StatCard
          label="Outstanding Balance"
          value={formatINR(totalPending)}
          accent="#f59e0b"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          label="Total Invoices"
          value={billing.length}
          accent="#2563eb"
          icon={<Receipt className="w-5 h-5" />}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by patient name or invoice..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
          />
        </div>
        <div className="flex gap-1 bg-[var(--inner-bg)] p-1.5 rounded-xl border border-[var(--card-border)]">
          {['All', 'Paid', 'Pending', 'Partial'].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === f
                  ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--inner-bg)] border-b border-[var(--card-border)]">
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Invoice ID</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Patient</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Breakdown</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Total</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)]">
            {filtered.map((bill) => (
              <tr key={bill.id} className="hover:bg-[var(--inner-bg)] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-500/10 text-blue-600 dark:text-sky-400 rounded-xl flex items-center justify-center border border-blue-500/15">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-[var(--text-primary)] text-xs">INV-{String(bill.id).slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-[var(--text-muted)]">{bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-[var(--text-primary)]">{bill.admission?.patient?.name || 'Unknown'}</td>
                <td className="px-6 py-4 text-xs text-[var(--text-muted)] space-y-0.5 font-semibold">
                  <p>Room: <span className="font-bold text-[var(--text-primary)]">{formatINR(bill.roomCharges || 0)}</span></p>
                  <p>Doctor: <span className="font-bold text-[var(--text-primary)]">{formatINR(bill.doctorFees || 0)}</span></p>
                  <p>Lab: <span className="font-bold text-[var(--text-primary)]">{formatINR(bill.labFees || 0)}</span></p>
                </td>
                <td className="px-6 py-4 text-base font-black tracking-tight text-[var(--text-primary)]">{formatINR(bill.totalAmount || 0)}</td>
                <td className="px-6 py-4">
                  <StatusPill status={bill.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-[var(--text-muted)] hover:text-blue-600 dark:hover:text-sky-400 hover:bg-[var(--inner-bg)] rounded-lg cursor-pointer transition-colors" title="View Invoice"><Eye className="w-4 h-4" /></button>
                    {(!bill.receiptUrl) && <button className="p-1.5 text-[var(--text-muted)] hover:text-emerald-600 hover:bg-[var(--inner-bg)] rounded-lg cursor-pointer transition-colors" title="Download PDF"><Download className="w-4 h-4" /></button>}
                    {(bill.status === 'PENDING' || bill.status === 'Pending') && (
                      <button
                        onClick={() => handleMarkPaid(bill.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all"
                      >
                        Mark Paid
                      </button>
                    )}
                    {(bill.status === 'PAID' || bill.status === 'Paid') && bill.receiptUrl && (
                      <a
                        href={bill.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-primary)] font-bold text-xs rounded-xl hover:bg-[var(--inner-bg)] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Receipt
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <EmptyState
            icon={<Receipt className="w-8 h-8 text-[var(--text-muted)]" />}
            title="No billing records found"
            description="Invoices and billing summaries will appear here once generated"
          />
        )}
      </div>
    </div>
  );
};

