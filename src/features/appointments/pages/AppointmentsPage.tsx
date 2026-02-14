/**
 * AppointmentsPage - Página de gerenciamento de agendamentos
 * 
 * Página para gerenciar todos os agendamentos:
 * - Lista de agendamentos do dia/período
 * - Search por cliente ou serviço
 * - Filtros por data e status
 * - Cards de estatísticas (total, confirmados, receita prevista)
 * - Cards de agendamento com ações (confirmar, reagendar, cancelar)
 * - Modal para novo agendamento
 * - Menu de ações inline
 * 
 * Integração com AppointmentsStore:
 * - Auto-fetch de agendamentos futuros
 * - Filtros em tempo real
 * - CRUD completo
 * - Atualização de status
 * 
 * Referências:
 * - ANALISE_COMPLETA_UI.md - Seção 4 (Agendamentos)
 * - DESCRICAO_FEATURES.md - Seção 2 (Sistema de Agendamentos)
 * - ESTADOS_ESPECIAIS.md - Loading, Empty, Error para agendamentos
 * 
 * Features:
 * - Cards com timeline (horário + duração)
 * - Status badges coloridos (confirmado/pendente/cancelado)
 * - Menu de ações (confirmar/reagendar/cancelar)
 * - Filtros por data
 * - Search em tempo real
 */

import React, { useState, useMemo, useEffect, useId } from 'react';
import CardSkeleton from '@/components/common/CardSkeleton';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { useAppointments } from '@/hooks/useAppointments';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { useUI } from '@/hooks/useUI';
import { Appointment, AppointmentStatus } from '@/types';
import { CreateAppointmentData } from '@/store/appointments.store';
import { getAvailableHalfHourSlots, isHalfHourSlot } from '@/constants';

// ===== Sub-Components =====

/**
 * AppointmentCard - Card de agendamento com menu de ações
 */
interface AppointmentCardProps {
  appointment: Appointment;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onReschedule: (appointment: Appointment) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onConfirm,
  onCancel,
  onReschedule
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.Confirmed:
        return 'bg-violet-500/20 text-violet-400';
      case AppointmentStatus.Pending:
        return 'bg-yellow-500/20 text-yellow-400';
      case AppointmentStatus.Completed:
        return 'bg-green-500/20 text-green-400';
      case AppointmentStatus.Cancelled:
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  const handleConfirm = () => {
    onConfirm(appointment.id);
    setMenuOpen(false);
  };

  const handleCancel = () => {
    onCancel(appointment.id);
    setMenuOpen(false);
  };

  const handleReschedule = () => {
    onReschedule(appointment);
    setMenuOpen(false);
  };

  return (
    <div className="flex space-x-4">
      <div className="flex flex-col items-center">
        <p className="font-bold text-slate-100">{appointment.startTime}</p>
        <p className="text-xs text-slate-400">{appointment.duration}min</p>
      </div>
      <Card className="flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-slate-100">{appointment.clientName}</p>
            <p className="text-sm text-slate-300">{appointment.services.join(' + ')}</p>
            <p className="text-sm text-slate-400 flex items-center mt-2">
              <Icon name="user" className="w-4 h-4 mr-2" />
              {appointment.clientPhone}
            </p>
            {appointment.notes && (
              <p className="text-xs text-slate-500 italic mt-2">"{appointment.notes}"</p>
            )}
          </div>
          <div className="text-right flex flex-col items-end">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(appointment.status)}`}>
              {appointment.status}
            </span>
            {appointment.price && (
              <p className="text-lg font-bold text-slate-100 mt-2">R$ {appointment.price.toFixed(2)}</p>
            )}
            <div className="relative mt-2">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <Icon name="dots" className="w-6 h-6" />
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-40 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-20">
                    {appointment.status === AppointmentStatus.Pending && (
                      <button
                        onClick={handleConfirm}
                        className="w-full flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 rounded-t-lg text-left"
                      >
                        <Icon name="check" className="w-4 h-4 mr-2" />
                        Confirmar
                      </button>
                    )}
                    <button
                      onClick={handleReschedule}
                      className="w-full flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 text-left"
                    >
                      <Icon name="clock" className="w-4 h-4 mr-2" />
                      Reagendar
                    </button>
                    {appointment.status !== AppointmentStatus.Cancelled && (
                      <button
                        onClick={handleCancel}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-slate-600 rounded-b-lg text-left"
                      >
                        <Icon name="x" className="w-4 h-4 mr-2" />
                        Cancelar
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

/**
 * NewAppointmentForm - Formulário inline para criar agendamento
 */
interface NewAppointmentFormProps {
  onClose: () => void;
  editingAppointment?: Appointment | null;
}

const NewAppointmentForm: React.FC<NewAppointmentFormProps> = ({ onClose, editingAppointment }) => {
  const { createAppointment, updateAppointment, appointments } = useAppointments();
  const { clients } = useClients({ autoFetch: true });
  const { services } = useServices({ autoFetch: true });
  const { success, error: showError } = useUI();

  const [clientName, setClientName] = useState(editingAppointment?.clientName || '');
  const [clientPhone, setClientPhone] = useState(editingAppointment?.clientPhone || '');
  const [selectedServices, setSelectedServices] = useState<string[]>(editingAppointment?.services || []);
  const [date, setDate] = useState(editingAppointment?.date || '');
  const [startTime, setStartTime] = useState(editingAppointment?.startTime || '');
  const [duration, setDuration] = useState(editingAppointment?.duration || 60);
  const [notes, setNotes] = useState(editingAppointment?.notes || '');
  const [loading, setLoading] = useState(false);

  const availableTimes = useMemo(
    () =>
      getAvailableHalfHourSlots(appointments, date, {
        excludeAppointmentId: editingAppointment?.id,
        includeTimes: editingAppointment?.startTime ? [editingAppointment.startTime] : [],
      }),
    [appointments, date, editingAppointment?.id, editingAppointment?.startTime]
  );

  const timeListId = useId();

  useEffect(() => {
    if (startTime && !availableTimes.includes(startTime)) {
      setStartTime('');
    }
  }, [availableTimes, startTime]);

  // Cálculo automático do preço com base nos serviços selecionados
  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, serviceName) => {
      const service = services.find(s => s.name === serviceName);
      return sum + (service?.price || 0);
    }, 0);
  }, [selectedServices, services]);

  const handleTimeChange = (value: string) => {
    if (!value) {
      setStartTime('');
      return;
    }

    if (!isHalfHourSlot(value)) {
      showError('Escolha horários com intervalos de 30 minutos.');
      return;
    }

    if (!availableTimes.includes(value)) {
      showError('Horário indisponível para esta data.');
      return;
    }

    setStartTime(value);
  };

  const handleSubmit = async () => {
    if (!clientName.trim() || !clientPhone.trim() || selectedServices.length === 0 || !date || !startTime) {
      showError('Preencha todos os campos obrigatórios');
      return;
    }

    if (!isHalfHourSlot(startTime)) {
      showError('Escolha horários com intervalos de 30 minutos.');
      return;
    }

    if (!availableTimes.includes(startTime)) {
      showError('Esse horário já está ocupado.');
      return;
    }

    setLoading(true);
    try {
      if (editingAppointment) {
        // Update existing appointment
        await updateAppointment(editingAppointment.id, {
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          services: selectedServices,
          date,
          startTime,
          duration,
          notes: notes.trim(),
          price: totalPrice
        });
        success('Agendamento atualizado com sucesso!');
      } else {
        // Create new appointment
        const createData: CreateAppointmentData = {
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          services: selectedServices,
          date,
          startTime,
          duration,
          price: totalPrice,
          status: AppointmentStatus.Pending,
          notes: notes.trim()
        };
        await createAppointment(createData);
        success('Agendamento criado com sucesso!');
      }
      onClose();
    } catch (err) {
      showError('Erro ao salvar agendamento');
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (serviceName: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceName)
        ? prev.filter(s => s !== serviceName)
        : [...prev, serviceName]
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-400">Cliente *</label>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Nome do cliente"
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-400">Telefone *</label>
        <input
          type="tel"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
          placeholder="(00) 00000-0000"
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-400 mb-2 block">Serviços * (R$ {totalPrice.toFixed(2)})</label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {services.map(service => (
            <label key={service.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedServices.includes(service.name)}
                onChange={() => toggleService(service.name)}
                className="w-4 h-4 text-violet-600 bg-slate-700 border-slate-600 rounded focus:ring-2 focus:ring-violet-500"
              />
              <span className="text-slate-200 text-sm">{service.name} - R$ {service.price.toFixed(2)}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-400">Data *</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-400">Horário *</label>
        <input
          type="time"
          min="08:00"
          max="20:00"
          step={1800}
          list={timeListId}
          value={startTime}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <datalist id={timeListId}>
          {availableTimes.map((time) => (
            <option key={time} value={time} />
          ))}
        </datalist>
        {availableTimes.length === 0 && (
          <p className="mt-1 text-xs text-red-400">Sem horários disponíveis nesta data.</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium text-slate-400">Duração (minutos)</label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
          min="15"
          step="15"
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-400">Observações</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anotações sobre o agendamento..."
          rows={3}
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        ></textarea>
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
          {loading ? 'Salvando...' : editingAppointment ? 'Atualizar' : 'Criar'}
        </button>
      </div>
    </div>
  );
};

/**
 * ConfirmCancelModal - Modal de confirmação de cancelamento
 */
interface ConfirmCancelModalProps {
  appointmentId: string;
  clientName: string;
  onConfirm: () => void;
  onClose: () => void;
}

const ConfirmCancelModal: React.FC<ConfirmCancelModalProps> = ({
  appointmentId,
  clientName,
  onConfirm,
  onClose
}) => (
  <div className="space-y-4">
    <p className="text-slate-300">
      Tem certeza que deseja <strong className="text-red-400">cancelar</strong> o agendamento de{' '}
      <strong>{clientName}</strong>?
    </p>
    <p className="text-sm text-slate-400">Esta ação não pode ser desfeita.</p>
    <div className="flex space-x-3 pt-4">
      <button
        onClick={onClose}
        className="flex-1 bg-slate-700 text-slate-200 font-bold py-2 rounded-lg hover:bg-slate-600"
      >
        Não, manter
      </button>
      <button
        onClick={onConfirm}
        className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700"
      >
        Sim, cancelar
      </button>
    </div>
  </div>
);

// ===== Main Component =====

export const AppointmentsPage: React.FC = () => {
  // Hooks
  const {
    appointments,
    loading,
    getTodayAppointments,
    searchByClient,
    filterByStatus,
    updateStatus
  } = useAppointments({ autoFetch: 'upcoming' });

  const { openModal, closeModal, isModalOpen } = useUI();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | 'all'>('all');
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    // Filter by search
    if (searchQuery.trim()) {
      filtered = searchByClient(searchQuery);
    }

    // Filter by date
    filtered = filtered.filter(app => app.date === selectedDate);

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(app => app.status === selectedStatus);
    }

    return filtered;
  }, [appointments, searchQuery, selectedDate, selectedStatus, searchByClient]);

  // Stats
  const todayAppointments = getTodayAppointments();
  const confirmedCount = todayAppointments.filter(a => a.status === AppointmentStatus.Confirmed).length;
  const expectedRevenue = todayAppointments.reduce((sum, a) => sum + (a.price || 0), 0);

  // Handlers
  const handleConfirm = async (id: string) => {
    try {
      await updateStatus(id, AppointmentStatus.Confirmed);
    } catch (err) {
      console.error('Error confirming appointment:', err);
    }
  };

  const handleCancelClick = (id: string) => {
    setCancellingId(id);
    openModal('confirmCancel');
  };

  const handleCancelConfirm = async () => {
    if (!cancellingId) return;
    try {
      await updateStatus(cancellingId, AppointmentStatus.Cancelled);
      closeModal('confirmCancel');
      setCancellingId(null);
    } catch (err) {
      console.error('Error cancelling appointment:', err);
    }
  };

  const handleReschedule = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    openModal('newAppointment');
  };

  const handleNewAppointment = () => {
    setEditingAppointment(null);
    openModal('newAppointment');
  };

  const handleCloseAppointmentModal = () => {
    closeModal('newAppointment');
    setEditingAppointment(null);
  };

  // Format date for display
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const cancellingAppointment = cancellingId
    ? appointments.find(a => a.id === cancellingId)
    : null;

  return (
    <>
      <div className="space-y-6 pb-6">
        {/* Header */}
        <div>
          <p className="text-2xl font-bold text-slate-100">Agendamentos</p>
          <p className="text-slate-400">Gerencie todos os seus agendamentos</p>
        </div>

        {/* Novo Agendamento Button */}
        <button
          onClick={handleNewAppointment}
          className="w-full bg-violet-600 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition-colors"
        >
          <Icon name="plus" className="w-5 h-5" />
          <span>Novo Agendamento</span>
        </button>

        {/* Search Bar */}
        <div className="relative">
          <Icon name="search" className="w-5 h-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente ou serviço..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Date Filter */}
        <div className="flex space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-grow bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            onClick={() => openModal('statusFilter')}
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 flex items-center justify-center space-x-2 hover:bg-slate-700/50"
          >
            <Icon name="filter" className="w-5 h-5 text-slate-400" />
            <span className="font-semibold text-slate-200">Filtros</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <Card className="!p-3">
            <p className="text-slate-400 text-xs">Agendamentos Hoje</p>
            <p className="font-bold text-xl mt-1 text-slate-100">{todayAppointments.length}</p>
          </Card>
          <Card className="!p-3">
            <p className="text-slate-400 text-xs">Confirmados</p>
            <p className="font-bold text-xl mt-1 text-slate-100">{confirmedCount}</p>
          </Card>
          <Card className="!p-3">
            <p className="text-slate-400 text-xs">Receita Prevista</p>
            <p className="font-bold text-xl mt-1 text-slate-100">R$ {expectedRevenue.toFixed(0)}</p>
          </Card>
        </div>

        {/* Appointments List */}
        <div>
          <h3 className="font-bold text-slate-100 mb-4 flex items-center">
            <Icon name="clock" className="w-5 h-5 mr-2 text-violet-400" />
            Agendamentos do Dia ({formatDateDisplay(selectedDate)})
          </h3>
          {loading ? (
            <div className="pt-4">
              <CardSkeleton count={4} />
            </div>
          ) : filteredAppointments.length > 0 ? (
            <div className="space-y-4">
              {filteredAppointments.map(app => (
                <AppointmentCard
                  key={app.id}
                  appointment={app}
                  onConfirm={handleConfirm}
                  onCancel={handleCancelClick}
                  onReschedule={handleReschedule}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Icon name="calendar" className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-slate-500 text-sm mt-2">
                {searchQuery || selectedStatus !== 'all'
                  ? 'Nenhum agendamento encontrado com os filtros aplicados.'
                  : 'Nenhum agendamento para este dia.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isModalOpen('newAppointment')}
        onClose={handleCloseAppointmentModal}
        title={editingAppointment ? 'Reagendar' : 'Novo Agendamento'}
      >
        <NewAppointmentForm
          onClose={handleCloseAppointmentModal}
          editingAppointment={editingAppointment}
        />
      </Modal>

      <Modal
        isOpen={isModalOpen('confirmCancel')}
        onClose={() => {
          closeModal('confirmCancel');
          setCancellingId(null);
        }}
        title="Confirmar Cancelamento"
      >
        {cancellingAppointment && (
          <ConfirmCancelModal
            appointmentId={cancellingAppointment.id}
            clientName={cancellingAppointment.clientName}
            onConfirm={handleCancelConfirm}
            onClose={() => {
              closeModal('confirmCancel');
              setCancellingId(null);
            }}
          />
        )}
      </Modal>

      {/* Status Filter Modal */}
      <Modal
        isOpen={isModalOpen('statusFilter')}
        onClose={() => closeModal('statusFilter')}
        title="Filtrar por Status"
      >
        <div className="space-y-2">
          {[
            { value: 'all', label: 'Todos' },
            { value: AppointmentStatus.Pending, label: 'Pendente' },
            { value: AppointmentStatus.Confirmed, label: 'Confirmado' },
            { value: AppointmentStatus.Completed, label: 'Concluído' },
            { value: AppointmentStatus.Cancelled, label: 'Cancelado' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => {
                setSelectedStatus(option.value as AppointmentStatus | 'all');
                closeModal('statusFilter');
              }}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${selectedStatus === option.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-700/50 text-slate-200 hover:bg-slate-700'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
};
