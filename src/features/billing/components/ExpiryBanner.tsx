/**
 * ExpiryBanner — Banner de aviso de grace period (5 dias).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle } from 'react-icons/fi';

interface ExpiryBannerProps {
    daysOverdue: number;
    maxGraceDays: number;
}

export const ExpiryBanner: React.FC<ExpiryBannerProps> = ({ daysOverdue, maxGraceDays }) => {
    const daysLeft = maxGraceDays - daysOverdue;
    const isUrgent = daysLeft <= 2;

    const message = daysLeft <= 0
        ? 'Seu acesso será bloqueado a qualquer momento!'
        : daysLeft === 1
            ? 'Último dia! Regularize seu pagamento para evitar perda de acesso.'
            : `Pagamento atrasado. Você tem ${daysLeft} dia(s) para regularizar.`;

    return (
        <div className={`${isUrgent ? 'bg-red-600' : 'bg-amber-600'} text-white px-4 py-2.5 flex items-center justify-between gap-3`}>
            <div className="flex items-center gap-2 text-sm">
                <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{message}</span>
            </div>
            <Link
                to="/billing"
                className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors whitespace-nowrap"
            >
                Pagar agora
            </Link>
        </div>
    );
};
