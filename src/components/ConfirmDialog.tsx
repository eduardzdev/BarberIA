import React from 'react';
import { useUI } from '@/hooks/useUI';
import { Icon } from './Icon';

export const ConfirmDialog: React.FC = () => {
    const { confirmDialog, hideConfirm } = useUI();

    if (!confirmDialog.open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                onClick={hideConfirm}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl shadow-black animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900/50">
                    <h3 className="font-bold text-slate-100 text-base">{confirmDialog.title}</h3>
                    <button
                        onClick={hideConfirm}
                        className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                    >
                        <Icon name="close" className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 bg-slate-900">
                    <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                        {confirmDialog.message}
                    </p>
                </div>

                {/* Footer (Buttons) */}
                <div className="flex space-x-3 p-4 bg-slate-800/50">
                    <button
                        onClick={() => {
                            if (confirmDialog.onCancel) confirmDialog.onCancel();
                            hideConfirm();
                        }}
                        className="flex-1 bg-slate-700/70 hover:bg-slate-600 border border-slate-600/50 text-slate-200 font-bold py-2.5 rounded-xl text-sm transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                            hideConfirm();
                        }}
                        className="flex-1 bg-[#DE3C3C] hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-red-900/20"
                    >
                        Sim, remover
                    </button>
                </div>
            </div>
        </div>
    );
};
