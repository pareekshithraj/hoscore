import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, FileText, ArrowLeft, Printer, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-rose-100 selection:text-rose-900">
      {/* Header matching Landing page */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/50 print:hidden">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center">
              <img src="/hoscore-logo.png" alt="HOSCORE" className="h-14 object-contain" />
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-extrabold uppercase tracking-wider border border-slate-200/60">
              Privacy Charter
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all border border-slate-200 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Print Policy</span>
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
            <ShieldCheck className="w-4 h-4 text-rose-600" /> DPDP Act 2023 Privacy Policy
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Privacy Policy &{' '}
            <span className="bg-gradient-to-r from-rose-600 to-red-500 bg-clip-text text-transparent">
              Health Data Charter
            </span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Effective Date: January 1, 2026 · Last Revised: July 23, 2026
          </p>

          <p className="text-xs text-slate-500 font-medium max-w-xl mx-auto">
            HOSCORE by Bluevolt Groups Private Limited protects patient health data under the Digital Personal Data Protection (DPDP) Act 2023. ABDM / ABHA linking is on the product roadmap and is not live.
          </p>
        </div>
      </section>

      {/* Policy Content Body */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10 text-slate-700 text-sm leading-relaxed">
        
        {/* Key Highlights Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-[24px] bg-gradient-to-br from-rose-50/60 via-white to-slate-50 border border-rose-200/60 shadow-sm print:hidden">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
              <Lock className="w-4 h-4 text-rose-600" />
              <span>AES-256 Encryption</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">All health databases encrypted at rest and TLS 1.3 in transit.</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Consent-Driven</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Hospital staff access is logged. Patients can revoke doctor access in the privacy page.</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Right to Erasure</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Full rights to access, correct, or request account data deletion.</p>
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2">1. Data We Collect</h2>
          <p>
            When you register as a patient, hospital staff member, or doctor on HOSCORE, we collect specific information necessary to operate clinical workflows and health record management:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-600 font-medium">
            <li><strong>Identity & Contact Information:</strong> Full legal name, date of birth, gender, contact number, email address, physical address, and emergency contact details.</li>
            <li><strong>Health & Clinical Records:</strong> Hospital UHID / Hoscore ID, consultation notes, vitals, lab results, e-prescriptions, admissions, and allergy history. ABHA IDs are stored only if you provide them.</li>
            <li><strong>Technical & System Telemetry:</strong> IP address, device identifier, browser type, operating system, login audit logs, and transaction timestamps.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2">2. Purpose & Legal Basis for Processing</h2>
          <p>
            We process your personal and health data under the statutory provisions of the DPDP Act 2023, National Health Authority (NHA) norms, and medical regulation rules for the following purposes:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-600 font-medium">
            <li>Facilitating outpatient (OPD) token queueing, doctor appointments, and hospital bed admissions.</li>
            <li>Generating e-prescriptions, diagnostic orders, and inpatient billing invoices.</li>
            <li>Fulfilling legal and statutory obligations including audit trails requested by the hospital that treated you.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2">3. Consent Management & Withdrawal</h2>
          <p>
            Your health records are confidential. Hoscore utilizes explicit, itemized consent architecture:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-600 font-medium">
            <li>Medical records stay inside the hospital that created them unless you share them (print pack, QR pass, or a future ABDM consent flow).</li>
            <li>You may review, modify, or revoke active consents at any time through the Patient Portal (<code className="bg-slate-100 px-2 py-0.5 rounded text-rose-700 font-mono text-xs">/patient/privacy</code>).</li>
            <li>Withdrawal of consent does not affect the legality of data processing conducted prior to revocation.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2">4. Data Storage, Security & Retention</h2>
          <p>
            All health records managed by HOSCORE are hosted on secure, ISO 27001 and Tier-IV data centers located within the Republic of India:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-600 font-medium">
            <li><strong>Encryption Standards:</strong> Data at rest is encrypted using AES-256 bit encryption; data in transit uses TLS 1.3 protocols.</li>
            <li><strong>Retention Schedules:</strong> Routine outpatient and inpatient records are stored for a statutory minimum of 10 years as mandated by MoHFW EHR Standards 2016. Medico-legal records are retained permanently.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2">5. Patient Rights under DPDP Act 2023</h2>
          <p>You possess statutory rights regarding your personal and medical data:</p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-600 font-medium">
            <li><strong>Right to Access:</strong> Request a complete summary of your health profile and sharing history.</li>
            <li><strong>Right to Correction:</strong> Request correction of inaccurate personal or demographic information.</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your personal account, subject to mandatory medical retention laws.</li>
            <li><strong>Right to Grievance Redressal:</strong> File complaints with our designated Data Protection Officer.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2">6. Data Protection Officer (DPO) Contact</h2>
          <p>
            If you have questions or wish to exercise your privacy rights, contact our Data Protection Officer:
          </p>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs font-medium">
            <p className="font-extrabold text-slate-900 text-sm">Data Protection Directorate · HOSCORE</p>
            <p>Bluevolt Groups Private Limited, Tech Zone 4, New Delhi - 110001, India</p>
            <p><strong>Official Email:</strong> dpo@hoscore.gov.in / privacy@bluevolt.in</p>
            <p><strong>Grievance Helpline:</strong> +91 1800-425-9090 (Toll-Free, 9 AM - 6 PM IST)</p>
          </div>
        </section>

      </main>

      {/* Footer matching Landing page */}
      <footer className="bg-slate-950 text-slate-400 py-10 border-t border-slate-900 text-xs font-medium print:hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 HOSCORE Initiative by Bluevolt Groups Private Limited. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/gov-guidelines" className="hover:text-white transition-colors">Gov Mandates</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link to="/citizens-charter" className="hover:text-white transition-colors">Citizen's Charter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
