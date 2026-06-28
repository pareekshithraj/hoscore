import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../utils/apiConfig';

const bgImages = ['/login-bg.png', '/login-bg2.png', '/login-bg3.png'];
const slideContent = [
  {
    title: 'Capturing Moments, Creating Memories',
    desc: 'Take absolute control of your clinical charts, vaccination timelines, and doctor permissions.',
  },
  {
    title: 'Real-time Access Audits & Consent Controls',
    desc: 'Enforce strict consent controls and monitor physician access trails in real-time.',
  },
  {
    title: 'Lifetime Vaccine & Immunization Schedules',
    desc: 'Keep track of age-based clinical milestones with verification and self-reporting controls.',
  },
];

type Mode = 'login' | 'register' | 'forgot';
type LoginMethod = 'password' | 'otp';

// Server-driven OTP challenge. The backend generates and delivers the codes
// (email + phone via MSG91) and we verify each required channel separately.
interface ChallengeSummary {
  challengeId: string;
  purpose: 'register' | 'login' | 'reset_password';
  email: string;
  phone: string | null;
  requiredChannels: { email: boolean; phone: boolean };
  verifiedChannels: { email: boolean; phone: boolean };
  expiresAt: string;
  warnings: string[];
}

export const Login = () => {
  const { user, activeContext, login } = useAuth();
  const location = useLocation();
  const nextPath = typeof location.state?.next === 'string' && location.state.next.startsWith('/patient')
    ? location.state.next
    : null;

  const [mode, setMode] = useState<Mode>(location.state?.mode === 'register' ? 'register' : 'login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [challenge, setChallenge] = useState<ChallengeSummary | null>(null);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Phone is verified through the MSG91 widget (window.sendOtp / window.verifyOtp),
  // not the backend OTP. We track its verification locally and hold the session
  // returned by the widget endpoint until email is also verified.
  const [widgetPhone, setWidgetPhone] = useState('');
  const [emailVerifiedLocal, setEmailVerifiedLocal] = useState(false);
  const [phoneVerifiedLocal, setPhoneVerifiedLocal] = useState(false);
  const [pendingSession, setPendingSession] = useState<any>(null);
  const [widgetSent, setWidgetSent] = useState(false);

  const toIntlPhone = (raw: string) => {
    const digits = (raw || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 10) return `91${digits}`;
    return digits;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bgImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  if (user && activeContext) {
    if (activeContext.type === 'superadmin') return <Navigate to="/super-admin" replace />;
    if (activeContext.type === 'patient') return <Navigate to={nextPath || '/patient'} replace />;
    return <Navigate to="/dashboard" replace />;
  }

  const resetFlowState = (nextMode?: Mode) => {
    if (nextMode) setMode(nextMode);
    setChallenge(null);
    setResetToken('');
    setEmailOtp('');
    setPhoneOtp('');
    setResetPasswordValue('');
    setConfirmResetPassword('');
    setEmailVerifiedLocal(false);
    setPhoneVerifiedLocal(false);
    setPendingSession(null);
    setWidgetSent(false);
    setCountdown(0);
    setError('');
    setInfo('');
  };

  // Show the challenge card for a server-issued OTP challenge.
  const beginChallenge = (summary: ChallengeSummary, message?: string) => {
    setChallenge(summary);
    setEmailOtp('');
    setPhoneOtp('');
    setEmailVerifiedLocal(false);
    setPhoneVerifiedLocal(false);
    setPendingSession(null);
    setWidgetSent(false);
    setCountdown(60);
    setError('');
    setInfo(message || 'Enter the verification code(s) we sent you.');
    setIsLoading(false);
    // Auto-fire the MSG91 widget SMS when phone verification is required.
    // Retry up to 10 times with 500ms delay to handle widget script load race.
    if (summary.requiredChannels.phone) {
      const intl = toIntlPhone(widgetPhone || regPhone || identifier);
      if (intl) {
        let attempts = 0;
        const tryWidget = () => {
          const sendOtp = (window as any).sendOtp;
          if (typeof sendOtp === 'function') {
            sendOtp(intl, () => setWidgetSent(true), () => undefined);
          } else if (attempts < 10) {
            attempts++;
            setTimeout(tryWidget, 500);
          }
        };
        tryWidget();
      }
    }
  };

  const finishAuthResponse = (data: any) => {
    if (data?.token && data?.user && data?.contexts && data?.activeContext) {
      login(data.user, data.token, data.contexts, data.activeContext);
    }
  };

  const postJson = async (path: string, body: Record<string, unknown>) => {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  };

  // Apply an updated challenge summary returned after verifying a channel.
  // When the server finalizes (all required channels verified) it returns a
  // session, a reset token, or nothing further — handled by the callers.
  const applyChallengeResponse = (data: any): 'pending' | 'done' => {
    if (data?.token && data?.contexts && data?.activeContext) {
      finishAuthResponse(data);
      return 'done';
    }
    if (data?.resetToken) {
      setResetToken(data.resetToken);
      setChallenge(null);
      setInfo(data.message || 'Verification complete. Set your new password.');
      return 'done';
    }
    if (data?.challenge) {
      setChallenge(data.challenge);
      if (data.message) setInfo(data.message);
      return 'pending';
    }
    return 'pending';
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setInfo('');
    try {
      const data = await postJson('/auth/login', { identifier, password });
      if (data.requiresOtp && data.challenge) {
        beginChallenge(data.challenge, data.message);
        return;
      }
      finishAuthResponse(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpLoginStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setInfo('');
    try {
      const data = await postJson('/auth/start-otp-login', { identifier });
      if (data.challenge) beginChallenge(data.challenge, data.message);
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
    setInfo('');
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const data = await postJson('/auth/register', {
        name: fullName,
        email,
        password,
        phone: regPhone,
      });
      setIdentifier(email);
      setWidgetPhone(regPhone);
      if (data.challenge) beginChallenge(data.challenge, data.message);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleForgotPasswordStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setInfo('');
    try {
      const data = await postJson('/auth/forgot-password', { identifier });
      if (data.challenge) beginChallenge(data.challenge, data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Once both required channels are confirmed locally, complete the login using
  // the session the MSG91 widget endpoint returned.
  useEffect(() => {
    if (!pendingSession || !challenge) return;
    const needEmail = challenge.requiredChannels.email;
    const needPhone = challenge.requiredChannels.phone;
    if ((!needEmail || emailVerifiedLocal) && (!needPhone || phoneVerifiedLocal)) {
      finishAuthResponse(pendingSession);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSession, emailVerifiedLocal, phoneVerifiedLocal, challenge]);

  // Verify the EMAIL channel against the server challenge. Phone is handled by
  // the MSG91 widget separately (see verifyPhoneWidget).
  const verifyChannel = async (channel: 'email' | 'phone') => {
    if (!challenge) return;
    const code = channel === 'email' ? emailOtp : phoneOtp;
    if (code.length !== 6) {
      setError(`Enter the 6-digit ${channel} code.`);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const data = await postJson('/auth/verify-otp', {
        challengeId: challenge.challengeId,
        channel,
        otpCode: code,
      });
      if (channel === 'email') setEmailVerifiedLocal(true);
      const state = applyChallengeResponse(data);
      if (state === 'pending') {
        setInfo(data.message || `${channel === 'email' ? 'Email' : 'Phone'} verified.`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger the MSG91 widget to send an SMS OTP to the registered phone.
  const sendPhoneWidget = () => {
    const intl = toIntlPhone(widgetPhone || regPhone || identifier);
    if (!intl) {
      setError('Enter a valid phone number for SMS OTP.');
      return;
    }
    const sendOtp = (window as any).sendOtp;
    if (typeof sendOtp !== 'function') {
      setError('OTP service is still loading. Please try again in a moment.');
      return;
    }
    setError('');
    sendOtp(
      intl,
      () => { setWidgetSent(true); setInfo('SMS OTP sent to your phone.'); },
      (err: any) => setError(err?.message || 'Could not send SMS OTP.'),
    );
  };

  // Verify the SMS OTP via the widget, then exchange the access token for a
  // session at the backend.
  const verifyPhoneWidget = async () => {
    if (phoneOtp.length !== 6) {
      setError('Enter the 6-digit phone code.');
      return;
    }
    const verifyOtp = (window as any).verifyOtp;
    if (typeof verifyOtp !== 'function') {
      setError('OTP service is still loading. Please try again in a moment.');
      return;
    }
    setIsLoading(true);
    setError('');
    verifyOtp(
      phoneOtp,
      async (data: any) => {
        const accessToken = data?.message || data?.['access-token'] || data?.accessToken || data;
        try {
          const session = await postJson('/auth/verify-msg91-access-token', {
            accessToken,
            email: challenge?.email || email,
            identifier: toIntlPhone(widgetPhone || regPhone || identifier),
          });
          setPhoneVerifiedLocal(true);
          setPendingSession(session);
          setInfo('Phone verified.');
        } catch (err: any) {
          setError(err.message || 'Phone verification failed.');
        } finally {
          setIsLoading(false);
        }
      },
      (err: any) => {
        setError(err?.message || 'Invalid SMS OTP.');
        setIsLoading(false);
      },
    );
  };

  const handleResend = async () => {
    if (!challenge) return;
    setError('');
    try {
      const data = await postJson('/auth/resend-otp', { challengeId: challenge.challengeId });
      if (data.challenge) setChallenge(data.challenge);
      setEmailOtp('');
      setPhoneOtp('');
      setCountdown(60);
      setInfo(data.message || 'Verification codes resent.');
    } catch (err: any) {
      setError(err.message || 'Could not resend codes.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPasswordValue.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (resetPasswordValue !== confirmResetPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const data = await postJson('/auth/reset-password', {
        resetToken,
        password: resetPasswordValue,
      });
      setInfo(data.message || 'Password updated successfully.');
      setResetToken('');
      setMode('login');
      setLoginMethod('password');
      setPassword('');
      setResetPasswordValue('');
      setConfirmResetPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChannelInput = (
    channel: 'email' | 'phone',
    label: string,
    target: string | null,
    value: string,
    setValue: (v: string) => void,
    verified: boolean,
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 font-semibold">{label}{target ? ` · ${target}` : ''}</span>
        {verified && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
          </span>
        )}
      </div>
      {!verified && (
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
            placeholder="6-digit code"
            className="flex-1 px-4 py-3.5 bg-[#1B1824] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-center tracking-[0.25em] font-mono font-bold"
          />
          <button
            type="button"
            disabled={isLoading || value.length !== 6}
            onClick={() => (channel === 'phone' ? verifyPhoneWidget() : verifyChannel(channel))}
            className="px-4 py-3.5 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            Verify
          </button>
        </div>
      )}
      {channel === 'phone' && !verified && (
        <button
          type="button"
          onClick={sendPhoneWidget}
          className="text-[11px] font-bold text-red-500 hover:text-red-400 underline underline-offset-2"
        >
          {widgetSent ? '📱 Resend SMS code' : '📱 Send SMS code to your phone'}
        </button>
      )}
    </div>
  );

  const renderChallengeCard = () => {
    if (!challenge) return null;
    const { requiredChannels, verifiedChannels } = challenge;
    return (
      <div className="space-y-4">
        <div className="bg-[#23202E] border border-white/[0.05] rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold">Verification</p>
              <h3 className="text-lg font-bold text-white">
                {requiredChannels.email && requiredChannels.phone ? 'Verify email & phone' : 'Enter OTP'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => resetFlowState(mode === 'register' ? 'register' : 'login')}
              className="text-xs font-semibold text-slate-400 hover:text-white"
            >
              Start over
            </button>
          </div>

          {challenge.warnings?.map((w) => (
            <p key={w} className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">{w}</p>
          ))}

          {requiredChannels.email && renderChannelInput(
            'email', 'Email code', challenge.email, emailOtp, setEmailOtp, verifiedChannels.email || emailVerifiedLocal,
          )}
          {requiredChannels.phone && renderChannelInput(
            'phone', 'Phone code', challenge.phone, phoneOtp, setPhoneOtp, verifiedChannels.phone || phoneVerifiedLocal,
          )}
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium">Didn&apos;t receive a code?</span>
          {countdown > 0 ? (
            <span className="text-slate-500 font-semibold">Resend in {countdown}s</span>
          ) : (
            <button type="button" onClick={handleResend} className="text-red-500 hover:text-red-400 font-bold">
              Resend code
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderLoginForm = () => {
    if (resetToken) {
      return (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="relative">
            <input
              type={showResetPassword ? 'text' : 'password'}
              required
              placeholder="New password"
              value={resetPasswordValue}
              onChange={(e) => setResetPasswordValue(e.target.value)}
              className="w-full pl-4 pr-11 py-3.5 bg-[#23202E] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowResetPassword((prev) => !prev)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400"
            >
              {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <input
            type="password"
            required
            placeholder="Confirm new password"
            value={confirmResetPassword}
            onChange={(e) => setConfirmResetPassword(e.target.value)}
            className="w-full px-4 py-3.5 bg-[#23202E] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? 'Updating password...' : 'Set New Password'}
          </button>
        </form>
      );
    }

    if (challenge) {
      return renderChallengeCard();
    }

    if (mode === 'forgot') {
      return (
        <form onSubmit={handleForgotPasswordStart} className="space-y-4">
          <input
            type="text"
            required
            placeholder="Email or phone number"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-4 py-3.5 bg-[#23202E] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? 'Sending codes...' : 'Send Reset OTPs'}
          </button>
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => resetFlowState('login')}
              className="text-xs text-slate-400 hover:text-white font-semibold"
            >
              Back to login
            </button>
          </div>
        </form>
      );
    }

    if (loginMethod === 'otp') {
      return (
        <form onSubmit={handleOtpLoginStart} className="space-y-4">
          <input
            type="text"
            required
            placeholder="Email or phone number"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-4 py-3.5 bg-[#23202E] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? 'Sending codes...' : 'Send OTPs'}
          </button>
          <div className="text-center pt-2 border-t border-white/[0.04]">
            <button
              type="button"
              onClick={() => { setLoginMethod('password'); setError(''); setInfo(''); }}
              className="text-xs text-slate-400 hover:text-white font-semibold"
            >
              Login with password instead
            </button>
          </div>
        </form>
      );
    }

    return (
      <form onSubmit={handlePasswordLogin} className="space-y-4">
        <input
          type="text"
          required
          placeholder="Email or phone number"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="w-full px-4 py-3.5 bg-[#23202E] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
        />
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-4 pr-11 py-3.5 bg-[#23202E] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400"
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
          <button type="button" onClick={() => resetFlowState('forgot')} className="text-red-500 hover:text-red-400">
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.08]"></div>
          </div>
          <span className="relative px-3 bg-[#1C1924] text-xs text-slate-500 uppercase tracking-wider font-semibold">
            Or use
          </span>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => { setLoginMethod('otp'); setError(''); setInfo(''); }}
            className="text-xs text-slate-400 hover:text-white font-semibold"
          >
            Login with OTP instead
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-[#1C1924] flex flex-col md:flex-row w-full overflow-hidden text-white selection:bg-red-500/30 selection:text-red-200">
      <div className="md:w-[42%] lg:w-[36%] xl:w-[32%] relative p-10 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-2rem)] m-4 rounded-[32px] overflow-hidden border border-white/[0.03]">
        {bgImages.map((src, idx) => (
          <div
            key={src}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              currentSlide === idx ? 'opacity-100 z-0' : 'opacity-0 -z-10'
            }`}
            style={{ backgroundImage: `linear-gradient(to bottom, rgba(20, 18, 26, 0.35), rgba(20, 18, 26, 0.85)), url('${src}')` }}
          />
        ))}

        <div className="flex items-center gap-2.5 relative z-10">
          <img src="/hoscore-logo.png" alt="HOSCORE" className="h-14 w-auto object-contain rounded-xl" />
        </div>

        <Link
          to="/"
          className="absolute top-10 right-8 text-[11px] font-bold text-white/95 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1 z-10"
        >
          Back to website <ArrowRight className="w-3 h-3" />
        </Link>

        <div className="space-y-4 pr-4 relative z-10">
          {slideContent.map((slide, idx) => (
            <div
              key={slide.title}
              className={`transition-all duration-700 ease-in-out ${
                currentSlide === idx ? 'opacity-100 translate-y-0 relative' : 'opacity-0 translate-y-4 absolute pointer-events-none'
              }`}
            >
              <h3 className="text-2xl font-bold tracking-tight text-white leading-snug">{slide.title}</h3>
              <p className="text-xs text-white/70 leading-relaxed max-w-xs mt-2">{slide.desc}</p>
            </div>
          ))}

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

      <div className="flex-1 min-h-screen flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 bg-[#1C1924]">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              {mode === 'register'
                ? 'Create an account'
                : mode === 'forgot'
                  ? 'Reset your password'
                  : 'Sign in to HOSCORE'}
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              {mode === 'register' ? (
                <>
                  Already have an account?{' '}
                  <button onClick={() => resetFlowState('login')} className="text-red-500 hover:text-red-400 font-semibold transition-all hover:underline">
                    Log in
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{' '}
                  <button onClick={() => resetFlowState('register')} className="text-red-500 hover:text-red-400 font-semibold transition-all hover:underline">
                    Sign up
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

          {!error && info && (
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-2.5 text-xs text-blue-100 leading-normal font-semibold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-300" />
              <span>{info}</span>
            </div>
          )}

          {mode === 'register' && !challenge ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#23202E] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
                />
                <input
                  type="text"
                  required
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#23202E] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
                />
              </div>
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#23202E] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
              />
              <input
                type="tel"
                required
                placeholder="Phone number"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#23202E] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
              />
              <input
                type="password"
                required
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#23202E] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
              />
              <label className="flex items-center gap-2.5 cursor-pointer py-1 select-none">
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
              </label>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          ) : (
            renderLoginForm()
          )}
        </div>
      </div>
    </div>
  );
};
