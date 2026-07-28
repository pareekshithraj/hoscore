import React, { useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { ShieldCheck } from 'lucide-react';

interface DigitalQRPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  sixDigitId: string;
}

export const DigitalQRPassModal: React.FC<DigitalQRPassModalProps> = ({
  isOpen,
  onClose,
  patientName,
  sixDigitId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    // Draw white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // Draw high quality QR pattern
    ctx.fillStyle = '#0F172A';
    const grid = 15;
    const cellSize = size / grid;

    // Helper to draw QR corner target finder
    const drawFinderPattern = (x: number, y: number) => {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(x * cellSize, y * cellSize, 4 * cellSize, 4 * cellSize);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect((x + 0.6) * cellSize, (y + 0.6) * cellSize, 2.8 * cellSize, 2.8 * cellSize);
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect((x + 1.2) * cellSize, (y + 1.2) * cellSize, 1.6 * cellSize, 1.6 * cellSize);
    };

    // Draw 3 corner targets
    drawFinderPattern(1, 1);
    drawFinderPattern(10, 1);
    drawFinderPattern(1, 10);

    // Deterministic data cells generated from sixDigitId
    const seed = (sixDigitId || '123456').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    ctx.fillStyle = '#0F172A';

    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        // Skip corner finder zones
        if ((r <= 5 && c <= 5) || (r <= 5 && c >= 9) || (r >= 9 && c <= 5)) continue;

        const val = Math.sin(seed * (r + 1) * 31 + (c + 1) * 17);
        if (val > 0.05) {
          ctx.fillRect(c * cellSize + 1, r * cellSize + 1, cellSize - 2, cellSize - 2);
        }
      }
    }
  }, [isOpen, sixDigitId]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Digital Health Pass">
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <div className="w-full max-w-sm bg-gradient-to-b from-sky-950/40 via-slate-900 to-slate-950 border border-sky-500/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
              <span className="text-xs font-black text-white tracking-widest uppercase">HOSCORE PASS</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-0.5 rounded-full">
              OFFICIAL
            </span>
          </div>

          {/* Patient Details */}
          <h3 className="text-xl font-black text-white tracking-tight leading-tight">{patientName}</h3>
          <div className="mt-2 inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-xl">
            <span className="text-xs font-mono font-black text-sky-400 tracking-widest">
              HSC-{sixDigitId || '882910'}
            </span>
          </div>

          {/* QR Canvas */}
          <div className="my-6 p-4 bg-white rounded-2xl shadow-inner inline-block border-2 border-sky-400/40">
            <canvas ref={canvasRef} width={180} height={180} className="rounded-lg" />
          </div>

          {/* Footer note */}
          <p className="text-xs text-slate-400 font-semibold px-2">
            Show this QR code at hospital reception, self-service kiosk, or doctor desk for instant check-in.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-sky-600/20"
        >
          Close Pass
        </button>
      </div>
    </Modal>
  );
};
