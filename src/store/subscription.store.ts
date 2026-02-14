/**
 * SubscriptionStore — Estado global de assinatura (Zustand)
 *
 * Gerencia estado de assinatura com listener Firestore em tempo real.
 * Detecta mudanças via webhook (pagamentos) automaticamente.
 */

import { create } from 'zustand';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/firebase';
import type { SubscriptionData, PlanType, BillingType } from '@/types';

interface SubscriptionState {
    // State
    subscription: SubscriptionData | null;
    loading: boolean;
    error: string | null;

    // Actions
    setSubscription: (sub: SubscriptionData | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    startListening: (userId: string) => () => void;
    createSubscription: (data: {
        plan: PlanType;
        barberCount: number;
        billingType: BillingType;
        cpfCnpj?: string;
        creditCard?: object;
        creditCardHolderInfo?: object;
    }) => Promise<void>;
    cancelSubscription: () => Promise<void>;
    updateBarberCount: (barberCount: number) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
    subscription: null,
    loading: true,
    error: null,

    setSubscription: (subscription) => set({ subscription, loading: false }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error, loading: false }),

    /**
     * Inicia listener em tempo real para subscription/current.
     * Retorna função de cleanup (unsubscribe).
     */
    startListening: (userId: string) => {
        set({ loading: true, error: null });

        const docRef = doc(db, 'barbershops', userId, 'subscription', 'current');

        const unsubscribe = onSnapshot(
            docRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data() as SubscriptionData;
                    set({ subscription: data, loading: false });
                } else {
                    set({ subscription: null, loading: false });
                }
            },
            (error) => {
                console.error('[SubscriptionStore] Listener error:', error);
                set({ error: error.message, loading: false });
            }
        );

        return unsubscribe;
    },

    /**
     * Cria assinatura para usuário já autenticado (ex: após demo_approved).
     */
    createSubscription: async (data) => {
        set({ loading: true, error: null });
        try {
            const fn = httpsCallable(functions, 'createSubscription');
            await fn(data);
            // O listener de onSnapshot atualizará o estado automaticamente
        } catch (error: any) {
            const message = error.message || 'Erro ao criar assinatura.';
            set({ error: message, loading: false });
            throw error;
        }
    },

    /**
     * Cancela assinatura ativa.
     */
    cancelSubscription: async () => {
        set({ loading: true, error: null });
        try {
            const fn = httpsCallable(functions, 'cancelSubscription');
            await fn({});
            // Listener atualizará o estado
        } catch (error: any) {
            const message = error.message || 'Erro ao cancelar assinatura.';
            set({ error: message, loading: false });
            throw error;
        }
    },

    /**
     * Atualiza número de barbeiros e recalcula valor.
     */
    updateBarberCount: async (barberCount: number) => {
        set({ loading: true, error: null });
        try {
            const fn = httpsCallable(functions, 'updateBarberCount');
            await fn({ barberCount });
            // Listener atualizará o estado
        } catch (error: any) {
            const message = error.message || 'Erro ao atualizar barbeiros.';
            set({ error: message, loading: false });
            throw error;
        }
    },
}));
