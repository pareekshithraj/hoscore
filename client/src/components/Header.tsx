import { useState, useEffect, useRef } from 'react';
import { Bell, Menu, Search, User, ShieldCheck, Sun, Moon, Clock, X, Trash2, CheckCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DashboardSwitcher } from './DashboardSwitcher';

export const Header = ({ onOpenMenu }: { onOpenMenu?: () => void }) => {
  const { user, activeContext, theme, toggleTheme, notifications, markNotificationAsRead, clearNotifications } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formattedTime = time.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric"
  }) + " · " + time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="min-h-16 border-b border-slate-200/60 dark:border-white/[0.05] bg-white/80 dark:bg-[#0a0f1d]/80 backdrop-blur-xl flex items-center justify-between gap-3 px-3 sm:px-5 lg:px-8 flex-shrink-0 sticky top-0 z-40 transition-colors">
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            className="lg:hidden w-10 h-10 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-200 flex items-center justify-center active:scale-95 transition-all"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Hospital Branding on Left (Logo & Hospital Name) */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center shadow-inner">
            <img src="/hoscore-logo.png" alt="Logo" className="w-6 h-6 object-contain rounded-md" />
          </div>
          <span className="font-extrabold text-sm text-slate-800 dark:text-white tracking-tight truncate max-w-[140px] sm:max-w-[200px]">
            {activeContext?.hospitalName || 'Hoscore Platform'}
          </span>
        </div>
        
        <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-white/[0.08]" />

        {/* Live Date, Time, and Day Ticker */}
        <div className="hidden lg:flex items-center gap-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.03] px-3.5 py-2 rounded-xl border border-slate-200/60 dark:border-white/[0.04] shadow-inner font-mono">
          <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 animate-pulse" />
          <span>{formattedTime}</span>
        </div>

        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/10 rounded-lg">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">System Active</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Dashboard Switcher */}
        <DashboardSwitcher />

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-xl transition-all cursor-pointer relative"
          title="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
        </button>

        {/* Notifications Dropdown Wrapper */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setNotifOpen(!notifOpen)}
            className="flex p-2.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-xl relative transition-all cursor-pointer"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white dark:border-[#0a0f1d] animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notifOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#0b0f1a] rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/[0.06] overflow-hidden z-50 animate-scale-in">
              <div className="p-4 border-b border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Alert Center</p>
                </div>
                {notifications.length > 0 && (
                  <button 
                    onClick={clearNotifications}
                    className="text-[10px] font-extrabold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Clear All
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.04]">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => markNotificationAsRead(n.id)}
                    className={`p-3.5 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] flex gap-3 relative ${!n.isRead ? 'bg-blue-500/[0.02]' : ''}`}
                  >
                    {!n.isRead && (
                      <span className="absolute top-4 left-3 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    )}
                    <div className="flex-1 pl-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
                          {n.title}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                        {n.message}
                      </p>
                      <div className="mt-1 flex">
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide border ${
                          n.type === 'SUCCESS' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' :
                          n.type === 'WARNING' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' :
                          n.type === 'URGENT' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20' :
                          'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20'
                        }`}>
                          {n.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {notifications.length === 0 && (
                  <div className="p-8 text-center text-slate-400">
                    <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs font-semibold">No active notifications</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-white/[0.08] mx-1" />

        {/* Profile */}
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03] px-1 sm:px-3 py-1.5 rounded-xl transition-all group min-w-0">
          <div className="hidden md:block text-right min-w-0">
            <p className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-blue-500 dark:group-hover:text-sky-400 transition-colors leading-none truncate">{user?.name || 'User'}</p>
            <span className="text-[9px] text-[#0ea5e9] dark:text-[#0ea5e9] font-bold uppercase tracking-wider block mt-0.5">{activeContext?.role || 'Staff'}</span>
          </div>
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center border border-blue-400/20 shadow-md shadow-blue-500/10 group-hover:scale-105 transition-transform flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
};
