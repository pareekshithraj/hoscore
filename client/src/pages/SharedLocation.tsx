import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Loader2, Building2, Clock, HeartPulse } from 'lucide-react';
import { BASE_URL } from '../utils/apiConfig';
import { MapCanvas, type Marker } from '../components/map/MapCanvas';
import { normaliseFloor, type Floor, type HospitalMapDoc } from '../utils/mapModel';

interface SharedData {
  hospital?: { name: string; address?: string; city?: string };
  label?: string;
  note?: string;
  floorId: string;
  cell: { r: number; c: number };
  map?: HospitalMapDoc | null;
  updatedAt: string;
}

// Public, unauthenticated page a family member opens from a share link.
export const SharedLocation = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchIt = () => {
    fetch(`${BASE_URL}/shared-location/${token}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Link unavailable');
        return r.json();
      })
      .then((d) => { setData(d); setError(null); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchIt();
    const iv = setInterval(fetchIt, 15000); // poll for live movement
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const floor: Floor | null = useMemo(() => {
    if (!data?.map?.floors?.length) return null;
    const f = data.map.floors.find((x) => x.id === data.floorId) ?? data.map.floors[0];
    return normaliseFloor(f, data.map.rows, data.map.cols);
  }, [data]);

  const markers: Marker[] = useMemo(
    () => (data ? [{ cell: data.cell, label: data.label || 'Patient', kind: 'patient', pulse: true }] : []),
    [data],
  );

  return (
    <div className="min-h-screen bg-[#0a0e1a] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20"><HeartPulse className="h-6 w-6" /></div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">HOSCORE · Patient Location</h1>
            <p className="text-xs text-slate-400">Shared with you by your family member</p>
          </div>
        </div>

        {loading ? (
          <div className="flex h-72 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-500" /></div>
        ) : error ? (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-8 text-center">
            <MapPin className="mx-auto mb-2 h-8 w-8 text-rose-400/60" />
            <p className="text-sm font-bold text-rose-300">{error}</p>
            <p className="mt-1 text-xs text-slate-500">The link may have expired or been turned off.</p>
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-sky-300"><Building2 className="h-4 w-4" /><span className="text-sm font-black text-white">{data.hospital?.name}</span></div>
              {data.hospital?.address && <p className="mt-1 text-xs text-slate-400">{[data.hospital.address, data.hospital.city].filter(Boolean).join(', ')}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300"><MapPin className="mr-1 inline h-3 w-3" />{data.label || 'Patient location'}</span>
                {floor && <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-bold text-slate-300">{floor.label}</span>}
              </div>
              {data.note && <p className="mt-3 rounded-lg bg-black/30 p-2 text-xs text-slate-300">{data.note}</p>}
            </div>

            {floor ? (
              <div className="rounded-xl border border-sky-500/10 bg-white/[0.03] p-4">
                <MapCanvas cells={floor.cells} anchors={floor.anchors} markers={markers} showAnchorLabels />
              </div>
            ) : (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-8 text-center text-xs text-slate-500">Map not available for this hospital.</div>
            )}

            <p className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
              <Clock className="h-3 w-3" /> Updated {new Date(data.updatedAt).toLocaleTimeString()} · refreshes automatically
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
