import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useLocation, useNavigate } from 'react-router-dom';
import { BASE_URL } from '../utils/apiConfig';

// ── New-booking live toast ───────────────────────────────────────────────────
interface BookingToast {
  id: number;
  patientName: string;
  tokenNumber: number;
  date: string;
  time: string;
  doctorName?: string;
}

function NewBookingToast({ toast, onDismiss }: { toast: BookingToast; onDismiss: (id: number) => void }) {
  const navigate = useNavigate();
  // Auto-dismiss after 10 s
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 10000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <div
      style={{
        background: 'var(--bg-card, #1c2030)',
        border: '1px solid #2563eb55',
        borderLeft: '4px solid #2563eb',
        borderRadius: 14,
        padding: '14px 16px',
        minWidth: 280,
        maxWidth: 340,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        animation: 'slideInRight 0.3s ease',
        cursor: 'pointer',
      }}
      onClick={() => { navigate('/calendar'); onDismiss(toast.id); }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1 }}>
          📅 New Booking
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(toast.id); }}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
        >
          ✕
        </button>
      </div>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary, #f1f5f9)' }}>
        {toast.patientName}
        <span style={{ marginLeft: 8, background: '#2563eb22', color: '#60a5fa', borderRadius: 6, padding: '1px 8px', fontSize: 12, fontWeight: 700 }}>
          Token #{toast.tokenNumber}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#94a3b8' }}>
        {toast.date} · {toast.time}
        {toast.doctorName && <> · <span style={{ color: '#7dd3fc' }}>{toast.doctorName}</span></>}
      </div>
      <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Click to open Calendar →</div>
    </div>
  );
}

// ── Layout ───────────────────────────────────────────────────────────────────
export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isSimulator = location.pathname === '/dashboard/simulator';
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => setIsMobileNavOpen(false), []);
  const [toasts, setToasts] = useState<BookingToast[]>([]);
  const toastIdRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const knownApptIdsRef = useRef<Set<string> | null>(null);

  // Live Toast Notifications — via WebSocket (dev/local) OR HTTP Polling Fallback (Production)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const hostname = window.location.hostname;
    const isServerless =
      hostname.endsWith('.vercel.app') ||
      hostname === 'hoscore.in' ||
      hostname === 'www.hoscore.in';

    // 1. Try WebSocket if not serverless
    if (!isServerless) {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      let host = window.location.host;
      try {
        if (BASE_URL.startsWith('http')) {
          const url = new URL(BASE_URL);
          host = url.host;
        }
      } catch {}
      const wsUrl = `${wsProtocol}//${host}/ws?token=${token}`;

      let ws: WebSocket;
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'NEW_APPOINTMENT') {
              const d = payload.data;
              setToasts(prev => [
                ...prev,
                {
                  id: ++toastIdRef.current,
                  patientName: d.patientName || 'Patient',
                  tokenNumber: d.tokenNumber,
                  date: d.date,
                  time: d.time,
                  doctorName: d.doctorName,
                },
              ]);
            }
          } catch {}
        };
        ws.onerror = () => {};
        ws.onclose = () => {};
      } catch {}
    }

    // 2. HTTP Polling Fallback (Essential for Vercel/production live toasts)
    const checkNewAppointments = async () => {
      try {
        const res = await fetch(`${BASE_URL}/appointments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const list: any[] = await res.json();
        if (!Array.isArray(list)) return;

        if (!knownApptIdsRef.current) {
          // Initial seed — remember existing appointment IDs
          knownApptIdsRef.current = new Set(list.map((a: any) => a.id));
        } else {
          // Check for newly added appointments
          for (const appt of list) {
            if (!knownApptIdsRef.current.has(appt.id)) {
              knownApptIdsRef.current.add(appt.id);
              if (appt.status === 'PENDING' || appt.status === 'CONFIRMED') {
                const dateStr = appt.date ? new Date(appt.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Today';
                setToasts(prev => [
                  ...prev,
                  {
                    id: ++toastIdRef.current,
                    patientName: appt.patient?.name || appt.patientName || 'Patient',
                    tokenNumber: appt.tokenNumber || 1,
                    date: dateStr,
                    time: appt.time || '10:00 AM',
                    doctorName: appt.doctor?.name,
                  },
                ]);
              }
            }
          }
        }
      } catch {}
    };

    checkNewAppointments();
    const interval = setInterval(checkNewAppointments, 10000);

    return () => {
      clearInterval(interval);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  if (isSimulator) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden dashboard-theme">
      {/* Fixed Sidebar */}
      <Sidebar isMobileOpen={isMobileNavOpen} onCloseMobile={closeMobileNav} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header onOpenMenu={() => setIsMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 animate-fade-in-up relative z-10">
          {children}
        </main>
      </div>

      {/* Live booking toasts — bottom-right stack */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          alignItems: 'flex-end',
        }}
      >
        {toasts.map(t => (
          <NewBookingToast key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};
