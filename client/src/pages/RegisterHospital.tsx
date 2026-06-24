import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, User, Mail, Lock, Phone, MapPin, CheckCircle2, ArrowLeft, ArrowRight, IndianRupee, Sparkles } from 'lucide-react';
import { COUNTRIES, citiesForRegion, statesForCountry } from '../utils/locations';

const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

export const RegisterHospital = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    hospitalName: '', address: '', country: 'India', city: '', state: '', contact: '', description: '',
    adminName: '', adminEmail: '', adminPassword: '', adminPhone: '',
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/hospitals/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
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
          <p className="text-slate-500">Your hospital has been added to the HOSCORE network. Log in with your admin credentials to access your dashboard.</p>
          <button onClick={() => navigate('/login')} className="px-8 py-4 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-2xl hover:from-rose-700 hover:to-red-700 transition-all shadow-xl">
            Go to Login
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

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{s}</div>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-rose-600' : 'bg-slate-200'}`} />}
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
                <input type="text" required placeholder="City General Hospital" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white" value={form.hospitalName} onChange={e => update('hospitalName', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                <input type="text" placeholder="123 Medical Street" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white" value={form.address} onChange={e => update('address', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Country</label>
                <input list="register-country-options" type="text" placeholder="India" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white" value={form.country} onChange={e => setForm(prev => ({ ...prev, country: e.target.value, state: '', city: '' }))} />
                <datalist id="register-country-options">
                  {COUNTRIES.map(country => <option key={country} value={country} />)}
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">City</label>
                  <input list="register-city-options" type="text" placeholder="Mumbai" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white" value={form.city} onChange={e => update('city', e.target.value)} />
                  <datalist id="register-city-options">
                    {citiesForRegion(form.country, form.state).map(city => <option key={city} value={city} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">State</label>
                  <input list="register-state-options" type="text" placeholder="Maharashtra" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white" value={form.state} onChange={e => setForm(prev => ({ ...prev, state: e.target.value, city: '' }))} />
                  <datalist id="register-state-options">
                    {statesForCountry(form.country).map(state => <option key={state} value={state} />)}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Number</label>
                <input type="tel" placeholder="+91 22 1234 5678" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white" value={form.contact} onChange={e => update('contact', e.target.value)} />
              </div>
              <button onClick={() => form.hospitalName ? setStep(2) : setError('Hospital name is required')} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Admin Account</h2>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Admin Name *</label>
                <input type="text" required placeholder="Dr. John Smith" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white" value={form.adminName} onChange={e => update('adminName', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Admin Email *</label>
                <input type="email" required placeholder="admin@hospital.com" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white" value={form.adminEmail} onChange={e => update('adminEmail', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                <input type="tel" placeholder="+91 98765 43210" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white" value={form.adminPhone} onChange={e => update('adminPhone', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password *</label>
                <input type="password" required placeholder="Create a secure password" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white" value={form.adminPassword} onChange={e => update('adminPassword', e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => (form.adminName && form.adminEmail && form.adminPassword) ? setStep(3) : setError('All admin fields are required')} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-800 mb-2">Confirm Subscription</h2>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-300">Starter Plan</span>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <IndianRupee className="w-6 h-6" /><span className="text-4xl font-black">150</span>
                  <span className="text-slate-400 text-sm">/user/year</span>
                </div>
                <div className="space-y-2 text-sm text-slate-300">
                  <p>• Up to 50 users</p>
                  <p>• All hospital modules</p>
                  <p>• Patient portal access</p>
                  <p>• Analytics & reports</p>
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
                <button onClick={handleSubmit} disabled={isLoading} className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-xl hover:from-rose-700 hover:to-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isLoading ? 'Registering...' : 'Complete Registration'}
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
