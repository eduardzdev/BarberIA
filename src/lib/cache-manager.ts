/**
 * Cache Manager - Gestão centralizada de cache de todas as stores
 * 
 * Responsável por limpar cache de TODAS as stores e localStorage
 * em cenários de logout, troca de conta ou reset forçado.
 * 
 * Separado de store-helpers.ts para evitar dependências circulares:
 *   stores -> store-helpers (OK)
 *   cache-manager -> stores (OK)
 *   stores -> cache-manager (NUNCA - evita circular)
 */

import { useAppointmentsStore } from '@/store/appointments.store';
import { useClientsStore } from '@/store/clients.store';
import { useFinancialStore } from '@/store/financial.store';
import { useServicesStore } from '@/store/services.store';
import { useBarbershopStore } from '@/store/barbershop.store';

/** Chaves de localStorage usadas pelo persist middleware */
const PERSIST_KEYS = [
    'barberia-appointments',
    'barberia-clients',
    'barberia-financial',
    'barberia-services',
    'barberia-barbershop',
] as const;

/**
 * Limpa cache de TODAS as stores e localStorage.
 * Deve ser chamado em logout, delete account e deactivate account
 * para evitar contaminação de dados entre contas diferentes.
 */
export function clearAllStoresCache() {
    // 1. Desconecta listeners ativos
    useAppointmentsStore.getState().unsubscribeTodayAppointments();

    // 2. Reseta state de todas as stores
    useAppointmentsStore.getState().clearCache();
    useClientsStore.getState().clearCache();
    useFinancialStore.getState().clearCache();
    useServicesStore.getState().clearCache();
    useBarbershopStore.getState().clearCache();

    // 3. Remove dados persistidos do localStorage
    PERSIST_KEYS.forEach(key => localStorage.removeItem(key));
}
