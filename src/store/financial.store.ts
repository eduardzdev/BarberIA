/**
 * FinancialStore - Store Zustand para gerenciar transações financeiras
 * 
 * Gerencia todas as transações (receitas e despesas) com:
 * - Cache inteligente com validação de "staleness" (1 minuto)
 * - Persistência em localStorage para sobreviver a reloads
 * - Filtros server-side para data range (otimização de custos)
 * 
 * IMPORTANTE: fetchByDateRange agora usa queries Firestore em vez de
 * buscar todos e filtrar no cliente (economia de ~80% em reads).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Transaction, TransactionType } from '@/types';
import { BaseService } from '@/services/base.service';
import { where, orderBy } from 'firebase/firestore';
import {
  shouldRefetch,
  markAsFetched,
  resetCache,
  createSafeRehydrateHandler,
  PERSIST_VERSION,
  CacheableStateWithMode
} from '@/lib/store-helpers';

const transactionsService = new BaseService<Transaction>('transactions');

// Types para criação/atualização
export type CreateTransactionData = Omit<Transaction, 'id'>;
export type UpdateTransactionData = Partial<CreateTransactionData>;

interface FinancialState extends CacheableStateWithMode {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;

  // Filtros atuais (para cache validation)
  currentDateRange: { start: string; end: string } | null;

  // Actions
  fetchTransactions: (forceRefresh?: boolean) => Promise<void>;
  fetchByDateRange: (startDate: string, endDate: string, forceRefresh?: boolean) => Promise<void>;
  fetchByMonth: (year: number, month: number, forceRefresh?: boolean) => Promise<void>;
  createTransaction: (data: CreateTransactionData) => Promise<string>;
  updateTransaction: (id: string, data: UpdateTransactionData) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearError: () => void;
  clearCache: () => void;
}

export const useFinancialStore = create<FinancialState>()(
  persist(
    (set, get) => ({
      transactions: [],
      loading: false,
      error: null,

      // Cache state
      dataLoaded: false,
      lastFetchedAt: null,
      fetchMode: null,
      currentDateRange: null,

      /**
       * Busca todas as transações
       * Ordenadas por data (decrescente) e hora (decrescente)
       */
      fetchTransactions: async (forceRefresh = false) => {
        const state = get();

        if (!shouldRefetch(state, 'all', forceRefresh)) {
          return;
        }

        set({ loading: true, error: null });
        try {
          const data = await transactionsService.getAll([
            orderBy('date', 'desc'),
          ], 200); // Limite de segurança

          // Ordenar por data e hora localmente (já vem ordenado por data)
          const sorted = data.sort((a, b) => {
            const dateCompare = b.date.localeCompare(a.date);
            if (dateCompare !== 0) return dateCompare;
            return b.time.localeCompare(a.time);
          });

          set({
            transactions: sorted,
            loading: false,
            currentDateRange: null,
            ...markAsFetched('all'),
          });
        } catch (err) {
          console.error('Erro ao buscar transações:', err);
          set({
            error: 'Erro ao carregar transações',
            loading: false
          });
        }
      },

      /**
       * Busca transações em um período específico
       * OTIMIZADO: Usa queries Firestore server-side em vez de filtrar no cliente
       */
      fetchByDateRange: async (startDate: string, endDate: string, forceRefresh = false) => {
        const state = get();
        const rangeKey = `range:${startDate}:${endDate}`;

        // Check cache - verifica se o range atual é o mesmo
        if (!forceRefresh &&
          state.dataLoaded &&
          state.fetchMode === rangeKey &&
          state.currentDateRange?.start === startDate &&
          state.currentDateRange?.end === endDate) {
          // Ainda valida staleness
          if (!shouldRefetch(state, rangeKey, false)) {
            return;
          }
        }

        set({ loading: true, error: null });
        try {
          // OTIMIZAÇÃO: Query server-side no Firestore
          const filtered = await transactionsService.getAll([
            where('date', '>=', startDate),
            where('date', '<=', endDate),
            orderBy('date', 'desc'),
          ]);

          // Ordenar por hora localmente (data já ordenada)
          const sorted = filtered.sort((a, b) => {
            const dateCompare = b.date.localeCompare(a.date);
            if (dateCompare !== 0) return dateCompare;
            return b.time.localeCompare(a.time);
          });

          set({
            transactions: sorted,
            loading: false,
            currentDateRange: { start: startDate, end: endDate },
            ...markAsFetched(rangeKey),
          });
        } catch (err) {
          console.error('Erro ao buscar transações por período:', err);
          set({
            error: 'Erro ao carregar transações do período',
            loading: false
          });
        }
      },

      /**
       * Busca transações de um mês específico
       */
      fetchByMonth: async (year: number, month: number, forceRefresh = false) => {
        // Calcular primeiro e último dia do mês
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);

        const startDate = firstDay.toISOString().split('T')[0];
        const endDate = lastDay.toISOString().split('T')[0];

        return get().fetchByDateRange(startDate, endDate, forceRefresh);
      },

      /**
       * Cria uma nova transação
       */
      createTransaction: async (data: CreateTransactionData) => {
        set({ loading: true, error: null });
        try {
          // Validações
          if (!data.description.trim()) {
            throw new Error('Descrição é obrigatória');
          }
          if (!data.category.trim()) {
            throw new Error('Categoria é obrigatória');
          }
          if (data.amount <= 0) {
            throw new Error('Valor deve ser maior que zero');
          }
          if (!data.date) {
            throw new Error('Data é obrigatória');
          }
          if (!data.time) {
            throw new Error('Hora é obrigatória');
          }
          if (!data.paymentMethod.trim()) {
            throw new Error('Método de pagamento é obrigatório');
          }

          // Criar transação
          const id = await transactionsService.create(data);

          // Adicionar ao estado local
          const newTransaction: Transaction = { ...data, id };
          const updated = [...get().transactions, newTransaction].sort((a, b) => {
            const dateCompare = b.date.localeCompare(a.date);
            if (dateCompare !== 0) return dateCompare;
            return b.time.localeCompare(a.time);
          });

          set({
            transactions: updated,
            loading: false,
            lastFetchedAt: Date.now(),
          });

          return id;
        } catch (err) {
          console.error('Erro ao criar transação:', err);
          const message = err instanceof Error ? err.message : 'Erro ao criar transação';
          set({ error: message, loading: false });
          throw err;
        }
      },

      /**
       * Atualiza uma transação existente
       */
      updateTransaction: async (id: string, data: UpdateTransactionData) => {
        set({ loading: true, error: null });
        try {
          // Buscar transação atual
          const current = get().transactions.find(t => t.id === id);
          if (!current) {
            throw new Error('Transação não encontrada');
          }

          // Validações (se campos fornecidos)
          if (data.description !== undefined && !data.description.trim()) {
            throw new Error('Descrição não pode ser vazia');
          }
          if (data.category !== undefined && !data.category.trim()) {
            throw new Error('Categoria não pode ser vazia');
          }
          if (data.amount !== undefined && data.amount <= 0) {
            throw new Error('Valor deve ser maior que zero');
          }
          if (data.paymentMethod !== undefined && !data.paymentMethod.trim()) {
            throw new Error('Método de pagamento não pode ser vazio');
          }

          // Atualizar no Firestore
          await transactionsService.update(id, data);

          // Atualizar estado local
          const updated = get().transactions.map(t =>
            t.id === id ? { ...t, ...data } : t
          ).sort((a, b) => {
            const dateCompare = b.date.localeCompare(a.date);
            if (dateCompare !== 0) return dateCompare;
            return b.time.localeCompare(a.time);
          });

          set({
            transactions: updated,
            loading: false,
            lastFetchedAt: Date.now(),
          });
        } catch (err) {
          console.error('Erro ao atualizar transação:', err);
          const message = err instanceof Error ? err.message : 'Erro ao atualizar transação';
          set({ error: message, loading: false });
          throw err;
        }
      },

      /**
       * Remove uma transação
       */
      deleteTransaction: async (id: string) => {
        set({ loading: true, error: null });
        try {
          // Remover do Firestore
          await transactionsService.delete(id);

          // Remover do estado local
          const updated = get().transactions.filter(t => t.id !== id);
          set({
            transactions: updated,
            loading: false,
            lastFetchedAt: Date.now(),
          });
        } catch (err) {
          console.error('Erro ao remover transação:', err);
          set({
            error: 'Erro ao remover transação',
            loading: false
          });
          throw err;
        }
      },

      /**
       * Limpa mensagem de erro
       */
      clearError: () => {
        set({ error: null });
      },

      clearCache: () => set({
        ...resetCache(),
        transactions: [],
        currentDateRange: null,
      }),
    }),
    {
      name: 'barberia-financial',
      storage: createJSONStorage(() => localStorage),
      version: PERSIST_VERSION,
      onRehydrateStorage: () => createSafeRehydrateHandler('financial'),
      partialize: (state) => ({
        transactions: state.transactions,
        dataLoaded: state.dataLoaded,
        lastFetchedAt: state.lastFetchedAt,
        fetchMode: state.fetchMode,
        currentDateRange: state.currentDateRange,
      }),
    }
  )
);
