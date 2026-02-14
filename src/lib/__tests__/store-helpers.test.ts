/**
 * Unit Tests: store-helpers.ts
 *
 * Testa todas as utility functions puras da camada de cache:
 * - isDataStale, shouldRefetch, markAsFetched, resetCache
 * - createSafeRehydrateHandler, createPersistConfig
 * - Constantes STALE_THRESHOLD_MS, PERSIST_VERSION
 */

import {
    isDataStale,
    shouldRefetch,
    markAsFetched,
    resetCache,
    createSafeRehydrateHandler,
    createPersistConfig,
    STALE_THRESHOLD_MS,
    PERSIST_VERSION,
    CacheableState,
    CacheableStateWithMode,
} from '../store-helpers';

// ============================================
// CONSTANTES
// ============================================

describe('Constants', () => {
    it('STALE_THRESHOLD_MS deve ser 5 minutos (300000ms)', () => {
        expect(STALE_THRESHOLD_MS).toBe(5 * 60 * 1000);
    });

    it('PERSIST_VERSION deve ser 1', () => {
        expect(PERSIST_VERSION).toBe(1);
    });
});

// ============================================
// isDataStale
// ============================================

describe('isDataStale', () => {
    it('retorna true quando dados nunca foram carregados (dataLoaded: false)', () => {
        const state: CacheableState = { dataLoaded: false, lastFetchedAt: null };
        expect(isDataStale(state)).toBe(true);
    });

    it('retorna true quando lastFetchedAt é null', () => {
        const state: CacheableState = { dataLoaded: true, lastFetchedAt: null };
        expect(isDataStale(state)).toBe(true);
    });

    it('retorna false quando dados estão dentro do threshold', () => {
        const state: CacheableState = {
            dataLoaded: true,
            lastFetchedAt: Date.now() - 1000, // 1 segundo atrás
        };
        expect(isDataStale(state)).toBe(false);
    });

    it('retorna true quando dados estão fora do threshold', () => {
        const state: CacheableState = {
            dataLoaded: true,
            lastFetchedAt: Date.now() - STALE_THRESHOLD_MS - 1, // 1ms além do threshold
        };
        expect(isDataStale(state)).toBe(true);
    });
});

// ============================================
// shouldRefetch
// ============================================

describe('shouldRefetch', () => {
    const freshState: CacheableStateWithMode = {
        dataLoaded: true,
        lastFetchedAt: Date.now(),
        fetchMode: 'all',
    };

    it('retorna true quando forceRefresh é true', () => {
        expect(shouldRefetch(freshState, 'all', true)).toBe(true);
    });

    it('retorna true quando dados nunca foram carregados', () => {
        const state: CacheableStateWithMode = {
            dataLoaded: false,
            lastFetchedAt: null,
            fetchMode: null,
        };
        expect(shouldRefetch(state)).toBe(true);
    });

    it('retorna true quando dados estão stale', () => {
        const state: CacheableStateWithMode = {
            dataLoaded: true,
            lastFetchedAt: Date.now() - STALE_THRESHOLD_MS - 1,
            fetchMode: 'all',
        };
        expect(shouldRefetch(state, 'all')).toBe(true);
    });

    it('retorna true quando mode mudou', () => {
        const state: CacheableStateWithMode = {
            dataLoaded: true,
            lastFetchedAt: Date.now(),
            fetchMode: 'all',
        };
        expect(shouldRefetch(state, 'recent')).toBe(true);
    });

    it('retorna false quando dados são frescos e mode é o mesmo', () => {
        expect(shouldRefetch(freshState, 'all')).toBe(false);
    });
});

// ============================================
// markAsFetched
// ============================================

describe('markAsFetched', () => {
    it('retorna shape correto sem mode', () => {
        const before = Date.now();
        const result = markAsFetched();
        const after = Date.now();

        expect(result.dataLoaded).toBe(true);
        expect(result.lastFetchedAt).toBeGreaterThanOrEqual(before);
        expect(result.lastFetchedAt).toBeLessThanOrEqual(after);
        expect(result.fetchMode).toBeUndefined();
    });

    it('inclui fetchMode quando mode é fornecido', () => {
        const result = markAsFetched('recent');

        expect(result.dataLoaded).toBe(true);
        expect(result.lastFetchedAt).toBeTypeOf('number');
        expect(result.fetchMode).toBe('recent');
    });
});

// ============================================
// resetCache
// ============================================

describe('resetCache', () => {
    it('retorna shape zerado', () => {
        const result = resetCache();

        expect(result).toEqual({
            dataLoaded: false,
            lastFetchedAt: null,
        });
    });
});

// ============================================
// createSafeRehydrateHandler
// ============================================

describe('createSafeRehydrateHandler', () => {
    it('não faz nada quando não há erro', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

        const handler = createSafeRehydrateHandler('test-store');
        handler({}, undefined);

        expect(warnSpy).not.toHaveBeenCalled();
        warnSpy.mockRestore();
    });

    it('loga warning e remove key do localStorage quando há erro', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

        // Mock localStorage para environment node
        const mockRemoveItem = vi.fn();
        const originalLocalStorage = globalThis.localStorage;
        Object.defineProperty(globalThis, 'localStorage', {
            value: { removeItem: mockRemoveItem },
            writable: true,
            configurable: true,
        });

        const handler = createSafeRehydrateHandler('clients');
        handler({}, new Error('JSON parse failed'));

        expect(warnSpy).toHaveBeenCalledOnce();
        expect(warnSpy.mock.calls[0][0]).toContain('[clients]');
        expect(warnSpy.mock.calls[0][0]).toContain('corrompido');
        expect(mockRemoveItem).toHaveBeenCalledWith('barberia-clients');

        // Restore
        if (originalLocalStorage) {
            Object.defineProperty(globalThis, 'localStorage', {
                value: originalLocalStorage,
                writable: true,
                configurable: true,
            });
        }
        warnSpy.mockRestore();
    });
});

// ============================================
// createPersistConfig
// ============================================

describe('createPersistConfig', () => {
    it('retorna configuração com name, partialize, version e onRehydrateStorage', () => {
        const partialize = (state: { data: string; loading: boolean }) => ({
            data: state.data,
        });

        const config = createPersistConfig('test-store', partialize);

        expect(config.name).toBe('barberia-test-store');
        expect(config.partialize).toBe(partialize);
        expect(config.version).toBe(PERSIST_VERSION);
        expect(config.onRehydrateStorage).toBeTypeOf('function');
    });
});
