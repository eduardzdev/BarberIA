/**
 * SubscriptionGuard — Protege rotas baseado no status da assinatura.
 *
 * Lógica:
 * - active / demo_approved → Acesso normal
 * - overdue ≤5 dias → Acesso + ExpiryBanner
 * - overdue >5 dias → PaywallScreen
 * - blocked / cancelled → PaywallScreen
 * - pending_payment → Tela de pagamento pendente
 * - sem subscription → NoSubscriptionScreen
 */

import React, { ReactNode } from 'react';
import { useSubscriptionStore } from '@/store/subscription.store';
import { PaywallScreen } from '@/features/billing/components/PaywallScreen';
import { ExpiryBanner } from '@/features/billing/components/ExpiryBanner';
import { NoSubscriptionScreen } from '@/features/billing/components/NoSubscriptionScreen';
import { GRACE_PERIOD_DAYS } from '@/features/billing/constants';
import { FiClock } from 'react-icons/fi';

interface SubscriptionGuardProps {
    children: ReactNode;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
    const { subscription, loading } = useSubscriptionStore();

    // While loading, show nothing (the layout skeleton handles this)
    if (loading) {
        return <>{children}</>;
    }

    // No subscription at all
    if (!subscription) {
        return <NoSubscriptionScreen />;
    }

    const { status } = subscription;

    // Full access statuses
    if (status === 'active' || status === 'demo_approved') {
        return <>{children}</>;
    }

    // Pending payment — show waiting screen
    if (status === 'pending_payment') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-sm w-full text-center">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-amber-500/30">
                        <FiClock className="w-10 h-10 text-amber-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-100 mb-2">Aguardando Pagamento</h1>
                    <p className="text-slate-400 text-sm mb-4">
                        Seu pagamento está sendo processado. O acesso será liberado
                        automaticamente assim que a confirmação for recebida.
                    </p>
                    <p className="text-xs text-slate-600">
                        Isso pode levar alguns minutos. Atualize a página para verificar.
                    </p>
                </div>
            </div>
        );
    }

    // Overdue — check grace period
    if (status === 'overdue') {
        const overdueStart = subscription.overdueStartDate?.toDate?.()
            || subscription.overdueStartDate
            ? new Date(subscription.overdueStartDate)
            : new Date();

        const now = new Date();
        const daysOverdue = Math.floor(
            (now.getTime() - overdueStart.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Within grace period — allow access with banner
        if (daysOverdue <= GRACE_PERIOD_DAYS) {
            return (
                <>
                    <ExpiryBanner daysOverdue={daysOverdue} maxGraceDays={GRACE_PERIOD_DAYS} />
                    {children}
                </>
            );
        }

        // Past grace period — block
        return <PaywallScreen reason="overdue" />;
    }

    // Blocked or cancelled or payment failed
    if (status === 'blocked') {
        return <PaywallScreen reason="blocked" />;
    }

    if (status === 'cancelled') {
        return <PaywallScreen reason="cancelled" />;
    }

    if (status === 'payment_failed') {
        return <PaywallScreen reason="payment_failed" />;
    }

    // Default: allow access (safe fallback)
    return <>{children}</>;
};
