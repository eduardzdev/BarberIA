/**
 * FinancialPage - Página de controle financeiro
 * 
 * Página para gerenciar todas as transações financeiras:
 * - Cards de resumo (receita mensal, semanal, diária, lucro líquido)
 * - Distribuição de formas de pagamento (com barra de progresso)
 * - Lista de transações recentes
 * - Filtros por período e tipo
 * - Modal para criar nova transação
 * 
 * Integração com FinancialStore:
 * - Auto-fetch do mês atual
 * - Estatísticas calculadas
 * - Filtros em tempo real
 * - CRUD completo
 * 
 * Referências:
 * - ANALISE_COMPLETA_UI.md - Seção 6 (Financeiro)
 * - DESCRICAO_FEATURES.md - Seção 5 (Controle Financeiro)
 * - ESTADOS_ESPECIAIS.md - Loading, Empty, Error para transações
 * 
 * Features:
 * - Cards de estatísticas com trends
 * - Distribuição visual de métodos de pagamento
 * - Transações com cores (verde=receita, vermelho=despesa)
 * - Filtros por período
 * - Modal inline para nova transação
 */

import React, { useState, useMemo } from 'react';
import CardSkeleton from '@/components/common/CardSkeleton';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { useFinancial } from '@/hooks/useFinancial';
import { useUI } from '@/hooks/useUI';
import { Transaction, TransactionType } from '@/types';
import { CreateTransactionData } from '@/store/financial.store';

// ===== Sub-Components =====

/**
 * StatCard - Card de estatística com trend
 */
interface StatCardProps {
  icon: string;
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, trend, trendUp }) => (
  <Card className="!p-4">
    <div className="flex items-start justify-between mb-2">
      <div className="p-2 bg-violet-500/20 rounded-lg">
        <Icon name={icon} className="w-5 h-5 text-violet-400" />
      </div>
    </div>
    <p className="text-slate-400 text-sm">{title}</p>
    <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
    {trend && (
      <p className={`text-xs mt-2 flex items-center ${trendUp ? 'text-green-400' : trendUp === false ? 'text-red-400' : 'text-slate-400'}`}>
        {trendUp !== undefined && (
          <Icon name={trendUp ? 'trending-up' : 'trending-down'} className="w-3 h-3 mr-1" />
        )}
        {trend}
      </p>
    )}
  </Card>
);

/**
 * PaymentMethodDistribution - Barra de distribuição por método de pagamento
 */
interface PaymentMethodDistributionProps {
  method: string;
  percentage: number;
  amount: string;
  icon: string;
  creditPercentage?: number;
  debitPercentage?: number;
  creditAmount?: number;
  debitAmount?: number;
}

const PaymentMethodDistribution: React.FC<PaymentMethodDistributionProps> = ({
  method,
  percentage,
  amount,
  icon,
  creditPercentage,
  debitPercentage,
  creditAmount,
  debitAmount
}) => {
  const isCardMethod = method.toLowerCase().includes('cartão');
  const hasSplit = isCardMethod && creditPercentage !== undefined && debitPercentage !== undefined;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon name={icon} className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <span className="text-slate-300 font-medium truncate">{method}</span>
          <span className="text-slate-500 text-xs">{percentage}% do total</span>
        </div>
        <span className="font-bold text-slate-100 flex-shrink-0">{amount}</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-1.5">
        {hasSplit ? (
          <div className="flex h-1.5 rounded-full overflow-hidden">
            {creditPercentage > 0 && (
              <div
                className="bg-violet-500 h-full transition-all duration-300"
                style={{ width: `${creditPercentage}%` }}
                title={`Crédito: R$ ${creditAmount?.toFixed(2) || '0.00'}`}
              ></div>
            )}
            {debitPercentage > 0 && (
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${debitPercentage}%` }}
                title={`Débito: R$ ${debitAmount?.toFixed(2) || '0.00'}`}
              ></div>
            )}
          </div>
        ) : (
          <div
            className="bg-violet-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          ></div>
        )}
      </div>
      {hasSplit && (
        <div className="flex gap-4 text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-violet-500 rounded-full"></div>
            <span>Crédito: R$ {creditAmount?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-blue-600 rounded-full"></div>
            <span>Débito: R$ {debitAmount?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * TransactionItem - Item de transação na lista
 */
interface TransactionItemProps {
  transaction: Transaction;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const isIncome = transaction.type === TransactionType.Income;

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center space-x-4">
        <div className={`p-2 rounded-lg ${isIncome ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          <Icon
            name={isIncome ? 'arrowUp' : 'arrowDown'}
            className={`w-5 h-5 ${isIncome ? 'text-green-400' : 'text-red-400'}`}
          />
        </div>
        <div>
          <p className="font-bold text-slate-100">{transaction.description}</p>
          <p className="text-xs text-slate-400">
            {transaction.date} - {transaction.time}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold text-lg ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
          {isIncome ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
        </p>
        <p className="text-xs text-slate-400">{transaction.category}</p>
      </div>
    </div>
  );
};

/**
 * NewTransactionForm - Formulário inline para criar transação
 */
interface NewTransactionFormProps {
  onClose: () => void;
}

const NewTransactionForm: React.FC<NewTransactionFormProps> = ({ onClose }) => {
  const { createTransaction } = useFinancial();
  const { success, error: showError } = useUI();

  const [type, setType] = useState<TransactionType>(TransactionType.Income);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Serviços');
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      showError('Preencha todos os campos corretamente');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const createData: CreateTransactionData = {
        type,
        description: description.trim(),
        category: category.trim(),
        amount: parseFloat(amount),
        date,
        time,
        paymentMethod: paymentMethod.trim()
      };

      await createTransaction(createData);
      success('Transação registrada com sucesso!');
      onClose();
    } catch (err) {
      showError('Erro ao registrar transação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-400">Tipo *</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TransactionType)}
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value={TransactionType.Income}>Receita</option>
          <option value={TransactionType.Expense}>Despesa</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-400">Descrição *</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Corte de cabelo - João Silva"
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-400">Valor (R$) *</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-400">Categoria *</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Ex: Serviços, Produtos"
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-400">Método de Pagamento *</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="Dinheiro">Dinheiro</option>
          <option value="Cartão de Crédito">Cartão de Crédito</option>
          <option value="Cartão de Débito">Cartão de Débito</option>
          <option value="Pix">Pix</option>
        </select>
      </div>
      <div className="flex space-x-3 pt-4">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 bg-slate-700 text-slate-200 font-bold py-2 rounded-lg hover:bg-slate-600 disabled:bg-slate-800"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-violet-600 text-white font-bold py-2 rounded-lg hover:bg-violet-700 disabled:bg-slate-500"
        >
          {loading ? 'Salvando...' : 'Registrar'}
        </button>
      </div>
    </div>
  );
};

// ===== Main Component =====

export const FinancialPage: React.FC = () => {
  // Hooks
  const {
    transactions,
    loading,
    getTodayTransactions,
    getMonthlyStats,
    getStatsByPaymentMethod
  } = useFinancial({ autoFetch: 'current-month' });

  const { openModal, closeModal, isModalOpen } = useUI();

  // Estatísticas
  const todayTransactions = getTodayTransactions();
  const todayRevenue = todayTransactions
    .filter(t => t.type === TransactionType.Income)
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyStats = getMonthlyStats();
  const paymentMethodStats = getStatsByPaymentMethod();

  // Cálculo de receita semanal (últimos 7 dias)
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  const weeklyTransactions = transactions.filter(
    t => t.date >= sevenDaysAgoStr && t.date <= todayStr
  );
  const weeklyRevenue = weeklyTransactions
    .filter(t => t.type === TransactionType.Income)
    .reduce((sum, t) => sum + t.amount, 0);

  // Distribuição por método de pagamento
  const totalIncome = paymentMethodStats.reduce((sum, stat) => sum + stat.income, 0);

  // Agregar cartões e separar crédito/débito
  const cardCreditStat = paymentMethodStats.find(s => s.method === 'Cartão de Crédito');
  const cardDebitStat = paymentMethodStats.find(s => s.method === 'Cartão de Débito');
  const otherStats = paymentMethodStats.filter(
    s => s.method !== 'Cartão de Crédito' && s.method !== 'Cartão de Débito'
  );

  const cardTotal = (cardCreditStat?.income || 0) + (cardDebitStat?.income || 0);
  const cardPercentage = totalIncome > 0 ? Math.round((cardTotal / totalIncome) * 100) : 0;
  const cardCreditPercentage = totalIncome > 0 ? Math.round(((cardCreditStat?.income || 0) / totalIncome) * 100) : 0;
  const cardDebitPercentage = totalIncome > 0 ? Math.round(((cardDebitStat?.income || 0) / totalIncome) * 100) : 0;

  const paymentDistribution = [
    ...(cardTotal > 0 ? [{
      method: 'Cartão',
      amount: cardTotal,
      percentage: cardPercentage,
      creditPercentage: cardCreditPercentage,
      debitPercentage: cardDebitPercentage,
      creditAmount: cardCreditStat?.income || 0,
      debitAmount: cardDebitStat?.income || 0
    }] : []),
    ...otherStats.map(stat => ({
      method: stat.method,
      amount: stat.income,
      percentage: totalIncome > 0 ? Math.round((stat.income / totalIncome) * 100) : 0
    }))
  ];

  // Ícones para métodos de pagamento
  const getPaymentIcon = (method: string): string => {
    const lower = method.toLowerCase();
    if (lower.includes('pix')) return 'receipt';
    if (lower.includes('dinheiro')) return 'cash';
    if (lower.includes('cartão') || lower.includes('cartao')) return 'creditCard';
    return 'payment';
  };

  // Transações recentes (últimas 10)
  const recentTransactions = transactions.slice(0, 10);

  return (
    <>
      <div className="space-y-6 pb-6">
        {/* Header */}
        <div>
          <p className="text-2xl font-bold text-slate-100">Financeiro</p>
          <p className="text-slate-400">Controle completo das suas finanças</p>
        </div>

        {/* Nova Transação Button */}
        <button
          onClick={() => openModal('newTransaction')}
          className="w-full bg-violet-600 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition-colors"
        >
          <Icon name="plus" className="w-5 h-5" />
          <span>Nova Transação</span>
        </button>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon="dollar"
            title="Receita Mensal"
            value={`R$ ${monthlyStats.income.toFixed(0)}`}
            trend={`${monthlyStats.count} transações`}
          />
          <StatCard
            icon="calendar"
            title="Receita Semanal"
            value={`R$ ${weeklyRevenue.toFixed(0)}`}
            trend={`${weeklyTransactions.length} transações`}
          />
          <StatCard
            icon="receipt"
            title="Receita Diária"
            value={`R$ ${todayRevenue.toFixed(0)}`}
            trend={`Hoje, ${now.toLocaleDateString('pt-BR')}`}
          />
          <StatCard
            icon="trendUp"
            title="Lucro Líquido"
            value={`R$ ${monthlyStats.balance.toFixed(0)}`}
            trend="Receita - Despesas"
          />
        </div>

        {/* Formas de Pagamento */}
        <Card>
          <h3 className="font-bold text-slate-100 mb-2 flex items-center">
            <Icon name="clock" className="w-5 h-5 mr-2 text-violet-400" />
            Formas de Pagamento
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            Distribuição dos recebimentos do mês
          </p>
          {paymentDistribution.length > 0 ? (
            <div className="space-y-4">
              {paymentDistribution.map((dist) => (
                <PaymentMethodDistribution
                  key={dist.method}
                  method={dist.method}
                  percentage={dist.percentage}
                  amount={`R$ ${dist.amount.toFixed(2)}`}
                  icon={getPaymentIcon(dist.method)}
                  creditPercentage={'creditPercentage' in dist ? dist.creditPercentage : undefined}
                  debitPercentage={'debitPercentage' in dist ? dist.debitPercentage : undefined}
                  creditAmount={'creditAmount' in dist ? dist.creditAmount : undefined}
                  debitAmount={'debitAmount' in dist ? dist.debitAmount : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Icon name="payment" className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-slate-500 text-sm mt-2">
                Nenhum recebimento registrado este mês.
              </p>
            </div>
          )}
        </Card>

        {/* Transações Recentes */}
        <Card>
          <h3 className="font-bold text-slate-100 mb-2 flex items-center">
            <Icon name="history" className="w-5 h-5 mr-2 text-violet-400" />
            Transações Recentes
          </h3>
          <p className="text-sm text-slate-400 mb-2">Últimas movimentações financeiras</p>

          {loading ? (
            <div className="pt-4">
              <CardSkeleton count={3} />
            </div>
          ) : recentTransactions.length > 0 ? (
            <>
              <div className="divide-y divide-slate-700">
                {recentTransactions.map((tx) => (
                  <TransactionItem key={tx.id} transaction={tx} />
                ))}
              </div>
              {transactions.length > 10 && (
                <button className="w-full mt-4 text-center text-violet-400 font-semibold text-sm hover:underline">
                  Ver Todas as Transações
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Icon name="receipt" className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-slate-500 text-sm mt-2">Nenhuma transação registrada ainda.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isModalOpen('newTransaction')}
        onClose={() => closeModal('newTransaction')}
        title="Nova Transação"
      >
        <NewTransactionForm onClose={() => closeModal('newTransaction')} />
      </Modal>
    </>
  );
};
