import { Bell, Menu, Search, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DashboardSwitcher } from './DashboardSwitcher';

export const Header = ({ onOpenMenu }: { onOpenMenu?: () => void }) => {
  const { user, activeContext } = useAuth();
  
  return (
    <header className="min-h-16 border-b border-white/[0.05] bg-[#0a0f1d]/80 backdrop-blur-xl flex items-center justify-between gap-3 px-3 sm:px-5 lg:px-8 flex-shrink-0 sticky top-0 z-40">
      <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            className="lg:hidden w-10 h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-200 flex items-center justify-center active:scale-95 transition-all"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="relative hidden sm:block w-full max-w-xs lg:max-w-sm xl:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search patients, doctors, or reports..."
            className="w-full pl-11 pr-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/50 transition-all"
          />
        </div>
        
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">System Encrypted & Active</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Dashboard Switcher */}
        <DashboardSwitcher />

        {/* Notifications */}
        <button className="hidden min-[420px]:flex p-2.5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] rounded-xl relative transition-all">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#0a0f1d] animate-pulse"></span>
        </button>
        
        <div className="hidden md:block w-px h-8 bg-white/[0.08] mx-1" />

        {/* Profile */}
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-white/[0.03] px-1 sm:px-3 py-1.5 rounded-xl transition-all group min-w-0">
          <div className="hidden md:block text-right min-w-0">
            <p className="text-sm font-bold text-slate-100 group-hover:text-sky-400 transition-colors">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{activeContext?.role || 'Staff'}</p>
          </div>
          <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center border border-sky-400/20 shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
};
