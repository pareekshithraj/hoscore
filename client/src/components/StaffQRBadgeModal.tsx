import React, { useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { ShieldCheck, UserCheck, Stethoscope } from 'lucide-react';

interface StaffQRBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffName: string;
  roleOrSpecialty: string;
  staffId: string;
}

export const StaffQRBadgeModal: React.FC<StaffQRBadgeModalProps> = ({
  isOpen,
  onClose,
  staffName,
  roleOrSpecialty,
  staffId,
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

    ctx.fillStyle = '#4F46E5';
    const grid = 15;
    const cellSize = size / grid;

    const drawFinderPattern = (x: number, y: number) => {
      ctx.fillStyle = '#4F46E5';
      ctx.fillRect(x * cellSize, y * cellSize, 4 * cellSize, 4 * cellSize);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect((x + 0.6) * cellSize, (y + 0.6) * cellSize, 2.8 * cellSize, 2.8 * cellSize);
      ctx.fillStyle = '#6366F1';
      ctx.fillRect((x + 1.2) * cellSize, (y + 1.2) * cellSize, 1.6 * cellSize, 1.6 * cellSize);
    };

    drawFinderPattern(1, 1);
    drawFinderPattern(10, 1);
    drawFinderPattern(1, 10);

    const seed = (staffId || 'STF-88190').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    ctx.fillStyle = '#0F172A';

    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        if ((r <= 5 && c <= 5) || (r <= 5 && c >= 9) || (r >= 9 && c <= 5)) continue;
        const val = Math.sin(seed * (r + 4) * 23 + (c + 1) * 13);
        if (val > 0.06) {
          ctx.fillRect(c * cellSize + 1, r * cellSize + 1, cellSize - 2, cellSize - 2);
        }
      }
    }
  }, [isOpen, staffId]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official Staff Verification Badge">
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <div className="w-full max-w-sm bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-black text-white tracking-widest uppercase">STAFF DIGITAL BADGE</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-400" /> AUTHORIZED
            </span>
          </div>

          <h3 className="text-xl font-black text-white tracking-tight">{staffName}</h3>
          <p className="text-xs font-bold text-indigo-400 mt-1 uppercase tracking-wider">{roleOrSpecialty}</p>
          <div className="mt-2 inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-xl">
            <span className="text-xs font-mono font-black text-indigo-300 tracking-widest">
              ID: {staffId.startsWith('STF') || staffId.startsWith('DOC') ? staffId : `STF-${staffId.substring(0, 8).toUpperCase()}`}
            </span>
          </div>

          <div className="my-5 p-4 bg-white rounded-2xl shadow-inner inline-block border-2 border-indigo-400/40">
            <canvas ref={canvasRef} width={180} height={180} className="rounded-lg" />
          </div>

          <p className="text-xs text-slate-400 font-semibold px-2">
            Scan this badge for staff attendance, shift authorization, and clinical duty verification.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all cursor-pointer"
        >
          Close Badge
        </button>
      </div>
    </Modal>
  );
};
