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

// ===== Helpers =====
const formatName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  let first = parts[0];
  if (first.length > 10) first = first.substring(0, 10) + '...';
  if (parts.length > 1) return `${first} ${parts[parts.length - 1][0]}.`;
  return first;
};

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
  onDeleteAppointment?: (appointment: Appointment) => void;
  onStatusChange?: (appointment: Appointment, newStatus: AppointmentStatus) => void;
  statusActionLoading?: boolean;
}

interface AppointmentActionMenuProps {
  appointment: Appointment;
  onEdit?: (appointment: Appointment) => void;
  onComplete?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onDelete?: (appointment: Appointment) => void;
  disabledActions?: boolean;
}

const AppointmentActionMenu: React.FC<AppointmentActionMenuProps> = ({
  appointment,
  onEdit,
  onComplete,
  onCancel,
  onDelete,
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
            className={`w-full flex items-center px-4 py-2 text-sm hover:bg-slate-600 ${disableCancel ? 'text-slate-500 cursor-not-allowed' : 'text-red-400'
              }`}
          >
            <Icon name="x" className="w-4 h-4 mr-2" />
            Cancelar
          </button>
          <button
            disabled={disabledActions}
            onClick={(event) => handleAction(event, onDelete)}
            className={`w-full flex items-center px-4 py-2 text-sm rounded-b-lg hover:bg-slate-600 ${disabledActions ? 'text-slate-500 cursor-not-allowed' : 'text-red-500 font-bold'
              }`}
          >
            <Icon name="trash" className="w-4 h-4 mr-2" />
            Excluir
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
  onDeleteAppointment,
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
          <Card className="!p-4 bg-slate-800/50 hover:bg-slate-700/60 border border-slate-700/50 transition-all group">
            <div className="flex flex-col space-y-4">
              {/* Top Section: Name and Actions */}
              <div className="flex justify-between items-start gap-4">
                <button
                  onClick={() => onAppointmentClick?.(appointment)}
                  className="flex items-center gap-2 text-left group-hover:translate-x-1 transition-transform"
                >
                  <Icon name="user" className="w-4 h-4 text-violet-400" />
                  <p className="font-bold text-slate-100 text-base leading-none">
                    {formatName(appointment.clientName)}
                  </p>
                </button>

                <div className="flex items-center space-x-2 h-6" onClick={(e) => e.stopPropagation()}>
                  <StatusSelector
                    currentStatus={appointment.status}
                    onStatusChange={(newStatus) => onStatusChange?.(appointment, newStatus)}
                  />
                  <AppointmentActionMenu
                    appointment={appointment}
                    onEdit={onEditAppointment}
                    onComplete={onCompleteAppointment}
                    onCancel={onCancelAppointment}
                    onDelete={onDeleteAppointment}
                    disabledActions={statusActionLoading}
                  />
                </div>
              </div>

              {/* Bottom Section: Info and Price */}
              <div className="flex flex-col space-y-3 pt-1">
                {/* Full-width Services */}
                <button
                  onClick={() => onAppointmentClick?.(appointment)}
                  className="flex items-center gap-2 text-left group-hover:translate-x-1 transition-transform w-full"
                >
                  <Icon name="scissors" className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                  <p className="text-sm text-slate-300 font-medium line-clamp-1">
                    {appointment.services.join(' + ')}
                  </p>
                </button>

                {/* Duration and Price in one line */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Icon name="clock" className="w-3.5 h-3.5 text-violet-400" />
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      {appointment.duration} min
                    </p>
                  </div>

                  {appointment.price && (
                    <div className="flex-shrink-0">
                      <span className="text-sm font-extrabold text-green-400 bg-green-400/10 px-3 py-1 rounded-lg border border-green-500/20 block leading-none">
                        R$ {appointment.price.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
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
  onDeleteAppointment?: (appointment: Appointment) => void;
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
  onDeleteAppointment,
  onStatusChange,
  statusActionLoading
}) => {
  return (
    <div className="w-64 flex-shrink-0" data-status={status}>
      <div className={`px-3 py-2 rounded-lg ${color} mb-3`}>
        <p className="font-bold text-slate-100 text-sm">{title}</p>
        <p className="text-xs text-slate-300">{appointments.length} agendamentos</p>
      </div>
      <div className="space-y-2">
        {appointments.length > 0 ? (
          appointments.map(app => (
            <Card key={app.id} className="!p-4 hover:bg-slate-700/40 border border-slate-700/50 transition-all space-y-3 group">
              <div className="flex justify-between items-start">
                <button
                  onClick={() => onAppointmentClick(app)}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-violet-500/10 p-1.5 rounded-lg">
                        <Icon name="clock" className="w-4 h-4 text-violet-400" />
                      </div>
                      <p className="font-bold text-slate-100 text-base">{app.startTime}</p>
                    </div>
                    {app.price && (
                      <span className="text-sm font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-md">
                        R$ {app.price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Icon name="user" className="w-3.5 h-3.5 text-violet-400" />
                      <p className="font-semibold text-slate-200 text-sm truncate">
                        {formatName(app.clientName)}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon name="scissors" className="w-3.5 h-3.5 text-violet-400 mt-0.5" />
                      <p className="text-xs text-slate-400 line-clamp-1">{app.services.join(', ')}</p>
                    </div>
                  </div>
                </button>
                <div onClick={(e) => e.stopPropagation()} className="ml-2">
                  <AppointmentActionMenu
                    appointment={app}
                    onEdit={onEditAppointment}
                    onComplete={onCompleteAppointment}
                    onCancel={onCancelAppointment}
                    onDelete={onDeleteAppointment}
                    disabledActions={statusActionLoading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Icon name="clock" className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs font-medium">{app.duration} min</span>
                </div>
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
          <div className="text-center py-8">
            <Icon name="inbox" className="w-8 h-8 mx-auto text-slate-700/50" />
          </div>
        )}
      </div>
    </div>
  );
};

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
  onDeleteAppointment?: (appointment: Appointment) => void;
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
  onDeleteAppointment,
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
            onDeleteAppointment={onDeleteAppointment}
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
    <div className="space-y-4">
      <div className="space-y-3">
        {/* Card de Agendamentos (Principal) */}
        <Card className="!p-4 bg-slate-900/70 border border-slate-800">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-3">Agendamentos (7 dias)</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-800/50 bg-slate-950/40 p-3">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Confirm.</p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">{totals.totalConfirmed}</p>
            </div>
            <div className="rounded-lg border border-slate-800/50 bg-slate-950/40 p-3">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Total</p>
              <p className="mt-1 text-2xl font-bold text-slate-100">{totals.totalAppointments}</p>
            </div>
          </div>
        </Card>

        {/* Card de Receita (Minimalista) */}
        <div className="px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="trendUp" className="w-4 h-4 text-emerald-400" />
            <p className="text-[10px] text-emerald-400/70 uppercase tracking-wider font-bold">Receita Prevista:</p>
            <p className="text-sm font-bold text-emerald-400">{currencyFormatter.format(totals.totalRevenue)}</p>
          </div>
          <span className="text-[9px] text-slate-600 uppercase font-medium">Líquido</span>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 px-1">
        Dê dois cliques no dia para ver detalhes na
        {' '}<button
          onClick={onTimelineLinkClick}
          className="text-violet-400 font-bold hover:underline"
          type="button"
        >
          Timeline
        </button>.
      </p>

      <div className="space-y-3">
        {daySummaries.map(day => {
          const weekday = formatWeekday(day.date, day.isBaseDay);
          const formattedDate = formatDate(day.date);
          const highlightClass = day.isBaseDay
            ? 'border-violet-500/40 shadow-[0_0_14px_rgba(139,92,246,0.3)]'
            : 'border-slate-800/60';
          return (
            <Card
              onDoubleClick={() => onDayDoubleClick?.(day.isoDate)}
              key={day.isoDate}
              className={`!p-4 bg-slate-900/80 border ${highlightClass} ${onDayDoubleClick ? 'cursor-zoom-in' : ''
                }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 uppercase tracking-wide">{weekday}</p>
                <p className="text-sm font-semibold text-slate-200">{formattedDate}</p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-sm border-t border-slate-800/50 pt-4">
                <div>
                  <p className="text-[9px] uppercase text-slate-500 font-bold tracking-tight mb-1">Total</p>
                  <p className="text-base font-bold text-slate-200">{day.total}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-slate-500 font-bold tracking-tight mb-1">Confirm.</p>
                  <p className="text-base font-bold text-emerald-400">{day.confirmed}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-slate-500 font-bold tracking-tight mb-1">Pendente</p>
                  <p className="text-base font-bold text-yellow-400">{day.pending}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
                <p className="text-[9px] uppercase text-emerald-400/70 font-bold tracking-wider">Receita Prevista</p>
                <p className="text-sm font-bold text-emerald-400">
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
        <p className="text-slate-400 flex items-center">
          <Icon name="phone" className="w-3.5 h-3.5 mr-1 text-violet-400" />
          {appointment.clientPhone}
        </p>
      </div>
      <StatusSelector
        currentStatus={appointment.status}
        onStatusChange={(newStatus) => onStatusChange?.(appointment, newStatus)}
      />
    </div>
    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
      <div>
        <p className="text-xs text-slate-400 flex items-center mb-1">
          <Icon name="calendar" className="w-3.5 h-3.5 mr-1 text-violet-400" />
          Data
        </p>
        <p className="font-semibold text-slate-200">
          {(() => {
            const [year, month, day] = appointment.date.split('-');
            return `${day}/${month}/${year.slice(-2)}`;
          })()}
        </p>
      </div>
      <div>
        <p className="text-xs text-slate-400 flex items-center mb-1">
          <Icon name="clock" className="w-3.5 h-3.5 mr-1 text-violet-400" />
          Horário
        </p>
        <p className="font-semibold text-slate-200">{appointment.startTime}</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 flex items-center mb-1">
          <Icon name="history" className="w-3.5 h-3.5 mr-1 text-violet-400" />
          Duração
        </p>
        <p className="font-semibold text-slate-200">{appointment.duration} min</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 flex items-center mb-1">
          <Icon name="dollar" className="w-3.5 h-3.5 mr-1 text-violet-400" />
          Preço
        </p>
        <p className="font-semibold text-slate-200">
          {appointment.price ? `R$ ${appointment.price.toFixed(2)}` : '-'}
        </p>
      </div>
    </div>
    <div className="pt-4 border-t border-slate-700">
      <p className="text-xs text-slate-400 mb-2 flex items-center">
        <Icon name="scissors" className="w-3.5 h-3.5 mr-1 text-violet-400" />
        Serviços
      </p>
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
        <p className="text-xs text-slate-400 mb-2 flex items-center">
          <Icon name="pencil" className="w-3.5 h-3.5 mr-1 text-violet-400" />
          Observações
        </p>
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
  const { appointments, filterByDate, updateStatus, deleteAppointment, fetchUpcoming } = useAppointments({ autoFetch: 'upcoming' });
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

  const handleDeleteAppointment = async (appointment: Appointment) => {
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o agendamento de ${appointment.clientName}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await deleteAppointment(appointment.id);
      success('Agendamento excluído com sucesso!');
      await fetchUpcoming();
    } catch (err) {
      console.error('Erro ao excluir agendamento:', err);
      showError(err instanceof Error ? err.message : 'Erro ao excluir agendamento');
    } finally {
      setActionLoading(false);
    }
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
            <button onClick={handlePreviousDay} data-testid="prev-day" className="p-2.5 text-slate-400 hover:text-white">
              <Icon name="left" className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              data-testid="today-btn"
              className="flex-grow text-center font-semibold text-slate-200 hover:text-white"
            >
              {isToday ? 'Hoje' : 'Ir para Hoje'}
            </button>
            <button onClick={handleNextDay} data-testid="next-day" className="p-2.5 text-slate-400 hover:text-white">
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
                data-testid="view-calendar"
                className={`flex-1 text-center text-sm py-1.5 rounded-md ${viewMode === 'calendar'
                  ? 'bg-slate-700 font-semibold text-slate-100'
                  : 'text-slate-400'
                  }`}
              >
                Calendário
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                data-testid="view-kanban"
                className={`flex-1 text-center text-sm py-1.5 rounded-md ${viewMode === 'kanban'
                  ? 'bg-slate-700 font-semibold text-slate-100'
                  : 'text-slate-400'
                  }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                data-testid="view-timeline"
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
              onDeleteAppointment={handleDeleteAppointment}
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
                  onDeleteAppointment={handleDeleteAppointment}
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
