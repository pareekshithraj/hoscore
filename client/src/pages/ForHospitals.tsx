import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, IndianRupee, Shield, Zap, Database, BarChart3, Users, Building2, Layers, Clock, Globe2, ChevronRight, Sparkles, Monitor, Cpu, ArrowUpRight } from 'lucide-react';

export const ForHospitals = () => {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/hoscore-logo.png" alt="HOSCORE" className="h-14 object-contain" />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#modules" className="hover:text-blue-600 transition-colors">Modules</a>
            <Link to="/" className="hover:text-blue-600 transition-colors">← Patient Home</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-900 hover:text-blue-600 px-4 py-2">Sign In</Link>
            <Link to="/register-hospital" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-full hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
              List Your Hospital
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — Bold split layout */}
      <section className="relative pt-28 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950" />
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/15 blur-[120px] rounded-full" />

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="max-w-3xl space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.1] text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Globe2 className="w-3.5 h-3.5" /> India's Most Comprehensive Hospital ERP
            </div>

            <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight">
              Run Your Hospital<br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">Like Never Before.</span>
            </h1>

            <p className="text-xl text-slate-400 leading-relaxed max-w-xl">
              HOSCORE digitalizes every single operation — OPD, labs, billing, shifts, inventory, patient records — in one beautiful dashboard.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/register-hospital" className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-500/25 active:scale-[0.97] text-lg">
                Get Started <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#features" className="flex items-center gap-2 px-8 py-4 text-slate-400 font-bold hover:text-white transition-all group text-lg border border-white/10 rounded-2xl hover:border-white/20">
                Explore Features <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-8 pt-8 border-t border-white/[0.06]">
              {[
                { n: '500+', l: 'Hospitals' },
                { n: '50K+', l: 'Staff Users' },
                { n: '99.9%', l: 'Uptime' },
                { n: '< 2min', l: 'Setup Time' },
              ].map((s, i) => (
                <div key={i}>
                  <p className="text-2xl font-black text-white">{s.n}</p>
                  <p className="text-xs text-slate-500 font-medium">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento — Crazy asymmetric layout */}
      <section id="features" className="py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <p className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">The Complete Platform</p>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900">Everything. Digitalized.</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">One subscription. Every module. No add-ons.</p>
          </div>

          {/* Asymmetric Bento Grid */}
          <div className="grid md:grid-cols-6 gap-4">
            {/* Large — spans 4 cols */}
            <div className="md:col-span-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[28px] p-10 text-white min-h-[320px] flex flex-col justify-between relative overflow-hidden group hover:shadow-2xl transition-all">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full" />
              <div className="relative">
                <Monitor className="w-10 h-10 text-blue-400 mb-4" />
                <h3 className="text-3xl font-black mb-3">Real-Time Command Center</h3>
                <p className="text-slate-400 max-w-lg leading-relaxed">Live dashboard showing bed occupancy, queue lengths, staff on duty, active admissions, and revenue — all updating in real-time. Hospital operations at a glance.</p>
              </div>
              <div className="flex items-center gap-2 mt-6 text-blue-400 text-sm font-bold">
                <Sparkles className="w-4 h-4" /> Live operational intelligence
              </div>
            </div>

            {/* Small — spans 2 cols */}
            <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[28px] p-8 text-white min-h-[320px] flex flex-col justify-between hover:shadow-2xl transition-all">
              <Cpu className="w-10 h-10 text-blue-200" />
              <div>
                <h3 className="text-xl font-black mb-2">Role-Based Access</h3>
                <p className="text-blue-100/70 text-sm">Personalized dashboards for Admin, Doctor, Nurse, Receptionist, Pharmacist, Lab Tech — each sees only what they need.</p>
              </div>
            </div>

            {/* 2-col card */}
            <div className="md:col-span-2 bg-white rounded-[28px] border border-slate-200/60 p-8 flex flex-col justify-between min-h-[240px] hover:border-blue-200 hover:shadow-xl transition-all group">
              <Database className="w-10 h-10 text-emerald-600 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Patient Records</h3>
                <p className="text-slate-500 text-sm">Complete medical history, vitals, lab results, prescriptions — paperless and searchable.</p>
              </div>
            </div>

            {/* 2-col card */}
            <div className="md:col-span-2 bg-white rounded-[28px] border border-slate-200/60 p-8 flex flex-col justify-between min-h-[240px] hover:border-purple-200 hover:shadow-xl transition-all group">
              <BarChart3 className="w-10 h-10 text-purple-600 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Revenue Analytics</h3>
                <p className="text-slate-500 text-sm">Track billing, insurance claims, expenses, and departmental revenue with interactive charts.</p>
              </div>
            </div>

            {/* 2-col card */}
            <div className="md:col-span-2 bg-white rounded-[28px] border border-slate-200/60 p-8 flex flex-col justify-between min-h-[240px] hover:border-amber-200 hover:shadow-xl transition-all group">
              <Users className="w-10 h-10 text-amber-600 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Staff Management</h3>
                <p className="text-slate-500 text-sm">Shift scheduling, leave requests, department groups, and performance tracking.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules — Scrollable Marquee-style */}
      <section id="modules" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <p className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">29+ Modules</p>
            <h2 className="text-4xl font-black text-slate-900">Built for Every Department</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[
              'OPD Queue', 'Admissions', 'Discharge', 'Billing', 'Lab Orders',
              'Prescriptions', 'Vitals Monitor', 'Inventory', 'Shift Roster', 'Insurance Claims',
              'Expenses', 'Feedback', 'Notice Board', 'Calendar', 'Leave Mgmt',
              'Staff Groups', 'Audit Logs', 'Analytics', 'Rooms & Beds', 'Patient Portal',
            ].map((m, i) => (
              <div key={i} className="bg-slate-50 hover:bg-white border border-slate-200/60 hover:border-blue-300 rounded-2xl p-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                <p className="text-sm font-bold text-slate-700">{m}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[200px] rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="text-center mb-16 space-y-4">
            <p className="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">Transparent Pricing</p>
            <h2 className="text-4xl lg:text-5xl font-black">One Plan. Everything Included.</h2>
            <p className="text-lg text-slate-400">No hidden fees. No per-module charges. Pay per user, get everything.</p>
          </div>

          <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-sm rounded-[32px] border border-white/[0.1] p-10 lg:p-14">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-6">
                  <Sparkles className="w-3 h-3" /> All-Inclusive
                </div>
                <div className="flex items-baseline gap-2 mb-6">
                  <IndianRupee className="w-10 h-10" />
                  <span className="text-7xl font-black">150</span>
                  <span className="text-slate-400 text-lg">/user/year</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {['All 29+ modules', 'Unlimited patients', 'Real-time dashboard', 'Staff management', 'Patient portal', 'Analytics & reports', 'Multi-role access', 'Priority support'].map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span className="text-slate-300 text-sm">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-full lg:w-auto flex flex-col gap-4">
                <Link to="/register-hospital" className="px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-2xl text-center text-lg active:scale-[0.97]">
                  Start Now <ArrowUpRight className="w-5 h-5 inline ml-1" />
                </Link>
                <p className="text-xs text-slate-500 text-center">No credit card required • Cancel anytime</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
            Ready to Digitalize<br />Your Hospital?
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">Join the HOSCORE network and give your staff the tools they deserve.</p>
          <Link to="/register-hospital" className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl text-lg hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-500/20 active:scale-[0.97] transition-all">
            Get Started — ₹150/user/yr <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center">
              <img src="/hoscore-logo.png" alt="HOSCORE" className="h-12 object-contain" />
            </div>
            <div className="flex items-center gap-8 text-sm font-medium text-slate-500">
              <Link to="/" className="hover:text-blue-600 transition-colors">Patient Home</Link>
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Powered by</span>
              <img src="/bluevolt-logo.png" alt="BLUEVOLT GROUPS" className="h-12 object-contain" />
            </div>
            <p className="text-sm text-slate-400">© 2026 HOSCORE. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
