import { useEffect, useMemo, useState } from 'react';
import { X, Navigation, Compass, MapPin, Share2, Copy, Check, Loader2, BedDouble } from 'lucide-react';
import { api } from '../services/api';
import { MapCanvas, type Marker } from './map/MapCanvas';
import {
  findPath, pathToDirections, normaliseFloor,
  type Cell, type Floor, type HospitalMapDoc,
} from '../utils/mapModel';

interface WayfindingModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination?: string; // legacy label; when set, tries to route to a matching anchor
}

interface MyLocationResponse {
  admitted: boolean;
  hospital?: { id: string; name: string };
  room?: { id: string; name: string; type: string };
  bed?: { id: string; bedNumber: string };
  map?: HospitalMapDoc | null;
  position?: { floorId: string; cellR: number; cellC: number; label?: string } | null;
}

export const WayfindingModal = ({ isOpen, onClose, destination }: WayfindingModalProps) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MyLocationResponse | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setShareUrl(null);
    api.get('/patient/location')
      .then((res) => setData(res))
      .catch(() => setData({ admitted: false }))
      .finally(() => setLoading(false));
  }, [isOpen]);

  // Resolve the active floor + destination cell + entrance start, then A*.
  const routed = useMemo(() => {
    if (!data?.map?.floors?.length) return null;
    const map = data.map;
    const norm = (f: Floor) => normaliseFloor(f, map.rows, map.cols);

    // Destination: the patient's live position, else their bed/room anchor, else a labelled anchor match.
    let floor: Floor | undefined;
    let dest: Cell | undefined;
    let destLabel = destination || 'your room';

    if (data.position) {
      floor = map.floors.find((f) => f.id === data.position!.floorId);
      dest = { r: data.position.cellR, c: data.position.cellC };
      destLabel = data.position.label || destLabel;
    }
    if (!dest) {
      for (const f of map.floors) {
        const anchor = f.anchors.find((a) =>
          (data.bed && a.bedId === data.bed.id) ||
          (data.room && a.roomId === data.room.id) ||
          (destination && a.label.toLowerCase().includes(destination.toLowerCase())),
        );
        if (anchor) { floor = f; dest = anchor.cell; destLabel = anchor.label; break; }
      }
    }
    if (!floor) floor = map.floors[0];
    if (!dest) return { floor: norm(floor), path: [] as Cell[], destLabel, dest: undefined, start: undefined };

    const nf = norm(floor);
    const entrance = nf.anchors.find((a) => a.kind === 'entrance');
    const start: Cell = entrance?.cell ?? { r: nf.cells.length - 1, c: Math.floor((nf.cells[0]?.length ?? 1) / 2) };
    const path = findPath(nf.cells, start, dest);
    return { floor: nf, path, destLabel, dest, start };
  }, [data, destination]);

  const markers: Marker[] = useMemo(() => {
    const m: Marker[] = [];
    if (routed?.start) m.push({ cell: routed.start, label: 'Entrance', kind: 'you' });
    if (routed?.dest) m.push({ cell: routed.dest, label: routed.destLabel, kind: 'destination', pulse: true });
    return m;
  }, [routed]);

  const steps = useMemo(
    () => (routed?.path?.length ? pathToDirections(routed.path, routed.destLabel) : []),
    [routed],
  );

  const share = async () => {
    setSharing(true);
    try {
      const res = await api.post('/patient/location/share', { expiresHours: 24 });
      const url = `${window.location.origin}/shared-location/${res.shareToken}`;
      setShareUrl(url);
    } catch { /* ignore */ } finally { setSharing(false); }
  };

  const copy = async () => {
    if (!shareUrl) return;
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="glass-card animate-fade-in-up flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl md:flex-row">
        {/* Left: live map */}
        <div className="flex min-h-[350px] flex-1 flex-col items-center justify-center border-r border-white/[0.04] bg-slate-900/50 p-6 md:min-h-[460px]">
          <div className="mb-4 flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 animate-[spin_6s_linear_infinite] text-sky-400" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Live Indoor Wayfinder</span>
            </div>
            {data?.hospital && <span className="rounded border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-sky-400">{data.hospital.name}</span>}
          </div>

          <div className="w-full max-w-[360px]">
            {loading ? (
              <div className="flex aspect-square items-center justify-center rounded-lg border border-white/[0.06] bg-black/40"><Loader2 className="h-6 w-6 animate-spin text-slate-500" /></div>
            ) : !data?.admitted ? (
              <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border border-white/[0.06] bg-black/40 p-6 text-center">
                <BedDouble className="h-8 w-8 text-slate-600" />
                <p className="text-xs font-bold text-slate-400">You're not currently admitted.</p>
                <p className="text-[10px] text-slate-500">Indoor wayfinding activates when you're admitted to a hospital with a published map.</p>
              </div>
            ) : !data.map ? (
              <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border border-white/[0.06] bg-black/40 p-6 text-center">
                <MapPin className="h-8 w-8 text-slate-600" />
                <p className="text-xs font-bold text-slate-400">This hospital hasn't published a map yet.</p>
              </div>
            ) : (
              <MapCanvas cells={routed!.floor.cells} anchors={routed!.floor.anchors} path={routed!.path} markers={markers} showAnchorLabels />
            )}
          </div>
          {data?.admitted && routed?.floor && <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">{routed.floor.label}</p>}
        </div>

        {/* Right: directions + share */}
        <div className="flex w-full flex-col justify-between p-6 md:w-[350px]">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-black tracking-tight text-white">Your Location</h3>
              <button onClick={onClose} className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {data?.admitted && (data.room || data.bed) && (
              <div className="mb-4 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-400">You are in</span>
                <h2 className="text-xl font-black leading-tight text-white">{data.room?.name}{data.bed ? ` · Bed ${data.bed.bedNumber}` : ''}</h2>
                {data.room?.type && <p className="mt-1 text-xs font-semibold text-slate-400">{data.room.type}</p>}
              </div>
            )}

            {steps.length > 0 ? (
              <div className="mt-6 space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Route from entrance</span>
                {steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border border-sky-400/20 bg-sky-500/10 text-[10px] font-black text-sky-400">{idx + 1}</div>
                    <p className="text-xs font-semibold leading-relaxed text-slate-300">{step}</p>
                  </div>
                ))}
              </div>
            ) : data?.admitted && data.map ? (
              <p className="mt-6 text-xs italic text-slate-500">No walkable route found. Ask staff to add an entrance & corridors in the Map Builder.</p>
            ) : null}
          </div>

          {/* Share with family */}
          {data?.admitted && (
            <div className="mt-6 border-t border-white/[0.04] pt-5">
              {!shareUrl ? (
                <button onClick={share} disabled={sharing} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-sky-500/20 transition-colors hover:bg-sky-400 disabled:opacity-50">
                  {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                  Share my location with family
                </button>
              ) : (
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Share link (valid 24h)</span>
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 p-2">
                    <input readOnly value={shareUrl} className="flex-1 bg-transparent text-[10px] text-slate-300 outline-none" />
                    <button onClick={copy} className="rounded-md bg-white/10 p-1.5 text-slate-300 hover:bg-white/20">{copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}</button>
                  </div>
                  <p className="text-[9px] text-slate-500">Anyone with this link can see your ward on the map. It expires automatically.</p>
                </div>
              )}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-400"><Navigation className="h-4 w-4" /></div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Navigation status</p>
                  <p className="text-xs font-extrabold text-emerald-400">{steps.length ? 'Route compiled' : 'Location active'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
