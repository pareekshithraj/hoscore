import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Receipt, IndianRupee, CreditCard, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MyBills = () => {
  const { selectedPatientId } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const fetchBills = () => {
    setLoading(true);
    const url = selectedPatientId ? `/patient/bills?patientId=${selectedPatientId}` : '/patient/bills';
    api.get(url)
      .then(setBills)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBills();
    // Load Razorpay Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
  }, [selectedPatientId]);

  const handlePayment = async (billId: string) => {
    setNotice(null);
    setPayingId(billId);
    try {
      // Patient-context endpoints — the staff /billing/* routes are feature-gated
      // to hospital context and always reject a patient session.
      const orderData = await api.post(`/patient/bills/${billId}/pay-order`, {});
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_xxxx',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Hoscore Payments',
        description: 'Medical Bill Payment',
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            await api.post('/patient/bills/pay-verify', response);
            setNotice({ tone: 'success', text: 'Payment successful — your receipt is ready to download.' });
            fetchBills();
          } catch (e: any) {
            setNotice({
              tone: 'error',
              text: e?.message || 'Payment went through but confirmation failed. Contact the hospital before paying again.',
            });
          } finally {
            setPayingId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setPayingId(null);
            setNotice({ tone: 'error', text: 'Payment cancelled. Your bill is unchanged.' });
          },
        },
        theme: { color: '#e11d48' }
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (e: any) {
      console.error(e);
      setNotice({ tone: 'error', text: e?.message || 'Could not start payment. Please try again.' });
      setPayingId(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900">My Bills</h1>

      {notice && (
        <div
          role="status"
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            notice.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {notice.text}
        </div>
      )}

      {bills.length === 0 ? <p className="text-slate-500">No bills found.</p> : (
        <div className="space-y-3">
          {bills.map((b: any, i: number) => (
            <div key={b.id || i} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center"><Receipt className="w-6 h-6 text-amber-600" /></div>
              <div className="flex-1">
                <p className="font-bold text-slate-900">{b.hospitalName || 'Hospital'}</p>
                <p className="text-sm text-slate-500">Room: ₹{b.roomCharges} · Doctor: ₹{b.doctorFees} · Lab: ₹{b.labFees}</p>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <p className="text-lg font-black text-slate-900 flex items-center gap-0.5"><IndianRupee className="w-4 h-4" />{b.totalAmount}</p>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${b.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{b.status}</span>
                {b.status === 'PENDING' && (
                  <button
                    onClick={() => handlePayment(b.id)}
                    disabled={payingId === b.id}
                    className="mt-2 text-xs bg-rose-600 hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-1.5 px-3 rounded-lg shadow flex items-center gap-1.5 transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> {payingId === b.id ? 'Opening…' : 'Pay Now'}
                  </button>
                )}
                {b.status === 'PAID' && b.receiptUrl && (
                  <a href={b.receiptUrl} target="_blank" rel="noopener noreferrer" className="mt-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors">
                    <Download className="w-3.5 h-3.5" /> Receipt
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
