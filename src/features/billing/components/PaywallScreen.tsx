/**
 * PaywallScreen — Tela de bloqueio por inadimplência ou cancelamento.
 */

import React from 'react';
import { FiLock, FiCreditCard, FiDownload } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface PaywallScreenProps {
    reason: 'overdue' | 'blocked' | 'cancelled' | 'payment_failed';
}

export const PaywallScreen: React.FC<PaywallScreenProps> = ({ reason }) => {
    const navigate = useNavigate();
    const whatsappPhone = import.meta.env.VITE_WHATSAPP_BUSINESS_PHONE || '5511999999999';

    const messages = {
        overdue: {
            title: 'Pagamento Atrasado',
            description: 'Sua assinatura possui um pagamento pendente. Regularize para continuar usando o BarberIA.',
            cta: 'Regularizar Pagamento',
        },
        blocked: {
            title: 'Acesso Bloqueado',
            description: 'Sua assinatura foi bloqueada por inadimplência. Entre em contato para reativar.',
            cta: 'Reativar Assinatura',
        },
        cancelled: {
            title: 'Assinatura Cancelada',
            description: 'Sua assinatura foi cancelada. Reative para recuperar o acesso completo.',
            cta: 'Reativar Assinatura',
        },
        payment_failed: {
            title: 'Pagamento Recusado',
            description: 'O pagamento com seu cartão foi recusado. Verifique o limite disponível ou tente outro cartão.',
            cta: 'Tentar Novamente',
        },
    };

    const msg = messages[reason];

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-sm w-full text-center">
                {/* Lock icon */}
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-slate-700">
                    <FiLock className="w-10 h-10 text-red-400" />
                </div>

                <h1 className="text-2xl font-bold text-slate-100 mb-2">{msg.title}</h1>
                <p className="text-slate-400 mb-8 text-sm">{msg.description}</p>

                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/billing')}
                        className="w-full bg-violet-600 text-white font-bold py-3 rounded-lg hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2"
                    >
                        <FiCreditCard className="w-5 h-5" />
                        {msg.cta}
                    </button>

                    <a
                        href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent('Olá! Preciso de ajuda com minha assinatura do BarberIA.')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <FaWhatsapp className="w-5 h-5" />
                        Falar com Suporte
                    </a>
                </div>

                <p className="text-xs text-slate-600 mt-6">
                    Seus dados estão salvos e seguros. Após regularizar, você terá acesso completo novamente.
                </p>
            </div>
        </div>
    );
};
