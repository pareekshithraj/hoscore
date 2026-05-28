import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  HeartPulse,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

type HospitalProfileData = {
  id: string;
  name: string;
  slug?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  contact?: string | null;
  description?: string | null;
  logo?: string | null;
  rating?: number;
  isPartnered?: boolean;
  doctors?: Array<{ id: string; name: string; specialty: string; rating?: number; status?: string }>;
  _count?: { rooms?: number; doctors?: number; appointments?: number };
};

function setMeta(name: string, content: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let tag = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    if (property) tag.setAttribute('property', name);
    else tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setCanonical(url: string) {
  let tag = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!tag) {
    tag = document.createElement('link');
    tag.rel = 'canonical';
    document.head.appendChild(tag);
  }
  tag.href = url;
}

export const HospitalProfile = () => {
  const { id } = useParams();
  const { activeContext } = useAuth();
  const isPatient = activeContext?.type === 'patient';
  const [hospital, setHospital] = useState<HospitalProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${BASE_URL}/hospitals/${id}`)
      .then((response) => {
        if (!response.ok) throw new Error('Hospital not found');
        return response.json();
      })
      .then((data) => {
        setHospital(data);
        setError('');
      })
      .catch(() => setError('Hospital profile not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const locationText = [hospital?.city, hospital?.state].filter(Boolean).join(', ');
  const specialties = useMemo(() => {
    const unique = new Set((hospital?.doctors || []).map((doctor) => doctor.specialty).filter(Boolean));
    return Array.from(unique);
  }, [hospital]);
  const profilePath = hospital ? `/hospitals/${hospital.slug || hospital.id}` : '';
  const bookingPath = hospital ? `/patient/book/${hospital.id}` : '/patient/find';

  useEffect(() => {
    if (!hospital) return;
    const title = `${hospital.name} HOSCORE Profile | Doctors, Appointments, Ratings`;
    const description = `${hospital.name}${locationText ? ` in ${locationText}` : ''} on HOSCORE. View verified hospital profile, doctors, specialties, ratings, patient services, and appointment access.`;
    const canonical = `${window.location.origin}${profilePath}`;

    document.title = title;
    setMeta('description', description);
    setMeta('robots', 'index,follow,max-image-preview:large');
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:type', 'profile', true);
    setMeta('og:url', canonical, true);
    setMeta('og:image', hospital.logo || `${window.location.origin}/hoscore-logo.png`, true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setCanonical(canonical);

    const schemaId = 'hospital-profile-schema';
    document.getElementById(schemaId)?.remove();
    const script = document.createElement('script');
    script.id = schemaId;
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Hospital',
      name: hospital.name,
      description,
      url: canonical,
      image: hospital.logo || `${window.location.origin}/hoscore-logo.png`,
      telephone: hospital.contact || undefined,
      address: {
        '@type': 'PostalAddress',
        streetAddress: hospital.address || undefined,
        addressLocality: hospital.city || undefined,
        addressRegion: hospital.state || undefined,
      },
      aggregateRating: hospital.rating
        ? {
            '@type': 'AggregateRating',
            ratingValue: hospital.rating,
            bestRating: 5,
            ratingCount: Math.max(hospital._count?.appointments || 1, 1),
          }
        : undefined,
      medicalSpecialty: specialties,
    });
    document.head.appendChild(script);
  }, [hospital, locationText, profilePath, specialties]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-400">Loading verified HOSCORE profile...</p>
        </div>
      </div>
    );
  }

  if (!hospital || error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 text-white">
        <div className="max-w-md text-center space-y-5">
          <Building2 className="w-14 h-14 text-rose-400 mx-auto" />
          <h1 className="text-3xl font-black">Hospital Profile Not Found</h1>
          <p className="text-slate-400">This HOSCORE hospital profile is unavailable or no longer active.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-950 font-black">
            <ArrowLeft className="w-4 h-4" />
            Back to HOSCORE
          </Link>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Verified Doctors', value: hospital._count?.doctors || hospital.doctors?.length || 0, icon: Stethoscope },
    { label: 'Care Rooms', value: hospital._count?.rooms || 0, icon: Building2 },
    { label: 'Network Rating', value: hospital.rating?.toFixed(1) || 'N/A', icon: Star },
    { label: 'Appointments', value: hospital._count?.appointments || 0, icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-950 overflow-hidden">
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/85 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/hoscore-logo.png" alt="HOSCORE" className="h-14 object-contain" />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            <a href="#overview" className="hover:text-rose-600 transition-colors">Overview</a>
            <a href="#doctors" className="hover:text-rose-600 transition-colors">Doctors</a>
            <a href="#trust" className="hover:text-rose-600 transition-colors">Trust</a>
          </div>
          <Link
            to={isPatient ? bookingPath : '/login'}
            state={isPatient ? undefined : { next: bookingPath }}
            className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white text-sm font-black rounded-full shadow-lg shadow-rose-500/20 hover:from-rose-700 hover:to-red-700 active:scale-95 transition-all"
          >
            Book Appointment
          </Link>
        </div>
      </nav>

      <header id="overview" className="relative pt-28 pb-16 bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(244,63,94,0.25),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.22),transparent_30%)]" />
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="max-w-7xl mx-auto px-6 relative">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to hospital network
          </Link>

          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-400/20 px-3 py-1.5 text-xs font-black text-emerald-300 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  HOSCORE Verified Profile
                </span>
                {hospital.isPartnered && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-400/20 px-3 py-1.5 text-xs font-black text-rose-200 uppercase tracking-wider">
                    <Award className="w-4 h-4" />
                    Partner Hospital
                  </span>
                )}
              </div>

              <div className="space-y-5">
                <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-[0.95]">
                  {hospital.name}
                </h1>
                <p className="max-w-2xl text-lg text-slate-300 leading-relaxed font-medium">
                  {hospital.description || 'A verified HOSCORE hospital profile with secure appointment access, doctor discovery, and patient-first digital records.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-300">
                {locationText && (
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                    <MapPin className="w-4 h-4 text-rose-300" />
                    {locationText}
                  </span>
                )}
                {hospital.contact && (
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                    <Phone className="w-4 h-4 text-blue-300" />
                    {hospital.contact}
                  </span>
                )}
                <span className="inline-flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                  <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                  {hospital.rating || 'N/A'} HOSCORE rating
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to={isPatient ? bookingPath : '/login'}
                  state={isPatient ? undefined : { next: bookingPath }}
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-black shadow-xl shadow-rose-950/30 hover:from-rose-500 hover:to-red-500 active:scale-[0.98] transition-all"
                >
                  <Calendar className="w-5 h-5" />
                  Book Appointment
                </Link>
                <a
                  href="#doctors"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white/10 border border-white/15 text-white font-black hover:bg-white/15 active:scale-[0.98] transition-all"
                >
                  <Search className="w-5 h-5" />
                  View Specialists
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-r from-rose-500/20 to-blue-500/20 blur-3xl rounded-full" />
              <div className="relative rounded-[36px] bg-white/[0.08] border border-white/10 p-6 shadow-2xl backdrop-blur-xl">
                <div className="rounded-[28px] bg-white text-slate-950 p-6 space-y-6">
                  <div className="h-56 rounded-[24px] bg-gradient-to-br from-rose-600 via-red-500 to-blue-600 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                    <div className="w-28 h-28 rounded-[28px] bg-white/95 shadow-2xl flex items-center justify-center overflow-hidden">
                      {hospital.logo ? (
                        <img src={hospital.logo} alt={hospital.name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-14 h-14 text-rose-600" />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {statCards.map((stat) => {
                      const Icon = stat.icon;
                      return (
                        <div key={stat.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                          <Icon className="w-5 h-5 text-rose-600 mb-3" />
                          <p className="text-2xl font-black">{stat.value}</p>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-3 gap-6">
            {[
              { title: 'Verified Identity', body: 'A public HOSCORE profile gives patients one trusted source for hospital details, doctors, and appointment access.', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
              { title: 'Patient-First Access', body: 'Online appointment booking is available only after patient login, keeping health access tied to a verified profile.', icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100' },
              { title: 'Digital Care Network', body: 'Profiles connect discovery, queue flow, prescriptions, vitals, records, and hospital operations inside HOSCORE.', icon: HeartPulse, color: 'text-rose-600 bg-rose-50 border-rose-100' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[28px] border border-slate-200 p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 ${item.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-black mb-2">{item.title}</h2>
                  <p className="text-sm leading-relaxed text-slate-500 font-medium">{item.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="doctors" className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-xs font-black text-rose-600 uppercase tracking-[0.2em] mb-3">Clinical Network</p>
                <h2 className="text-4xl font-black">Doctors and Specialties</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {specialties.slice(0, 5).map((specialty) => (
                  <span key={specialty} className="rounded-full bg-white border border-slate-200 px-4 py-2 text-xs font-black text-slate-600">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>

            {hospital.doctors && hospital.doctors.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {hospital.doctors.map((doctor) => (
                  <div key={doctor.id} className="rounded-[28px] bg-white border border-slate-200 p-6 hover:border-rose-200 hover:shadow-xl transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-red-600 text-white flex items-center justify-center font-black shadow-lg shadow-rose-500/20">
                        {doctor.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-slate-950 truncate">{doctor.name}</h3>
                        <p className="text-sm text-slate-500 font-bold">{doctor.specialty}</p>
                        <div className="flex items-center gap-3 mt-3 text-xs font-bold">
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            {doctor.rating || 'N/A'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <Clock className="w-3.5 h-3.5" />
                            {doctor.status || 'Available'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center">
                <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-black text-slate-700">Specialist directory is being updated.</p>
              </div>
            )}
          </div>
        </section>

        <section id="trust" className="py-20 bg-slate-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(244,63,94,0.18),transparent_25%)]" />
          <div className="max-w-7xl mx-auto px-6 relative grid lg:grid-cols-[0.8fr_1.2fr] gap-12 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-400/20 px-4 py-2 text-xs font-black text-rose-200 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                Search-Ready HOSCORE Identity
              </div>
              <h2 className="text-4xl lg:text-5xl font-black leading-tight">A public trust page for every verified hospital.</h2>
              <p className="text-slate-400 leading-relaxed font-medium">
                Like a company profile on LinkedIn or Crunchbase, HOSCORE hospital profiles give patients a trusted destination for discovery, verification, and care access.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                'Indexed profile URL with hospital name and location metadata',
                'Structured Hospital schema for search engines',
                'Canonical profile URL and social sharing metadata',
                'Verified partner status and appointment access controls',
              ].map((text) => (
                <div key={text} className="rounded-2xl bg-white/[0.06] border border-white/[0.08] p-5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300 mb-4" />
                  <p className="text-sm font-bold text-slate-200 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
