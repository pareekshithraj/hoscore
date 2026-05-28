import React, { useState } from 'react';
import { Header } from './Header';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Calendar, FileText, Activity, Receipt, Search, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const patientMenuItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/patient' },
  { icon: Calendar, label: 'My Appointments', path: '/patient/appointments' },
  { icon: FileText, label: 'Prescriptions', path: '/patient/prescriptions' },
  { icon: Activity, label: 'Medical Records', path: '/patient/records' },
  { icon: Receipt, label: 'My Bills', path: '/patient/bills' },
  { icon: Search, label: 'Find Hospitals', path: '/patient/find' },
];

export const PatientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path: string) => {
    if (path === '/patient') return location.pathname === '/patient';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-[#060913] text-[#f8fafc] overflow-hidden dashboard-theme">
      {/* Patient Collapsible Sidebar */}
      <div
        className={clsx(
          "flex flex-col h-screen bg-[#070b16] border-r border-white/[0.04] text-slate-100 flex-shrink-0 relative z-50 transition-all duration-300 ease-in-out shadow-2xl",
          isCollapsed ? "w-[78px]" : "w-[260px]"
        )}
      >
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/[0.04] relative">
          <Link to="/patient" className="flex items-center gap-3 overflow-hidden">
            <img src="/hoscore-logo.png" alt="HOSCORE" className="h-10 w-10 min-w-[40px] rounded-xl object-contain" />
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-sm tracking-tight text-white">HOSCORE</span>
                <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider truncate">
                  Patient Portal
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3.5 top-1/2 -translate-y-1/2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-full p-1 border-2 border-[#070b16] shadow-lg transition-transform active:scale-95 cursor-pointer z-50"
          >
            {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6 scrollbar-thin">
          <div>
            {!isCollapsed ? (
              <p className="px-3 mb-2.5 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">My Health</p>
            ) : (
              <div className="h-px bg-white/[0.04] my-3 mx-1" />
            )}
            <div className="space-y-1">
              {patientMenuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    "group flex items-center rounded-xl transition-all duration-200 text-xs relative",
                    isCollapsed ? "justify-center p-2.5" : "gap-3.5 px-3 py-3",
                    isActive(item.path)
                      ? "bg-gradient-to-r from-cyan-500/15 to-blue-500/5 text-cyan-400 font-bold border border-cyan-500/20"
                      : "hover:bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-transparent",
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  {isActive(item.path) && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cyan-500 rounded-r-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                  )}
                  <item.icon className={clsx(
                    "w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200",
                    isActive(item.path) ? "text-cyan-400" : "group-hover:scale-110 text-slate-400 group-hover:text-slate-200"
                  )} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/[0.04]">
          <button
            onClick={() => { logout(); window.location.href = '/'; }}
            className={clsx(
              "flex items-center text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/[0.05] rounded-xl transition-all text-xs border border-transparent w-full",
              isCollapsed ? "justify-center p-2.5" : "gap-3.5 px-3 py-3"
            )}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="w-[18px] h-[18px]" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 animate-fade-in-up relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
};
