import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { BASE_URL } from '../utils/apiConfig';

type ServiceRow = { name: string; status: string };

export const SystemStatus: React.FC = () => {
  const [lastUpdated, setLastUpdated] = useState('');
  const [overall, setOverall] = useState('checking');
  const [services, setServices] = useState<ServiceRow[]>([]);

  useEffect(() => {
    fetch(`${BASE_URL}/status`)
      .then((r) => r.json())
      .then((data) => {
        setOverall(data.status || 'unknown');
        setServices(Array.isArray(data.services) ? data.services : []);
        setLastUpdated(new Date(data.generatedAt || Date.now()).toLocaleTimeString('en-IN'));
      })
      .catch(() => {
        setOverall('unreachable');
        setServices([{ name: 'API', status: 'down' }]);
        setLastUpdated(new Date().toLocaleTimeString('en-IN'));
      });
  }, []);

  const healthy = overall === 'operational';

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
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider mx-auto ${
            healthy ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-amber-100 border-amber-200 text-amber-800'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${healthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {healthy ? 'Core systems reachable' : overall === 'checking' ? 'Checking…' : 'Degraded or unreachable'}
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            HOSCORE Platform Uptime &{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
              Live Service Monitor
            </span>
          </h1>

          <p className="text-slate-600 text-sm font-medium">
            Live checks against the Hoscore API, database, and payment configuration. ABDM is listed only when connected.
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
            {services.map((s, idx) => {
              const ok = s.status === 'operational';
              return (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60">
                <div className="flex items-center gap-3">
                  {ok ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />}
                  <p className="font-extrabold text-slate-900 text-sm">{s.name}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                  ok ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}>
                  {s.status.replace(/_/g, ' ')}
                </span>
              </div>
              );
            })}
          </div>
        </div>

        {/* Recent Past Incidents */}
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900">Notes</h2>
          <div className="bg-white border border-slate-200/80 rounded-[24px] p-5">
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              This page reports live reachability, not a contractual SLA. ABDM / ABHA certification is not connected yet.
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
