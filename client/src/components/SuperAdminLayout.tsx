import React, { useCallback, useEffect, useState } from 'react';
import { Header } from './Header';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Building2, Users, Receipt, LogOut, ChevronLeft, ChevronRight, HardDrive, ShieldCheck, X, Search } from 'lucide-react';
import clsx from 'clsx';

const adminMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/super-admin' },
  { icon: Building2, label: 'Hospitals', path: '/super-admin/hospitals' },
  { icon: Users, label: 'Users', path: '/super-admin/users' },
  { icon: Receipt, label: 'Subscriptions', path: '/super-admin/subscriptions' },
  { icon: HardDrive, label: 'Usage & Costs', path: '/super-admin/usage' },
  { icon: ShieldCheck, label: 'Staff Presets', path: '/super-admin/staff-types' },
];

export const SuperAdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => setIsMobileNavOpen(false), []);

  const isActive = (path: string) => {
    if (path === '/super-admin') return location.pathname === '/super-admin';
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    closeMobileNav();
  }, [location.pathname, closeMobileNav]);

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden dashboard-theme">
      {/* Mobile Drawer Overlay */}
      <div
        onClick={closeMobileNav}
        className={clsx(
          "fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity lg:hidden",
          isMobileNavOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />
      
      {/* Super Admin Collapsible Sidebar (Vercel pure black styling) */}
      <div
        className={clsx(
          "flex flex-col h-dvh bg-white dark:bg-[#000000] border-r border-slate-200/80 dark:border-zinc-800/80 text-slate-800 dark:text-zinc-100 flex-shrink-0 z-50 transition-all duration-300 ease-in-out shadow-sm",
          "fixed inset-y-0 left-0 lg:relative lg:translate-x-0",
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-[78px]" : "w-[82vw] max-w-[300px] lg:w-[260px]"
        )}
      >
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/50 relative">
          <Link to="/super-admin" className="flex items-center gap-2.5 overflow-hidden group">
            <div className="h-9 w-9 min-w-[36px] rounded-xl bg-gradient-to-br from-rose-600 to-red-800 flex items-center justify-center border border-rose-500/20 shadow-sm transition-all duration-300 group-hover:scale-105">
              <img src="/icon.png" alt="HOSCORE" className="h-6.5 w-6.5 object-contain filter invert dark:invert-0" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-xs tracking-tight text-slate-900 dark:text-zinc-100 truncate group-hover:text-rose-500 dark:group-hover:text-rose-455 transition-colors">
                  Super Admin
                </span>
                <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block leading-none mt-0.5 font-mono">
                  Platform Core
                </span>
              </div>
            )}
          </Link>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 rounded-full p-1.5 border border-slate-200 dark:border-zinc-800 shadow-md transition-all active:scale-95 cursor-pointer z-50"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
          
          <button
            onClick={closeMobileNav}
            className="lg:hidden w-8 h-8 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 flex items-center justify-center"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Navigation Search Shortcut Bar */}
        {!isCollapsed && (
          <div className="px-4 pt-4 pb-1">
            <div className="relative flex items-center justify-between px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40 text-slate-400 dark:text-zinc-500 text-xs">
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder="Find page..."
                  className="bg-transparent border-0 outline-none text-xs w-full text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-600 font-semibold"
                />
              </span>
              <kbd className="text-[10px] font-mono border border-slate-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-950 px-1 rounded shadow-sm text-slate-400 dark:text-zinc-500">F</kbd>
            </div>
          </div>
        )}

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5 scrollbar-thin">
          <div>
            {!isCollapsed ? (
              <p className="px-3 mb-2 text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Platform</p>
            ) : (
              <div className="h-px bg-slate-200 dark:bg-zinc-800/60 my-2 mx-1" />
            )}
            <div className="space-y-0.5">
              {adminMenuItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={clsx(
                      "group flex items-center rounded-lg transition-all duration-200 text-xs relative",
                      isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                      active
                        ? "bg-slate-100 dark:bg-zinc-900 text-slate-900 dark:text-white font-extrabold border border-slate-200/50 dark:border-zinc-800/60"
                        : "hover:bg-slate-50 dark:hover:bg-zinc-900/30 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 border border-transparent",
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-rose-500 dark:bg-white rounded-r-full" />
                    )}
                    <item.icon className={clsx(
                      "w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200",
                      active ? "text-rose-600 dark:text-white" : "group-hover:scale-105 text-slate-400 dark:text-zinc-500 group-hover:text-slate-700 dark:group-hover:text-zinc-200"
                    )} />
                    {!isCollapsed && <span className="font-semibold">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-zinc-800/50 space-y-1 bg-slate-50/50 dark:bg-zinc-950/20">
          {!isCollapsed ? (
            <div className="mt-2 p-2.5 rounded-xl border border-slate-200/50 dark:border-zinc-800/80 bg-white dark:bg-[#000000] flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-red-650 flex items-center justify-center border border-rose-400/20 shadow-inner flex-shrink-0">
                  <span className="text-white text-xs font-black uppercase font-mono">{user?.name ? user.name[0] : 'S'}</span>
                </div>
                <div className="text-left min-w-0 leading-none">
                  <p className="text-xs font-black text-slate-800 dark:text-zinc-200 truncate leading-none">{user?.name || 'Super Admin'}</p>
                  <span className="text-[9px] text-rose-605 dark:text-rose-400 font-bold uppercase tracking-wider block mt-1">SUPER ADMIN</span>
                </div>
              </div>
              <button 
                onClick={() => { logout(); window.location.href = '/'; }}
                className="p-1 hover:bg-rose-500/10 text-rose-500 dark:text-rose-450 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => { logout(); window.location.href = '/'; }} 
              className="flex items-center justify-center p-2.5 text-rose-500 hover:bg-rose-500/[0.08] rounded-lg transition-all text-xs border border-transparent w-full cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header onOpenMenu={() => setIsMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 animate-fade-in-up relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
};
