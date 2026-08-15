import { useEffect, useState } from "react";
import {
  LayoutDashboard, Bed, Users, Stethoscope, Package, Receipt,
  Settings, LogOut, BarChart2, UserCircle, Calendar, Megaphone, CalendarOff,
  UsersRound, ChevronLeft, ChevronRight, ShieldCheck, X, CreditCard, Search, Map as MapIcon,
  Pill, HeartPulse, FlaskConical, ClipboardPlus, FileOutput, CalendarClock, Wallet, BadgeDollarSign, ScrollText
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../context/AuthContext";
import { hasFeature } from "../utils/features";

type Role = "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "STAFF" | "PHARMACIST" | "LAB_TECH";

type MenuItem = {
  icon: any;
  label: string;
  path: string;
  feature: string;
  adminOnly?: boolean;
  hideFor?: Role[];
  group: "clinical" | "census" | "admin" | "management";
};

const allMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", feature: "dashboard", group: "clinical" },
  { icon: Users, label: "OPD Queue", path: "/dashboard/queue", feature: "queue", group: "clinical" },
  { icon: Pill, label: "Prescriptions", path: "/dashboard/prescriptions", feature: "prescriptions", group: "clinical" },
  { icon: HeartPulse, label: "Vitals", path: "/dashboard/vitals", feature: "vitals", group: "clinical" },
  { icon: FlaskConical, label: "Lab Orders", path: "/dashboard/labs", feature: "labs", group: "clinical" },
  { icon: UserCircle, label: "Patients", path: "/dashboard/patients", feature: "patients", group: "clinical" },
  { icon: ClipboardPlus, label: "Admissions", path: "/dashboard/admissions", feature: "admissions", group: "census" },
  { icon: FileOutput, label: "Discharges", path: "/dashboard/discharges", feature: "discharges", group: "census" },
  { icon: Bed, label: "Rooms & Beds", path: "/dashboard/rooms", feature: "rooms", group: "census" },
  { icon: MapIcon, label: "Map Builder", path: "/dashboard/map", feature: "map", group: "census" },
  { icon: Stethoscope, label: "Doctors", path: "/dashboard/doctors", feature: "doctors", group: "admin", hideFor: ["DOCTOR"] },
  { icon: UsersRound, label: "Staff", path: "/dashboard/staff", feature: "staff", group: "admin" },
  { icon: ShieldCheck, label: "Staff Privileges", path: "/dashboard/staff-types", feature: "staff_types", group: "admin" },
  { icon: CalendarClock, label: "Shift Roster", path: "/dashboard/shifts", feature: "shifts", group: "admin" },
  { icon: Package, label: "Inventory", path: "/dashboard/inventory", feature: "inventory", group: "admin" },
  { icon: Receipt, label: "Billing", path: "/dashboard/billing", feature: "billing", group: "admin" },
  { icon: BadgeDollarSign, label: "Claims", path: "/dashboard/claims", feature: "claims", group: "admin" },
  { icon: Wallet, label: "Expenses", path: "/dashboard/expenses", feature: "expenses", group: "admin" },
  { icon: BarChart2, label: "Analytics", path: "/dashboard/analytics", feature: "analytics", group: "admin" },
  { icon: CreditCard, label: "Subscription", path: "/dashboard/subscription", feature: "settings", group: "management", adminOnly: true },
  { icon: Calendar, label: "Calendar", path: "/dashboard/calendar", feature: "calendar", group: "management" },
  { icon: Megaphone, label: "Notice Board", path: "/dashboard/notices", feature: "notices", group: "management" },
  { icon: CalendarOff, label: "Leave Requests", path: "/dashboard/leaves", feature: "leaves", group: "management" },
  { icon: UsersRound, label: "Groups", path: "/dashboard/groups", feature: "groups", group: "management", hideFor: ["DOCTOR"] },
  { icon: ScrollText, label: "Feedback", path: "/dashboard/feedback", feature: "feedback", group: "management" },
  { icon: Settings, label: "Audit Logs", path: "/dashboard/audit-logs", feature: "audit_logs", group: "management" },
];

export const Sidebar = ({ isMobileOpen = false, onCloseMobile }: { isMobileOpen?: boolean; onCloseMobile?: () => void }) => {
  const location = useLocation();
  const { activeContext, user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [navQuery, setNavQuery] = useState("");

  const userRole = (activeContext?.role || "STAFF") as Role;

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const visibleItems = allMenuItems.filter((i) => {
    if (i.adminOnly && userRole !== "ADMIN") return false;
    if (i.hideFor?.includes(userRole)) return false;
    if (!hasFeature(activeContext?.permissions, i.feature, userRole)) return false;
    if (navQuery.trim() && !i.label.toLowerCase().includes(navQuery.trim().toLowerCase())) return false;
    return true;
  });

  const groups: { id: MenuItem["group"]; label: string }[] = [
    { id: "clinical", label: "Clinical" },
    { id: "census", label: "Census" },
    { id: "admin", label: "Admin" },
    { id: "management", label: "Management" },
  ];

  useEffect(() => {
    onCloseMobile?.();
  }, [location.pathname, onCloseMobile]);

  // Focus search input on shortcut key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" && (e.ctrlKey || e.metaKey || e.target === document.body)) {
        e.preventDefault();
        document.getElementById("sidebar-search")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <div
        onClick={onCloseMobile}
        className={clsx(
          "fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity lg:hidden",
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />
      
      {/* Sidebar main container (Vercel Pure Black styling) */}
      <div
        className={clsx(
          "flex flex-col h-dvh bg-white dark:bg-[#000000] border-r border-slate-200/80 dark:border-zinc-800/80 text-slate-800 dark:text-zinc-100 flex-shrink-0 z-50 transition-all duration-300 ease-in-out shadow-sm",
          "fixed inset-y-0 left-0 lg:relative lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-[78px]" : "w-[82vw] max-w-[300px] lg:w-[260px]"
        )}
      >
        {/* Brand Header & Profile Switcher Box */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/50 relative">
          <Link to="/dashboard" className="flex items-center gap-2.5 overflow-hidden group">
            <div className="h-9 w-9 min-w-[36px] rounded-xl bg-gradient-to-br from-slate-900 to-black dark:from-zinc-800 dark:to-zinc-950 flex items-center justify-center border border-slate-200 dark:border-zinc-700/50 shadow-sm transition-all duration-300 group-hover:scale-105">
              <img src="/icon.png" alt="HOSCORE" className="h-6.5 w-6.5 object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-xs tracking-tight text-slate-900 dark:text-zinc-100 truncate group-hover:text-blue-500 dark:group-hover:text-sky-400 transition-colors">
                  {activeContext?.hospitalName || 'HOSCORE NETWORK'}
                </span>
                <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block leading-none mt-0.5">
                  Hospital Ops
                </span>
              </div>
            )}
          </Link>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-400 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 rounded-full p-1.5 border border-slate-200 dark:border-zinc-800 shadow-md transition-all active:scale-95 cursor-pointer z-50"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
          
          <button
            onClick={onCloseMobile}
            className="lg:hidden w-9 h-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 flex items-center justify-center"
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
                  id="sidebar-search"
                  type="text"
                  value={navQuery}
                  onChange={(e) => setNavQuery(e.target.value)}
                  placeholder="Find page..."
                  className="bg-transparent border-0 outline-none text-xs w-full text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-600 font-semibold"
                />
              </span>
              <kbd className="text-[10px] font-mono border border-slate-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-950 px-1 rounded shadow-sm text-slate-400 dark:text-zinc-500">F</kbd>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5 scrollbar-thin">
          {groups.map((group) => {
            const items = visibleItems.filter((i) => i.group === group.id);
            if (!items.length) return null;
            return (
              <div key={group.id}>
                {!isCollapsed ? (
                  <p className="px-3 mb-2 text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{group.label}</p>
                ) : (
                  <div className="h-px bg-slate-200 dark:bg-zinc-800/60 my-2 mx-1" />
                )}
                <div className="space-y-0.5">
                  {items.map((item) => {
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
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-blue-600 dark:bg-white rounded-r-full" />
                        )}
                        <item.icon className={clsx(
                          "w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200",
                          active ? "text-blue-600 dark:text-white" : "group-hover:scale-105 text-slate-400 dark:text-zinc-500 group-hover:text-slate-700 dark:group-hover:text-zinc-200"
                        )} />
                        {!isCollapsed && <span className="font-semibold">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer Section (Vercel Avatar + settings menu) */}
        <div className="p-3 border-t border-slate-100 dark:border-zinc-800/50 space-y-1 bg-slate-50/50 dark:bg-zinc-950/20">
          {hasFeature(activeContext?.permissions, "settings", userRole) && (
            <Link 
              to="/dashboard/settings" 
              className={clsx(
                "flex items-center rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-100/50 dark:hover:bg-zinc-900/50 transition-all text-xs border border-transparent",
                isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
              )}
              title={isCollapsed ? "Settings" : undefined}
            >
              <Settings className="w-[18px] h-[18px]" />
              {!isCollapsed && <span className="font-semibold">Settings</span>}
            </Link>
          )}

          {/* Vercel Avatar Block */}
          {!isCollapsed ? (
            <div className="mt-2 p-2.5 rounded-xl border border-slate-200/50 dark:border-zinc-800/80 bg-white dark:bg-[#000000] flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border border-blue-400/20 shadow-inner flex-shrink-0">
                  <span className="text-white text-xs font-black uppercase font-mono">{user?.name ? user.name[0] : 'U'}</span>
                </div>
                <div className="text-left min-w-0 leading-none">
                  <p className="text-xs font-black text-slate-800 dark:text-zinc-200 truncate leading-none">{user?.name || 'User'}</p>
                  <span className="text-[9px] text-[#0ea5e9] dark:text-sky-400 font-bold uppercase tracking-wider block mt-1">{activeContext?.role || 'Staff'}</span>
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
    </>
  );
};
