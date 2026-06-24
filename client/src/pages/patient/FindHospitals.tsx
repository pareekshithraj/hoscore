import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Search, Star, Shield, MapPin } from 'lucide-react';

export const FindHospitals = () => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/hospitals').then(d => { if (Array.isArray(d)) setHospitals(d); }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = hospitals.filter(h => h.name.toLowerCase().includes(search.toLowerCase()) || h.city?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Find Partnered Hospitals</h1>
      </div>
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input type="text" placeholder="Search by hospital name or city..." className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500/50 placeholder-slate-500" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {filtered.map((h: any) => (
          <div key={h.id} className="glass-card rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="h-1.5 bg-gradient-to-r from-rose-600 to-red-600" />
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase mb-2"><Shield className="w-3 h-3" /> Verified</div>
                    <h3 className="text-xl font-bold text-white">{h.name}</h3>
                    {h.city && <p className="text-sm text-slate-400 flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5 text-slate-500" />{h.city}{h.state ? `, ${h.state}` : ''}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg"><Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /><span className="text-sm font-bold text-amber-400">{h.rating || 'N/A'}</span></div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">{h.description || 'No description available for this partner facility.'}</p>
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="grid grid-cols-2 gap-3">
                <Link to={`/hospitals/${h.slug || h.id}`} className="block text-center py-3 border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl active:scale-[0.98] transition-all duration-300">Profile</Link>
                <Link to={`/patient/book/${h.id}`} className="block text-center py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-xl shadow-lg shadow-rose-950/25 active:scale-[0.98] transition-all duration-300">Book</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
