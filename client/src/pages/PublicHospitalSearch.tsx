import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { Building2, MapPin, Search, Shield, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

type Hospital = {
  id: string;
  name: string;
  slug?: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  address?: string | null;
  description?: string | null;
  logo?: string | null;
  photos?: Array<string | { url: string; caption?: string; isCover?: boolean }> | null;
  rating?: number;
  isPartnered?: boolean;
};

const locationSlug = (value?: string | null) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export const PublicHospitalSearch = () => {
  const { country, state, city } = useParams();
  const { activeContext } = useAuth();
  const isPatient = activeContext?.type === 'patient';
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [query, setQuery] = useState('');
  const [area, setArea] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const locationParts = [city, state, country].filter(Boolean).map((part) => String(part).replace(/-/g, ' '));
    const locationTitle = locationParts.length ? ` in ${locationParts.join(', ')}` : ' Near You';
    document.title = `Find Hospitals${locationTitle} | HOSCORE Verified Hospital Profiles`;
    const description = `Search verified HOSCORE hospital profiles${locationParts.length ? ` in ${locationParts.join(', ')}` : ''} by name, city, state, and area. View ratings, doctors, trust profile, and appointment access.`;
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;
  }, [country, state, city]);

  useEffect(() => {
    fetch(`${BASE_URL}/hospitals`)
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) setHospitals(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const areas = useMemo(() => {
    const values = new Set<string>();
    hospitals.forEach((hospital) => {
      if (hospital.city) values.add(hospital.city);
      if (hospital.state) values.add(hospital.state);
      if (hospital.country) values.add(hospital.country);
    });
    return Array.from(values).sort();
  }, [hospitals]);

  const locationFilter = [country, state, city].filter(Boolean).join(' ').replace(/-/g, ' ').toLowerCase();

  const filtered = hospitals.filter((hospital) => {
    const haystack = [hospital.name, hospital.city, hospital.state, hospital.country, hospital.address, hospital.description].filter(Boolean).join(' ').toLowerCase();
    const matchesQuery = !query || haystack.includes(query.toLowerCase());
    const matchesArea = !area || haystack.includes(area.toLowerCase());
    const matchesLocationRoute = !locationFilter || locationFilter.split(' ').every((part) => haystack.includes(part));
    return matchesQuery && matchesArea && matchesLocationRoute;
  });

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/hoscore-logo.png" alt="HOSCORE" className="h-14 object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-bold text-slate-700 hover:text-rose-600">Sign In</Link>
            <Link to="/login" state={{ mode: 'register' }} className="px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-600 to-red-600 text-white text-sm font-black shadow-lg shadow-rose-500/20">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <header className="relative overflow-hidden bg-slate-950 text-white py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(244,63,94,0.22),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(37,99,235,0.20),transparent_32%)]" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-400/20 px-4 py-2 text-xs font-black text-rose-200 uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              Verified HOSCORE Network
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-[0.95]">Search hospitals in your area.</h1>
            <p className="text-lg text-slate-300 leading-relaxed font-medium">
              Find verified HOSCORE hospital profiles by location, compare ratings, view specialties, and continue to appointment booking after patient login.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50 p-4 md:p-5 -mt-24 relative z-10 mb-12">
          <div className="grid md:grid-cols-[1fr_260px] gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search hospital name, specialty, city, area..."
                className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
            <select
              value={area}
              onChange={(event) => setArea(event.target.value)}
              className="h-14 px-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="">All areas</option>
              {areas.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-rose-600/20 border-t-rose-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-slate-500 uppercase tracking-wider">{filtered.length} hospitals found</p>
              <Link to="/" className="text-sm font-black text-rose-600 hover:text-rose-700">Back to home</Link>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {filtered.map((hospital, index) => {
                const bookingPath = `/patient/book/${hospital.id}`;
                const photos = Array.isArray(hospital.photos)
                  ? hospital.photos.map((photo: any) => typeof photo === 'string' ? { url: photo, isCover: false } : photo).filter((photo: any) => photo?.url)
                  : [];
                const cardImage = photos.find((photo: any) => photo.isCover)?.url || photos[0]?.url || hospital.logo;
                const location = [hospital.city, hospital.state, hospital.country].filter(Boolean).join(', ');
                const locationPath = hospital.country && hospital.state && hospital.city
                  ? `/hospitals/${locationSlug(hospital.country)}/${locationSlug(hospital.state)}/${locationSlug(hospital.city)}`
                  : '';
                return (
                  <div key={hospital.id} className="rounded-[28px] border border-slate-200 bg-white overflow-hidden hover:border-rose-200 hover:shadow-2xl transition-all duration-300">
                    <div className="grid sm:grid-cols-[180px_1fr]">
                      <div className={`min-h-56 relative bg-gradient-to-br ${index % 2 === 0 ? 'from-rose-600 to-red-600' : 'from-blue-600 to-indigo-600'} flex items-center justify-center`}>
                        {cardImage && <img src={cardImage} alt={hospital.name} className="absolute inset-0 w-full h-full object-cover" />}
                        <div className={`absolute inset-0 ${cardImage ? 'bg-slate-950/30' : 'opacity-15'}`} style={cardImage ? undefined : { backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                        <div className="w-20 h-20 rounded-3xl bg-white/95 shadow-2xl flex items-center justify-center overflow-hidden relative z-10">
                          {hospital.logo ? <img src={hospital.logo} alt={hospital.name} className="w-full h-full object-cover" /> : <Building2 className="w-10 h-10 text-rose-600" />}
                        </div>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase mb-2">
                              <Shield className="w-3 h-3" />
                              Verified
                            </div>
                            <h2 className="text-xl font-black">{hospital.name}</h2>
                            {location && (locationPath ? (
                              <Link to={locationPath} className="mt-1 text-sm font-bold text-slate-400 flex items-center gap-1 hover:text-rose-600 transition-colors">
                                <MapPin className="w-3.5 h-3.5" />
                                {location}
                              </Link>
                            ) : (
                              <p className="mt-1 text-sm font-bold text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {location}
                              </p>
                            ))}
                          </div>
                          <div className="flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-2 text-amber-700 font-black">
                            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                            {hospital.rating || 'N/A'}
                          </div>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{hospital.description || 'Verified HOSCORE hospital profile.'}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <Link to={`/hospitals/${hospital.slug || hospital.id}`} className="text-center py-3 rounded-xl border border-slate-200 text-slate-700 font-black hover:bg-slate-50">
                            View Profile
                          </Link>
                          <Link to={isPatient ? bookingPath : '/login'} state={isPatient ? undefined : { next: bookingPath }} className="text-center py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-black shadow-lg shadow-rose-500/20">
                            {isPatient ? 'Book' : 'Login to Book'}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
