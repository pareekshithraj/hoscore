import { useEffect, useState } from 'react';
import { Navigation } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLiveVisit } from '../hooks/useLiveVisit';
import { WayfindingModal } from './WayfindingModal';

export const LiveVisitBanner = () => {
  const { selectedPatientId } = useAuth();
  const { visit } = useLiveVisit(selectedPatientId);
  const [wayfindingOpen, setWayfindingOpen] = useState(false);
  const called = visit.inQueue && visit.status === 'IN_CONSULTATION';

  useEffect(() => {
    if (called) setWayfindingOpen(true);
  }, [called]);

  if (!visit.inQueue) return null;

  return (
    <>
      <div
        className={`mb-4 rounded-2xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          called
            ? 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20'
            : 'bg-sky-50 border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/20'
        }`}
      >
        <div className="flex items-center gap-3">
          <Navigation className={`w-5 h-5 ${called ? 'text-rose-600' : 'text-sky-600'}`} />
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              {called ? 'You are being called' : `You are ${visit.position || '—'} in line`}
            </p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Token #{visit.tokenNumber} · {visit.doctorName || 'Doctor'} · {visit.roomName}
            </p>
          </div>
        </div>
        <button
          onClick={() => setWayfindingOpen(true)}
          className={`px-4 py-2 text-xs font-bold rounded-lg text-white ${called ? 'bg-rose-600' : 'bg-sky-600'}`}
        >
          Indoor directions
        </button>
      </div>
      <WayfindingModal
        isOpen={wayfindingOpen}
        onClose={() => setWayfindingOpen(false)}
        destination={visit.roomName}
      />
    </>
  );
};
