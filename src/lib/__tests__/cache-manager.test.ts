/**
 * Unit Tests: cache-manager.ts
 *
 * Testa clearAllStoresCache com stores mockadas.
 * Valida que:
 * - Listener realtime é desconectado
 * - clearCache é chamado em TODAS as 5 stores
 * - Keys barberia-* são removidas do localStorage
 */

import { vi } from 'vitest';

// Mock de todas as stores ANTES do import do cache-manager
const mockUnsubscribeTodayAppointments = vi.fn();
const mockAppointmentsClearCache = vi.fn();
const mockClientsClearCache = vi.fn();
const mockFinancialClearCache = vi.fn();
const mockServicesClearCache = vi.fn();
const mockBarbershopClearCache = vi.fn();

vi.mock('@/store/appointments.store', () => ({
    useAppointmentsStore: {
        getState: () => ({
            unsubscribeTodayAppointments: mockUnsubscribeTodayAppointments,
            clearCache: mockAppointmentsClearCache,
        }),
    },
}));

vi.mock('@/store/clients.store', () => ({
    useClientsStore: {
        getState: () => ({
            clearCache: mockClientsClearCache,
        }),
    },
}));

vi.mock('@/store/financial.store', () => ({
    useFinancialStore: {
        getState: () => ({
            clearCache: mockFinancialClearCache,
        }),
    },
}));

vi.mock('@/store/services.store', () => ({
    useServicesStore: {
        getState: () => ({
            clearCache: mockServicesClearCache,
        }),
    },
}));

vi.mock('@/store/barbershop.store', () => ({
    useBarbershopStore: {
        getState: () => ({
            clearCache: mockBarbershopClearCache,
        }),
    },
}));

// Import DEPOIS dos mocks
import { clearAllStoresCache } from '../cache-manager';

// Mock localStorage para ambiente node
const localStorageMock: Record<string, string> = {};
const mockGetItem = vi.fn((key: string) => localStorageMock[key] ?? null);
const mockSetItem = vi.fn((key: string, value: string) => { localStorageMock[key] = value; });
const mockRemoveItem = vi.fn((key: string) => { delete localStorageMock[key]; });
const mockClear = vi.fn(() => { Object.keys(localStorageMock).forEach(k => delete localStorageMock[k]); });

Object.defineProperty(globalThis, 'localStorage', {
    value: {
        getItem: mockGetItem,
        setItem: mockSetItem,
        removeItem: mockRemoveItem,
        clear: mockClear,
    },
    writable: true,
    configurable: true,
});

describe('clearAllStoresCache', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Limpa o mock de localStorage
        Object.keys(localStorageMock).forEach(k => delete localStorageMock[k]);
    });

    it('desconecta o listener de today appointments', () => {
        clearAllStoresCache();
        expect(mockUnsubscribeTodayAppointments).toHaveBeenCalledOnce();
    });

    it('chama clearCache em todas as 5 stores', () => {
        clearAllStoresCache();

        expect(mockAppointmentsClearCache).toHaveBeenCalledOnce();
        expect(mockClientsClearCache).toHaveBeenCalledOnce();
        expect(mockFinancialClearCache).toHaveBeenCalledOnce();
        expect(mockServicesClearCache).toHaveBeenCalledOnce();
        expect(mockBarbershopClearCache).toHaveBeenCalledOnce();
    });

    it('remove todas as keys barberia-* do localStorage', () => {
        // Popula localStorage mock
        const keys = [
            'barberia-appointments',
            'barberia-clients',
            'barberia-financial',
            'barberia-services',
            'barberia-barbershop',
        ];
        keys.forEach(key => mockSetItem(key, '{"data":"test"}'));

        // Adiciona uma key que NÃO deve ser removida
        mockSetItem('other-key', 'should-remain');

        clearAllStoresCache();

        // Deve ter chamado removeItem para cada key barberia-*
        keys.forEach(key => {
            expect(mockRemoveItem).toHaveBeenCalledWith(key);
        });

        // Não deve ter removido a key não-barberia
        expect(mockRemoveItem).not.toHaveBeenCalledWith('other-key');
    });

    it('funciona sem erros com localStorage vazio', () => {
        expect(() => clearAllStoresCache()).not.toThrow();
    });
});
