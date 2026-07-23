import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Building2, ShieldCheck, Printer, Sparkles, AlertCircle, Award } from 'lucide-react';

export const MandatoryDisclosures: React.FC = () => {
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
              Mandatory Disclosures
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all border border-slate-200 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Print Document</span>
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
            <FileText className="w-4 h-4 text-rose-600" /> Statutory Public Notices & Institutional Disclosures
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Mandatory Public Disclosures &{' '}
            <span className="bg-gradient-to-r from-rose-600 to-red-500 bg-clip-text text-transparent">
              Quality Indicators
            </span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Published pursuant to Ministry of Health & Family Welfare mandates, NABH accreditation benchmarks, and Bio-Medical Waste rules.
          </p>
        </div>
      </section>

      {/* Main Body */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10 text-slate-700 text-sm leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2">1. Bio-Medical Waste Management Compliance</h2>
          <p>
            In compliance with the Bio-Medical Waste Management Rules 2016 (Amended 2019), all network hospitals participating in HOSCORE publish monthly waste generation logs:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-600 font-medium">
            <li>Color-coded segregation (Yellow, Red, White, Blue bins) strictly logged at point of generation.</li>
            <li>Barcoded bag tracking integrated into Hoscore Inventory & Bio-Waste disposal module.</li>
            <li>Direct handover to State Pollution Control Board (SPCB) authorized common waste treatment facilities (CBWTF).</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2">2. Clinical Quality Indicators & Safety Metrics</h2>
          <p>
            Hoscore analytics continuously monitors NABH Key Performance Indicators (KPIs) across participating clinical nodes:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-600 font-medium">
            <li>Inpatient Healthcare Associated Infection (HAI) Rate: Controlled under 0.2 per 1,000 patient days.</li>
            <li>Medication Error Rate: Zero critical prescription fulfillment errors recorded.</li>
            <li>Emergency Triage Re-assessment Rate: 100% compliance within published 3-minute window.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2">3. Organ Donation Public Notice</h2>
          <p>
            Hoscore actively promotes national organ donation awareness in partnership with NOTTO (National Organ and Tissue Transplant Organisation). Pledges can be registered through the Patient Portal profile settings.
          </p>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-10 border-t border-slate-900 text-xs font-medium print:hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 HOSCORE Initiative. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/gov-guidelines" className="hover:text-white transition-colors">Gov Mandates</Link>
            <span>•</span>
            <Link to="/citizens-charter" className="hover:text-white transition-colors">Citizen's Charter</Link>
            <span>•</span>
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
