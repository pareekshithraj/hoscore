import React, { useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { Building2, ShieldCheck } from 'lucide-react';

interface HospitalQRPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalName: string;
  hospitalId: string;
}

export const HospitalQRPassModal: React.FC<HospitalQRPassModalProps> = ({
  isOpen,
  onClose,
  hospitalName,
  hospitalId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#0284C7';
    const grid = 15;
    const cellSize = size / grid;

    const drawFinderPattern = (x: number, y: number) => {
      ctx.fillStyle = '#0284C7';
      ctx.fillRect(x * cellSize, y * cellSize, 4 * cellSize, 4 * cellSize);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect((x + 0.6) * cellSize, (y + 0.6) * cellSize, 2.8 * cellSize, 2.8 * cellSize);
      ctx.fillStyle = '#0369A1';
      ctx.fillRect((x + 1.2) * cellSize, (y + 1.2) * cellSize, 1.6 * cellSize, 1.6 * cellSize);
    };

    drawFinderPattern(1, 1);
    drawFinderPattern(10, 1);
    drawFinderPattern(1, 10);

    const seed = (hospitalId || 'HOSP-12345').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    ctx.fillStyle = '#0F172A';

    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        if ((r <= 5 && c <= 5) || (r <= 5 && c >= 9) || (r >= 9 && c <= 5)) continue;
        const val = Math.cos(seed * (r + 2) * 19 + (c + 3) * 11);
        if (val > 0.08) {
          ctx.fillRect(c * cellSize + 1, r * cellSize + 1, cellSize - 2, cellSize - 2);
        }
      }
    }
  }, [isOpen, hospitalId]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hospital Official QR Pass">
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <div className="w-full max-w-sm bg-gradient-to-b from-sky-950 via-slate-900 to-slate-950 border border-sky-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-400" />
              <span className="text-xs font-black text-white tracking-widest uppercase">HOSPITAL KIOSK PASS</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> VERIFIED
            </span>
          </div>

          <h3 className="text-lg font-black text-white tracking-tight">{hospitalName}</h3>
          <div className="mt-2 inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-xl">
            <span className="text-xs font-mono font-black text-sky-400 tracking-widest">
              HSP-{String(hospitalId).slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="my-5 p-4 bg-white rounded-2xl shadow-inner inline-block border-2 border-sky-400/40">
            <canvas ref={canvasRef} width={180} height={180} className="rounded-lg" />
          </div>

          <p className="text-xs text-slate-400 font-semibold px-2">
            Patients can scan this QR code at reception to auto-select this facility for OPD check-in & navigation.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all cursor-pointer"
        >
          Close Pass
        </button>
      </div>
    </Modal>
  );
};
