import { useState } from "react";
import {
  LayoutDashboard, Bed, Users, Stethoscope, ClipboardList, Package, Receipt,
  Settings, LogOut, BarChart2, UserCircle, Calendar, Megaphone, CalendarOff,
  UsersRound, Activity, ChevronLeft, ChevronRight, ShieldCheck,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../context/AuthContext";
import { hasFeature } from "../utils/features";

type Role = "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "STAFF" | "PHARMACIST" | "LAB_TECH";

const mainMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", feature: "dashboard" },
  { icon: Activity, label: "Simulator", path: "/dashboard/simulator", feature: "simulator" },
  { icon: Users, label: "OPD Queue", path: "/dashboard/queue", feature: "queue" },
  { icon: ClipboardList, label: "Prescriptions", path: "/dashboard/prescriptions", feature: "prescriptions" },
  { icon: Bed, label: "Rooms & Beds", path: "/dashboard/rooms", feature: "rooms" },
  { icon: Users, label: "Patients", path: "/dashboard/patients", feature: "patients" },
  { icon: ClipboardList, label: "Admissions", path: "/dashboard/admissions", feature: "admissions" },
  { icon: ClipboardList, label: "Discharges", path: "/dashboard/discharges", feature: "discharges" },
  { icon: ClipboardList, label: "Vitals", path: "/dashboard/vitals", feature: "vitals" },
  { icon: ClipboardList, label: "Lab Orders", path: "/dashboard/labs", feature: "labs" },
  { icon: Stethoscope, label: "Doctors", path: "/dashboard/doctors", feature: "doctors" },
  { icon: UserCircle, label: "Staff", path: "/dashboard/staff", feature: "staff" },
  { icon: ShieldCheck, label: "Staff Types", path: "/dashboard/staff-types", feature: "staff_types" },
  { icon: Calendar, label: "Shift Roster", path: "/dashboard/shifts", feature: "shifts" },
  { icon: Package, label: "Inventory", path: "/dashboard/inventory", feature: "inventory" },
  { icon: Receipt, label: "Billing", path: "/dashboard/billing", feature: "billing" },
  { icon: Receipt, label: "Claims", path: "/dashboard/claims", feature: "claims" },
  { icon: Receipt, label: "Expenses", path: "/dashboard/expenses", feature: "expenses" },
  { icon: BarChart2, label: "Analytics", path: "/dashboard/analytics", feature: "analytics" },
];

const managementMenuItems = [
  { icon: Calendar, label: "Calendar", path: "/dashboard/calendar", feature: "calendar" },
  { icon: Megaphone, label: "Notice Board", path: "/dashboard/notices", feature: "notices" },
  { icon: CalendarOff, label: "Leave Requests", path: "/dashboard/leaves", feature: "leaves" },
  { icon: UsersRound, label: "Groups", path: "/dashboard/groups", feature: "groups" },
  { icon: Megaphone, label: "Feedback", path: "/dashboard/feedback", feature: "feedback" },
  { icon: Settings, label: "Audit Logs", path: "/dashboard/audit-logs", feature: "audit_logs" },
];

export const Sidebar = () => {
  const location = useLocation();
  const { activeContext, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const userRole = (activeContext?.role || "STAFF") as Role;

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const filteredMain = mainMenuItems.filter((i) => hasFeature(activeContext?.permissions, i.feature, userRole));
  const filteredManagement = managementMenuItems.filter((i) => hasFeature(activeContext?.permissions, i.feature, userRole));

  return (
    <div 
      className={clsx(
        "flex flex-col h-screen bg-[#070b16] border-r border-white/[0.04] text-slate-100 flex-shrink-0 relative z-50 transition-all duration-300 ease-in-out shadow-2xl",
        isCollapsed ? "w-[78px]" : "w-[260px]"
      )}
    >
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/[0.04] relative">
        <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <img src="/hoscore-logo.png" alt="HOSCORE" className="h-10 w-10 min-w-[40px] rounded-xl object-contain" />
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-extrabold text-sm tracking-tight text-white">HOSCORE</span>
              <span className="text-[9px] text-[#0ea5e9] font-bold uppercase tracking-wider truncate">
                {activeContext?.hospitalName || 'Hospital Network'}
              </span>
            </div>
          )}
        </Link>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 bg-[#0ea5e9] hover:bg-sky-400 text-white rounded-full p-1 border-2 border-[#070b16] shadow-lg transition-transform active:scale-95 cursor-pointer z-50"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6 scrollbar-thin">
        <div>
          {!isCollapsed ? (
            <p className="px-3 mb-2.5 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Operations</p>
          ) : (
            <div className="h-px bg-white/[0.04] my-3 mx-1" />
          )}
          <div className="space-y-1">
            {filteredMain.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "group flex items-center rounded-xl transition-all duration-200 text-xs relative",
                  isCollapsed ? "justify-center p-2.5" : "gap-3.5 px-3 py-3",
                  isActive(item.path)
                    ? "bg-gradient-to-r from-sky-500/15 to-blue-500/5 text-sky-400 font-bold border border-sky-500/20"
                    : "hover:bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-transparent",
                )}
                title={isCollapsed ? item.label : undefined}
              >
                {isActive(item.path) && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#0ea5e9] rounded-r-full shadow-[0_0_10px_rgba(14,165,233,0.8)]" />
                )}
                <item.icon className={clsx(
                  "w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200", 
                  isActive(item.path) ? "text-[#0ea5e9]" : "group-hover:scale-110 text-slate-400 group-hover:text-slate-200"
                )} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
        </div>

        <div>
          {!isCollapsed ? (
            <p className="px-3 mb-2.5 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Management</p>
          ) : (
            <div className="h-px bg-white/[0.04] my-3 mx-1" />
          )}
          <div className="space-y-1">
            {filteredManagement.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "group flex items-center rounded-xl transition-all duration-200 text-xs relative",
                  isCollapsed ? "justify-center p-2.5" : "gap-3.5 px-3 py-3",
                  isActive(item.path)
                    ? "bg-gradient-to-r from-sky-500/15 to-blue-500/5 text-sky-400 font-bold border border-sky-500/20"
                    : "hover:bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-transparent",
                )}
                title={isCollapsed ? item.label : undefined}
              >
                {isActive(item.path) && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#0ea5e9] rounded-r-full shadow-[0_0_10px_rgba(14,165,233,0.8)]" />
                )}
                <item.icon className={clsx(
                  "w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200", 
                  isActive(item.path) ? "text-[#0ea5e9]" : "group-hover:scale-110 text-slate-400 group-hover:text-slate-200"
                )} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-white/[0.04] space-y-1">
        {hasFeature(activeContext?.permissions, "settings", userRole) && (
          <Link 
            to="/dashboard/settings" 
            className={clsx(
              "flex items-center text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] rounded-xl transition-all text-xs border border-transparent",
              isCollapsed ? "justify-center p-2.5" : "gap-3.5 px-3 py-3"
            )}
            title={isCollapsed ? "Settings" : undefined}
          >
            <Settings className="w-[18px] h-[18px]" />
            {!isCollapsed && <span>Settings</span>}
          </Link>
        )}
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
  );
};
