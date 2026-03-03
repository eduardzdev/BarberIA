import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';

export const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-24 h-24 mb-6 flex items-center justify-center relative">
                <img src="/icons/Logo%20Final%20BarberIA%20100x100%20.svg" alt="BarberIA" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
                <div className="absolute -bottom-2 -right-2 bg-slate-950 rounded-full p-1">
                    <Icon name="x" className="w-6 h-6 text-red-500" />
                </div>
            </div>

            <h1 className="text-6xl font-black text-slate-100 mb-2 tracking-tighter">404</h1>
            <h2 className="text-xl font-bold text-slate-300 mb-4">Página não encontrada</h2>

            <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Ops! A página que você está procurando não existe, foi movida ou a URL está incorreta.
            </p>

            <button
                onClick={() => navigate('/')}
                className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2"
            >
                Voltar ao início
            </button>
        </div>
    );
};
