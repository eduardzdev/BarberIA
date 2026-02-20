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

import React, { useState, useMemo, useEffect } from 'react';
import CardSkeleton from '@/components/common/CardSkeleton';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { useFinancial } from '@/hooks/useFinancial';
import { useUI } from '@/hooks/useUI';
import { StatsCard } from '@/components/StatsCard';
import { Transaction, TransactionType, Appointment } from '@/types';
import { CreateTransactionData, UpdateTransactionData } from '@/store/financial.store';
import { appointmentService } from '@/services/appointment.service';
import { TransactionForm } from '@/features/financial/components/TransactionForm';

// ===== Sub-Components =====


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
const TransactionItem: React.FC<{
  transaction: Transaction;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}> = ({ transaction, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loadingAppt, setLoadingAppt] = useState(false);
  const isIncome = transaction.type === TransactionType.Income;

  useEffect(() => {
    if (expanded && transaction.referenceType === 'appointment' && transaction.referenceId && !appointment) {
      setLoadingAppt(true);
      appointmentService.getById(transaction.referenceId)
        .then(data => {
          if (data) setAppointment(data);
        })
        .catch(console.error)
        .finally(() => setLoadingAppt(false));
    }
  }, [expanded, transaction, appointment]);

  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year.slice(2)}`;
  };

  const getDisplayInfo = () => {
    let title = transaction.description;
    let tagText = isIncome ? 'ENTRADA' : 'SAÍDA';
    let tagColor = isIncome
      ? 'bg-green-500/10 text-green-400 border-green-500/20'
      : 'bg-red-500/10 text-red-500 border-red-500/20'; // Adjusted to match the print closer

    if (transaction.referenceType === 'appointment') {
      const parts = transaction.description.split(' - ');
      if (parts.length > 1) {
        const fullName = parts[0].trim();
        const names = fullName.split(' ');
        if (names.length > 1) {
          title = `${names[0]} ${names[names.length - 1].charAt(0)}.`;
        } else {
          title = names[0];
        }
      }

      tagText = 'CLIENTE';
      tagColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
    }

    return { title, tagText, tagColor };
  };

  const { title, tagText, tagColor } = getDisplayInfo();

  return (
    <div className="flex flex-col border-b border-slate-700/50 last:border-0 hover:bg-slate-800/20 transition-colors">
      <div
        className="flex items-center justify-between py-4 px-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3 min-w-0 flex-1 pr-4">
          <div className={`p-2.5 rounded-xl flex-shrink-0 ${isIncome ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <Icon
              name={isIncome ? 'arrowUp' : 'arrowDown'}
              className={`w-5 h-5 ${isIncome ? 'text-green-400' : 'text-red-400'}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-slate-100 truncate text-sm sm:text-base">{title}</p>
              <span className={`flex-shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wider ${tagColor}`}>
                {tagText}
              </span>
            </div>
            <div className="flex items-center text-xs text-slate-400 mt-1">
              <Icon name="calendar" className="w-3.5 h-3.5 mr-1" />
              <span>{formatDateBR(transaction.date)} às {transaction.time}</span>
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`font-bold text-base sm:text-lg ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
            {isIncome ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
          </p>
          <div className="flex items-center justify-end text-[10px] font-bold tracking-wider text-slate-500 mt-1">
            <span>VER DETALHES</span>
            <Icon
              name="chevronDown"
              className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 bg-slate-800/30 rounded-lg mx-2 mb-3">
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm mb-4">
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Tipo</p>
              <p className="text-slate-200 font-medium">{isIncome ? 'Receita' : 'Despesa'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Método de Pagamento</p>
              <p className="text-slate-200 font-medium">{transaction.paymentMethod}</p>
            </div>
            {transaction.referenceType !== 'appointment' && (
              <div className="col-span-2">
                <p className="text-slate-500 text-xs mb-0.5">Descrição Completa</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-slate-200 font-medium text-sm">{transaction.description}</p>
                  {transaction.category && (
                    <span className="flex-shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wider bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                      {transaction.category.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            )}
            {transaction.referenceType === 'appointment' && (
              <div className="col-span-2 bg-violet-500/10 p-3 rounded-lg border border-violet-500/20">
                <p className="text-violet-400 text-xs mb-2 font-semibold flex items-center">
                  <Icon name="calendar" className="w-3.5 h-3.5 mr-1" />
                  Detalhes do Agendamento
                </p>
                {loadingAppt ? (
                  <p className="text-slate-400 text-xs animate-pulse">Carregando detalhes do cliente...</p>
                ) : appointment ? (
                  <div className="space-y-1.5 mt-2">
                    <p className="text-slate-200 text-sm flex items-center">
                      <Icon name="user" className="w-3.5 h-3.5 mr-2 text-slate-500" />
                      <span className="font-medium mr-1">Cliente:</span> {appointment.clientName}
                    </p>
                    <p className="text-slate-200 text-sm flex items-center">
                      <Icon name="phone" className="w-3.5 h-3.5 mr-2 text-slate-500" />
                      <span className="font-medium mr-1">Telefone:</span> {appointment.clientPhone}
                    </p>
                    <p className="text-slate-200 text-sm flex items-start">
                      <Icon name="scissors" className="w-3.5 h-3.5 mr-2 text-slate-500 mt-0.5" />
                      <span className="font-medium mr-1">Serviços:</span>
                      <span className="flex-1">{appointment.services.join(', ')}</span>
                    </p>
                    {appointment.barberName && (
                      <p className="text-slate-200 text-sm flex items-center">
                        <Icon name="star" className="w-3.5 h-3.5 mr-2 text-slate-500" />
                        <span className="font-medium mr-1">Profissional:</span> {appointment.barberName}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-300 text-sm">{transaction.description}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-3 border-t border-slate-700/50">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(transaction); }}
              className="flex-1 flex items-center justify-center space-x-2 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors"
            >
              <Icon name="edit" className="w-4 h-4" />
              <span>Editar</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(transaction); }}
              className="flex-1 flex items-center justify-center space-x-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors"
            >
              <Icon name="trash" className="w-4 h-4" />
              <span>Excluir</span>
            </button>
          </div>
        </div>
      )}
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
    getStatsByPaymentMethod,
    deleteTransaction
  } = useFinancial({ autoFetch: 'current-month' });

  const { openModal, closeModal, isModalOpen, showConfirm, success, error: showError } = useUI();

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    openModal('editTransaction');
  };

  const handleDelete = (transaction: Transaction) => {
    showConfirm(
      'Confirmar Exclusão',
      `Tem certeza que deseja remover a transação\n"${transaction.description}"?\n\nEsta ação não pode ser desfeita.`,
      async () => {
        try {
          await deleteTransaction(transaction.id);
          success('Transação excluída com sucesso');
        } catch (err) {
          showError('Erro ao excluir transação');
        }
      }
    );
  };

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
          <StatsCard
            icon="dollar"
            title="Receita Mensal"
            value={`R$ ${monthlyStats.income.toFixed(0)}`}
            trend={`${monthlyStats.count} transações`}
            trendDirection="neutral"
          />
          <StatsCard
            icon="calendar"
            title="Receita Semanal"
            value={`R$ ${weeklyRevenue.toFixed(0)}`}
            trend={`${weeklyTransactions.length} transações`}
            trendDirection="neutral"
          />
          <StatsCard
            icon="receipt"
            title="Receita Diária"
            value={`R$ ${todayRevenue.toFixed(0)}`}
            trend={`Hoje, ${now.toLocaleDateString('pt-BR')}`}
            trendDirection="neutral"
          />
          <StatsCard
            icon="trendUp"
            title="Lucro Líquido"
            value={`R$ ${monthlyStats.balance.toFixed(0)}`}
            trend="Receita - Despesas"
            trendDirection="neutral"
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
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
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
        <TransactionForm onClose={() => closeModal('newTransaction')} />
      </Modal>

      <Modal
        isOpen={isModalOpen('editTransaction')}
        onClose={() => {
          closeModal('editTransaction');
          setTimeout(() => setEditingTransaction(null), 200);
        }}
        title="Editar Transação"
      >
        <TransactionForm
          onClose={() => {
            closeModal('editTransaction');
            setTimeout(() => setEditingTransaction(null), 200);
          }}
          transaction={editingTransaction}
        />
      </Modal>
    </>
  );
};
