/**
 * SubscriptionCard — Card do plano ativo na BillingPage.
 */

import React from 'react';
import { FiCheck, FiCalendar, FiUsers, FiCreditCard } from 'react-icons/fi';
import { BILLING_PLANS, formatCurrency } from '../constants';
import type { SubscriptionData } from '@/types';

interface SubscriptionCardProps {
    subscription: SubscriptionData;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    active: { label: 'Ativo', color: 'text-green-400 bg-green-400/10 border-green-400/30' },
    demo_approved: { label: 'Demo Ativa', color: 'text-violet-400 bg-violet-400/10 border-violet-400/30' },
    pending_payment: { label: 'Aguardando Pagamento', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
    overdue: { label: 'Atrasado', color: 'text-red-400 bg-red-400/10 border-red-400/30' },
    blocked: { label: 'Bloqueado', color: 'text-red-500 bg-red-500/10 border-red-500/30' },
    cancelled: { label: 'Cancelado', color: 'text-slate-400 bg-slate-400/10 border-slate-400/30' },
};

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription }) => {
    const plan = BILLING_PLANS[subscription.plan] || BILLING_PLANS.basic;
    const statusInfo = STATUS_LABELS[subscription.status] || STATUS_LABELS.active;

    const formatDate = (timestamp: any): string => {
        if (!timestamp) return '—';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-100">Plano {plan.name}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusInfo.color}`}>
                        {statusInfo.label}
                    </span>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-extrabold text-violet-400">
                        {formatCurrency(subscription.monthlyValue)}
                    </div>
                    <span className="text-slate-500 text-xs">/mês</span>
                </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                    <FiUsers className="w-4 h-4 text-violet-400" />
                    <span>{subscription.barberCount} barbeiro{subscription.barberCount > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                    <FiCalendar className="w-4 h-4 text-violet-400" />
                    <span>Próx.: {formatDate(subscription.nextPaymentDate)}</span>
                </div>
            </div>
        </div>
    );
};
