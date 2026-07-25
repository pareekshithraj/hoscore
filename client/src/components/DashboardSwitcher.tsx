import { useState, useRef, useEffect } from 'react';
import { useAuth, type ContextItem } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Building2, User, ShieldCheck, Stethoscope, Syringe, FlaskConical, Receipt, Sparkles } from 'lucide-react';

const roleIcons: Record<string, any> = {
  ADMIN: Building2, DOCTOR: Stethoscope, NURSE: Syringe, RECEPTIONIST: Receipt,
  PHARMACIST: FlaskConical, LAB_TECH: FlaskConical, STAFF: User, CLEANER: User,
  PATIENT: User, SUPER_ADMIN: ShieldCheck,
};

const roleColors: Record<string, string> = {
  ADMIN: 'bg-blue-500', DOCTOR: 'bg-emerald-500', NURSE: 'bg-rose-500',
  RECEPTIONIST: 'bg-amber-500', PHARMACIST: 'bg-purple-500', LAB_TECH: 'bg-indigo-500',
  STAFF: 'bg-slate-500', CLEANER: 'bg-teal-500', PATIENT: 'bg-cyan-500', SUPER_ADMIN: 'bg-red-600',
};

function getContextLabel(ctx: ContextItem): string {
  if (ctx.type === 'superadmin') return 'Super Admin';
  if (ctx.type === 'patient') return 'Patient Dashboard';
  return `${ctx.role} @ ${ctx.hospitalName || 'Hospital'}`;
}

function getContextRoute(ctx: ContextItem): string {
  if (ctx.type === 'superadmin') return '/super-admin';
  if (ctx.type === 'patient') return '/patient';
  return '/dashboard';
}

import { PasswordConfirmModal } from './PasswordConfirmModal';

export const DashboardSwitcher = () => {
  const { contexts, activeContext, switchContext } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pendingCtx, setPendingCtx] = useState<ContextItem | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (contexts.length <= 1) return null;

  const handleSelectContext = (ctx: ContextItem) => {
    setPendingCtx(ctx);
    setOpen(false);
  };

  const handleConfirmSwitch = async (password: string) => {
    if (!pendingCtx) return;
    const target = pendingCtx;
    await switchContext(target, password);
    setPendingCtx(null);
    navigate(getContextRoute(target));
  };


  const role = activeContext?.role || 'STAFF';
  const Icon = roleIcons[role] || User;
  const bgColor = roleColors[role] || 'bg-slate-500';


  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-all group cursor-pointer text-slate-800 dark:text-zinc-200 active:scale-95"
      >
        <div className={`w-5 h-5 ${bgColor} rounded-md flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-3 h-3 text-white" />
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-bold leading-none">{activeContext ? getContextLabel(activeContext) : 'Select'}</p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-550 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-zinc-950 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden z-50 animate-scale-in">
          <div className="p-3 border-b border-slate-100 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 dark:text-sky-400" />
              <p className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Switch Environment</p>
            </div>
          </div>
          <div className="p-2 max-h-64 overflow-y-auto space-y-1">
            {contexts.map((ctx, i) => {
              const isActive =
                ctx.type === activeContext?.type &&
                ctx.hospitalId === activeContext?.hospitalId &&
                ctx.role === activeContext?.role;
              const CtxIcon = roleIcons[ctx.role || 'STAFF'] || User;
              const ctxBg = roleColors[ctx.role || 'STAFF'] || 'bg-slate-500';

              return (
                <button
                  key={i}
                  onClick={() => !isActive && handleSelectContext(ctx)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left cursor-pointer border ${
                    isActive 
                      ? 'bg-blue-50/40 dark:bg-zinc-900 border-blue-200 dark:border-zinc-800 text-blue-700 dark:text-white font-bold' 
                      : 'hover:bg-slate-50 dark:hover:bg-zinc-900/50 border-transparent text-slate-700 dark:text-zinc-350 hover:text-slate-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <div className={`w-7 h-7 ${ctxBg} rounded-md flex items-center justify-center flex-shrink-0`}>
                    <CtxIcon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">
                      {getContextLabel(ctx)}
                    </p>
                    {ctx.department && ctx.type === 'hospital' && (
                      <p className="text-[9px] text-slate-400 dark:text-zinc-550 font-semibold">{ctx.department}</p>
                    )}
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 bg-blue-500 dark:bg-sky-400 rounded-full flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <PasswordConfirmModal
        isOpen={Boolean(pendingCtx)}
        onClose={() => setPendingCtx(null)}
        onConfirm={handleConfirmSwitch}
        targetRoleLabel={pendingCtx ? getContextLabel(pendingCtx) : ''}
      />
    </div>
  );
};

