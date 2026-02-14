/**
 * Store Helpers - Shared utilities for Zustand stores
 * 
 * Provides:
 * - Staleness checking for cache validation
 * - Persist configuration factory for consistent localStorage caching
 * - Type definitions for cacheable store state
 * 
 * Usage:
 * ```typescript
 * interface MyState extends CacheableState {
 *   items: Item[];
 *   fetchItems: () => Promise<void>;
 * }
 * 
 * // In store:
 * fetchItems: async (forceRefresh = false) => {
 *   if (!forceRefresh && !shouldRefetch(get())) return;
 *   // ... fetch logic
 *   set({ ...data, ...markAsFetched() });
 * }
 * ```
 */

import { StateStorage, createJSONStorage, PersistOptions } from 'zustand/middleware';

// ============================================
// CONSTANTS
// ============================================

/** Default staleness threshold in milliseconds (5 minutes) */
export const STALE_THRESHOLD_MS = 5 * 60 * 1000;

/** Storage key prefix for all persisted stores */
const STORAGE_PREFIX = 'barberia';

// ============================================
// TYPES
// ============================================

/**
 * Base interface for stores that support caching
 */
export interface CacheableState {
    /** Whether initial data has been loaded */
    dataLoaded: boolean;
    /** Timestamp of last successful fetch */
    lastFetchedAt: number | null;
}

/**
 * Extended cacheable state with fetch mode tracking
 */
export interface CacheableStateWithMode extends CacheableState {
    /** The mode/filter used for the last fetch */
    fetchMode: string | null;
}

// ============================================
// STALENESS UTILITIES
// ============================================

/**
 * Check if cached data is stale and needs refresh
 * @param state - Store state with cache metadata
 * @param thresholdMs - Custom threshold (default: STALE_THRESHOLD_MS)
 * @returns true if data should be refetched
 */
export function isDataStale(
    state: CacheableState,
    thresholdMs: number = STALE_THRESHOLD_MS
): boolean {
    if (!state.dataLoaded || !state.lastFetchedAt) {
        return true;
    }
    return Date.now() - state.lastFetchedAt > thresholdMs;
}

/**
 * Check if data should be refetched based on staleness and mode
 * @param state - Store state with cache metadata
 * @param currentMode - The mode being requested
 * @param forceRefresh - Force refetch regardless of cache
 * @returns true if data should be refetched
 */
export function shouldRefetch(
    state: CacheableStateWithMode,
    currentMode?: string,
    forceRefresh: boolean = false
): boolean {
    if (forceRefresh) return true;
    if (!state.dataLoaded) return true;
    if (isDataStale(state)) return true;
    if (currentMode && state.fetchMode !== currentMode) return true;
    return false;
}

/**
 * Create cache metadata update for after successful fetch
 * @param mode - Optional fetch mode to track
 * @returns Object to spread into store state
 */
export function markAsFetched(mode?: string): Partial<CacheableStateWithMode> {
    return {
        dataLoaded: true,
        lastFetchedAt: Date.now(),
        ...(mode !== undefined && { fetchMode: mode }),
    };
}

/**
 * Create cache reset metadata (for logout or error scenarios)
 * @returns Object to spread into store state
 */
export function resetCache(): CacheableState {
    return {
        dataLoaded: false,
        lastFetchedAt: null,
    };
}

// ============================================
// PERSIST CONFIGURATION
// ============================================

/**
 * Create persist options for a store
 * @param storeName - Unique name for the store (used in localStorage key)
 * @param partialize - Function to select which state to persist
 * @returns PersistOptions for zustand middleware
 */
export function createPersistConfig<T>(
    storeName: string,
    partialize: (state: T) => Partial<T>
): PersistOptions<T, Partial<T>> {
    return {
        name: `${STORAGE_PREFIX}-${storeName}`,
        storage: createJSONStorage(() => localStorage),
        partialize,
        version: PERSIST_VERSION,
        onRehydrateStorage: () => createSafeRehydrateHandler(storeName),
    };
}

/** Current persist version - increment when state shape changes */
export const PERSIST_VERSION = 1;

/**
 * Factory for safe rehydration error handler
 * Prevents silent crashes when localStorage data is corrupted
 * @param storeName - Name of the store (for logging)
 * @returns Handler compatible with Zustand's onRehydrateStorage
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createSafeRehydrateHandler(storeName: string): (state: any, error?: unknown) => void {
    return (_state: any, error?: unknown) => {
        if (error) {
            console.warn(
                `[${storeName}] Cache corrompido no localStorage. Usando valores padrão.`,
                error
            );
            try {
                localStorage.removeItem(`${STORAGE_PREFIX}-${storeName}`);
            } catch (e) {
                // localStorage pode não estar disponível
            }
        }
    };
}

/**
 * Default partialize function that excludes loading/error states
 * @param state - Full store state
 * @param dataKeys - Keys of data to persist
 * @returns Partial state for persistence
 */
export function defaultPartialize<T extends CacheableState>(
    state: T,
    dataKeys: (keyof T)[]
): Partial<T> {
    const result: Partial<T> = {
        dataLoaded: state.dataLoaded,
        lastFetchedAt: state.lastFetchedAt,
    } as Partial<T>;

    for (const key of dataKeys) {
        result[key] = state[key];
    }

    return result;
}
