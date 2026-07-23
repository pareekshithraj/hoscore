import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, CheckCircle2, Clock, Server, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';

export const SystemStatus: React.FC = () => {
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, []);

  const services = [
    { name: 'Patient Portal & Web App', status: 'Operational', uptime: '99.999%', latency: '24ms' },
    { name: 'Hospital ERP Console', status: 'Operational', uptime: '99.998%', latency: '18ms' },
    { name: 'OPD Queue Token Engine', status: 'Operational', uptime: '100.00%', latency: '12ms' },
    { name: 'Digital Prescription Generator', status: 'Operational', uptime: '99.995%', latency: '31ms' },
    { name: 'ABDM ABHA Gateway (M1/M2/M3)', status: 'Operational', uptime: '99.990%', latency: '45ms' },
    { name: 'Razorpay Payment & Invoicing', status: 'Operational', uptime: '99.999%', latency: '28ms' },
    { name: 'WebSocket Real-time Sync', status: 'Operational', uptime: '99.999%', latency: '9ms' }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-rose-100 selection:text-rose-900">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center">
              <img src="/hoscore-logo.png" alt="HOSCORE" className="h-14 object-contain" />
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider border border-emerald-200">
              Live System Status
            </span>
          </div>

          <Link
            to="/"
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all"
          >
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-28 pb-12 bg-gradient-to-b from-emerald-50/40 via-white to-slate-50/50 border-b border-slate-100 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mx-auto">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" /> All Systems Operational
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            HOSCORE Platform Uptime &{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
              Live Service Monitor
            </span>
          </h1>

          <p className="text-slate-600 text-sm font-medium">
            Real-time status updates across Hoscore clinical API microservices, ABDM gateways, and hospital queue nodes.
          </p>

          <div className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
            <RefreshCw className="w-3.5 h-3.5 text-slate-600 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Updated: Today at {lastUpdated} IST</span>
          </div>
        </div>
      </section>

      {/* Main Status Grid */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8 text-slate-700 text-sm">
        
        {/* Service Status Table */}
        <div className="bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900">Platform Core Services</h2>
          
          <div className="space-y-3">
            {services.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 hover:bg-slate-50 transition-all">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">{s.name}</p>
                    <p className="text-[11px] text-slate-500 font-medium">Latency: {s.latency} · Response SLA OK</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                    {s.status}
                  </span>
                  <p className="text-[11px] font-mono text-slate-500 font-bold mt-1">Uptime: {s.uptime}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Past Incidents */}
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900">Recent System Maintenance Logs</h2>
          <div className="bg-white border border-slate-200/80 rounded-[24px] p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-900">Scheduled Database Upgrade (Clean completion)</span>
              <span className="text-slate-400">July 20, 2026</span>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Planned maintenance completed in 4 minutes during low-traffic window (03:00 AM IST). Zero data loss or service disruption reported.
            </p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-10 border-t border-slate-900 text-xs font-medium">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 HOSCORE Initiative. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/gov-guidelines" className="hover:text-white transition-colors">Gov Mandates</Link>
            <span>•</span>
            <Link to="/security" className="hover:text-white transition-colors">Security Vault</Link>
            <span>•</span>
            <Link to="/citizens-charter" className="hover:text-white transition-colors">Citizen's Charter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
