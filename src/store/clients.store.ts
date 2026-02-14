/**
 * ClientsStore - Store global de clientes usando Zustand
 * 
 * Gerencia a base de clientes da barbearia com:
 * - Cache inteligente com validação de "staleness" (1 minuto)
 * - Persistência em localStorage para sobreviver a reloads
 * 
 * Estado:
 * - clients: Lista de clientes
 * - loading: Estado de carregamento
 * - error: Mensagem de erro
 * - dataLoaded/lastFetchedAt: Metadados de cache
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Client, ClientStatus } from '@/types';
import { BaseService } from '@/services/base.service';
import { orderBy } from 'firebase/firestore';
import {
  shouldRefetch,
  markAsFetched,
  resetCache,
  createSafeRehydrateHandler,
  PERSIST_VERSION,
  CacheableStateWithMode
} from '@/lib/store-helpers';

// Instância do serviço de Firestore
const clientsService = new BaseService<Client>('clients');

// Tipos para criação/atualização (sem ID)
export type CreateClientData = Omit<Client, 'id' | 'visits' | 'spent' | 'lastVisit' | 'avatarInitials' | 'status' | 'isVip'> & {
  visits?: number;
  spent?: number;
  lastVisit?: string;
  avatarInitials?: string;
  status?: ClientStatus;
  isVip?: boolean;
};
export type UpdateClientData = Partial<Omit<Client, 'id'>>;

interface ClientsState extends CacheableStateWithMode {
  // Estado
  clients: Client[];
  loading: boolean;
  error: string | null;

  // Ações de dados
  fetchClients: (forceRefresh?: boolean) => Promise<void>;
  createClient: (data: CreateClientData) => Promise<string>;
  updateClient: (id: string, data: UpdateClientData) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  updateStatus: (id: string, status: ClientStatus) => Promise<void>;
  toggleVip: (id: string, isVip: boolean) => Promise<void>;

  // Ações de controle
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  clearCache: () => void;
}

export const useClientsStore = create<ClientsState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      clients: [],
      loading: false,
      error: null,

      // Cache state
      dataLoaded: false,
      lastFetchedAt: null,
      fetchMode: null,

      // Busca todos os clientes
      fetchClients: async (forceRefresh = false) => {
        const state = get();

        // Check cache validity
        if (!shouldRefetch(state, 'all', forceRefresh)) {
          return;
        }

        set({ loading: true, error: null });

        try {
          const clients = await clientsService.getAll([
            orderBy('name', 'asc')
          ]);

          set({
            clients,
            loading: false,
            error: null,
            ...markAsFetched('all'),
          });
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'Erro ao carregar clientes';

          console.error('Erro ao buscar clientes:', error);
          set({
            loading: false,
            error: errorMessage
          });
        }
      },

      // Cria um novo cliente
      createClient: async (data: CreateClientData) => {
        set({ loading: true, error: null });

        try {
          // Validações
          if (!data.name) {
            throw new Error('Nome é obrigatório');
          }

          if (!data.phone) {
            throw new Error('Telefone é obrigatório');
          }

          if (!data.email) {
            throw new Error('Email é obrigatório');
          }

          // Gera iniciais do avatar
          const avatarInitials = data.name
            .split(' ')
            .map(word => word[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

          // Cria cliente no Firestore
          const id = await clientsService.create({
            ...data,
            avatarInitials,
            visits: data.visits || 0,
            spent: data.spent || 0,
            lastVisit: data.lastVisit || '',
            status: data.status || ClientStatus.Active,
            isVip: data.isVip || false,
          });

          // Atualiza estado local
          const newClient: Client = {
            id,
            ...data,
            avatarInitials,
            visits: data.visits || 0,
            spent: data.spent || 0,
            lastVisit: data.lastVisit || '',
            status: data.status || ClientStatus.Active,
            isVip: data.isVip || false,
          };

          set((state) => ({
            clients: [...state.clients, newClient].sort((a, b) =>
              a.name.localeCompare(b.name)
            ),
            loading: false,
            error: null,
            lastFetchedAt: Date.now(),
          }));

          return id;
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'Erro ao criar cliente';

          console.error('Erro ao criar cliente:', error);
          set({
            loading: false,
            error: errorMessage
          });

          throw error;
        }
      },

      // Atualiza um cliente existente
      updateClient: async (id: string, data: UpdateClientData) => {
        set({ loading: true, error: null });

        try {
          // Valida se cliente existe
          const client = get().clients.find(c => c.id === id);
          if (!client) {
            throw new Error('Cliente não encontrado');
          }

          // Atualiza iniciais se nome mudou
          let updateData = { ...data };
          if (data.name) {
            const avatarInitials = data.name
              .split(' ')
              .map(word => word[0])
              .join('')
              .substring(0, 2)
              .toUpperCase();
            updateData = { ...updateData, avatarInitials };
          }

          // Atualiza no Firestore
          await clientsService.update(id, updateData);

          // Atualiza estado local
          set((state) => ({
            clients: state.clients
              .map(c => c.id === id ? { ...c, ...updateData } : c)
              .sort((a, b) => a.name.localeCompare(b.name)),
            loading: false,
            error: null,
            lastFetchedAt: Date.now(),
          }));
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'Erro ao atualizar cliente';

          console.error('Erro ao atualizar cliente:', error);
          set({
            loading: false,
            error: errorMessage
          });

          throw error;
        }
      },

      // Remove um cliente
      deleteClient: async (id: string) => {
        set({ loading: true, error: null });

        try {
          // Valida se cliente existe
          const client = get().clients.find(c => c.id === id);
          if (!client) {
            throw new Error('Cliente não encontrado');
          }

          // Remove do Firestore
          await clientsService.delete(id);

          // Remove do estado local
          set((state) => ({
            clients: state.clients.filter(c => c.id !== id),
            loading: false,
            error: null,
            lastFetchedAt: Date.now(),
          }));
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'Erro ao excluir cliente';

          console.error('Erro ao excluir cliente:', error);
          set({
            loading: false,
            error: errorMessage
          });

          throw error;
        }
      },

      // Atualiza apenas o status (helper convenience)
      updateStatus: async (id: string, status: ClientStatus) => {
        try {
          await get().updateClient(id, { status });
        } catch (error) {
          throw error;
        }
      },

      // Atualiza apenas o VIP (helper convenience)
      toggleVip: async (id: string, isVip: boolean) => {
        try {
          await get().updateClient(id, { isVip });
        } catch (error) {
          throw error;
        }
      },

      // Ações de controle
      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error, loading: false }),

      clearError: () => set({ error: null }),

      clearCache: () => set({
        ...resetCache(),
        clients: [],
      }),
    }),
    {
      name: 'barberia-clients',
      storage: createJSONStorage(() => localStorage),
      version: PERSIST_VERSION,
      onRehydrateStorage: () => createSafeRehydrateHandler('clients'),
      partialize: (state) => ({
        clients: state.clients,
        dataLoaded: state.dataLoaded,
        lastFetchedAt: state.lastFetchedAt,
        fetchMode: state.fetchMode,
      }),
    }
  )
);
