import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Key, Server, Cpu, CheckCircle2, Printer, Sparkles, FileCode, ShieldCheck } from 'lucide-react';

export const SecurityArchitecture: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-rose-100 selection:text-rose-900">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/50 print:hidden">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center">
              <img src="/hoscore-logo.png" alt="HOSCORE" className="h-14 object-contain" />
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-extrabold uppercase tracking-wider border border-slate-200/60">
              Security Architecture
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all border border-slate-200 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Print Security Doc</span>
            </button>
            <Link
              to="/"
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-28 pb-12 bg-gradient-to-b from-rose-50/40 via-white to-slate-50/50 border-b border-slate-100 overflow-hidden print:pt-6 print:pb-2">
        <div className="max-w-4xl mx-auto px-6 space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200/50 text-rose-700 text-xs font-bold uppercase tracking-wider mx-auto">
            <Shield className="w-4 h-4 text-rose-600" /> ISO 27001 & CERT-In Empanelled Security Vault
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Security Architecture &{' '}
            <span className="bg-gradient-to-r from-rose-600 to-red-500 bg-clip-text text-transparent">
              Trust Infrastructure
            </span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Technical blueprint of Hoscore’s end-to-end cryptographic encryption, zero-trust access control, and disaster resilience.
          </p>
        </div>
      </section>

      {/* Body */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10 text-slate-700 text-sm leading-relaxed">
        
        {/* Security Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-sm space-y-2">
            <Lock className="w-6 h-6 text-rose-600" />
            <h3 className="font-extrabold text-slate-900 text-base">AES-256 at Rest</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">Health databases, medical records, and file stores encrypted with military-grade AES-256 keys.</p>
          </div>

          <div className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-sm space-y-2">
            <Server className="w-6 h-6 text-blue-600" />
            <h3 className="font-extrabold text-slate-900 text-base">TLS 1.3 In Transit</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">HTTPS API requests protected via TLS 1.3 with Perfect Forward Secrecy (PFS).</p>
          </div>

          <div className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-sm space-y-2">
            <Cpu className="w-6 h-6 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900 text-base">CERT-In VAPT Audited</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">Quarterly penetration testing & vulnerability audits by CERT-In empanelled assessors.</p>
          </div>
        </div>

        {/* Technical Deep Dive */}
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2">1. Identity & Zero-Trust Access Control (RBAC)</h2>
          <p>
            Hoscore enforces strict Role-Based Access Control (RBAC) across all administrative, doctor, nurse, and patient endpoints. Staff access to clinical records is restricted based on active shift assignments and hospital department node permissions.
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-600 font-medium">
            <li>Multi-Factor Authentication (MFA) mandated for hospital super-admins and physicians.</li>
            <li>Session timeout enforcement after 15 minutes of inactivity on clinical consoles.</li>
            <li>Immutable audit logging recording every read, update, or export operation on patient files.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2">2. Infrastructure & Disaster Recovery</h2>
          <p>
            Hosted across multi-region, Tier-IV data centers within India with real-time replication and automated failover capabilities:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-600 font-medium">
            <li><strong>Database Mirroring:</strong> Automated point-in-time recovery with 5-minute RPO (Recovery Point Objective).</li>
            <li><strong>Availability:</strong> Production runs on Vercel (hoscore.in + api.hoscore.in), Neon Postgres, and Cloudflare R2. We do not publish a 99.999% SLA on this page.</li>
            <li><strong>Automated Backups:</strong> Encrypted daily snapshots stored in air-gapped immutable storage vaults.</li>
          </ul>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-10 border-t border-slate-900 text-xs font-medium print:hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 HOSCORE Initiative. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/gov-guidelines" className="hover:text-white transition-colors">Gov Mandates</Link>
            <span>•</span>
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/citizens-charter" className="hover:text-white transition-colors">Citizen's Charter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
