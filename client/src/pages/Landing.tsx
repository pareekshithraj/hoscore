import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Heart, Star, MapPin, Clock, FileText, Search, ChevronRight, Sparkles, Activity, Building2, Fingerprint, RefreshCw, KeyRound, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

import { BASE_URL } from '../utils/apiConfig';

export const Landing = () => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const { activeContext } = useAuth();
  const isPatient = activeContext?.type === 'patient';

  useEffect(() => {
    fetch(`${BASE_URL}/hospitals`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setHospitals(data); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden selection:bg-rose-100 selection:text-rose-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/hoscore-logo.png" alt="HOSCORE" className="h-14 object-contain" />
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-rose-600 transition-colors">How it Works</a>
            <a href="#hospitals" className="hover:text-rose-600 transition-colors">Hospitals</a>
            <a href="#why-hoscore" className="hover:text-rose-600 transition-colors">Why HOSCORE</a>
            <Link to="/for-hospitals" className="hover:text-rose-600 transition-colors">For Hospitals</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-900 hover:text-rose-600 transition-colors px-4 py-2">Sign In</Link>
            <Link to="/login" className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white text-sm font-bold rounded-full hover:from-rose-700 hover:to-red-700 shadow-lg shadow-rose-500/20 active:scale-95 transition-all">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — Patient Focus */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-rose-400/[0.07] blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-400/[0.05] blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '12s' }} />

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8 animate-slide-up">
            {/* Floating pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200/50 text-rose-700 text-xs font-bold uppercase tracking-wider mx-auto">
              <Sparkles className="w-3.5 h-3.5" /> Your health, one tap away
            </div>

            <h1 className="text-5xl lg:text-[72px] font-black text-slate-900 leading-[1.05] tracking-tight">
              Your Health.{' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-rose-600 to-red-500 bg-clip-text text-transparent">
                  Simplified.
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 8C50 3 150 1 298 6" stroke="url(#grad)" strokeWidth="3" strokeLinecap="round" />
                  <defs><linearGradient id="grad"><stop stopColor="#e11d48" /><stop offset="1" stopColor="#ef4444" /></linearGradient></defs>
                </svg>
              </span>
            </h1>

            <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
              Find top-rated hospitals near you, book appointments instantly, track your prescriptions, and access your medical records — all from one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/login" className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-2xl hover:from-rose-700 hover:to-red-700 transition-all shadow-xl shadow-rose-500/25 active:scale-[0.97] text-lg">
                Create Free Account <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#hospitals" className="flex items-center gap-2 px-8 py-4 text-slate-600 font-bold hover:text-slate-900 transition-all group text-lg">
                Browse Hospitals <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Floating feature cards — Bento style */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {[
              { icon: <Search className="w-6 h-6 text-blue-600" />, title: 'Find Hospitals', desc: 'Search by location, specialty, or rating', bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-200/40' },
              { icon: <Clock className="w-6 h-6 text-emerald-600" />, title: 'Book Instantly', desc: 'No calls needed. Pick time, confirm.', bg: 'from-emerald-50 to-emerald-100/50', border: 'border-emerald-200/40' },
              { icon: <FileText className="w-6 h-6 text-purple-600" />, title: 'Digital Records', desc: 'Prescriptions, vitals, lab results — stored.', bg: 'from-purple-50 to-purple-100/50', border: 'border-purple-200/40' },
              { icon: <Heart className="w-6 h-6 text-rose-600" />, title: 'Track Health', desc: 'Your personal health timeline, always.', bg: 'from-rose-50 to-rose-100/50', border: 'border-rose-200/40' },
            ].map((f, i) => (
              <div key={i} className={`relative bg-gradient-to-br ${f.bg} border ${f.border} rounded-[24px] p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-500 group cursor-default`}>
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — Universal Standard Bento Timeline */}
      <section id="how-it-works" className="py-24 bg-slate-50/50 relative overflow-hidden">
        {/* Decorative Grid Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(#e11d48_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.01] pointer-events-none" />
        <div className="absolute -top-40 left-1/3 w-[500px] h-[500px] bg-rose-400/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50/80 border border-rose-100 text-rose-700 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Modern Health Standard
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-none">
              A Lifelong Health Registry.<br />
              <span className="bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 bg-clip-text text-transparent">Accessible anywhere, secured forever.</span>
            </h2>
            <p className="text-base lg:text-lg text-slate-500 leading-relaxed mt-4 font-medium">
              Just as digital identity needs a secure profile, modern healthcare demands a unified digital record standard. <span className="font-extrabold text-rose-600">HOSCORE</span> is a permanent, secure health database profile owned by you and connected directly to top hospitals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Permanent Profile',
                subtitle: 'Profile Activation',
                desc: 'Every patient receives their unique HOSCORE digital health profile. A secure, lifelong medical vault that simplifies check-ins, remains completely private, and contains your verified health history.',
                highlight: 'The foundational health profile standard.',
                icon: <Fingerprint className="w-6 h-6" />,
                theme: 'blue'
              },
              {
                step: '02',
                title: 'Universal Integration',
                subtitle: 'Real-Time Sync',
                desc: 'Walk into any emergency room, specialist clinic, or pharmacy in the network. Your HOSCORE ID instantly shares your medical records and active vitals with authorized practitioners — no paperwork needed.',
                highlight: 'Zero paperwork to carry. Zero redundant tests.',
                icon: <RefreshCw className="w-6 h-6 animate-spin-slow" />,
                theme: 'emerald'
              },
              {
                step: '03',
                title: 'Absolute Privacy',
                subtitle: 'Dynamic Access Controls',
                desc: 'You control the access keys. Grant temporary diagnostic view permissions to clinics and revoke them at any moment. Your personal health records are encrypted, secure, and entirely under your command.',
                highlight: 'Industry-grade encryption. 100% data ownership.',
                icon: <KeyRound className="w-6 h-6" />,
                theme: 'rose'
              }
            ].map((item, i) => (
              <div key={i} className="relative group bg-white rounded-3xl border border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="space-y-6">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md ${
                      item.theme === 'blue' ? 'bg-blue-50 text-blue-600' :
                      item.theme === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                      PHASE {item.step}
                    </span>
                    <span className="text-slate-300 font-extrabold text-xs tracking-widest">HOSCORE SYSTEM</span>
                  </div>

                  {/* Icon and Title */}
                  <div className="space-y-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                      item.theme === 'blue' ? 'bg-blue-50/50 border-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' :
                      item.theme === 'emerald' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' :
                      'bg-rose-50/50 border-rose-100 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'
                    }`}>
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">{item.title}</h3>
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{item.subtitle}</p>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>

                {/* highlight summary */}
                <div className="mt-8 pt-5 border-t border-slate-100">
                  <div className="flex items-center gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${
                      item.theme === 'blue' ? 'text-blue-500' :
                      item.theme === 'emerald' ? 'text-emerald-500' :
                      'text-rose-500'
                    }`} />
                    <p className="text-xs text-slate-600 font-semibold">{item.highlight}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Large Callout */}
          <div className="mt-12 bg-slate-900 rounded-[28px] p-8 lg:p-10 border border-slate-800 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="space-y-2 relative z-10">
              <h3 className="text-lg lg:text-xl font-bold text-white tracking-tight">Protecting the Next Generation of Healthcare</h3>
              <p className="text-slate-400 text-sm max-w-xl leading-relaxed">Every family member registered on the HOSCORE network receives lifetime vaccine calendars, vitals history tracking, and pediatric check-up reminders directly in their secure profile.</p>
            </div>
            <Link to="/login" className="flex-shrink-0 px-6 py-3.5 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-rose-500/20 hover:from-rose-700 hover:to-red-700 transition-all active:scale-95 z-10">
              Register Free Profile
            </Link>
          </div>
        </div>
      </section>


      {/* Partnered Hospitals — Card Grid */}
      <section id="hospitals" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
            <div>
              <p className="text-xs font-black text-rose-600 uppercase tracking-[0.2em] mb-3">Trusted Network</p>
              <h2 className="text-4xl font-black text-slate-900">Top Hospitals Near You</h2>
            </div>
            <Link to="/hospitals" className="text-sm font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 group">
              View All <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {(hospitals.length > 0 ? hospitals : [
              { id: 'h1', name: 'St. Vincent Medical Center', rating: 4.9, description: 'Elite tertiary care hospital with advanced robotic surgery and state-of-the-art cardiology.', city: 'Mumbai', state: 'Maharashtra' },
              { id: 'h2', name: 'Apollo General Hospital', rating: 4.8, description: 'World-renowned medical expertise and research-driven treatments for complex cases.', city: 'Delhi', state: 'Delhi' },
            ]).map((h: any, i: number) => {
              const photos = Array.isArray(h.photos)
                ? h.photos.map((photo: any) => typeof photo === 'string' ? { url: photo, isCover: false } : photo).filter((photo: any) => photo?.url)
                : [];
              const cardImage = photos.find((photo: any) => photo.isCover)?.url || photos[0]?.url || h.logo;
              const location = [h.city, h.state, h.country].filter(Boolean).join(', ');
              return (
              <div key={h.id || i} className="relative group rounded-[28px] bg-white border border-slate-200/60 hover:border-rose-200 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <div className="flex">
                  {/* Square Logo / Photo Area */}
                  <div className={`w-40 min-h-full flex-shrink-0 relative overflow-hidden bg-gradient-to-br ${i % 2 === 0 ? 'from-rose-500 via-red-500 to-rose-600' : 'from-blue-500 via-indigo-500 to-blue-600'}`}>
                    {/* Grid pattern overlay */}
                    {cardImage && <img src={cardImage} alt={h.name} className="absolute inset-0 w-full h-full object-cover" />}
                    <div className={`absolute inset-0 ${cardImage ? 'bg-slate-950/35' : 'opacity-10'}`} style={cardImage ? undefined : { backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 overflow-hidden">
                        {h.logo ? (
                          <img src={h.logo} alt={h.name} className="w-full h-full object-cover bg-white" />
                        ) : (
                          <Building2 className="w-8 h-8 text-white" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        <span className="text-sm font-bold text-white">{h.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-7 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider">
                          <Shield className="w-3 h-3" /> Verified
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-wider">
                          <Heart className="w-3 h-3" /> Top Rated
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-rose-600 transition-colors leading-tight">{h.name}</h3>
                      {location && <p className="text-sm text-slate-400 mt-1.5 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{location}</p>}
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{h.description}</p>
                    <div className="flex gap-2.5 pt-1">
                      <Link to={isPatient ? `/patient/book/${h.id}` : '/login'} state={isPatient ? undefined : { next: `/patient/book/${h.id}` }} className={`flex-1 text-center py-3 font-bold rounded-xl active:scale-[0.97] transition-all text-sm ${i % 2 === 0 ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white hover:from-rose-700 hover:to-red-700 shadow-lg shadow-rose-500/20' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20'}`}>Book Appointment</Link>
                      <Link to={`/hospitals/${h.slug || h.id}`} className="px-5 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm">Details</Link>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why HOSCORE — Bento Grid */}
      <section id="why-hoscore" className="py-24 bg-slate-950 text-white overflow-hidden relative">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-rose-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-16 space-y-4">
            <p className="text-xs font-black text-rose-400 uppercase tracking-[0.2em]">Why Patients Love Us</p>
            <h2 className="text-4xl lg:text-5xl font-black">Healthcare, Reimagined</h2>
          </div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Large card */}
            <div className="md:col-span-2 bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-sm rounded-[28px] border border-white/[0.08] p-10 flex flex-col justify-between min-h-[280px] group hover:border-rose-500/30 transition-all">
              <div>
                <Activity className="w-10 h-10 text-rose-400 mb-4" />
                <h3 className="text-2xl font-black mb-3">All Your Records. One Place.</h3>
                <p className="text-slate-400 max-w-md leading-relaxed">Visit any HOSCORE hospital and your records follow you. No more carrying files, no more repeating history. Your complete health profile, always accessible.</p>
              </div>
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/[0.06]">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, j) => <div key={j} className={`w-8 h-8 rounded-full border-2 border-slate-950 bg-gradient-to-br ${['from-rose-400 to-red-500', 'from-blue-400 to-indigo-500', 'from-emerald-400 to-teal-500', 'from-amber-400 to-orange-500'][j]}`} />)}
                </div>
                <p className="text-sm text-slate-400">Trusted by <span className="text-white font-bold">1M+</span> patients</p>
              </div>
            </div>

            {/* Small cards stacked */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-rose-600/20 to-red-600/10 backdrop-blur-sm rounded-[24px] border border-rose-500/20 p-6 hover:border-rose-500/40 transition-all">
                <Shield className="w-8 h-8 text-rose-400 mb-3" />
                <h4 className="text-lg font-bold mb-1">100% Private</h4>
                <p className="text-sm text-slate-400">Your health data is encrypted and only you control who sees it.</p>
              </div>
              <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/10 backdrop-blur-sm rounded-[24px] border border-blue-500/20 p-6 hover:border-blue-500/40 transition-all">
                <Clock className="w-8 h-8 text-blue-400 mb-3" />
                <h4 className="text-lg font-bold mb-1">Zero Wait Time</h4>
                <p className="text-sm text-slate-400">Book your slot, skip the queue. Walk in exactly when it's your turn.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — Patient Focus */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-r from-rose-600 to-red-600 rounded-[40px] p-12 lg:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-red-400/20 blur-3xl translate-y-1/2 -translate-x-1/2 rounded-full" />
            <div className="relative z-10 space-y-6">
              <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">Take Control of<br />Your Health Today</h2>
              <p className="text-rose-100 text-lg max-w-xl mx-auto">Join millions who trust HOSCORE for their healthcare journey. Free forever for patients.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/login" className="w-full sm:w-auto px-10 py-5 bg-white text-rose-600 font-black rounded-2xl hover:bg-slate-50 transition-all shadow-2xl active:scale-[0.97] text-lg">Create Free Account</Link>
                <Link to="/for-hospitals" className="w-full sm:w-auto px-10 py-5 border border-white/30 text-white font-bold rounded-2xl hover:bg-white/10 transition-all">Are you a Hospital?</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Institutional Footer */}
      <footer className="bg-slate-950 text-slate-400 pt-24 pb-12 border-t border-slate-900 relative overflow-hidden">
        {/* Subtle decorative glows */}
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-rose-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Platform Performance Stat Panel */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-[28px] bg-slate-900/50 border border-slate-900/80 mb-16 shadow-2xl">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Patient Profiles</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-2xl font-bold text-white tracking-tight">1,420,892,104</p>
              </div>
              <p className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-wider">Verified Medical Identity Active</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Platform Uptime SLA</p>
              <p className="text-2xl font-bold text-white tracking-tight">99.9999%</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">HIPAA & GDPR Compliant Security</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Network Hospitals</p>
              <p className="text-2xl font-bold text-white tracking-tight">4,892</p>
              <p className="text-[10px] text-rose-500/80 font-bold uppercase tracking-wider">Verified Clinics & Labs</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Security Compliance</p>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <p className="text-sm font-extrabold text-white tracking-wider">HIPAA / GDPR / FHIR</p>
              </div>
              <p className="text-[10px] text-blue-400/80 font-bold uppercase tracking-wider">End-to-End Encryption</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 pb-16 border-b border-slate-900">
            {/* Column 1: Brand & Mission */}
            <div className="col-span-2 space-y-6">
              <div className="inline-flex items-center rounded-2xl bg-white px-4 py-3 shadow-lg shadow-black/20">
                <img src="/hoscore-logo.png" alt="HOSCORE" className="h-12 w-auto object-contain" />
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm font-medium">
                HOSCORE is the premier digital hospital network. A unified medical record standard ensuring that every patient profile is secure and optimized for seamless scheduling, queue monitoring, and clinical workflows.
              </p>
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">System Core Active</span>
              </div>
            </div>

            {/* Column 2: Patient Registry */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-white">Patient Ecosystem</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/login" className="hover:text-rose-400 transition-colors">Digital Health Profile</Link></li>
                <li><Link to="/patient/find" className="hover:text-rose-400 transition-colors">Find Network Hospitals</Link></li>
                <li><Link to="/login" className="hover:text-rose-400 transition-colors">Secure Health Timeline</Link></li>
                <li><Link to="/login" className="hover:text-rose-400 transition-colors">Digital Vitals Tracking</Link></li>
                <li><a href="#" className="hover:text-rose-400 transition-colors">Emergency Health Pass</a></li>
              </ul>
            </div>

            {/* Column 3: Institutional ERP */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-white">For Institutions</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/for-hospitals" className="hover:text-rose-400 transition-colors">Hospital ERP Suite</Link></li>
                <li><Link to="/register-hospital" className="hover:text-rose-400 transition-colors">List Your Hospital</Link></li>
                <li><Link to="/for-hospitals" className="hover:text-rose-400 transition-colors">Real-Time Queue Console</Link></li>
                <li><Link to="/for-hospitals" className="hover:text-rose-400 transition-colors">Institutional Pricing</Link></li>
                <li><a href="#" className="hover:text-rose-400 transition-colors">Partner Verification</a></li>
              </ul>
            </div>

            {/* Column 4: Standards & Trust */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-white">Trust & Compliance</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-rose-400 transition-colors">Sovereign Data Standard</a></li>
                <li><a href="#" className="hover:text-rose-400 transition-colors">HIPAA & GDPR Encryption</a></li>
                <li><a href="#" className="hover:text-rose-400 transition-colors">SLA & Security Uptime</a></li>
                <li><a href="#" className="hover:text-rose-400 transition-colors">Patient Bill of Rights</a></li>
                <li><a href="#" className="hover:text-rose-400 transition-colors">Decentralized Vault Tech</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-12 flex flex-col md:flex-row items-center justify-between gap-8 text-xs font-bold text-slate-500">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <p>© 2026 HOSCORE Initiative. All rights reserved globally.</p>
              <div className="flex gap-4">
                <a href="#" className="hover:text-white transition-colors">Privacy Charter</a>
                <span>•</span>
                <a href="#" className="hover:text-white transition-colors">Registry Terms</a>
                <span>•</span>
                <a href="#" className="hover:text-white transition-colors">System Status</a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-600 font-extrabold uppercase tracking-wider">Powered by</span>
              <div className="inline-flex items-center rounded-xl bg-white px-3 py-2 opacity-70 hover:opacity-100 transition-opacity shadow-lg shadow-black/20">
                <img src="/bluevolt-logo.png" alt="BLUEVOLT GROUPS" className="h-8 w-auto object-contain" />
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
