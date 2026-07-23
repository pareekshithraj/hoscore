import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, ShieldCheck, FileText, Printer, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const TermsOfService: React.FC = () => {
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
              Terms of Service
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all border border-slate-200 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Print Terms</span>
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
            <Scale className="w-4 h-4 text-rose-600" /> Statutory Terms & Institutional Governance
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Terms of Service &{' '}
            <span className="bg-gradient-to-r from-rose-600 to-red-500 bg-clip-text text-transparent">
              Platform Usage Policy
            </span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Effective Date: January 1, 2026 · Last Revised: July 23, 2026
          </p>

          <p className="text-xs text-slate-500 font-medium max-w-xl mx-auto">
            Governing the access and utilization of Hoscore Digital Healthcare Network by patients, medical practitioners, hospitals, and institutional partners.
          </p>
        </div>
      </section>

      {/* Terms Body */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10 text-slate-700 text-sm leading-relaxed">

        {/* Important Warning Banner */}
        <div className="p-5 rounded-[24px] bg-amber-50 border border-amber-200/80 flex items-start gap-3.5 text-xs text-amber-900 font-medium shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-extrabold text-sm block text-amber-950">Medical Emergency Disclaimer</span>
            <p>
              Hoscore is a digital healthcare management and Electronic Health Record (EHR) platform. It is <strong>NOT</strong> an emergency medical dispatch service. For life-threatening emergencies, call national emergency helpline <strong>112</strong> or visit the nearest hospital emergency department immediately.
            </p>
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2">1. Acceptance of Terms</h2>
          <p>
            By creating an account, accessing, or utilizing the HOSCORE web portal, mobile application, or hospital ERP tools operated by Bluevolt Groups Private Limited, you agree to be bound by these Terms of Service, Privacy Policy, and applicable government guidelines.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2">2. Patient & User Responsibilities</h2>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-600 font-medium">
            <li><strong>Accurate Information:</strong> You agree to provide accurate, current, and complete personal and medical history information during registration and appointment booking.</li>
            <li><strong>Account Security:</strong> You are responsible for safeguarding your login credentials, OTP codes, and authentication tokens. Any action taken under your authenticated session is deemed authorized by you.</li>
            <li><strong>Fair Platform Use:</strong> You agree not to misuse consultation booking features, submit false appointment requests, or attempt unauthorized access to another user's health profile.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2">3. Doctor & Hospital Practitioner Obligations</h2>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-600 font-medium">
            <li><strong>NMC/SMC Registration:</strong> All medical practitioners registering on Hoscore must hold valid credentials with the National Medical Commission (NMC) or state medical council.</li>
            <li><strong>E-Prescribing Compliance:</strong> Doctors must adhere strictly to Telemedicine Practice Guidelines (2020) and are prohibited from issuing prescriptions for Schedule X drugs or controlled narcotics via remote tele-consultations.</li>
            <li><strong>Record Accuracy:</strong> Attending physicians and staff must ensure clinical accuracy, proper ICD-10/SNOMED coding, and timely sign-off on discharge summaries.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2">4. Institutional Subscription & Billing Terms</h2>
          <p>
            Hospitals and clinics subscribing to Hoscore ERP plans agree to the following commercial terms:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-slate-600 font-medium">
            <li><strong>Subscription Plans:</strong> Pricing and billing cycles are billed monthly or annually as per the selected institutional package.</li>
            <li><strong>Payments & Payment Gateways:</strong> Transactions are securely processed through RBI-authorized payment gateways (e.g. Razorpay). All fees are exclusive of applicable GST unless stated otherwise.</li>
            <li><strong>SLA Guarantee:</strong> Hoscore maintains a 99.99% system uptime SLA for core hospital registration, queue console, and prescription generation endpoints.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2">5. Intellectual Property Rights</h2>
          <p>
            All content, brand logos, code, software architecture, interface designs, and database schemas associated with HOSCORE are the exclusive property of Bluevolt Groups Private Limited and protected under Indian and international copyright and trademark laws.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2">6. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, HOSCORE and Bluevolt Groups Private Limited shall not be liable for indirect, incidental, or consequential damages resulting from clinical medical decisions made by attending doctors, third-party internet outages, or force majeure events.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2">7. Governing Law & Jurisdiction</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any legal disputes arising out of platform usage shall be subject to the exclusive jurisdiction of courts located in New Delhi, India.
          </p>
        </section>

      </main>

      {/* Footer matching Landing page */}
      <footer className="bg-slate-950 text-slate-400 py-10 border-t border-slate-900 text-xs font-medium print:hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 HOSCORE Initiative by Bluevolt Groups Private Limited. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/gov-guidelines" className="hover:text-white transition-colors">Gov Mandates</Link>
            <span>•</span>
            <Link to="/citizens-charter" className="hover:text-white transition-colors">Citizen's Charter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
