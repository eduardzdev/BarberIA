/**
 * DashboardPage - Página principal do dashboard
 * 
 * Página inicial após login que exibe:
 * - Cards de estatísticas com dados reais (agendamentos, receita, clientes, próximo)
 * - Ações rápidas (novo agendamento, cliente, pagamento, ver agenda)
 * - Lista de próximos agendamentos (scrollable, max-height)
 * - Modais para criação de entidades
 * 
 * Integração com 4 Stores:
 * - AppointmentsStore: Estatísticas e lista de agendamentos
 * - ClientsStore: Total de clientes
 * - FinancialStore: Receita do dia/período
 * - ServicesStore: Disponível para seleção em forms
 * 
 * Referências:
 * - ANALISE_COMPLETA_UI.md - Seção 2 (Dashboard)
 * - DESCRICAO_FEATURES.md - Seção 1 (Visão Geral)
 * - ESTADOS_ESPECIAIS.md - Loading, Empty, Error states
 * 
 * Features:
 * - Data formatada em português (ex: "quinta-feira, 27 de setembro de 2025")
 * - Cards de estatísticas com trends
 * - Ações rápidas com navegação
 * - Lista de agendamentos com ações (editar, remover, concluir)
 * - Modais inline para criação/edição
 * - Auto-fetch de dados ao montar
 */

import React, { useState, useEffect, useMemo } from 'react';
import CardSkeleton from '@/components/common/CardSkeleton';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { StatusSelector } from '@/components/StatusSelector';
import { useAppointments } from '@/hooks/useAppointments';
import { useClients } from '@/hooks/useClients';
import { useFinancial } from '@/hooks/useFinancial';
import { useUI } from '@/hooks/useUI';
import { StatsCard } from '@/components/StatsCard';
import {
  Appointment,
  AppointmentStatus,
  ClientStatus,
  TransactionType
} from '@/types';
import { CreateAppointmentForm } from '@/features/appointments/components/CreateAppointmentForm';
import { formatPhone } from '@/lib/validations';

// ===== Sub-Components =====


/**
 * QuickActionButton - Botão de ação rápida
 */
interface QuickActionButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-slate-700/50 transition-colors"
  >
    <div className="w-10 h-10 bg-violet-500/20 rounded-full flex items-center justify-center mb-2">
      <Icon name={icon} className="w-5 h-5 text-violet-400" />
    </div>
    <span className="text-sm font-medium text-slate-200 text-center">{label}</span>
  </button>
);

/**
 * UpcomingAppointmentItem - Item de agendamento na lista
 */
interface UpcomingAppointmentItemProps {
  appointment: Appointment;
  onEdit: (appointment: Appointment) => void;
  onRemove: (appointment: Appointment) => void;
  onComplete: (appointment: Appointment) => void;
  onStatusChange: (appointment: Appointment, newStatus: AppointmentStatus) => void;
  onViewDetails: (appointment: Appointment) => void;
}

const UpcomingAppointmentItem: React.FC<UpcomingAppointmentItemProps> = ({
  appointment,
  onEdit,
  onRemove,
  onComplete,
  onStatusChange,
  onViewDetails
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const priceLabel = appointment.price
    ? `R$ ${appointment.price.toFixed(2)}`
    : '--';

  const dateFormatted = new Date(appointment.date + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short'
  });

  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <button
          onClick={() => onViewDetails(appointment)}
          className="flex-1 text-left"
        >
          <div className="flex items-center space-x-2 mb-1">
            <p className="font-bold text-slate-100">{appointment.clientName}</p>
            <div onClick={(e) => e.stopPropagation()}>
              <StatusSelector
                currentStatus={appointment.status}
                onStatusChange={(newStatus) => onStatusChange(appointment, newStatus)}
              />
            </div>
          </div>
          <p className="text-sm text-slate-300">{appointment.services.join(' + ')}</p>
        </button>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <Icon name="dots" className="w-5 h-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-10">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(appointment);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 rounded-t-lg"
              >
                <Icon name="pencil" className="w-4 h-4 mr-2" />
                Editar
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onComplete(appointment);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-green-400 hover:bg-slate-600"
              >
                <Icon name="check" className="w-4 h-4 mr-2" />
                Concluir
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onRemove(appointment);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-slate-600 rounded-b-lg"
              >
                <Icon name="x" className="w-4 h-4 mr-2" />
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
      <button
        onClick={() => onViewDetails(appointment)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span className="flex items-center">
            <Icon name="calendar" className="w-4 h-4 mr-1" />
            {dateFormatted} • {appointment.startTime}
          </span>
          <span className="font-bold text-slate-100">{priceLabel}</span>
        </div>
      </button>
    </div>
  );
};

/**
 * ConfirmationModalContent - Conteúdo de modal de confirmação
 */
interface ConfirmationModalContentProps {
  message: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModalContent: React.FC<ConfirmationModalContentProps> = ({
  message,
  confirmText,
  onConfirm,
  onCancel
}) => (
  <div className="space-y-4">
    <p className="text-slate-300">{message}</p>
    <div className="flex space-x-3">
      <button
        onClick={onCancel}
        className="flex-1 bg-slate-700 text-slate-200 font-bold py-2 rounded-lg hover:bg-slate-600"
      >
        Cancelar
      </button>
      <button
        onClick={onConfirm}
        className="flex-1 bg-violet-600 text-white font-bold py-2 rounded-lg hover:bg-violet-700"
      >
        {confirmText}
      </button>
    </div>
  </div>
);

/**
 * NewClientForm - Formulário inline para criar cliente
 */
interface NewClientFormProps {
  onClose: () => void;
}

const NewClientForm: React.FC<NewClientFormProps> = ({ onClose }) => {
  const { createClient } = useClients();
  const { success, error: showError, closeModal } = useUI();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !email.trim()) {
      showError('Preencha todos os campos obrigatórios');
      return;
    }

    const formattedPhone = formatPhone(phone);
    const digitsOnly = formattedPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 11) {
      showError('Informe um telefone válido no formato (11) 99999-9999');
      return;
    }

    setLoading(true);
    try {
      await createClient({
        name: name.trim(),
        phone: formattedPhone,
        email: email.trim(),
        notes: ''
      });
      success('Cliente cadastrado com sucesso!');
      setName('');
      setPhone('');
      setEmail('');
      closeModal('newClient');
      onClose();
    } catch (err) {
      showError('Erro ao cadastrar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-400">Nome *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome completo"
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-400">Telefone *</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(11) 99999-9999"
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-400">Email *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="cliente@email.com"
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
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
          {loading ? 'Salvando...' : 'Cadastrar'}
        </button>
      </div>
    </div>
  );
};

/**
 * NewPaymentForm - Formulário inline para registrar transação
 */
interface NewPaymentFormProps {
  onClose: () => void;
}

const NewPaymentForm: React.FC<NewPaymentFormProps> = ({ onClose }) => {
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
      await createTransaction({
        type,
        description: description.trim(),
        category,
        amount: parseFloat(amount),
        date,
        time,
        paymentMethod
      });

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

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Hooks
  const {
    loading: appointmentsLoading,
    appointments,
    updateStatus,
    fetchUpcoming
  } = useAppointments({ autoFetch: 'upcoming' });

  const { clients } = useClients({ autoFetch: true });

  const { transactions } = useFinancial({ autoFetch: 'current-month' });

  const { openModal, closeModal, isModalOpen, success, error: showError } = useUI();

  // Estado local
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [viewDetailsAppointment, setViewDetailsAppointment] = useState<Appointment | null>(null);

  // Data formatada
  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(today);

  // Estatísticas - Otimizado com useMemo
  const { todayAppointments, futureAppointments, appointmentStats, nextAppointment, todayRevenue, todayTransactionsCount } = useMemo(() => {
    const now = Date.now();
    const todayIso = new Date().toISOString().split('T')[0];

    const toTimestamp = (dateStr: string, timeStr: string) =>
      new Date(`${dateStr}T${timeStr}`).getTime();

    const isActiveStatus = (status: AppointmentStatus) =>
      status !== AppointmentStatus.Cancelled && status !== AppointmentStatus.Completed;

    const todayList = appointments
      .filter(app => app.date === todayIso && app.status !== AppointmentStatus.Cancelled)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const sortedUpcoming = appointments
      .filter(app => isActiveStatus(app.status))
      .sort((a, b) => {
        if (a.date === b.date) {
          return a.startTime.localeCompare(b.startTime);
        }
        return a.date.localeCompare(b.date);
      });

    const upcomingFromNow = sortedUpcoming.filter(app => toTimestamp(app.date, app.startTime) >= now);

    const next = upcomingFromNow[0] ?? sortedUpcoming[0] ?? null;
    const future = (upcomingFromNow.length > 0 ? upcomingFromNow : sortedUpcoming).slice(0, 5);

    const appointmentStats = appointments.reduce(
      (acc, app) => {
        acc.total += 1;
        if (app.date === todayIso) {
          acc.today += 1;
        }
        switch (app.status) {
          case AppointmentStatus.Confirmed:
            acc.confirmed += 1;
            break;
          case AppointmentStatus.Pending:
            acc.pending += 1;
            break;
          case AppointmentStatus.Completed:
            acc.completed += 1;
            acc.totalRevenue += app.price ?? 0;
            break;
          case AppointmentStatus.Cancelled:
            acc.cancelled += 1;
            break;
        }
        return acc;
      },
      {
        total: 0,
        today: 0,
        confirmed: 0,
        pending: 0,
        completed: 0,
        cancelled: 0,
        totalRevenue: 0
      }
    );

    const todayIncomeTransactions = transactions.filter(
      t => t.date === todayIso && t.type === TransactionType.Income
    );
    const todayRevenue = todayIncomeTransactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      todayAppointments: todayList,
      futureAppointments: future,
      appointmentStats,
      nextAppointment: next,
      todayRevenue,
      todayTransactionsCount: todayIncomeTransactions.length
    };
  }, [appointments, transactions]);

  const clientStats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter(client => client.status === ClientStatus.Active).length;
    const inactive = total - active;

    return {
      total,
      active,
      inactive
    };
  }, [clients]);

  // Handlers
  const handleEditClick = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    openModal('editAppointment');
  };

  const handleRemoveClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    openModal('confirmRemove', appointment);
  };

  const handleCompleteClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    openModal('confirmComplete', appointment);
  };

  const handleConfirmRemove = async () => {
    if (!selectedAppointment) return;

    try {
      await updateStatus(selectedAppointment.id, AppointmentStatus.Cancelled);
      await fetchUpcoming();
      success('Agendamento cancelado com sucesso!');
      closeModal('confirmRemove');
      setSelectedAppointment(null);
    } catch (err) {
      showError('Erro ao cancelar agendamento');
    }
  };

  const handleConfirmComplete = async () => {
    if (!selectedAppointment) return;

    try {
      await updateStatus(selectedAppointment.id, AppointmentStatus.Completed);
      await fetchUpcoming();
      success('Agendamento concluído com sucesso!');
      closeModal('confirmComplete');
      setSelectedAppointment(null);
    } catch (err) {
      showError('Erro ao concluir agendamento');
    }
  };

  const handleStatusChange = async (appointment: Appointment, newStatus: AppointmentStatus) => {
    try {
      await updateStatus(appointment.id, newStatus);
      await fetchUpcoming();
      success(`Status alterado para ${newStatus} com sucesso!`);
    } catch (err) {
      showError('Erro ao alterar status do agendamento');
    }
  };

  const handleCreateAppointmentClick = () => {
    setSelectedAppointment(null);
    openModal('newAppointment');
  };

  const handleViewDetails = (appointment: Appointment) => {
    setViewDetailsAppointment(appointment);
    openModal('viewDetails');
  };

  const handleEditFromDetails = () => {
    if (viewDetailsAppointment) {
      closeModal('viewDetails');
      setEditingAppointment(viewDetailsAppointment);
      openModal('editAppointment');
    }
  };

  return (
    <>
      <div className="space-y-6 pb-6">
        {/* Header */}
        <div>
          <p className="text-2xl font-bold text-slate-100">Dashboard</p>
          <p className="text-slate-400 capitalize">{formattedDate}</p>
        </div>

        {/* Novo Agendamento Button */}
        <button
          onClick={handleCreateAppointmentClick}
          className="w-full bg-violet-600 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition-colors"
        >
          <Icon name="plus" className="w-5 h-5" />
          <span>Novo Agendamento</span>
        </button>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <StatsCard
            icon="calendar"
            title="Agendamentos Hoje"
            value={todayAppointments.length.toString()}
            trend={`${appointmentStats.confirmed} confirmados`}
            trendDirection="neutral"
          />
          <StatsCard
            icon="dollar"
            title="Receita Hoje"
            value={`R$ ${todayRevenue.toFixed(0)}`}
            trend={`${todayTransactionsCount} transações`}
            trendDirection="neutral"
          />
          <StatsCard
            icon="users"
            title="Total de Clientes"
            value={clientStats.total.toString()}
            trend={`${clientStats.active} ativos`}
            trendDirection="neutral"
          />
          <StatsCard
            icon="clock"
            title="Próximo Cliente"
            value={nextAppointment?.startTime || '--:--'}
            trend={nextAppointment?.clientName || 'Nenhum agendamento'}
            trendDirection="neutral"
          />
        </div>

        {/* Ações Rápidas */}
        <Card>
          <h3 className="font-bold text-slate-100 mb-4 flex items-center">
            <Icon name="scissors" className="w-5 h-5 mr-2 text-violet-400" />
            Ações Rápidas
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Acesso rápido às funcionalidades principais
          </p>
          <div className="grid grid-cols-2 gap-3">
            <QuickActionButton
              icon="calendar"
              label="Novo Agendamento"
              onClick={handleCreateAppointmentClick}
            />
            <QuickActionButton
              icon="users"
              label="Cadastrar Cliente"
              onClick={() => openModal('newClient')}
            />
            <QuickActionButton
              icon="payment"
              label="Registrar Pagamento"
              onClick={() => openModal('newPayment')}
            />
            <QuickActionButton
              icon="clock"
              label="Ver Agenda"
              onClick={() => navigate('/agenda')}
            />
          </div>
        </Card>

        {/* Próximos Agendamentos */}
        <Card>
          <h3 className="font-bold text-slate-100 mb-1">Próximos Agendamentos</h3>
          <p className="text-sm text-slate-400 mb-4">Seus próximos compromissos</p>

          {appointmentsLoading ? (
            <div className="pt-4">
              <CardSkeleton count={3} />
            </div>
          ) : futureAppointments.length > 0 ? (
            <>
              <div
                className="relative max-h-96 overflow-y-auto space-y-3 pr-2 -mr-2"
                style={{
                  maskImage: 'linear-gradient(to bottom, black 95%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 95%, transparent 100%)'
                }}
              >
                {futureAppointments.map((app) => (
                  <UpcomingAppointmentItem
                    key={app.id}
                    appointment={app}
                    onEdit={handleEditClick}
                    onRemove={handleRemoveClick}
                    onComplete={handleCompleteClick}
                    onStatusChange={handleStatusChange}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
              <button
                onClick={() => navigate('/agenda')}
                className="w-full mt-6 text-center text-violet-400 font-semibold text-sm hover:underline"
              >
                Ver Todos os Agendamentos
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <Icon name="calendar" className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-slate-500 text-sm mt-2">Nenhum agendamento futuro.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isModalOpen('confirmRemove')}
        onClose={() => closeModal('confirmRemove')}
        title="Confirmar Cancelamento"
      >
        <ConfirmationModalContent
          message="Tem certeza que deseja cancelar este agendamento?"
          confirmText="Cancelar Agendamento"
          onConfirm={handleConfirmRemove}
          onCancel={() => closeModal('confirmRemove')}
        />
      </Modal>

      <Modal
        isOpen={isModalOpen('confirmComplete')}
        onClose={() => closeModal('confirmComplete')}
        title="Confirmar Conclusão"
      >
        <ConfirmationModalContent
          message="Deseja marcar este agendamento como concluído?"
          confirmText="Concluir"
          onConfirm={handleConfirmComplete}
          onCancel={() => closeModal('confirmComplete')}
        />
      </Modal>

      <Modal
        isOpen={isModalOpen('newAppointment')}
        onClose={() => closeModal('newAppointment')}
        title="Novo Agendamento"
      >
        <CreateAppointmentForm
          onClose={() => closeModal('newAppointment')}
          onSuccess={() => setSelectedAppointment(null)}
        />
      </Modal>

      <Modal
        isOpen={isModalOpen('editAppointment')}
        onClose={() => {
          closeModal('editAppointment');
          setEditingAppointment(null);
        }}
        title="Editar Agendamento"
      >
        {editingAppointment && (
          <CreateAppointmentForm
            mode="edit"
            appointmentId={editingAppointment.id}
            defaultValues={{
              clientName: editingAppointment.clientName,
              clientPhone: editingAppointment.clientPhone,
              date: editingAppointment.date,
              startTime: editingAppointment.startTime,
              services: editingAppointment.services,
              notes: editingAppointment.notes,
              duration: editingAppointment.duration,
              price: editingAppointment.price,
              status: editingAppointment.status,
            }}
            onClose={() => {
              closeModal('editAppointment');
              setEditingAppointment(null);
            }}
            onSuccess={() => {
              setEditingAppointment(null);
              closeModal('editAppointment');
            }}
          />
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen('newClient')}
        onClose={() => closeModal('newClient')}
        title="Cadastrar Novo Cliente"
      >
        <NewClientForm onClose={() => closeModal('newClient')} />
      </Modal>

      <Modal
        isOpen={isModalOpen('newPayment')}
        onClose={() => closeModal('newPayment')}
        title="Registrar Transação"
      >
        <NewPaymentForm onClose={() => closeModal('newPayment')} />
      </Modal>

      {/* Modal de Detalhes */}
      <Modal
        isOpen={isModalOpen('viewDetails')}
        onClose={() => {
          closeModal('viewDetails');
          setViewDetailsAppointment(null);
        }}
        title="Detalhes do Agendamento"
        onEdit={handleEditFromDetails}
      >
        {viewDetailsAppointment && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-2xl font-bold text-slate-100">{viewDetailsAppointment.clientName}</p>
                <p className="text-slate-400">{viewDetailsAppointment.clientPhone}</p>
              </div>
              <StatusSelector
                currentStatus={viewDetailsAppointment.status}
                onStatusChange={(newStatus) => handleStatusChange(viewDetailsAppointment, newStatus)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
              <div>
                <p className="text-xs text-slate-400">Data</p>
                <p className="font-semibold text-slate-200">{viewDetailsAppointment.date}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Horário</p>
                <p className="font-semibold text-slate-200">{viewDetailsAppointment.startTime}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Duração</p>
                <p className="font-semibold text-slate-200">{viewDetailsAppointment.duration} min</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Preço</p>
                <p className="font-semibold text-slate-200">
                  {viewDetailsAppointment.price ? `R$ ${viewDetailsAppointment.price.toFixed(2)}` : '-'}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-400 mb-2">Serviços</p>
              <div className="flex flex-wrap gap-2">
                {viewDetailsAppointment.services.map((service, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-violet-500/20 text-violet-400 text-xs rounded-full"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
            {viewDetailsAppointment.notes && (
              <div className="pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Observações</p>
                <p className="text-sm text-slate-300 italic">"{viewDetailsAppointment.notes}"</p>
              </div>
            )}
            <button
              onClick={() => closeModal('viewDetails')}
              className="w-full bg-violet-600 text-white font-bold py-2 rounded-lg hover:bg-violet-700 mt-4"
            >
              Fechar
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};
