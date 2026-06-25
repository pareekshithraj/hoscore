import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle2, IndianRupee, Shield, Zap, Database, 
  BarChart3, Users, Building2, Clock, Globe2, ChevronRight, 
  Sparkles, Monitor, Cpu, ArrowUpRight, Bed, ClipboardList, Activity, 
  ArrowDownToLine, Star, Bell, Menu, X
} from 'lucide-react';

export const ForHospitals = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const leadersLogos = [
    { name: "Apollo Hospitals", icon: <Building2 className="w-5 h-5" /> },
    { name: "Fortis Healthcare", icon: <Shield className="w-5 h-5" /> },
    { name: "Max Healthcare", icon: <Activity className="w-5 h-5" /> },
    { name: "Manipal Hospitals", icon: <Star className="w-5 h-5" /> },
    { name: "Narayana Health", icon: <ClipboardList className="w-5 h-5" /> },
    { name: "Aster DM", icon: <Globe2 className="w-5 h-5" /> }
  ];

  // Double the list of logos to create a continuous looping track without gaps
  const doubledLogos = [...leadersLogos, ...leadersLogos, ...leadersLogos];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-blue-100/30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/hoscore-logo.png" alt="HOSCORE" className="h-14 object-contain" />
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#modules" className="hover:text-blue-600 transition-colors">Modules</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            <Link to="/" className="hover:text-blue-600 transition-colors">← Patient Home</Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm font-bold text-slate-900 hover:text-blue-600 px-4 py-2">Sign In</Link>
            <Link to="/register-hospital" className="border border-slate-900 text-slate-900 rounded-full px-5 py-2 hover:bg-slate-900 hover:text-white transition-all text-sm font-bold active:scale-95">
              Book a Demo
            </Link>
          </div>

          {/* Hamburger Mobile Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-95 cursor-pointer z-50 relative"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        <div className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-lg md:hidden transition-all duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}>
          <div className={`absolute top-0 right-0 w-80 h-full bg-white shadow-2xl p-6 pt-24 flex flex-col justify-between transition-transform duration-300 ease-out transform ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="flex flex-col gap-6 text-base font-extrabold text-slate-800">
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-blue-600 border-b border-slate-100 pb-3 transition-colors"
              >
                Features
              </a>
              <a 
                href="#modules" 
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-blue-600 border-b border-slate-100 pb-3 transition-colors"
              >
                Modules
              </a>
              <a 
                href="#pricing" 
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-blue-600 border-b border-slate-100 pb-3 transition-colors"
              >
                Pricing
              </a>
              <Link 
                to="/" 
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-blue-600 border-b border-slate-100 pb-3 transition-colors"
              >
                ← Patient Home
              </Link>
            </div>

            <div className="flex flex-col gap-4 pt-8">
              <Link 
                to="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 text-slate-950 font-black hover:text-blue-600 transition-colors"
              >
                Sign In
              </Link>
              <Link 
                to="/register-hospital" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-4 bg-slate-950 text-white rounded-full font-black text-center shadow-lg active:scale-[0.98] transition-all"
              >
                Book a Demo
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Sky-Blue Cloud Gradient */}
      <section className="relative pt-32 pb-4 overflow-hidden bg-gradient-to-b from-[#cbdffd] via-[#e2edfe] to-white flex flex-col items-center">
        {/* Soft floating background blurs for depth */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#b7d6ff]/40 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-[#cfe0ff]/30 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center space-y-6 relative z-20 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Seamless Digital Hospital<br />
            <span className="bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">Operations Management</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600/90 leading-relaxed max-w-3xl mx-auto font-semibold">
            A powerful multi-tenant platform that digitizes operations, streamlines clinical workflows, and guarantees patient safety. No friction. All connected.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link to="/register-hospital" className="px-8 py-3.5 bg-slate-950 text-white text-base font-bold rounded-full hover:bg-slate-900 shadow-xl shadow-slate-950/20 active:scale-95 transition-all duration-300">
              Book a Demo
            </Link>
          </div>
        </div>

        {/* Mock Browser Frame Floating in Clouds */}
        <div className="w-full max-w-6xl px-4 md:px-8 pt-16 relative z-10">
          <div className="w-full bg-white rounded-t-2xl shadow-[0_25px_60px_-15px_rgba(37,99,235,0.15)] border border-slate-200/60 overflow-hidden transform hover:-translate-y-1 transition-transform duration-500">
            
            {/* Browser Header Bar */}
            <div className="w-full h-11 bg-slate-50 border-b border-slate-200/50 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="w-full max-w-xs sm:max-w-md h-6.5 bg-white border border-slate-200/60 rounded-md text-[11px] text-slate-400 flex items-center justify-center font-semibold shadow-inner">
                <span className="text-slate-300 mr-1">https://</span>hoscore.com/dashboard
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span className="w-3.5 h-3.5 font-bold text-xs">+</span>
              </div>
            </div>

            {/* Dashboard Preview Content */}
            <div className="bg-slate-50/50 p-4 sm:p-6 text-slate-900 text-left min-h-[500px] flex flex-col gap-6">
              
              {/* Inner Dashboard Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-950">City General Hospital</h2>
                    <p className="text-xs text-slate-500 font-bold">OPD Command Console</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="relative">
                    <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer shadow-sm">
                      <Bell className="w-4 h-4" />
                      <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center font-black text-blue-600 text-sm">
                      PR
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs font-black text-slate-900">Dr. Pareekshith Raj</p>
                      <p className="text-[10px] font-bold text-slate-400">Chief Coordinator</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid of Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Card 1 */}
                <div className="bg-white border border-slate-200/60 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Active Wards</p>
                    <p className="text-2xl font-black text-slate-950">12 Wards</p>
                    <p className="text-xs text-slate-400 font-bold">2 Isolation Units</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                    <Building2 className="w-6 h-6" />
                  </div>
                </div>
                {/* Card 2 */}
                <div className="bg-white border border-slate-200/60 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Queue Status</p>
                    <p className="text-2xl font-black text-slate-950">18 Patients</p>
                    <p className="text-xs text-slate-400 font-bold">Avg Delay: 12 mins</p>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
                {/* Card 3 */}
                <div className="bg-white border border-slate-200/60 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-teal-600 uppercase tracking-wider">Bed Saturation</p>
                    <p className="text-2xl font-black text-slate-950">84% Capacity</p>
                    <p className="text-xs text-slate-400 font-bold">8 Open ICU Slots</p>
                  </div>
                  <div className="p-3 bg-teal-50 rounded-2xl text-teal-600">
                    <Bed className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Lower Details Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Patients Table */}
                <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-950 text-sm">Live Patient Admission Queue</h3>
                    <span className="text-[10px] bg-blue-50 text-blue-600 font-extrabold px-2.5 py-1 rounded-full">Updated Live</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                          <th className="px-5 py-3">Patient</th>
                          <th className="px-5 py-3">Department</th>
                          <th className="px-5 py-3">Priority</th>
                          <th className="px-5 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { name: "Amit Kumar", dept: "Cardiology", prio: "Critical", pColor: "bg-rose-50 text-rose-600 border-rose-100", status: "Admitted" },
                          { name: "Priyanjana Sen", dept: "Orthopedics", prio: "Medium", pColor: "bg-amber-50 text-amber-600 border-amber-100", status: "In Consultation" },
                          { name: "Rohit Malhotra", dept: "Pediatrics", prio: "Routine", pColor: "bg-slate-100 text-slate-600 border-slate-200", status: "Discharged" },
                        ].map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3.5 font-bold text-slate-900">{row.name}</td>
                            <td className="px-5 py-3.5 text-slate-600 font-medium">{row.dept}</td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2.5 py-0.5 border text-[10px] font-extrabold rounded-full ${row.pColor}`}>
                                {row.prio}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-bold text-slate-700">{row.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sidebar Metrics */}
                <div className="flex flex-col gap-4">
                  {/* Saturation Gauge Card */}
                  <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Clinical Occupancy</h4>
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    </div>
                    
                    <div className="flex items-center gap-5">
                      {/* SVG Gauge */}
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-100"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-blue-600"
                            strokeDasharray="84, 100"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className="absolute text-sm font-black text-slate-900">84%</span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900">42 Beds Occupied</p>
                        <p className="text-[11px] text-slate-400 font-bold">Near Saturation Limit</p>
                      </div>
                    </div>
                  </div>

                  {/* Resource Usage Widget */}
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl p-5 shadow-sm space-y-4">
                    <h4 className="text-[10px] font-black text-blue-200 uppercase tracking-wider">Storage & Pharmacy Usage</h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>IV Fluids & Salines</span>
                        <span>75%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full" style={{ width: "75%" }} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>Critical Antibiotics</span>
                        <span>25%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full" style={{ width: "25%" }} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Absolute Volumetric Clouds / Mist Overlays at the bottom of the hero */}
          <div className="absolute bottom-[-1px] left-0 right-0 h-40 bg-gradient-to-t from-white via-white/95 to-transparent z-20 pointer-events-none" />
          
          {/* Decorative volumetric cloud puffs */}
          <div className="absolute bottom-[-20px] left-[-50px] w-96 h-36 bg-white/80 filter blur-xl rounded-full opacity-90 z-20 pointer-events-none" />
          <div className="absolute bottom-[-40px] left-[15%] w-96 h-40 bg-white/90 filter blur-xl rounded-full opacity-95 z-20 pointer-events-none" />
          <div className="absolute bottom-[-30px] right-[10%] w-[450px] h-44 bg-white/90 filter blur-xl rounded-full opacity-95 z-20 pointer-events-none" />
          <div className="absolute bottom-[-10px] right-[-60px] w-80 h-36 bg-white/80 filter blur-xl rounded-full opacity-90 z-20 pointer-events-none" />
        </div>
      </section>

      {/* Trusted Leaders Section */}
      <section className="relative z-30 bg-white py-12 border-b border-slate-100 overflow-hidden">
        <div className="w-full text-center space-y-6">
          <p className="text-xs font-black text-blue-600 uppercase tracking-[0.25em]">Trusted By Leaders</p>
          
          {/* Marquee Track Container */}
          <div className="relative w-full flex items-center overflow-hidden py-2 bg-slate-50/40 border-y border-slate-100/50">
            {/* Fade overlays on left/right edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            <div className="animate-marquee flex gap-16 items-center whitespace-nowrap">
              {doubledLogos.map((logo, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-slate-400 hover:text-slate-600 transition-colors font-black text-sm uppercase tracking-wide cursor-default select-none">
                  {logo.icon}
                  <span>{logo.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Features Bento */}
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

      {/* Modules */}
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
            <div className="flex items-center gap-8 text-sm font-semibold text-slate-500">
              <Link to="/" className="hover:text-blue-600 transition-colors">Patient Home</Link>
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-semibold">Powered by</span>
              <img src="/bluevolt-logo.png" alt="BLUEVOLT GROUPS" className="h-12 object-contain" />
            </div>
            <p className="text-sm text-slate-400">© 2026 HOSCORE. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
