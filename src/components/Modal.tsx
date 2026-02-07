
import React, { useEffect } from 'react';
import { Card } from './Card';
import { Icon } from './Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onEdit?: () => void; // Botão de edição opcional
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, onEdit }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-2 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0.8; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
            animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
      <Card
        className="w-full max-w-sm mx-2 !p-0 animate-slide-up bg-slate-900 shadow-2xl shadow-violet-500/20 rounded-2xl"
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-slate-100">{title}</h2>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1 text-slate-400 hover:text-violet-400 transition-colors"
                title="Editar agendamento"
              >
                <Icon name="pencil" className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
              <Icon name="x" className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          {children}
        </div>
      </Card>
    </div>
  );
};