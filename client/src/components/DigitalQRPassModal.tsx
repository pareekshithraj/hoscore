import React from 'react';
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
  const qrData = `HOSCORE:${sixDigitId || '882910'}:TOKEN-1`;

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

          {/* QR Img */}
          <div className="my-6 p-4 bg-white rounded-2xl shadow-inner inline-block border-2 border-sky-400/40">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}`} alt="Digital Health Pass QR Code" className="rounded-lg w-[180px] h-[180px]" />
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
