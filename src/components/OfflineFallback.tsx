import React from 'react';

/**
 * OfflineFallback - Tela exibida quando o app está sem conexão
 * 
 * Segue o padrão visual do projeto (dark mode, slate + violet).
 * Usado pelo service worker como fallback quando navegação offline falha.
 */
const OfflineFallback: React.FC = () => {
    return (
        <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col items-center justify-center gap-6 p-6">
            {/* Ícone */}
            <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center">
                <svg
                    className="w-10 h-10 text-violet-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
                    />
                </svg>
            </div>

            {/* Título */}
            <div className="text-center">
                <h1 className="text-xl font-bold text-slate-100">Sem conexão</h1>
                <p className="text-slate-400 text-sm mt-2 max-w-xs">
                    Verifique sua conexão com a internet e tente novamente.
                </p>
            </div>

            {/* Botão retry */}
            <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors text-sm"
            >
                Tentar novamente
            </button>
        </div>
    );
};

export default OfflineFallback;
