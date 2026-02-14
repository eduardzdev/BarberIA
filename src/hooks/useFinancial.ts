/**
 * useFinancial - Hook para gerenciar transações financeiras
 * 
 * Facilita o uso do FinancialStore em componentes React.
 * 
 * Features:
 * - Acesso ao estado de transações
 * - Métodos CRUD completos
 * - Filtros por tipo, categoria, período
 * - Cálculo de saldo, receitas e despesas
 * - Estatísticas financeiras
 * - Auto-loading inicial (opcional)
 * - forceRefresh para bypass de cache
 * - Helpers memoizados (useMemo)
 * 
 * Referências:
 * - ANALISE_COMPLETA_UI.md - Seção 6 (Financeiro)
 * - DESCRICAO_FEATURES.md - Seção 5 (Controle Financeiro)
 * 
 * Exemplo de uso:
 * ```typescript
 * function FinancialPage() {
 *   const { 
 *     transactions, 
 *     loading,
 *     getBalance,
 *     getMonthlyStats 
 *   } = useFinancial({ autoFetch: 'current-month' });
 * 
 *   const balance = getBalance();
 *   const stats = getMonthlyStats();
 * 
 *   return (
 *     <div>
 *       <h2>Saldo: R$ {balance.toFixed(2)}</h2>
 *       <p>Receitas: R$ {stats.income.toFixed(2)}</p>
 *       <p>Despesas: R$ {stats.expenses.toFixed(2)}</p>
 *     </div>
 *   );
 * }
 * ```
 */

import { useEffect, useMemo } from 'react';
import {
  useFinancialStore,
  CreateTransactionData,
  UpdateTransactionData
} from '@/store/financial.store';
import { TransactionType } from '@/types';

interface UseFinancialOptions {
  /**
   * Busca automática ao montar
   * - 'all': Todas as transações
   * - 'current-month': Mês atual
   * - 'date-range': Período específico (requer startDate e endDate)
   * - false: Sem busca automática
   */
  autoFetch?: 'all' | 'current-month' | 'date-range' | false;
  /**
   * Data inicial (para autoFetch: 'date-range')
   */
  startDate?: string;
  /**
   * Data final (para autoFetch: 'date-range')
   */
  endDate?: string;
  /**
   * Força refetch ignorando cache
   */
  forceRefresh?: boolean;
}

export function useFinancial(options: UseFinancialOptions = {}) {
  const {
    autoFetch = false,
    startDate,
    endDate,
    forceRefresh = false,
  } = options;

  // Estado do store
  const transactions = useFinancialStore((state) => state.transactions);
  const loading = useFinancialStore((state) => state.loading);
  const error = useFinancialStore((state) => state.error);
  const dataLoaded = useFinancialStore((state) => state.dataLoaded);

  // Ações
  const fetchTransactions = useFinancialStore((state) => state.fetchTransactions);
  const fetchByDateRange = useFinancialStore((state) => state.fetchByDateRange);
  const fetchByMonth = useFinancialStore((state) => state.fetchByMonth);
  const createTransaction = useFinancialStore((state) => state.createTransaction);
  const updateTransaction = useFinancialStore((state) => state.updateTransaction);
  const deleteTransaction = useFinancialStore((state) => state.deleteTransaction);
  const clearError = useFinancialStore((state) => state.clearError);
  const clearCache = useFinancialStore((state) => state.clearCache);

  // Auto-fetch ao montar (usa cache a menos que forceRefresh)
  useEffect(() => {
    if (autoFetch === 'all') {
      fetchTransactions(forceRefresh);
    } else if (autoFetch === 'current-month') {
      const now = new Date();
      fetchByMonth(now.getFullYear(), now.getMonth() + 1, forceRefresh);
    } else if (autoFetch === 'date-range' && startDate && endDate) {
      fetchByDateRange(startDate, endDate, forceRefresh);
    }
  }, [autoFetch, startDate, endDate, forceRefresh, fetchTransactions, fetchByDateRange, fetchByMonth]);

  // Helpers memoizados para evitar re-renders desnecessários
  const helpers = useMemo(() => ({
    /**
     * Busca transação por ID
     */
    getTransactionById: (id: string) => {
      return transactions.find(t => t.id === id) || null;
    },

    /**
     * Filtra transações por tipo
     */
    filterByType: (type: TransactionType) => {
      return transactions.filter(t => t.type === type);
    },

    /**
     * Filtra transações por categoria
     */
    filterByCategory: (category: string) => {
      return transactions.filter(t => t.category === category);
    },

    /**
     * Filtra transações por método de pagamento
     */
    filterByPaymentMethod: (method: string) => {
      return transactions.filter(t => t.paymentMethod === method);
    },

    /**
     * Filtra transações por período
     */
    filterByDateRange: (start: string, end: string) => {
      return transactions.filter(t =>
        t.date >= start && t.date <= end
      );
    },

    /**
     * Retorna receitas
     */
    getIncomeTransactions: () => {
      return transactions.filter(t => t.type === TransactionType.Income);
    },

    /**
     * Retorna despesas
     */
    getExpenseTransactions: () => {
      return transactions.filter(t => t.type === TransactionType.Expense);
    },

    /**
     * Calcula saldo total
     */
    getBalance: () => {
      return transactions.reduce((balance, t) => {
        return t.type === TransactionType.Income
          ? balance + t.amount
          : balance - t.amount;
      }, 0);
    },

    /**
     * Calcula total de receitas
     */
    getTotalIncome: () => {
      return transactions
        .filter(t => t.type === TransactionType.Income)
        .reduce((sum, t) => sum + t.amount, 0);
    },

    /**
     * Calcula total de despesas
     */
    getTotalExpenses: () => {
      return transactions
        .filter(t => t.type === TransactionType.Expense)
        .reduce((sum, t) => sum + t.amount, 0);
    },

    /**
     * Retorna estatísticas gerais
     */
    getStats: () => {
      const income = transactions
        .filter(t => t.type === TransactionType.Income)
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = transactions
        .filter(t => t.type === TransactionType.Expense)
        .reduce((sum, t) => sum + t.amount, 0);
      const balance = income - expenses;

      return {
        total: transactions.length,
        income,
        expenses,
        balance,
        incomeCount: transactions.filter(t => t.type === TransactionType.Income).length,
        expenseCount: transactions.filter(t => t.type === TransactionType.Expense).length,
      };
    },

    /**
     * Retorna estatísticas por categoria
     */
    getStatsByCategory: () => {
      const categories = new Map<string, { income: number; expenses: number; count: number }>();

      transactions.forEach(t => {
        const current = categories.get(t.category) || { income: 0, expenses: 0, count: 0 };

        if (t.type === TransactionType.Income) {
          current.income += t.amount;
        } else {
          current.expenses += t.amount;
        }
        current.count++;

        categories.set(t.category, current);
      });

      return Array.from(categories.entries()).map(([category, data]) => ({
        category,
        ...data,
        total: data.income - data.expenses,
      }));
    },

    /**
     * Retorna estatísticas por método de pagamento
     */
    getStatsByPaymentMethod: () => {
      const methods = new Map<string, { income: number; expenses: number; count: number }>();

      transactions.forEach(t => {
        const current = methods.get(t.paymentMethod) || { income: 0, expenses: 0, count: 0 };

        if (t.type === TransactionType.Income) {
          current.income += t.amount;
        } else {
          current.expenses += t.amount;
        }
        current.count++;

        methods.set(t.paymentMethod, current);
      });

      return Array.from(methods.entries()).map(([method, data]) => ({
        method,
        ...data,
        total: data.income - data.expenses,
      }));
    },

    /**
     * Retorna estatísticas do mês atual
     */
    getMonthlyStats: () => {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const monthTransactions = transactions.filter(t =>
        t.date >= firstDay && t.date <= lastDay
      );

      const income = monthTransactions
        .filter(t => t.type === TransactionType.Income)
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === TransactionType.Expense)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        income,
        expenses,
        balance: income - expenses,
        count: monthTransactions.length,
      };
    },

    /**
     * Retorna transações do dia atual
     */
    getTodayTransactions: () => {
      const today = new Date().toISOString().split('T')[0];
      return transactions.filter(t => t.date === today);
    },
  }), [transactions]);

  return {
    // Estado
    transactions,
    loading,
    error,
    dataLoaded,

    // Ações
    fetchTransactions,
    fetchByDateRange,
    fetchByMonth,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    clearError,
    clearCache,

    // Helpers
    ...helpers,
  };
}
