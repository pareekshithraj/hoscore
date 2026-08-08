import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, ArrowRight, IndianRupee, Sparkles } from 'lucide-react';
import { COUNTRIES, citiesForRegion, statesForCountry } from '../utils/locations';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../utils/apiConfig';
import { fetchJson } from '../utils/fetchJson';

interface RegisterHospitalForm {
  hospitalName: string;
  address: string;
  country: string;
  city: string;
  state: string;
  contact: string;
  description: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  adminPhone: string;
}

interface ChallengeSummary {
  challengeId: string;
  email: string;
  phone: string | null;
  requiredChannels: { email: boolean; phone: boolean };
  verifiedChannels: { email: boolean; phone: boolean };
  warnings: string[];
}

const toIntlPhone = (raw: string) => {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

export const RegisterHospital = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [challenge, setChallenge] = useState<ChallengeSummary | null>(null);
  const [challengeId, setChallengeId] = useState('');
  const [pendingHospitalToken, setPendingHospitalToken] = useState('');
  const [widgetSent, setWidgetSent] = useState(false);

  const [form, setForm] = useState<RegisterHospitalForm>(() => {
    try {
      const saved = sessionStorage.getItem('hoscore_hospital_register_draft');
      if (saved) return JSON.parse(saved);
    } catch (_err) {
      // Storage unavailable
    }
    return {
      hospitalName: '', address: '', country: 'India', city: '', state: '', contact: '', description: '',
      adminName: '', adminEmail: '', adminPassword: '', adminPhone: '',
    };
  });

  const update = (key: keyof RegisterHospitalForm, value: string) => setForm((prev: RegisterHospitalForm) => {
    const updated = { ...prev, [key]: value };
    try {
      sessionStorage.setItem('hoscore_hospital_register_draft', JSON.stringify(updated));
    } catch (_err) {
      // Storage unavailable
    }
    return updated;
  });

  const startCooldown = () => {
    setOtpCooldown(30);
    const timer = setInterval(() => {
      setOtpCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const validateStep2 = () => {
    if (!form.adminName || !form.adminEmail || !form.adminPassword) {
      setError('All admin fields are required.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail)) {
      setError('Enter a valid admin email address.');
      return false;
    }
    if (form.adminPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (form.adminPhone && !/^\d{10,15}$/.test(form.adminPhone.replace(/\D/g, ''))) {
      setError('Enter a valid phone number.');
      return false;
    }
    return true;
  };

  const handleStartOtpStep = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data, response } = await fetchJson<{
        message?: string;
        error?: string;
        challenge?: ChallengeSummary;
        pendingHospitalToken?: string;
      }>(`${BASE_URL}/hospitals/register/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error(data.error || 'Failed to initiate hospital registration');
      if (!data.challenge?.challengeId || !data.pendingHospitalToken) {
        throw new Error('Registration session could not be started. Please try again.');
      }

      setChallenge(data.challenge);
      setChallengeId(data.challenge.challengeId);
      setPendingHospitalToken(data.pendingHospitalToken);
      setEmailOtp('');
      setPhoneOtp('');
      setStep(4);
      startCooldown();
    } catch (err: any) {
      setError(err.message || 'Error initiating registration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!challengeId) return;
    setIsLoading(true);
    setError('');
    try {
      const { data, response } = await fetchJson<{ error?: string; challenge?: ChallengeSummary }>(
        `${BASE_URL}/auth/resend-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challengeId }),
        },
      );
      if (!response.ok) throw new Error(data.error || 'Failed to resend OTP');
      if (data.challenge) setChallenge(data.challenge);
      setEmailOtp('');
      setPhoneOtp('');
      startCooldown();
    } catch (err: any) {
      setError(err.message || 'Error resending OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async () => {
    if (emailOtp.length !== 6) {
      setError('Enter the 6-digit email code.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const { data, response } = await fetchJson<{ error?: string; challenge?: ChallengeSummary }>(
        `${BASE_URL}/auth/verify-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challengeId, channel: 'email', otpCode: emailOtp }),
        },
      );
      if (!response.ok) throw new Error(data.error || 'Invalid email OTP');
      if (data.challenge) setChallenge(data.challenge);
    } catch (err: any) {
      setError(err.message || 'Email verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const sendPhoneWidget = () => {
    const intl = toIntlPhone(form.adminPhone);
    if (!intl) {
      setError('Enter a valid phone number.');
      return;
    }
    const sendOtp = (window as any).sendOtp;
    if (typeof sendOtp === 'function') {
      sendOtp(intl, () => setWidgetSent(true), () => setError('Could not send SMS OTP.'));
      return;
    }
    setWidgetSent(true);
  };

  const verifyPhone = async () => {
    if (phoneOtp.length !== 6) {
      setError('Enter the 6-digit phone code.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const verifyOtpFn = (window as any).verifyOtp;
      if (typeof verifyOtpFn === 'function') {
        await new Promise<void>((resolve, reject) => {
          verifyOtpFn(
            phoneOtp,
            async (widgetData: { accessToken?: string; message?: string }) => {
              try {
                const accessToken = widgetData?.accessToken || widgetData?.message;
                if (!accessToken) throw new Error('Phone verification failed.');
                const { data, response } = await fetchJson<{ error?: string; challenge?: ChallengeSummary }>(
                  `${BASE_URL}/auth/verify-msg91-access-token`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      challengeId,
                      accessToken,
                      identifier: form.adminEmail || form.adminPhone,
                    }),
                  },
                );
                if (!response.ok) throw new Error(data.error || 'Phone verification failed');
                if (data.challenge) setChallenge(data.challenge);
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            (err: unknown) => reject(new Error((err as { message?: string })?.message || 'Phone verification failed')),
          );
        });
        return;
      }

      const { data, response } = await fetchJson<{ error?: string; challenge?: ChallengeSummary }>(
        `${BASE_URL}/auth/verify-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challengeId, channel: 'phone', otpCode: phoneOtp }),
        },
      );
      if (!response.ok) throw new Error(data.error || 'Invalid phone OTP');
      if (data.challenge) setChallenge(data.challenge);
    } catch (err: any) {
      setError(err.message || 'Phone verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const allChannelsVerified = challenge
    ? (!challenge.requiredChannels.email || challenge.verifiedChannels.email)
      && (!challenge.requiredChannels.phone || challenge.verifiedChannels.phone)
    : false;

  const handleComplete = async () => {
    if (!allChannelsVerified) {
      setError('Please verify all required channels before completing registration.');
      return;
    }
    if (!challengeId || !pendingHospitalToken) {
      setError('Registration session expired. Please go back and try again.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const { data, response } = await fetchJson<{
        error?: string;
        token?: string;
        user?: { id: string; name: string; email: string; isSuperAdmin?: boolean };
        contexts?: any[];
        activeContext?: any;
      }>(`${BASE_URL}/hospitals/register/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, pendingHospitalToken }),
      });

      if (!response.ok) throw new Error(data.error || 'Failed to complete registration');
      if (data.token && data.user && data.contexts && data.activeContext) {
        login(data.user, data.token, data.contexts, data.activeContext);
      }
      try {
        sessionStorage.removeItem('hoscore_hospital_register_draft');
      } catch (_err) {
        // Storage unavailable
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900">Hospital Registered!</h1>
          <p className="text-slate-500">Your 30-day trial has started. Add your team under Staff, then go to <strong>Subscription & Billing</strong> to pay ₹150/user/year.</p>
          <button onClick={() => navigate('/dashboard')} className="px-8 py-4 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-2xl hover:from-rose-700 hover:to-red-700 transition-all shadow-xl">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <img src="/hoscore-logo.png" alt="HOSCORE" className="h-18 object-contain mb-3 rounded-xl" />
          <h1 className="text-2xl font-black text-slate-900">List Your Hospital</h1>
          <p className="text-slate-500 text-sm mt-1">Join the HOSCORE network — ₹150/user/year</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{s}</div>
              {s < 4 && <div className={`w-8 h-0.5 ${step > s ? 'bg-rose-600' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Hospital Details</h2>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Hospital Name *</label>
                <input type="text" required placeholder="City General Hospital" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white" value={form.hospitalName} onChange={(e) => update('hospitalName', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                <input type="text" placeholder="123 Medical Street" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white" value={form.address} onChange={(e) => update('address', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Country</label>
                <input list="register-country-options" type="text" placeholder="India" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white" value={form.country} onChange={(e) => setForm((prev: RegisterHospitalForm) => ({ ...prev, country: e.target.value, state: '', city: '' }))} />
                <datalist id="register-country-options">
                  {COUNTRIES.map((country) => <option key={country} value={country} />)}
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">City</label>
                  <input list="register-city-options" type="text" placeholder="Mumbai" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white" value={form.city} onChange={(e) => update('city', e.target.value)} />
                  <datalist id="register-city-options">
                    {citiesForRegion(form.country, form.state).map((city) => <option key={city} value={city} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">State</label>
                  <input list="register-state-options" type="text" placeholder="Maharashtra" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white" value={form.state} onChange={(e) => setForm((prev: RegisterHospitalForm) => ({ ...prev, state: e.target.value, city: '' }))} />
                  <datalist id="register-state-options">
                    {statesForCountry(form.country).map((state) => <option key={state} value={state} />)}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Number</label>
                <input type="tel" placeholder="+91 22 1234 5678" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white" value={form.contact} onChange={(e) => update('contact', e.target.value)} />
              </div>
              <button onClick={() => (form.hospitalName ? setStep(2) : setError('Hospital name is required'))} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Admin Account</h2>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Admin Name *</label>
                <input type="text" required placeholder="Dr. John Smith" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white" value={form.adminName} onChange={(e) => update('adminName', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Admin Email *</label>
                <input type="email" required placeholder="admin@hospital.com" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white" value={form.adminEmail} onChange={(e) => update('adminEmail', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                <input type="tel" placeholder="+91 98765 43210" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white" value={form.adminPhone} onChange={(e) => update('adminPhone', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password *</label>
                <input type="password" required placeholder="Create a secure password" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white" value={form.adminPassword} onChange={(e) => update('adminPassword', e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => (validateStep2() ? setStep(3) : undefined)} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-800 mb-2">Start Your Free Trial</h2>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-800">
                <p className="font-bold mb-1">How billing works</p>
                <ol className="list-decimal list-inside space-y-1 text-emerald-700">
                  <li>Register your hospital (30-day free trial)</li>
                  <li>Add your team members under Staff</li>
                  <li>Pay ₹150 × number of users per year</li>
                  <li>Optionally enable autopay for yearly renewal</li>
                </ol>
              </div>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-300">Starter Plan</span>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <IndianRupee className="w-6 h-6" /><span className="text-4xl font-black">150</span>
                  <span className="text-slate-400 text-sm">/user/year</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
                <p><strong>Hospital:</strong> {form.hospitalName}</p>
                <p><strong>Admin:</strong> {form.adminName} ({form.adminEmail})</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleStartOtpStep} disabled={isLoading} className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-xl hover:from-rose-700 hover:to-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isLoading ? 'Sending OTP...' : 'Proceed to OTP Verification'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && challenge && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-1">Verify OTP</h2>
                <p className="text-xs text-slate-500">Verify each required channel to complete registration.</p>
              </div>

              {challenge.warnings?.map((w) => (
                <p key={w} className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">{w}</p>
              ))}

              {challenge.requiredChannels.email && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Email code · {challenge.email}</label>
                  {!challenge.verifiedChannels.email ? (
                    <div className="flex gap-2">
                      <input type="text" maxLength={6} value={emailOtp} onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))} placeholder="123456" className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-rose-500" />
                      <button type="button" onClick={verifyEmail} disabled={isLoading || emailOtp.length !== 6} className="px-4 py-3 bg-rose-600 text-white font-bold rounded-xl disabled:opacity-50">Verify</button>
                    </div>
                  ) : (
                    <p className="text-sm text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Email verified</p>
                  )}
                </div>
              )}

              {challenge.requiredChannels.phone && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Phone code · {challenge.phone || form.adminPhone}</label>
                  {!challenge.verifiedChannels.phone ? (
                    <>
                      <div className="flex gap-2">
                        <input type="text" maxLength={6} value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))} placeholder="123456" className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-rose-500" />
                        <button type="button" onClick={verifyPhone} disabled={isLoading || phoneOtp.length !== 6} className="px-4 py-3 bg-rose-600 text-white font-bold rounded-xl disabled:opacity-50">Verify</button>
                      </div>
                      <button type="button" onClick={sendPhoneWidget} className="text-xs text-rose-600 font-bold hover:underline">
                        {widgetSent ? 'Resend SMS code' : 'Send SMS code to your phone'}
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Phone verified</p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Didn&apos;t receive a code?</span>
                <button type="button" onClick={handleResendOtp} disabled={otpCooldown > 0 || isLoading} className="text-rose-600 hover:underline font-bold disabled:opacity-50">
                  {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend OTP'}
                </button>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleComplete} disabled={isLoading || !allChannelsVerified} className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-xl hover:from-rose-700 hover:to-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isLoading ? 'Completing...' : 'Verify & Start Trial'}
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-slate-500 hover:text-rose-600 font-medium">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};
