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

export const DashboardSwitcher = () => {
  const { contexts, activeContext, switchContext } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (contexts.length <= 1) return null;

  const handleSwitch = async (ctx: ContextItem) => {
    await switchContext(ctx);
    setOpen(false);
    navigate(getContextRoute(ctx));
  };

  const role = activeContext?.role || 'STAFF';
  const Icon = roleIcons[role] || User;
  const bgColor = roleColors[role] || 'bg-slate-500';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 transition-all group"
      >
        <div className={`w-6 h-6 ${bgColor} rounded-lg flex items-center justify-center`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-bold text-slate-800 leading-none">{activeContext ? getContextLabel(activeContext) : 'Select'}</p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden z-50 animate-scale-in">
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Switch Dashboard</p>
            </div>
          </div>
          <div className="p-2 max-h-64 overflow-y-auto">
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
                  onClick={() => !isActive && handleSwitch(ctx)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                    isActive ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 ${ctxBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <CtxIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>
                      {getContextLabel(ctx)}
                    </p>
                    {ctx.department && ctx.type === 'hospital' && (
                      <p className="text-[10px] text-slate-400 font-medium">{ctx.department}</p>
                    )}
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
