import { useCallback, useEffect, useState } from 'react';
import {
  IndianRupee, Users, CreditCard, RefreshCw, Shield, CheckCircle2, AlertTriangle,
  Calendar, Zap, ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import { openRazorpayOrderCheckout } from '../utils/razorpayCheckout';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

type PlanKey = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

interface BillingSnapshot {
  activeUsers: number;
  seatsDue: number;
  additionalSeats: number;
  annualAmount: number;
  upgradeAmount: number;
  trialActive: boolean;
  paidActive: boolean;
  usable: boolean;
  needsPayment: boolean;
  autopayEnabled: boolean;
  razorpayKeyId: string;
  razorpayLive: boolean;
  planConfig: { name: string; pricePerUser: number; maxUsers: number; features: string[] };
  subscription: {
    plan: PlanKey;
    status: string;
    billedSeats: number;
    endDate: string;
    trialEndsAt: string | null;
    pricePerUser: number;
  };
  payments: Array<{
    id: string;
    amount: number;
    userCount: number;
    plan: string;
    status: string;
    paymentType: string;
    paidAt: string | null;
    createdAt: string;
  }>;
}

const PLANS: PlanKey[] = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'];

export const SubscriptionBilling = () => {
  const { activeContext, user } = useAuth();
  const [snapshot, setSnapshot] = useState<BillingSnapshot | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('STARTER');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [autopayLoading, setAutopayLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = activeContext?.role === 'ADMIN';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/payments/subscription');
      setSnapshot(data);
      setSelectedPlan(data.subscription?.plan || 'STARTER');
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePayNow = async () => {
    if (!snapshot) return;
    setPaying(true);
    setError('');
    setSuccess('');
    try {
      const orderRes = await api.post('/payments/order', { plan: selectedPlan });
      const { order, keyId, userCount, amountInr } = orderRes;

      if (order.id.startsWith('order_mock_')) {
        await api.post('/payments/verify', {
          orderId: order.id,
          paymentId: `pay_mock_${Date.now()}`,
          signature: 'mock',
        });
        setSuccess(`Payment complete — ${userCount} seats × ₹${amountInr} activated for 1 year.`);
        await load();
        return;
      }

      await openRazorpayOrderCheckout({
        keyId,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        name: 'HOSCORE',
        description: `${userCount} users × ₹${snapshot.planConfig.pricePerUser}/year`,
        prefill: { name: user?.name, email: user?.email },
        onSuccess: async (response) => {
          await api.post('/payments/verify', {
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          setSuccess(`Payment successful! ${userCount} user seats activated for 1 year.`);
          await load();
        },
      });
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const handleEnableAutopay = async () => {
    setAutopayLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/payments/autopay/start', { plan: selectedPlan });
      if (res.shortUrl) {
        window.location.href = res.shortUrl;
        return;
      }
      // Mock / test mode without hosted page
      await api.post('/payments/autopay/confirm', { subscriptionId: res.subscriptionId });
      setSuccess(`Autopay enabled for ${res.userCount} users (₹${res.amountInr}/year).`);
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to enable autopay');
    } finally {
      setAutopayLoading(false);
    }
  };

  const handleCancelAutopay = async () => {
    if (!confirm('Cancel automatic yearly renewal? Your current plan stays active until the end date.')) return;
    try {
      await api.post('/payments/autopay/cancel', {});
      setSuccess('Autopay cancelled.');
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
        <p className="text-slate-600">Only hospital admins can manage subscription and billing.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading subscription...</div>;
  }

  if (!snapshot) {
    return <div className="p-8 text-center text-red-500">{error || 'Subscription not found'}</div>;
  }

  const { subscription, activeUsers, annualAmount, trialActive, paidActive, needsPayment, autopayEnabled } = snapshot;
  const statusLabel = trialActive
    ? `Trial (${subscription.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : 'active'})`
    : paidActive
      ? `Active until ${new Date(subscription.endDate).toLocaleDateString()}`
      : needsPayment
        ? 'Payment required'
        : subscription.status;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900">Subscription & Billing</h1>
        <p className="text-slate-500 mt-1">Add your team first, then pay ₹{subscription.pricePerUser}/user/year. Enable autopay for hassle-free renewals.</p>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">{error}</div>}
      {success && <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{success}</div>}

      {needsPayment && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900">Trial ended — subscription payment required</p>
            <p className="text-sm text-amber-800 mt-1">Pay for your {activeUsers} team member{activeUsers !== 1 ? 's' : ''} to keep using HOSCORE.</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Users className="w-4 h-4" /> Team members</div>
          <p className="text-3xl font-black text-slate-900">{activeUsers}</p>
          {paidActive && <p className="text-xs text-slate-500 mt-1">{subscription.billedSeats} seats paid</p>}
          <Link to="/dashboard/staff" className="inline-flex items-center gap-1 text-sm text-rose-600 font-bold mt-3 hover:underline">
            Manage staff <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Calendar className="w-4 h-4" /> Status</div>
          <p className="text-lg font-bold text-slate-900">{statusLabel}</p>
          <p className="text-xs text-slate-500 mt-1 capitalize">{subscription.plan.toLowerCase()} plan</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><IndianRupee className="w-4 h-4" /> Amount due</div>
          <p className="text-3xl font-black text-slate-900 flex items-baseline gap-0.5"><IndianRupee className="w-6 h-6" />{annualAmount.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">per year ({activeUsers} × ₹{subscription.pricePerUser})</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Choose plan</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {PLANS.map((plan) => (
            <button
              key={plan}
              type="button"
              onClick={() => setSelectedPlan(plan)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${selectedPlan === plan ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <p className="font-black text-slate-900">{plan}</p>
              <p className="text-sm text-slate-500 mt-1">₹{plan === 'STARTER' ? 150 : plan === 'PROFESSIONAL' ? 300 : 500}/user/yr</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-rose-400" />
          <h2 className="text-lg font-bold">Pay for your team</h2>
        </div>
        <p className="text-slate-300 text-sm">
          You have <strong className="text-white">{activeUsers}</strong> active team member{activeUsers !== 1 ? 's' : ''}.
          {activeUsers < 1 ? ' Add staff in Portal Access Accounts before paying.' : ` Total: ₹${annualAmount}/year.`}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handlePayNow}
            disabled={paying || activeUsers < 1}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl font-bold flex items-center gap-2 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            {paying ? 'Processing...' : `Pay ₹${annualAmount} now`}
          </button>
          {!autopayEnabled ? (
            <button
              onClick={handleEnableAutopay}
              disabled={autopayLoading || activeUsers < 1}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-xl font-bold flex items-center gap-2 border border-white/20"
            >
              <RefreshCw className="w-4 h-4" />
              {autopayLoading ? 'Setting up...' : 'Enable autopay (yearly)'}
            </button>
          ) : (
            <button onClick={handleCancelAutopay} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold border border-white/20">
              Cancel autopay
            </button>
          )}
        </div>
        {autopayEnabled && (
          <p className="text-emerald-300 text-sm flex items-center gap-2"><Shield className="w-4 h-4" /> Autopay is active — your subscription renews automatically each year.</p>
        )}
        {!snapshot.razorpayLive && (
          <p className="text-amber-300 text-xs">Test mode: Razorpay mock checkout (add RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET for live test keys).</p>
        )}
      </div>

      {snapshot.payments.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Payment history</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Users</th>
                  <th className="pb-2 pr-4">Amount</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">{new Date(p.paidAt || p.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 pr-4 capitalize">{p.paymentType.toLowerCase().replace('_', ' ')}</td>
                    <td className="py-3 pr-4">{p.userCount}</td>
                    <td className="py-3 pr-4">₹{p.amount}</td>
                    <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : p.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
