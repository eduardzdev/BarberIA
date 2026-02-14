/**
 * NoSubscriptionScreen — Exibida para usuários logados sem subscription.
 * CTA para contato via WhatsApp.
 */

import React from 'react';
import { FiInfo } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

export const NoSubscriptionScreen: React.FC = () => {
    const whatsappPhone = import.meta.env.VITE_WHATSAPP_BUSINESS_PHONE || '5511999999999';
    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent('Olá! Gostaria de ativar minha conta no BarberIA.')}`;

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-sm w-full text-center">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-violet-500/30">
                    <FiInfo className="w-10 h-10 text-violet-400" />
                </div>

                <h1 className="text-2xl font-bold text-slate-100 mb-2">Assinatura Necessária</h1>
                <p className="text-slate-400 mb-8 text-sm">
                    Para acessar o BarberIA, você precisa de uma assinatura ativa.
                    Entre em contato conosco para ativar seu plano.
                </p>

                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                >
                    <FaWhatsapp className="w-5 h-5" />
                    Falar com a equipe BarberIA
                </a>

                <p className="text-xs text-slate-600 mt-6">
                    Se você já possui uma assinatura e está vendo esta tela, aguarde alguns instantes ou entre em contato pelo WhatsApp.
                </p>
            </div>
        </div>
    );
};
