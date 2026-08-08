import { useState, useEffect, useRef } from 'react';
import { Bell, Menu, Search, User, ShieldCheck, Sun, Moon, Clock, X, Trash2, Sparkles } from 'lucide-react';
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
    weekday: "short",
    month: "short",
    day: "numeric",
  }) + " · " + time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="min-h-14 border-b border-slate-200/60 dark:border-zinc-800/80 bg-white/70 dark:bg-[#000000]/70 backdrop-blur-md flex items-center justify-between gap-3 px-4 sm:px-6 flex-shrink-0 sticky top-0 z-40 transition-all duration-300">
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            className="lg:hidden w-8 h-8 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            aria-label="Open navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Brand name/Hospital Network context indicator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-extrabold text-xs text-slate-800 dark:text-zinc-200 tracking-tight truncate max-w-[150px] sm:max-w-[200px]">
            {activeContext?.hospitalName || 'Hoscore Platform'}
          </span>
          <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[8px] bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 font-extrabold uppercase tracking-widest border border-slate-200/50 dark:border-zinc-800/60">
            {activeContext?.type === 'superadmin' ? 'SYSTEM' : 'PROD'}
          </span>
        </div>
        
        <div className="hidden md:block w-px h-4 bg-slate-200 dark:bg-zinc-800" />

        {/* Global Live Ticker */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-zinc-400 bg-slate-50/50 dark:bg-zinc-900/30 px-3 py-1 rounded-lg border border-slate-200/50 dark:border-zinc-800/40 shadow-inner font-mono">
          <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-zinc-400 animate-pulse" />
          <span>{formattedTime}</span>
        </div>

        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Online</span>
        </div>
      </div>

      {/* Right controls aligned with layout switcher */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
        {/* Dashboard Switcher */}
        <DashboardSwitcher />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-all cursor-pointer relative border border-transparent hover:border-slate-200/50 dark:hover:border-zinc-800/80 active:scale-95"
          title="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setNotifOpen(!notifOpen)}
            className="flex p-2 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg relative transition-all cursor-pointer border border-transparent hover:border-slate-200/50 dark:hover:border-zinc-800/80 active:scale-95"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white dark:border-black">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel (Vercel dark themed) */}
          {notifOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-950 rounded-xl shadow-2xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden z-50 animate-scale-in">
              <div className="p-3 border-b border-slate-100 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-900/20 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 dark:text-sky-400" />
                  <p className="text-[10px] font-black text-slate-800 dark:text-zinc-300 uppercase tracking-wider">Alert Center</p>
                </div>
                {notifications.length > 0 && (
                  <button 
                    onClick={clearNotifications}
                    className="text-[9px] font-black text-rose-500 hover:text-rose-600 dark:hover:text-rose-455 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Clear All
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/60 scrollbar-thin">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => markNotificationAsRead(n.id)}
                    className={`p-3 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900/20 flex gap-2 relative ${!n.isRead ? 'bg-blue-500/[0.01] dark:bg-sky-500/[0.02]' : ''}`}
                  >
                    {!n.isRead && (
                      <span className="absolute top-4 left-2.5 w-1.5 h-1.5 bg-blue-500 dark:bg-sky-400 rounded-full" />
                    )}
                    <div className="flex-1 pl-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                          {n.title}
                        </span>
                        <span className="text-[8px] text-slate-400 dark:text-zinc-500 font-bold font-mono">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold leading-normal">
                        {n.message}
                      </p>
                      <div className="mt-1 flex">
                        <span className={`text-[7px] font-black uppercase px-1 py-0.5 rounded tracking-wide border ${
                          n.type === 'SUCCESS' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' :
                          n.type === 'WARNING' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' :
                          n.type === 'URGENT' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20' :
                          'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
                        }`}>
                          {n.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {notifications.length === 0 && (
                  <div className="p-8 text-center text-slate-400 dark:text-zinc-500">
                    <Bell className="w-7 h-7 text-slate-200 dark:text-zinc-800 mx-auto mb-2" />
                    <p className="text-xs font-bold">No active alerts</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="hidden md:block w-px h-6 bg-slate-250 dark:bg-zinc-800 mx-1" />

        {/* Profile Avatar Glow Badge */}
        <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900/35 px-2 py-1 rounded-lg transition-all group border border-transparent hover:border-slate-200/50 dark:hover:border-zinc-850">
          <div className="hidden md:block text-right">
            <p className="text-xs font-black text-slate-800 dark:text-zinc-250 group-hover:text-blue-500 dark:group-hover:text-sky-400 transition-colors leading-none truncate max-w-[100px]">{user?.name || 'User'}</p>
            <span className="text-[8px] text-[#0ea5e9] dark:text-[#0ea5e9] font-black uppercase tracking-wider block mt-0.5 leading-none">{activeContext?.role || 'Staff'}</span>
          </div>
          <div className="w-7.5 h-7.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center border border-blue-400/20 shadow-md shadow-blue-500/10 group-hover:scale-105 transition-transform flex-shrink-0">
            <span className="text-white text-[11px] font-black uppercase font-mono">{user?.name ? user.name[0] : 'U'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
