/**
 * AgendaPage - Página de visualização da agenda
 * 
 * Página para visualizar agendamentos em diferentes formatos:
 * - 3 views: Timeline (linha do tempo), Kanban (colunas por status), Calendar (grade de horários)
 * - Navegação de datas (anterior/hoje/próximo)
 * - Cards de estatísticas do dia
 * - Filtros por profissional
 * - Cards de agendamento interativos
 * - Botão rápido para novo agendamento
 * 
 * Integração com AppointmentsStore:
 * - Auto-fetch de agendamentos futuros
 * - Filtros em tempo real
 * - Atualização de status inline
 * 
 * Referências:
 * - ANALISE_COMPLETA_UI.md - Seção 8 (Agenda)
 * - DESCRICAO_FEATURES.md - Seção 3 (Agenda Visual)
 * - FLUXO_NAVEGACAO.md - Fluxo 5 (Agenda)
 * 
 * Features:
 * - Timeline: Horários com slots disponíveis e ocupados
 * - Kanban: Colunas por status com drag-and-drop simulado
 * - Calendar: Grade de horários do dia
 * - Navegação de datas
 * - Stats do dia selecionado
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { StatusSelector } from '@/components/StatusSelector';
import { useAppointments } from '@/hooks/useAppointments';
import { useUI } from '@/hooks/useUI';
import { Appointment, AppointmentStatus } from '@/types';
import { CreateAppointmentForm } from '@/features/appointments/components/CreateAppointmentForm';
import { StatsCard } from '@/components/StatsCard';

// ===== Sub-Components =====

/**
 * TimelineSlot - Slot de horário na timeline
 */
interface TimelineSlotProps {
  time: string;
  appointment?: Appointment;
  onNewAppointment?: (time: string) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  onEditAppointment?: (appointment: Appointment) => void;
  onCompleteAppointment?: (appointment: Appointment) => void;
  onCancelAppointment?: (appointment: Appointment) => void;
  onStatusChange?: (appointment: Appointment, newStatus: AppointmentStatus) => void;
  statusActionLoading?: boolean;
}

interface AppointmentActionMenuProps {
  appointment: Appointment;
  onEdit?: (appointment: Appointment) => void;
  onComplete?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  disabledActions?: boolean;
}

const AppointmentActionMenu: React.FC<AppointmentActionMenuProps> = ({
  appointment,
  onEdit,
  onComplete,
  onCancel,
  disabledActions = false
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isCompleted = appointment.status === AppointmentStatus.Completed;
  const isCancelled = appointment.status === AppointmentStatus.Cancelled;
  const disableComplete = disabledActions || isCompleted || isCancelled;
  const disableCancel = disabledActions || isCancelled;

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen((prev) => !prev);
  };

  const handleAction = (
    event: React.MouseEvent<HTMLButtonElement>,
    action?: (appointment: Appointment) => void
  ) => {
    if ((disableComplete && action === onComplete) || (disableCancel && action === onCancel)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(false);
    action?.(appointment);
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="p-1 text-slate-400 hover:text-white"
      >
        <Icon name="dots" className="w-5 h-5" />
      </button>
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-10">
          <button
            onClick={(event) => handleAction(event, onEdit)}
            className="w-full flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 rounded-t-lg"
          >
            <Icon name="pencil" className="w-4 h-4 mr-2" />
            Editar
          </button>
          <button
            disabled={disableComplete}
            onClick={(event) => handleAction(event, onComplete)}
            className={`w-full flex items-center px-4 py-2 text-sm hover:bg-slate-600 ${disableComplete
              ? 'text-slate-500 cursor-not-allowed'
              : 'text-green-400'
              }`}
          >
            <Icon name="check" className="w-4 h-4 mr-2" />
            Concluir
          </button>
          <button
            disabled={disableCancel}
            onClick={(event) => handleAction(event, onCancel)}
            className={`w-full flex items-center px-4 py-2 text-sm rounded-b-lg hover:bg-slate-600 ${disableCancel ? 'text-slate-500 cursor-not-allowed' : 'text-red-400'
              }`}
          >
            <Icon name="x" className="w-4 h-4 mr-2" />
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

const TimelineSlot: React.FC<TimelineSlotProps> = ({
  time,
  appointment,
  onNewAppointment,
  onAppointmentClick,
  onEditAppointment,
  onCompleteAppointment,
  onCancelAppointment,
  onStatusChange,
  statusActionLoading
}) => {
  if (appointment) {
    return (
      <div className="flex space-x-4 items-start">
        <p className="w-12 text-right text-slate-400 text-sm">{time}</p>
        <div className="w-px bg-slate-700 h-full relative">
          <div className="w-2 h-2 rounded-full bg-violet-500 absolute top-1 -left-1 ring-4 ring-slate-900"></div>
        </div>
        <div className="flex-1 -mt-1">
          <Card className="bg-slate-800 hover:bg-slate-750 transition-colors">
            <div className="flex justify-between items-start">
              <button
                onClick={() => onAppointmentClick?.(appointment)}
                className="flex-1 pr-2 text-left"
              >
                <p className="font-bold text-slate-100">{appointment.clientName}</p>
                <p className="text-sm text-slate-300">{appointment.services.join(' + ')}</p>
                <p className="text-xs text-slate-400 mt-1">{appointment.duration}min</p>
              </button>
              <div className="flex items-start space-x-2" onClick={(e) => e.stopPropagation()}>
                <StatusSelector
                  currentStatus={appointment.status}
                  onStatusChange={(newStatus) => onStatusChange?.(appointment, newStatus)}
                />
                <AppointmentActionMenu
                  appointment={appointment}
                  onEdit={onEditAppointment}
                  onComplete={onCompleteAppointment}
                  onCancel={onCancelAppointment}
                  disabledActions={statusActionLoading}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex space-x-4 items-start h-20">
      <p className="w-12 text-right text-slate-400 text-sm pt-2">{time}</p>
      <div className="w-px bg-slate-700 h-full relative">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-600 absolute top-3 -left-0.5"></div>
      </div>
      <div className="flex-1 pt-1">
        <button
          onClick={() => onNewAppointment?.(time)}
          className="w-full border-2 border-dashed border-slate-700 rounded-xl p-3 text-center hover:border-violet-500/50 transition-colors"
        >
          <p className="text-slate-500 text-sm font-semibold">Horário disponível</p>
          <p className="text-violet-400 text-sm font-bold flex items-center justify-center mt-1">
            <Icon name="plus" className="w-4 h-4 mr-1" /> Agendar
          </p>
        </button>
      </div>
    </div>
  );
};

/**
 * KanbanColumn - Coluna do Kanban (agrupamento por status)
 */
interface KanbanColumnProps {
  title: string;
  status: AppointmentStatus;
  appointments: Appointment[];
  color: string;
  onAppointmentClick: (appointment: Appointment) => void;
  onEditAppointment?: (appointment: Appointment) => void;
  onCompleteAppointment?: (appointment: Appointment) => void;
  onCancelAppointment?: (appointment: Appointment) => void;
  onStatusChange?: (appointment: Appointment, newStatus: AppointmentStatus) => void;
  statusActionLoading?: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  status,
  appointments,
  color,
  onAppointmentClick,
  onEditAppointment,
  onCompleteAppointment,
  onCancelAppointment,
  onStatusChange,
  statusActionLoading
}) => (
  <div className="flex-1 min-w-0" data-status={status}>
    <div className={`px-3 py-2 rounded-lg ${color} mb-3`}>
      <p className="font-bold text-slate-100 text-sm">{title}</p>
      <p className="text-xs text-slate-300">{appointments.length} agendamentos</p>
    </div>
    <div className="space-y-2">
      {appointments.length > 0 ? (
        appointments.map(app => (
          <Card key={app.id} className="!p-3 hover:bg-slate-750 transition-colors space-y-2">
            <div className="flex justify-between items-start">
              <button
                onClick={() => onAppointmentClick(app)}
                className="flex-1 text-left"
              >
                <p className="font-bold text-slate-100 text-sm">{app.startTime}</p>
                <p className="text-xs text-slate-300 mt-1">{app.clientName}</p>
                <p className="text-xs text-slate-400 mt-1">{app.services.join(', ')}</p>
              </button>
              <div onClick={(e) => e.stopPropagation()}>
                <AppointmentActionMenu
                  appointment={app}
                  onEdit={onEditAppointment}
                  onComplete={onCompleteAppointment}
                  onCancel={onCancelAppointment}
                  disabledActions={statusActionLoading}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{app.duration} min</span>
              <div onClick={(e) => e.stopPropagation()}>
                <StatusSelector
                  currentStatus={app.status}
                  onStatusChange={(newStatus) => onStatusChange?.(app, newStatus)}
                />
              </div>
            </div>
          </Card>
        ))
      ) : (
        <div className="text-center py-4">
          <Icon name="inbox" className="w-6 h-6 mx-auto text-slate-600" />
          <p className="text-slate-500 text-xs mt-1">Nenhum agendamento</p>
        </div>
      )}
    </div>
  </div>
);

/**
 * DailyScheduleView - Grade de horários do dia
 */
interface DailyScheduleViewProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  onNewAppointment: (time: string) => void;
  onEditAppointment?: (appointment: Appointment) => void;
  onCompleteAppointment?: (appointment: Appointment) => void;
  onCancelAppointment?: (appointment: Appointment) => void;
  onStatusChange?: (appointment: Appointment, newStatus: AppointmentStatus) => void;
  statusActionLoading?: boolean;
}

const DailyScheduleView: React.FC<DailyScheduleViewProps> = ({
  appointments,
  onAppointmentClick,
  onNewAppointment,
  onEditAppointment,
  onCompleteAppointment,
  onCancelAppointment,
  onStatusChange,
  statusActionLoading
}) => {
  // Gera slots de 30 em 30 minutos das 8h às 20h
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 20) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  }, []);

  return (
    <div className="space-y-1">
      {timeSlots.map(time => {
        const appointment = appointments.find(a => a.startTime === time);
        return (
          <TimelineSlot
            key={time}
            time={time}
            appointment={appointment}
            onNewAppointment={onNewAppointment}
            onAppointmentClick={onAppointmentClick}
            onEditAppointment={onEditAppointment}
            onCompleteAppointment={onCompleteAppointment}
            onCancelAppointment={onCancelAppointment}
            onStatusChange={onStatusChange}
            statusActionLoading={statusActionLoading}
          />
        );
      })}
    </div>
  );
};

interface AgendaMacroOverviewProps {
  appointments: Appointment[];
  startDate: string;
  onDayDoubleClick?: (isoDate: string) => void;
  onTimelineLinkClick?: () => void;
}

const AgendaMacroOverview: React.FC<AgendaMacroOverviewProps> = ({
  appointments,
  startDate,
  onDayDoubleClick,
  onTimelineLinkClick,
}) => {
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    []
  );

  const daySummaries = useMemo(() => {
    const base = new Date(`${startDate}T00:00:00`);
    const normalizedBase = Number.isNaN(base.getTime()) ? new Date() : base;
    normalizedBase.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, index) => {
      const current = new Date(normalizedBase);
      current.setDate(normalizedBase.getDate() + index);
      const isoDate = current.toISOString().split('T')[0];
      const dayAppointments = appointments.filter(app => app.date === isoDate);
      const confirmedAppointments = dayAppointments.filter(app => app.status === AppointmentStatus.Confirmed);
      const pendingAppointments = dayAppointments.filter(app => app.status === AppointmentStatus.Pending);
      const revenue = confirmedAppointments.reduce((sum, app) => sum + (app.price ?? 0), 0);

      return {
        isoDate,
        date: current,
        total: dayAppointments.length,
        confirmed: confirmedAppointments.length,
        pending: pendingAppointments.length,
        revenue,
        isBaseDay: index === 0,
      };
    });
  }, [appointments, startDate]);

  const totals = useMemo(() => {
    return daySummaries.reduce(
      (acc, day) => {
        acc.totalAppointments += day.total;
        acc.totalRevenue += day.revenue;
        acc.totalConfirmed += day.confirmed;
        return acc;
      },
      { totalAppointments: 0, totalRevenue: 0, totalConfirmed: 0 }
    );
  }, [daySummaries]);

  const formatWeekday = (date: Date, isBaseDay: boolean) => {
    if (isBaseDay) {
      return 'Hoje';
    }
    return new Intl.DateTimeFormat('pt-BR', { weekday: 'long' })
      .format(date)
      .toUpperCase();
  };

  const formatDate = (date: Date) => {
    const formatted = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long'
    }).format(date);

    const [dayPart, monthPart] = formatted.split(' de ');
    if (!monthPart) {
      return formatted;
    }

    return `${dayPart} de ${monthPart.charAt(0).toUpperCase()}${monthPart.slice(1)}`;
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="!p-4 bg-slate-900/70 border border-slate-800">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Agendamentos (7 dias)</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <p className="text-[11px] text-slate-500 uppercase">Confirmados</p>
              <p className="mt-2 text-2xl font-bold text-emerald-400">{totals.totalConfirmed}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <p className="text-[11px] text-slate-500 uppercase">Total</p>
              <p className="mt-2 text-2xl font-bold text-slate-100">{totals.totalAppointments}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4 bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Receita Prevista</p>
              <p className="text-xl font-bold text-emerald-400">{currencyFormatter.format(totals.totalRevenue)}</p>
              <p className="text-[11px] text-slate-500 mt-1">Considera agendamentos confirmados</p>
            </div>
            <Icon name="trendUp" className="w-8 h-8 text-emerald-400" />
          </div>
        </Card>

        <p className="col-span-full text-sm text-slate-400 mt-4 mb-1">
          Dê dois cliques no dia para visualizar mais detalhes dos agendamentos na visualização de
          {' '}<button
            onClick={onTimelineLinkClick}
            className="text-violet-300 font-semibold hover:text-violet-200 transition-colors"
            type="button"
          >
            Timeline
          </button>
          .
        </p>
      </div>

      <div className="space-y-3">
        {daySummaries.map(day => {
          const weekday = formatWeekday(day.date, day.isBaseDay);
          const formattedDate = formatDate(day.date);
          const highlightClass = day.isBaseDay
            ? 'border-violet-500/40 shadow-[0_0_14px_rgba(139,92,246,0.4)]'
            : 'border-slate-800';
          return (
            <Card
              onDoubleClick={() => onDayDoubleClick?.(day.isoDate)}
              key={day.isoDate}
              className={`!p-4 bg-slate-900/80 border ${highlightClass} ${onDayDoubleClick ? 'cursor-zoom-in' : ''}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 uppercase tracking-wide">{weekday}</p>
                <p className="text-sm font-semibold text-slate-200">{formattedDate}</p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-[11px] uppercase text-slate-500 tracking-wide">Total</p>
                  <p className="mt-1 text-base font-semibold text-slate-200">{day.total}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase text-slate-500 tracking-wide">Confirmados</p>
                  <p className="mt-1 text-base font-semibold text-emerald-400">{day.confirmed}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase text-slate-500 tracking-wide">Pendentes</p>
                  <p className="mt-1 text-base font-semibold text-yellow-400">{day.pending}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-[11px] uppercase text-slate-500 tracking-wide">Receita Prevista</p>
                <p className="text-base font-semibold text-emerald-400">
                  {currencyFormatter.format(day.revenue)}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

interface AppointmentDetailModalProps {
  appointment: Appointment;
  onClose: () => void;
  onStatusChange?: (appointment: Appointment, newStatus: AppointmentStatus) => void;
}

const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  appointment,
  onClose,
  onStatusChange
}) => (
  <div className="space-y-4">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-2xl font-bold text-slate-100">{appointment.clientName}</p>
        <p className="text-slate-400">{appointment.clientPhone}</p>
      </div>
      <StatusSelector
        currentStatus={appointment.status}
        onStatusChange={(newStatus) => onStatusChange?.(appointment, newStatus)}
      />
    </div>
    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
      <div>
        <p className="text-xs text-slate-400">Data</p>
        <p className="font-semibold text-slate-200">{appointment.date}</p>
      </div>
      <div>
        <p className="text-xs text-slate-400">Horário</p>
        <p className="font-semibold text-slate-200">{appointment.startTime}</p>
      </div>
      <div>
        <p className="text-xs text-slate-400">Duração</p>
        <p className="font-semibold text-slate-200">{appointment.duration} min</p>
      </div>
      <div>
        <p className="text-xs text-slate-400">Preço</p>
        <p className="font-semibold text-slate-200">
          {appointment.price ? `R$ ${appointment.price.toFixed(2)}` : '-'}
        </p>
      </div>
    </div>
    <div className="pt-4 border-t border-slate-700">
      <p className="text-xs text-slate-400 mb-2">Serviços</p>
      <div className="flex flex-wrap gap-2">
        {appointment.services.map((service, idx) => (
          <span
            key={idx}
            className="px-2 py-1 bg-violet-500/20 text-violet-400 text-xs rounded-full"
          >
            {service}
          </span>
        ))}
      </div>
    </div>
    {appointment.notes && (
      <div className="pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-400 mb-2">Observações</p>
        <p className="text-sm text-slate-300 italic">"{appointment.notes}"</p>
      </div>
    )}
    <button
      onClick={onClose}
      className="w-full bg-violet-600 text-white font-bold py-2 rounded-lg hover:bg-violet-700 mt-4"
    >
      Fechar
    </button>
  </div>
);

// ===== Main Component =====

type ViewMode = 'timeline' | 'kanban' | 'calendar';

export const AgendaPage: React.FC = () => {
  // Hooks
  const { appointments, filterByDate, updateStatus, fetchUpcoming } = useAppointments({ autoFetch: 'upcoming' });
  const { openModal, closeModal, isModalOpen, success, error: showError } = useUI();

  // State
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [prefilledTime, setPrefilledTime] = useState<string | undefined>(undefined);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [appointmentToComplete, setAppointmentToComplete] = useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filtered appointments for selected date
  const dayAppointments = useMemo(() => {
    return filterByDate(selectedDate);
  }, [appointments, selectedDate, filterByDate]);

  // Stats
  const confirmedCount = useMemo(
    () => dayAppointments.filter(a => a.status === AppointmentStatus.Confirmed).length,
    [dayAppointments]
  );
  const pendingCount = useMemo(
    () => dayAppointments.filter(a => a.status === AppointmentStatus.Pending).length,
    [dayAppointments]
  );
  const completedCount = useMemo(
    () => dayAppointments.filter(a => a.status === AppointmentStatus.Completed).length,
    [dayAppointments]
  );
  const nextAppointment = dayAppointments.find(
    a => a.status !== AppointmentStatus.Cancelled
  );

  // Date navigation
  const handlePreviousDay = () => {
    const date = new Date(selectedDate + 'T00:00:00');
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate + 'T00:00:00');
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  // Format date for display
  const formatDateDisplay = () => {
    const date = new Date(selectedDate + 'T00:00:00');
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Handlers
  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditingAppointment(null);
    setAppointmentToComplete(null);
    openModal('appointmentDetail');
  };

  const handleNewAppointment = (time?: string) => {
    // Guarda horário pré-selecionado quando vier da timeline
    setPrefilledTime(time);
    setEditingAppointment(null);
    setAppointmentToComplete(null);
    openModal('newAppointment');
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setPrefilledTime(undefined);
    setAppointmentToComplete(null);
    if (isModalOpen('newAppointment')) {
      closeModal('newAppointment');
    }
    if (isModalOpen('appointmentDetail')) {
      closeModal('appointmentDetail');
    }
    openModal('editAppointment');
  };

  const handleStatusChange = async (
    appointment: Appointment,
    status: AppointmentStatus,
    successMessage: string,
    errorMessage: string
  ): Promise<boolean> => {
    if (actionLoading) {
      return false;
    }

    setActionLoading(true);
    try {
      await updateStatus(appointment.id, status);
      await fetchUpcoming();
      setSelectedAppointment((prev) =>
        prev && prev.id === appointment.id ? { ...prev, status } : prev
      );
      setEditingAppointment((prev) =>
        prev && prev.id === appointment.id ? { ...prev, status } : prev
      );
      setAppointmentToComplete((prev) =>
        prev && prev.id === appointment.id ? { ...prev, status } : prev
      );
      success(successMessage);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status do agendamento:', error);
      showError(errorMessage);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAppointment = (appointment: Appointment) => {
    void handleStatusChange(
      appointment,
      AppointmentStatus.Cancelled,
      'Agendamento cancelado.',
      'Não foi possível cancelar o agendamento.'
    );
  };

  const handleOpenCompleteModal = (appointment: Appointment) => {
    setAppointmentToComplete(appointment);
    openModal('confirmCompleteAgenda');
  };

  const handleCloseCompleteModal = () => {
    closeModal('confirmCompleteAgenda');
    setAppointmentToComplete(null);
  };

  const handleConfirmComplete = async () => {
    if (!appointmentToComplete) {
      return;
    }

    const result = await handleStatusChange(
      appointmentToComplete,
      AppointmentStatus.Completed,
      'Agendamento concluído com sucesso!',
      'Não foi possível concluir o agendamento.'
    );

    if (result) {
      handleCloseCompleteModal();
    }
  };

  const handleCompleteAppointment = (appointment: Appointment) => {
    handleOpenCompleteModal(appointment);
  };

  const handleQuickStatusChange = async (appointment: Appointment, newStatus: AppointmentStatus) => {
    try {
      setActionLoading(true);
      await updateStatus(appointment.id, newStatus);
      await fetchUpcoming();
      success(`Status alterado para ${newStatus} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      showError('Erro ao alterar status do agendamento');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditModalClose = () => {
    closeModal('editAppointment');
    setEditingAppointment(null);
  };

  const handleEditSuccess = () => {
    handleEditModalClose();
  };

  // Kanban columns
  const kanbanColumns = useMemo(() => {
    return [
      {
        title: 'Pendente',
        status: AppointmentStatus.Pending,
        appointments: dayAppointments.filter(a => a.status === AppointmentStatus.Pending),
        color: 'bg-yellow-500/20'
      },
      {
        title: 'Confirmado',
        status: AppointmentStatus.Confirmed,
        appointments: dayAppointments.filter(a => a.status === AppointmentStatus.Confirmed),
        color: 'bg-violet-500/20'
      },
      {
        title: 'Concluído',
        status: AppointmentStatus.Completed,
        appointments: dayAppointments.filter(a => a.status === AppointmentStatus.Completed),
        color: 'bg-green-500/20'
      },
      {
        title: 'Cancelado',
        status: AppointmentStatus.Cancelled,
        appointments: dayAppointments.filter(a => a.status === AppointmentStatus.Cancelled),
        color: 'bg-red-500/20'
      }
    ];
  }, [dayAppointments]);

  const rangeLabels = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parsedBase = new Date(`${selectedDate}T00:00:00`);
    const normalizedBase = Number.isNaN(parsedBase.getTime()) ? new Date(today) : parsedBase;
    normalizedBase.setHours(0, 0, 0, 0);

    const endDate = new Date(normalizedBase);
    endDate.setDate(normalizedBase.getDate() + 6);

    const capitalize = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

    const formatLabel = (date: Date, isBase: boolean) => {
      const isToday = date.getTime() === today.getTime();
      const weekday = isBase && isToday
        ? 'Hoje'
        : capitalize(new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date));

      const formattedDayMonth = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long'
      }).format(date);

      const [dayPart, monthPart] = formattedDayMonth.split(' de ');
      if (!monthPart) {
        return `${weekday}, ${capitalize(formattedDayMonth)}`;
      }

      return `${weekday}, ${dayPart} de ${capitalize(monthPart)}`;
    };

    return {
      start: formatLabel(normalizedBase, true),
      end: formatLabel(endDate, false)
    };
  }, [selectedDate]);

  const handleDayCardDoubleClick = useCallback((isoDate: string) => {
    setSelectedDate(isoDate);
    setViewMode('timeline');
  }, [setSelectedDate, setViewMode]);

  return (
    <>
      <div className="space-y-6 pb-6">
        {/* Header */}
        <div>
          <p className="text-2xl font-bold text-slate-100">Agenda</p>
          <p className="text-slate-400 capitalize">{formatDateDisplay()}</p>
        </div>

        {/* Date Navigation */}
        <div className="flex space-x-2">
          <div className="flex-grow flex items-center bg-slate-800/50 border border-slate-700 rounded-lg">
            <button onClick={handlePreviousDay} className="p-2.5 text-slate-400 hover:text-white">
              <Icon name="left" className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="flex-grow text-center font-semibold text-slate-200 hover:text-white"
            >
              {isToday ? 'Hoje' : 'Ir para Hoje'}
            </button>
            <button onClick={handleNextDay} className="p-2.5 text-slate-400 hover:text-white">
              <Icon name="right" className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => handleNewAppointment()}
            className="bg-violet-600 text-white font-bold p-2.5 rounded-lg flex items-center justify-center space-x-2 shadow-lg shadow-violet-600/20 hover:bg-violet-700"
          >
            <Icon name="plus" className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatsCard
            icon="check"
            title="Agendamentos Confirmados"
            value={confirmedCount}
          />
          <StatsCard
            icon="clock"
            title="Aguardando Confirmação"
            value={pendingCount}
          />
          <StatsCard
            icon="checkCircle"
            title="Concluídos"
            value={completedCount}
          />
          <StatsCard
            icon="calendar"
            title="Próximo Cliente"
            value={nextAppointment?.startTime || '--:--'}
          />
        </div>

        {/* View Mode Selector */}
        <div>
          <div className="flex space-x-2 items-center">
            <div className="flex-grow flex space-x-1 p-1 bg-slate-800/50 rounded-lg">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex-1 text-center text-sm py-1.5 rounded-md ${viewMode === 'calendar'
                  ? 'bg-slate-700 font-semibold text-slate-100'
                  : 'text-slate-400'
                  }`}
              >
                Calendário
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex-1 text-center text-sm py-1.5 rounded-md ${viewMode === 'kanban'
                  ? 'bg-slate-700 font-semibold text-slate-100'
                  : 'text-slate-400'
                  }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex-1 text-center text-sm py-1.5 rounded-md ${viewMode === 'timeline'
                  ? 'bg-slate-700 font-semibold text-slate-100'
                  : 'text-slate-400'
                  }`}
              >
                Timeline
              </button>
            </div>
          </div>
        </div>

        {/* View Content */}
        {viewMode === 'timeline' && (
          <Card>
            <h3 className="font-bold text-slate-100 mb-2">Linha do Tempo</h3>
            <p className="text-sm text-slate-400 mb-6">Visualização cronológica dos agendamentos</p>
            <DailyScheduleView
              appointments={dayAppointments}
              onAppointmentClick={handleAppointmentClick}
              onNewAppointment={handleNewAppointment}
              onEditAppointment={handleEditAppointment}
              onCompleteAppointment={handleCompleteAppointment}
              onCancelAppointment={handleCancelAppointment}
              onStatusChange={handleQuickStatusChange}
              statusActionLoading={actionLoading}
            />
          </Card>
        )}

        {viewMode === 'kanban' && (
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex space-x-3 min-w-max">
              {kanbanColumns.map(column => (
                <KanbanColumn
                  key={column.status}
                  title={column.title}
                  status={column.status}
                  appointments={column.appointments}
                  color={column.color}
                  onAppointmentClick={handleAppointmentClick}
                  onEditAppointment={handleEditAppointment}
                  onCompleteAppointment={handleCompleteAppointment}
                  onCancelAppointment={handleCancelAppointment}
                  onStatusChange={handleQuickStatusChange}
                  statusActionLoading={actionLoading}
                />
              ))}
            </div>
          </div>
        )}

        {viewMode === 'calendar' && (
          <Card className="!p-5">
            <div>
              <h3 className="font-bold text-slate-100 mb-2">Próximos 7 Dias</h3>
              <p className="text-sm text-slate-400 mb-6">
                Agendamentos e Receita Prevista de <span className="font-semibold text-slate-200">{rangeLabels.start}</span> até <span className="font-semibold text-slate-200">{rangeLabels.end}</span>.
              </p>
            </div>
            <AgendaMacroOverview
              appointments={appointments}
              startDate={selectedDate}
              onDayDoubleClick={handleDayCardDoubleClick}
              onTimelineLinkClick={() => setViewMode('timeline')}
            />
          </Card>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={isModalOpen('newAppointment')}
        onClose={() => {
          closeModal('newAppointment');
          setPrefilledTime(undefined);
        }}
        title="Novo Agendamento"
      >
        <CreateAppointmentForm
          onClose={() => {
            closeModal('newAppointment');
            setPrefilledTime(undefined);
          }}
          onSuccess={() => setPrefilledTime(undefined)}
          defaultValues={{
            date: selectedDate,
            startTime: prefilledTime || '',
          }}
        />
      </Modal>
      <Modal
        isOpen={isModalOpen('confirmCompleteAgenda') && !!appointmentToComplete}
        onClose={handleCloseCompleteModal}
        title="Confirmar Conclusão"
      >
        {appointmentToComplete && (
          <div className="space-y-4">
            <p className="text-slate-300">
              Deseja marcar {appointmentToComplete.clientName} às {appointmentToComplete.startTime} como concluído?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCloseCompleteModal}
                disabled={actionLoading}
                className="flex-1 bg-slate-700 text-slate-200 font-bold py-2 rounded-lg hover:bg-slate-600 disabled:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmComplete}
                disabled={actionLoading}
                className="flex-1 bg-violet-600 text-white font-bold py-2 rounded-lg hover:bg-violet-700 disabled:bg-slate-500"
              >
                {actionLoading ? 'Concluindo...' : 'Concluir'}
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={isModalOpen('editAppointment') && !!editingAppointment}
        onClose={handleEditModalClose}
        title="Editar Agendamento"
      >
        {editingAppointment && (
          <CreateAppointmentForm
            mode="edit"
            appointmentId={editingAppointment.id}
            onClose={handleEditModalClose}
            onSuccess={handleEditSuccess}
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
          />
        )}
      </Modal>
      <Modal
        isOpen={isModalOpen('appointmentDetail')}
        onClose={() => {
          closeModal('appointmentDetail');
          setSelectedAppointment(null);
        }}
        title="Detalhes do Agendamento"
        onEdit={() => {
          if (selectedAppointment) {
            closeModal('appointmentDetail');
            setEditingAppointment(selectedAppointment);
            openModal('editAppointment');
          }
        }}
      >
        {selectedAppointment && (
          <AppointmentDetailModal
            appointment={selectedAppointment}
            onClose={() => {
              closeModal('appointmentDetail');
              setSelectedAppointment(null);
            }}
            onStatusChange={handleQuickStatusChange}
          />
        )}
      </Modal>
    </>
  );
};
