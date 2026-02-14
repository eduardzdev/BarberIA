/**
 * BillingHistory — Lista de eventos de pagamento para auditoria.
 */

import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { FiCheck, FiAlertTriangle, FiX, FiClock } from 'react-icons/fi';
import { formatCurrency } from '../constants';
import type { PaymentEvent } from '@/types';

const EVENT_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    PAYMENT_CREATED: { icon: <FiClock />, label: 'Cobrança gerada', color: 'text-blue-400' },
    PAYMENT_RECEIVED: { icon: <FiCheck />, label: 'Pagamento confirmado', color: 'text-green-400' },
    PAYMENT_CONFIRMED: { icon: <FiCheck />, label: 'Pagamento confirmado', color: 'text-green-400' },
    PAYMENT_OVERDUE: { icon: <FiAlertTriangle />, label: 'Pagamento atrasado', color: 'text-amber-400' },
    PAYMENT_CREDIT_CARD_CAPTURE_REFUSED: { icon: <FiX />, label: 'Cartão recusado', color: 'text-red-400' },
    PAYMENT_DELETED: { icon: <FiX />, label: 'Pagamento cancelado', color: 'text-red-400' },
    PAYMENT_REFUNDED: { icon: <FiX />, label: 'Pagamento estornado', color: 'text-red-400' },
    SUBSCRIPTION_CREATED: { icon: <FiCheck />, label: 'Assinatura criada', color: 'text-violet-400' },
    SUBSCRIPTION_CANCELLED: { icon: <FiX />, label: 'Assinatura cancelada', color: 'text-slate-400' },
};

export const BillingHistory: React.FC = () => {
    const [events, setEvents] = useState<PaymentEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadEvents = async () => {
            const userId = auth.currentUser?.uid;
            if (!userId) return;

            try {
                const ref = collection(db, 'barbershops', userId, 'payment_events');
                const q = query(ref, orderBy('timestamp', 'desc'), limit(20));
                const snapshot = await getDocs(q);

                setEvents(snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                } as PaymentEvent)));
            } catch (error) {
                console.error('Erro ao carregar histórico:', error);
            } finally {
                setLoading(false);
            }
        };

        loadEvents();
    }, []);

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 bg-slate-800 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-6 text-slate-500 text-sm">
                <FiClock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Nenhum evento de pagamento ainda.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {events.map(event => {
                const config = EVENT_CONFIG[event.type] || { icon: <FiClock />, label: event.type, color: 'text-slate-400' };
                const date = event.timestamp?.toDate
                    ? event.timestamp.toDate().toLocaleDateString('pt-BR')
                    : '—';

                return (
                    <div key={event.id} className="flex items-center justify-between py-2.5 border-b border-slate-800 last:border-0">
                        <div className="flex items-center gap-3">
                            <span className={`${config.color}`}>{config.icon}</span>
                            <div>
                                <p className="text-sm text-slate-200">{config.label}</p>
                                <p className="text-xs text-slate-500">{date}</p>
                            </div>
                        </div>
                        {event.amount && (
                            <span className="text-sm font-semibold text-slate-300">
                                {formatCurrency(event.amount)}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
