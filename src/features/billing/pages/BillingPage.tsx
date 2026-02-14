/**
 * BillingPage — Página de gestão de assinatura.
 *
 * Renderiza condicionalmente baseado no status:
 * - active/demo_approved: Card + histórico + opções
 * - overdue: Card com alerta
 * - blocked/cancelled: Info + reativar
 * - sem subscription: WhatsApp CTA
 */

import React from 'react';
import { useSubscriptionStore } from '@/store/subscription.store';
import { SubscriptionCard } from '../components/SubscriptionCard';
import { BillingHistory } from '../components/BillingHistory';
import { NoSubscriptionScreen } from '../components/NoSubscriptionScreen';
import { FiAlertTriangle } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

export const BillingPage: React.FC = () => {
    const { subscription, loading, cancelSubscription } = useSubscriptionStore();
    const [showCancel, setShowCancel] = React.useState(false);
    const [cancelling, setCancelling] = React.useState(false);
    const whatsappPhone = import.meta.env.VITE_WHATSAPP_BUSINESS_PHONE || '5511999999999';

    if (loading) {
        return (
            <div className="space-y-4 pb-6">
                <div className="h-8 w-40 bg-slate-800 rounded animate-pulse" />
                <div className="h-32 bg-slate-800 rounded-xl animate-pulse" />
                <div className="h-48 bg-slate-800 rounded-xl animate-pulse" />
            </div>
        );
    }

    if (!subscription) {
        return (
            <div className="space-y-6 pb-6">
                <h1 className="text-2xl font-bold text-slate-100">Assinatura</h1>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
                    <p className="text-slate-400 mb-4">Nenhuma assinatura encontrada.</p>
                    <a
                        href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent('Olá! Gostaria de ativar minha conta no BarberIA.')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-green-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <FaWhatsapp className="w-5 h-5" />
                        Falar com a equipe
                    </a>
                </div>
            </div>
        );
    }

    const handleCancel = async () => {
        setCancelling(true);
        try {
            await cancelSubscription();
            setShowCancel(false);
        } catch {
            // Error handled in store
        } finally {
            setCancelling(false);
        }
    };

    return (
        <div className="space-y-6 pb-6">
            <h1 className="text-2xl font-bold text-slate-100">Assinatura</h1>

            {/* Current Plan */}
            <SubscriptionCard subscription={subscription} />

            {/* Pending payment info */}
            {subscription.status === 'pending_payment' && (
                <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-4 flex items-start gap-3">
                    <FiAlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-amber-300 font-semibold text-sm">Aguardando pagamento</p>
                        <p className="text-slate-400 text-xs mt-1">
                            Verifique seu email para instruções de pagamento. O acesso será liberado assim que o pagamento for confirmado.
                        </p>
                    </div>
                </div>
            )}

            {/* Billing History */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                <h2 className="text-lg font-semibold text-slate-100 mb-4">Histórico de Pagamentos</h2>
                <BillingHistory />
            </div>

            {/* Cancel section */}
            {['active', 'demo_approved'].includes(subscription.status) && (
                <div className="bg-slate-800/50 border border-red-900/30 rounded-xl p-5">
                    <h3 className="text-red-400 font-semibold mb-2 text-sm">Cancelar Assinatura</h3>
                    <p className="text-slate-500 text-xs mb-3">
                        Ao cancelar, você continuará com acesso até o fim do período pago.
                        Seus dados serão mantidos por 90 dias.
                    </p>
                    {!showCancel ? (
                        <button
                            onClick={() => setShowCancel(true)}
                            className="text-red-400 text-xs hover:underline"
                        >
                            Cancelar minha assinatura
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCancel}
                                disabled={cancelling}
                                className="bg-red-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {cancelling ? 'Cancelando...' : 'Confirmar cancelamento'}
                            </button>
                            <button
                                onClick={() => setShowCancel(false)}
                                className="text-slate-400 text-xs hover:text-slate-300"
                            >
                                Voltar
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
