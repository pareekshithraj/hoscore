import { useState, useEffect } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

import { BASE_URL } from '../utils/apiConfig';

const bgImages = ['/login-bg.png', '/login-bg2.png', '/login-bg3.png'];
const slideContent = [
  { 
    title: "Capturing Moments, Creating Memories", 
    desc: "Take absolute control of your clinical charts, vaccination timelines, and doctor permissions." 
  },
  { 
    title: "Real-time Access Audits & Consent Controls", 
    desc: "Enforce strict consent controls and monitor physician access trails in real-time." 
  },
  { 
    title: "Lifetime Vaccine & Immunization Schedules", 
    desc: "Keep track of age-based clinical milestones with verification and self-reporting controls." 
  }
];

export const Login = () => {
  const { user, activeContext, login } = useAuth();
  const location = useLocation();
  const nextPath = typeof location.state?.next === 'string' && location.state.next.startsWith('/patient')
    ? location.state.next
    : null;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>(location.state?.mode === 'register' ? 'register' : 'login');
  
  // Registration specific states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // OTP Login States
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Background Slideshow State
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bgImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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
      const response = await fetch(`${BASE_URL}/auth/login`, {
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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
      setOtpSent(true);
      setCountdown(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Verification failed');
      login(data.user, data.token, data.contexts, data.activeContext);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError('Please agree to the Terms & Conditions');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName, email, password, phone: regPhone, registerAs: 'patient' }),
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

  return (
    <div className="min-h-screen bg-[#1C1924] flex flex-col md:flex-row w-full overflow-hidden text-white selection:bg-red-500/30 selection:text-red-200">
      
      {/* Left Side: Floating Rounded Editorial Slideshow Pane */}
      <div className="md:w-[42%] lg:w-[36%] xl:w-[32%] relative p-10 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-2rem)] m-4 rounded-[32px] overflow-hidden border border-white/[0.03]">
        
        {/* Background Images Overlay with smooth transitions */}
        {bgImages.map((src, idx) => (
          <div
            key={src}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              currentSlide === idx ? 'opacity-100 z-0' : 'opacity-0 -z-10'
            }`}
            style={{ backgroundImage: `linear-gradient(to bottom, rgba(20, 18, 26, 0.35), rgba(20, 18, 26, 0.85)), url('${src}')` }}
          />
        ))}

        {/* Logo Brand (Overlayed on top of background) */}
        <div className="flex items-center gap-2.5 relative z-10">
          <img src="/hoscore-logo.png" alt="HOSCORE" className="h-14 w-auto object-contain rounded-xl" />
        </div>

        {/* Top Right Quick Exit */}
        <Link 
          to="/" 
          className="absolute top-10 right-8 text-[11px] font-bold text-white/95 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1 z-10"
        >
          Back to website <ArrowRight className="w-3 h-3" />
        </Link>

        {/* Slogan Slideshow Content */}
        <div className="space-y-4 pr-4 relative z-10">
          {slideContent.map((slide, idx) => (
            <div 
              key={idx} 
              className={`transition-all duration-700 ease-in-out ${
                currentSlide === idx 
                  ? 'opacity-100 translate-y-0 relative' 
                  : 'opacity-0 translate-y-4 absolute pointer-events-none'
              }`}
            >
              <h3 className="text-2xl font-bold tracking-tight text-white leading-snug">
                {slide.title}
              </h3>
              <p className="text-xs text-white/70 leading-relaxed max-w-xs mt-2">
                {slide.desc}
              </p>
            </div>
          ))}
          
          {/* Split Slider Dot Indicators */}
          <div className="flex gap-1.5 pt-4">
            {bgImages.map((_, idx) => (
              <span 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? 'w-8 bg-white' : 'w-2 bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Full-Height Form Interaction Pane */}
      <div className="flex-1 min-h-screen flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 bg-[#1C1924]">
        <div className="max-w-md w-full mx-auto space-y-6">
          
          {/* Header Text & Toggle Switch */}
          <div className="space-y-1.5">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              {mode === 'login' ? 'Sign in to HOSCORE' : 'Create an account'}
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button 
                    onClick={() => { setMode('register'); setError(''); }} 
                    className="text-red-500 hover:text-red-400 font-semibold transition-all hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button 
                    onClick={() => { setMode('login'); setOtpSent(false); setError(''); }} 
                    className="text-red-500 hover:text-red-400 font-semibold transition-all hover:underline"
                  >
                    Log in
                  </button>
                </>
              )}
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-xs text-red-200 leading-normal font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            loginMethod === 'password' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <input 
                    type="email" 
                    required 
                    placeholder="Email" 
                    className="w-full px-4 py-3.5 bg-[#23202E] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                  />
                </div>
                
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    placeholder="Enter your password" 
                    className="w-full pl-4 pr-11 py-3.5 bg-[#23202E] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold py-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-white/10 bg-[#23202E] text-red-650 focus:ring-red-600 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-slate-400 font-medium">Remember me</span>
                  </label>
                  <a href="#" className="text-red-500 hover:text-red-400">Forgot password?</a>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>

                {/* Or Register with Divider */}
                <div className="relative flex items-center justify-center my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.08]"></div>
                  </div>
                  <span className="relative px-3 bg-[#1C1924] text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Or register with
                  </span>
                </div>

                {/* Social Auth Buttons */}
                <div>
                  <button 
                    type="button"
                    onClick={() => alert("Google login is disabled for this environment.")}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#1C1924] border border-white/[0.08] hover:bg-white/[0.02] rounded-xl text-sm text-white font-semibold transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    Google
                  </button>
                </div>

                <div className="text-center pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setLoginMethod('otp'); setError(''); }} 
                    className="text-xs text-slate-450 hover:text-white font-semibold transition-all hover:underline"
                  >
                    Login with OTP instead
                  </button>
                </div>
              </form>
            ) : (
              /* OTP Login Step Flow */
              <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
                {!otpSent ? (
                  <>
                    <div className="relative">
                      <input 
                        type="email" 
                        required 
                        placeholder="Email" 
                        className="w-full px-4 py-3.5 bg-[#23202E] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isLoading} 
                      className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                    >
                      {isLoading ? 'Requesting OTP...' : 'Send Verification Code'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="bg-[#23202E] border border-white/[0.03] p-3.5 rounded-xl flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sending OTP to</span>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-200">{email}</span>
                        <button 
                          type="button" 
                          onClick={() => setOtpSent(false)} 
                          className="text-[10px] text-red-500 hover:text-red-400 font-bold"
                        >
                          Change
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <input 
                        type="text" 
                        required 
                        maxLength={6} 
                        placeholder="Enter 6-digit OTP" 
                        className="w-full px-4 py-3.5 bg-[#23202E] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-center tracking-[0.3em] font-mono font-bold transition-all" 
                        value={otpCode} 
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} 
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isLoading || otpCode.length !== 6} 
                      className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                    >
                      {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                    </button>

                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-slate-400 font-medium">Didn't receive code?</span>
                      {countdown > 0 ? (
                        <span className="text-slate-500 font-semibold">Resend in {countdown}s</span>
                      ) : (
                        <button 
                          type="button" 
                          onClick={handleSendOtp} 
                          className="text-red-500 hover:text-red-400 font-bold transition-all"
                        >
                          Resend code
                        </button>
                      )}
                    </div>
                  </>
                )}

                <div className="text-center pt-2 border-t border-white/[0.04]">
                  <button 
                    type="button" 
                    onClick={() => { setLoginMethod('password'); setError(''); }} 
                    className="text-xs text-slate-450 hover:text-white font-semibold transition-all hover:underline"
                  >
                    Login with password instead
                  </button>
                </div>
              </form>
            )
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  required 
                  placeholder="First name" 
                  className="w-full px-4 py-3.5 bg-[#23202E] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                />
                <input 
                  type="text" 
                  required 
                  placeholder="Last name" 
                  className="w-full px-4 py-3.5 bg-[#23202E] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                />
              </div>
              <div className="relative">
                <input 
                  type="email" 
                  required 
                  placeholder="Email" 
                  className="w-full px-4 py-3.5 bg-[#23202E] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
              <div className="relative">
                <input 
                  type="tel" 
                  placeholder="Phone number" 
                  className="w-full px-4 py-3.5 bg-[#23202E] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all" 
                  value={regPhone} 
                  onChange={(e) => setRegPhone(e.target.value)} 
                />
              </div>
              <div className="relative">
                <input 
                  type="password" 
                  required 
                  placeholder="Create password" 
                  className="w-full px-4 py-3.5 bg-[#23202E] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
              
              <div className="flex items-center gap-2.5 cursor-pointer py-1 select-none">
                <input 
                  type="checkbox" 
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-[#23202E] text-red-600 focus:ring-red-600 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-slate-400 font-medium">
                  I agree to the <a href="#" className="text-red-500 hover:underline">Terms & Conditions</a>
                </span>
              </div>

              <button 
                type="submit" 
                disabled={isLoading || !agreeTerms} 
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>

              {/* Or Register with Divider */}
              <div className="relative flex items-center justify-center my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.08]"></div>
                </div>
                <span className="relative px-3 bg-[#1C1924] text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Or register with
                </span>
              </div>

              {/* Social Auth Buttons */}
              <div>
                <button 
                  type="button"
                  onClick={() => alert("Google signup is disabled for this environment.")}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#1C1924] border border-white/[0.08] hover:bg-white/[0.02] rounded-xl text-sm text-white font-semibold transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  Google
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

    </div>
  );
};
