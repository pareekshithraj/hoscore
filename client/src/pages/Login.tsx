import { useState } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, AlertCircle, UserPlus } from 'lucide-react';

export const Login = () => {
  const { user, activeContext, login } = useAuth();
  const location = useLocation();
  const nextPath = typeof location.state?.next === 'string' && location.state.next.startsWith('/patient')
    ? location.state.next
    : null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');

  if (user && activeContext) {
    if (activeContext.type === 'superadmin') return <Navigate to="/super-admin" replace />;
    if (activeContext.type === 'patient') return <Navigate to={nextPath || '/patient'} replace />;
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');
      login(data.user, data.token, data.contexts, data.activeContext);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email, password, phone: regPhone, registerAs: 'patient' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');
      login(data.user, data.token, data.contexts, data.activeContext);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('admin123');
    setMode('login');
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 relative overflow-hidden selection:bg-rose-500/20 selection:text-rose-300">
      {/* Animated ambient background mesh */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-rose-500/[0.04] blur-[140px] rounded-full animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-20%] right-[-20%] w-[65%] h-[65%] bg-blue-500/[0.03] blur-[150px] rounded-full animate-pulse pointer-events-none" style={{ animationDuration: '12s' }} />
      <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-rose-600/[0.02] blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-rose-600 to-red-600 rounded-2xl flex items-center justify-center shadow-xl shadow-rose-500/20 mb-4 border border-rose-400/20 hover:scale-105 transition-transform duration-300">
            <span className="text-white font-black text-2xl tracking-tighter">H</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">HOSCORE</h2>
          <p className="text-slate-500 mt-1.5 text-center text-xs font-semibold uppercase tracking-wider">Global Sovereign Health Registry</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl shadow-2xl shadow-black/40">
          {/* Tab Toggle */}
          <div className="flex mb-6 bg-slate-950/60 rounded-2xl p-1 border border-slate-800/40">
            <button onClick={() => setMode('login')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${mode === 'login' ? 'bg-slate-800 text-white border border-slate-700/50 shadow-lg' : 'text-slate-500 hover:text-slate-400'}`}>Sign In</button>
            <button onClick={() => setMode('register')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${mode === 'register' ? 'bg-slate-800 text-white border border-slate-700/50 shadow-lg' : 'text-slate-500 hover:text-slate-400'}`}>Sign Up</button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-950/30 border border-red-900/50 rounded-xl flex items-start gap-3 text-xs text-red-400 leading-normal">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                  <input type="email" required placeholder="you@email.com" className="w-full pl-11 pr-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/30 focus:bg-slate-950/60 transition-all border-slate-800" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-rose-500 transition-colors" />
                  <input type="password" required placeholder="••••••••" className="w-full pl-11 pr-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/30 focus:bg-slate-950/60 transition-all border-slate-800" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-rose-500/10 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {isLoading ? 'Signing in...' : <><LogIn className="w-4 h-4" /> Sign In</>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                <input type="text" required placeholder="Your full name" className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/30 focus:bg-slate-950/60 transition-all border-slate-800" value={regName} onChange={(e) => setRegName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Email</label>
                <input type="email" required placeholder="you@email.com" className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/30 focus:bg-slate-950/60 transition-all border-slate-800" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Phone</label>
                <input type="tel" placeholder="+91 98765 43210" className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/30 focus:bg-slate-950/60 transition-all border-slate-800" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
                <input type="password" required placeholder="Create a password" className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/30 focus:bg-slate-950/60 transition-all border-slate-800" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-rose-500/10 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {isLoading ? 'Creating account...' : <><UserPlus className="w-4 h-4" /> Create Patient Account</>}
              </button>
            </form>
          )}

          {/* Demo Logins */}
          <div className="mt-6 pt-6 border-t border-slate-800/85">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3.5 text-center">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Super Admin', email: 'admin@hoscore.com' },
                { label: 'Hospital Admin', email: 'sarah@hoscore.com' },
                { label: 'Multi-Role', email: 'mark@hoscore.com' },
                { label: 'Patient', email: 'patient@hoscore.com' },
              ].map((d) => (
                <button key={d.email} onClick={() => demoLogin(d.email)} className="py-2.5 px-3 bg-slate-950/40 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800/80 hover:text-white hover:border-slate-700/50 transition-all duration-200 active:scale-95 truncate">
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Link to="/" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-rose-500 transition-colors">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};
