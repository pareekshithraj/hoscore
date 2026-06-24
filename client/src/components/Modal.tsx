import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  const { theme } = useAuth();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
      <div className={`glass-card w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl animate-fade-in-up duration-300 ${
        theme === 'dark' ? 'border-white/[0.08]' : 'border-slate-200'
      }`}>
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-white/[0.06]' : 'border-slate-100'
        }`}>
          <h3 className={`text-lg font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
          <button 
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              theme === 'dark' 
                ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
