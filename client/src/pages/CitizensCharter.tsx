import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, ShieldCheck, Heart, AlertCircle, Printer, Sparkles, CheckCircle2, PhoneCall } from 'lucide-react';

export const CitizensCharter: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-rose-100 selection:text-rose-900">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/50 print:hidden">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center">
              <img src="/hoscore-logo.png" alt="HOSCORE" className="h-14 object-contain" />
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-extrabold uppercase tracking-wider border border-slate-200/60">
              Citizen's Charter
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all border border-slate-200 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Print Charter</span>
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

      {/* Hero Section */}
      <section className="relative pt-28 pb-12 bg-gradient-to-b from-rose-50/40 via-white to-slate-50/50 border-b border-slate-100 overflow-hidden print:pt-6 print:pb-2">
        <div className="max-w-4xl mx-auto px-6 space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200/50 text-rose-700 text-xs font-bold uppercase tracking-wider mx-auto">
            <Users className="w-4 h-4 text-rose-600" /> Public Service Delivery Guarantees & Patient Bill of Rights
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Citizen's Charter &{' '}
            <span className="bg-gradient-to-r from-rose-600 to-red-500 bg-clip-text text-transparent">
              Hospital Service SLAs
            </span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Published in accordance with Ministry of Health & Family Welfare (MoHFW) standards and Quality Council of India (QCI) norms.
          </p>
        </div>
      </section>

      {/* Main Body */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10 text-slate-700 text-sm leading-relaxed">

        {/* Operational SLA Bento Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2">Guaranteed Service Turnaround Times (SLAs)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-rose-50/60 to-white p-5 rounded-[24px] border border-rose-200/60 space-y-2 shadow-sm">
              <div className="p-2 rounded-xl bg-rose-600 text-white w-fit">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Emergency Triage</p>
              <p className="text-2xl font-black text-slate-900">&lt; 3 Minutes</p>
              <p className="text-[11px] text-slate-500 font-medium">Immediate stabilization upon arrival without upfront deposit barriers.</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50/60 to-white p-5 rounded-[24px] border border-blue-200/60 space-y-2 shadow-sm">
              <div className="p-2 rounded-xl bg-blue-600 text-white w-fit">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">OPD Registration</p>
              <p className="text-2xl font-black text-slate-900">&lt; 10 Minutes</p>
              <p className="text-[11px] text-slate-500 font-medium">ABHA QR-scan token dispatch and queue confirmation.</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50/60 to-white p-5 rounded-[24px] border border-emerald-200/60 space-y-2 shadow-sm">
              <div className="p-2 rounded-xl bg-emerald-600 text-white w-fit">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Lab Report TAT</p>
              <p className="text-2xl font-black text-slate-900">&lt; 4 Hours</p>
              <p className="text-[11px] text-slate-500 font-medium">Routine blood and diagnostic reports delivered directly to portal.</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50/60 to-white p-5 rounded-[24px] border border-purple-200/60 space-y-2 shadow-sm">
              <div className="p-2 rounded-xl bg-purple-600 text-white w-fit">
                <Heart className="w-5 h-5" />
              </div>
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">IPD Discharge</p>
              <p className="text-2xl font-black text-slate-900">&lt; 60 Minutes</p>
              <p className="text-[11px] text-slate-500 font-medium">Final discharge summary clearance post physician approval.</p>
            </div>
          </div>
        </div>

        {/* Patient Rights */}
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2">1. Patient Bill of Rights</h2>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 font-medium">
            <li><strong>Right to Emergency Care:</strong> Right to receive immediate emergency medical treatment without delay or demand for advance financial deposits.</li>
            <li><strong>Right to Informed Consent:</strong> Right to clear explanation of proposed treatments, diagnostic risks, alternative options, and estimated costs prior to procedures.</li>
            <li><strong>Right to Privacy & Confidentiality:</strong> Absolute right to personal privacy during physical examinations and digital protection of electronic health records.</li>
            <li><strong>Right to Second Opinion:</strong> Right to request and receive complete medical record copies to seek second opinions from external doctors.</li>
            <li><strong>Right to Transparent Billing:</strong> Right to receive itemized invoices for all treatments, medicines, diagnostic tests, and bed charges.</li>
          </ul>
        </section>

        {/* Patient Responsibilities */}
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2">2. Patient Responsibilities</h2>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 font-medium">
            <li>Provide accurate medical history, past allergies, and current medications to attending medical staff.</li>
            <li>Adhere to prescribed treatment regimens and follow hospital infection control protocols.</li>
            <li>Respect hospital visiting hours, staff dignity, and fellow patient privacy.</li>
            <li>Fulfill agreed financial obligations for non-covered elective procedures promptly.</li>
          </ul>
        </section>

        {/* Emergency Helpdesk Callout */}
        <div className="p-6 rounded-[28px] bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="font-extrabold text-lg flex items-center gap-2 justify-center md:justify-start">
              <PhoneCall className="w-5 h-5 text-rose-400" /> Need Help or Have a Complaint?
            </h3>
            <p className="text-xs text-slate-400">Our Nodal Officer and Citizen Helpdesk are available to assist you 24/7.</p>
          </div>
          <Link
            to="/gov-guidelines/grievance"
            className="px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 font-bold text-xs rounded-xl transition-all shadow-md shadow-rose-500/20 whitespace-nowrap"
          >
            File Citizen Grievance
          </Link>
        </div>

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
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
