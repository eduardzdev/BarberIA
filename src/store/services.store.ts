/**
 * ServicesStore - Store global de serviços usando Zustand
 * 
 * Gerencia o catálogo de serviços da barbearia com:
 * - Cache inteligente com validação de "staleness" (1 minuto)
 * - Persistência em localStorage para sobreviver a reloads
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Service, Combo } from '@/types';
import { BaseService } from '@/services/base.service';
import { orderBy } from 'firebase/firestore';
import {
  shouldRefetch,
  markAsFetched,
  resetCache,
  isDataStale,
  STALE_THRESHOLD_MS,
  createSafeRehydrateHandler,
  PERSIST_VERSION,
  CacheableStateWithMode
} from '@/lib/store-helpers';

// Instâncias dos serviços de Firestore
const servicesService = new BaseService<Service>('services');
const combosService = new BaseService<Combo>('combos');

// Tipos para criação/atualização
export type CreateServiceData = Omit<Service, 'id'>;
export type UpdateServiceData = Partial<Omit<Service, 'id'>>;

export type CreateComboData = Omit<Combo, 'id'>;
export type UpdateComboData = Partial<Omit<Combo, 'id'>>;

interface ServicesState extends CacheableStateWithMode {
  // Estado
  services: Service[];
  combos: Combo[];
  loading: boolean;
  error: string | null;

  // Cache separado para combos
  combosLoaded: boolean;
  combosLastFetchedAt: number | null;

  // Ações de Serviços
  fetchServices: (forceRefresh?: boolean) => Promise<void>;
  createService: (data: CreateServiceData) => Promise<string>;
  updateService: (id: string, data: UpdateServiceData) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  toggleServiceStatus: (id: string, active: boolean) => Promise<void>;

  // Ações de Combos
  fetchCombos: (forceRefresh?: boolean) => Promise<void>;
  createCombo: (data: CreateComboData) => Promise<string>;
  updateCombo: (id: string, data: UpdateComboData) => Promise<void>;
  deleteCombo: (id: string) => Promise<void>;
  toggleComboStatus: (id: string, active: boolean) => Promise<void>;

  // Ações de controle
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  clearCache: () => void;
}

export const useServicesStore = create<ServicesState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      services: [],
      combos: [],
      loading: false,
      error: null,

      // Cache state para services
      dataLoaded: false,
      lastFetchedAt: null,
      fetchMode: null,

      // Cache state para combos
      combosLoaded: false,
      combosLastFetchedAt: null,

      // --- SERVIÇOS ---

      // Busca todos os serviços
      fetchServices: async (forceRefresh = false) => {
        const state = get();

        // Check cache validity
        if (!shouldRefetch(state, 'services', forceRefresh)) {
          return;
        }

        set({ loading: true, error: null });

        try {
          const services = await servicesService.getAll([
            orderBy('name', 'asc')
          ]);

          set({
            services,
            loading: false,
            error: null,
            ...markAsFetched('services'),
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar serviços';
          console.error('Erro ao buscar serviços:', error);
          set({ loading: false, error: errorMessage });
        }
      },

      // Cria um novo serviço
      createService: async (data: CreateServiceData) => {
        set({ loading: true, error: null });

        try {
          if (!data.name || !data.price || !data.duration) {
            throw new Error('Nome, preço e duração são obrigatórios');
          }

          // Adicionar default active = true se não vier
          const serviceData = { ...data, active: data.active ?? true };

          const id = await servicesService.create(serviceData);

          const newService: Service = {
            id,
            ...serviceData,
          };

          set((state) => ({
            services: [...state.services, newService].sort((a, b) => a.name.localeCompare(b.name)),
            loading: false,
            error: null,
            lastFetchedAt: Date.now(),
          }));

          return id;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao criar serviço';
          console.error('Erro ao criar serviço:', error);
          set({ loading: false, error: errorMessage });
          throw error;
        }
      },

      // Atualiza um serviço existente
      updateService: async (id: string, data: UpdateServiceData) => {
        set({ loading: true, error: null });

        try {
          const service = get().services.find(s => s.id === id);
          if (!service) throw new Error('Serviço não encontrado');

          await servicesService.update(id, data);

          set((state) => ({
            services: state.services
              .map(s => s.id === id ? { ...s, ...data } : s)
              .sort((a, b) => a.name.localeCompare(b.name)),
            loading: false,
            error: null,
            lastFetchedAt: Date.now(),
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar serviço';
          console.error('Erro ao atualizar serviço:', error);
          set({ loading: false, error: errorMessage });
          throw error;
        }
      },

      // Remove um serviço
      deleteService: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const service = get().services.find(s => s.id === id);
          if (!service) throw new Error('Serviço não encontrado');

          await servicesService.delete(id);

          set((state) => ({
            services: state.services.filter(s => s.id !== id),
            loading: false,
            error: null,
            lastFetchedAt: Date.now(),
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir serviço';
          console.error('Erro ao excluir serviço:', error);
          set({ loading: false, error: errorMessage });
          throw error;
        }
      },

      // Toggle status do serviço
      toggleServiceStatus: async (id: string, active: boolean) => {
        await get().updateService(id, { active });
      },

      // --- COMBOS ---

      // Busca todos os combos
      fetchCombos: async (forceRefresh = false) => {
        const state = get();

        // Check cache validity para combos (usa isDataStale compartilhado)
        if (!forceRefresh && state.combosLoaded && state.combosLastFetchedAt) {
          const combosCacheState = { dataLoaded: state.combosLoaded, lastFetchedAt: state.combosLastFetchedAt };
          if (!isDataStale(combosCacheState)) {
            return;
          }
        }

        set({ loading: true, error: null });

        try {
          const combos = await combosService.getAll([
            orderBy('name', 'asc')
          ]);

          set({
            combos,
            loading: false,
            error: null,
            combosLoaded: true,
            combosLastFetchedAt: Date.now(),
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar combos';
          console.error('Erro ao buscar combos:', error);
          set({ loading: false, error: errorMessage });
        }
      },

      // Cria um novo combo
      createCombo: async (data: CreateComboData) => {
        set({ loading: true, error: null });

        try {
          if (!data.name || !data.price || !data.serviceIds || data.serviceIds.length === 0) {
            throw new Error('Nome, preço e serviços são obrigatórios para combos');
          }

          // Default active
          const comboData = { ...data, active: data.active ?? true };

          const id = await combosService.create(comboData);

          const newCombo: Combo = {
            id,
            ...comboData,
          };

          set((state) => ({
            combos: [...state.combos, newCombo].sort((a, b) => a.name.localeCompare(b.name)),
            loading: false,
            error: null,
            combosLastFetchedAt: Date.now(),
          }));

          return id;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao criar combo';
          console.error('Erro ao criar combo:', error);
          set({ loading: false, error: errorMessage });
          throw error;
        }
      },

      // Atualiza um combo
      updateCombo: async (id: string, data: UpdateComboData) => {
        set({ loading: true, error: null });

        try {
          const combo = get().combos.find(c => c.id === id);
          if (!combo) throw new Error('Combo não encontrado');

          await combosService.update(id, data);

          set((state) => ({
            combos: state.combos
              .map(c => c.id === id ? { ...c, ...data } : c)
              .sort((a, b) => a.name.localeCompare(b.name)),
            loading: false,
            error: null,
            combosLastFetchedAt: Date.now(),
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar combo';
          console.error('Erro ao atualizar combo:', error);
          set({ loading: false, error: errorMessage });
          throw error;
        }
      },

      // Remove um combo
      deleteCombo: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const combo = get().combos.find(c => c.id === id);
          if (!combo) throw new Error('Combo não encontrado');

          await combosService.delete(id);

          set((state) => ({
            combos: state.combos.filter(c => c.id !== id),
            loading: false,
            error: null,
            combosLastFetchedAt: Date.now(),
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir combo';
          console.error('Erro ao excluir combo:', error);
          set({ loading: false, error: errorMessage });
          throw error;
        }
      },

      // Toggle status do combo
      toggleComboStatus: async (id: string, active: boolean) => {
        await get().updateCombo(id, { active });
      },

      // Ações de controle
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error, loading: false }),
      clearError: () => set({ error: null }),

      clearCache: () => set({
        ...resetCache(),
        services: [],
        combos: [],
        combosLoaded: false,
        combosLastFetchedAt: null,
      }),
    }),
    {
      name: 'barberia-services',
      storage: createJSONStorage(() => localStorage),
      version: PERSIST_VERSION,
      onRehydrateStorage: () => createSafeRehydrateHandler('services'),
      partialize: (state) => ({
        services: state.services,
        combos: state.combos,
        dataLoaded: state.dataLoaded,
        lastFetchedAt: state.lastFetchedAt,
        fetchMode: state.fetchMode,
        combosLoaded: state.combosLoaded,
        combosLastFetchedAt: state.combosLastFetchedAt,
      }),
    }
  )
);
