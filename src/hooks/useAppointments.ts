/**
 * useAppointments - Hook para gerenciar agendamentos
 * 
 * Facilita o uso do AppointmentsStore em componentes React.
 * 
 * Features:
 * - Acesso ao estado de agendamentos (lista, loading, error)
 * - Métodos CRUD: fetch, create, update, delete
 * - Filtros por data, status, profissional
 * - Helpers de estatísticas
 * - Auto-loading inicial (opcional)
 * 
 * Referências:
 * - ANALISE_COMPLETA_UI.md - Seção 3 (Appointments), Seção 4 (Agenda)
 * - DESCRICAO_FEATURES.md - Seção 3 (Gestão de Agendamentos)
 * 
 * Exemplo de uso:
 * ```typescript
 * function AppointmentsPage() {
 *   const { 
 *     appointments, 
 *     loading, 
 *     error,
 *     fetchUpcoming,
 *     updateStatus,
 *     getTodayAppointments 
 *   } = useAppointments({ autoFetch: 'upcoming' });
 * 
 *   const todayCount = getTodayAppointments().length;
 * 
 *   return (
 *     <div>
 *       {loading && <p>Carregando...</p>}
 *       {error && <p>Erro: {error}</p>}
 *       <p>Hoje: {todayCount} agendamentos</p>
 *     </div>
 *   );
 * }
 * ```
 */

import { useEffect } from 'react';
import {
  useAppointmentsStore,
  CreateAppointmentData,
  UpdateAppointmentData
} from '@/store/appointments.store';
import { AppointmentStatus } from '@/types';

interface UseAppointmentsOptions {
  /**
   * Busca automática ao montar
   * - 'all': Busca todos
   * - 'upcoming': Busca próximos (hoje e futuros)
   * - 'date': Busca de uma data específica (requer dateFilter)
   * - false: Não busca automaticamente
   */
  autoFetch?: 'all' | 'upcoming' | 'date' | false;

  /**
   * Data para filtro automático (apenas se autoFetch === 'date')
   */
  dateFilter?: string;
}

export function useAppointments(options: UseAppointmentsOptions = {}) {
  const { autoFetch = false, dateFilter } = options;

  // Estado do store
  const appointments = useAppointmentsStore((state) => state.appointments);
  const loading = useAppointmentsStore((state) => state.loading);
  const error = useAppointmentsStore((state) => state.error);

  // Ações
  const fetchAppointments = useAppointmentsStore((state) => state.fetchAppointments);
  const fetchAppointmentsByDate = useAppointmentsStore((state) => state.fetchAppointmentsByDate);
  const fetchUpcoming = useAppointmentsStore((state) => state.fetchUpcoming);
  const createAppointment = useAppointmentsStore((state) => state.createAppointment);
  const updateAppointment = useAppointmentsStore((state) => state.updateAppointment);
  const deleteAppointment = useAppointmentsStore((state) => state.deleteAppointment);
  const updateStatus = useAppointmentsStore((state) => state.updateStatus);
  const clearError = useAppointmentsStore((state) => state.clearError);

  // Pagination state and methods
  const hasMoreData = useAppointmentsStore((state) => state.hasMoreData);
  const estimatedTotal = useAppointmentsStore((state) => state.estimatedTotal);
  const lastVisibleDoc = useAppointmentsStore((state) => state.lastVisibleDoc);
  const fetchRecentAppointments = useAppointmentsStore((state) => state.fetchRecentAppointments);
  const fetchMoreAppointments = useAppointmentsStore((state) => state.fetchMoreAppointments);

  // Auto-fetch ao montar
  useEffect(() => {
    if (autoFetch === 'all') {
      fetchAppointments();
    } else if (autoFetch === 'upcoming') {
      fetchUpcoming();
    } else if (autoFetch === 'date' && dateFilter) {
      fetchAppointmentsByDate(dateFilter);
    }
  }, [autoFetch, dateFilter, fetchAppointments, fetchUpcoming, fetchAppointmentsByDate]);

  // Helpers
  const helpers = {
    /**
     * Busca agendamento por ID
     */
    getAppointmentById: (id: string) => {
      return appointments.find(a => a.id === id) || null;
    },

    /**
     * Filtra agendamentos por data
     */
    filterByDate: (date: string) => {
      return appointments.filter(a => a.date === date);
    },

    /**
     * Filtra agendamentos por status
     */
    filterByStatus: (status: AppointmentStatus) => {
      return appointments.filter(a => a.status === status);
    },

    /**
     * Filtra agendamentos por profissional
     */
    filterByBarber: (barberName: string) => {
      return appointments.filter(a =>
        a.barberName?.toLowerCase() === barberName.toLowerCase()
      );
    },

    /**
     * Filtra agendamentos por cliente (busca parcial)
     */
    searchByClient: (query: string) => {
      const lowerQuery = query.toLowerCase();
      return appointments.filter(a =>
        a.clientName.toLowerCase().includes(lowerQuery)
      );
    },

    /**
     * Retorna agendamentos de hoje
     */
    getTodayAppointments: () => {
      const today = new Date().toISOString().split('T')[0];
      return appointments.filter(a => a.date === today);
    },

    /**
     * Retorna agendamentos futuros (excluindo hoje)
     */
    getFutureAppointments: () => {
      const today = new Date().toISOString().split('T')[0];
      return appointments.filter(a => a.date > today);
    },

    /**
     * Retorna agendamentos passados
     */
    getPastAppointments: () => {
      const today = new Date().toISOString().split('T')[0];
      return appointments.filter(a => a.date < today);
    },

    /**
     * Retorna estatísticas dos agendamentos
     */
    getStats: () => {
      const total = appointments.length;
      const today = helpers.getTodayAppointments().length;

      const confirmed = appointments.filter(
        a => a.status === AppointmentStatus.Confirmed
      ).length;

      const pending = appointments.filter(
        a => a.status === AppointmentStatus.Pending
      ).length;

      const completed = appointments.filter(
        a => a.status === AppointmentStatus.Completed
      ).length;

      const cancelled = appointments.filter(
        a => a.status === AppointmentStatus.Cancelled
      ).length;

      const totalRevenue = appointments
        .filter(a => a.status === AppointmentStatus.Completed && a.price)
        .reduce((sum, a) => sum + (a.price || 0), 0);

      return {
        total,
        today,
        confirmed,
        pending,
        completed,
        cancelled,
        totalRevenue,
      };
    },

    /**
     * Verifica se há conflito de horário
     */
    hasTimeConflict: (date: string, startTime: string, duration: number, excludeId?: string) => {
      const dayAppointments = appointments.filter(a =>
        a.date === date &&
        a.id !== excludeId &&
        a.status !== AppointmentStatus.Cancelled
      );

      // Converte horário de início para minutos
      const [startHour, startMin] = startTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = startMinutes + duration;

      return dayAppointments.some(a => {
        const [aHour, aMin] = a.startTime.split(':').map(Number);
        const aStartMinutes = aHour * 60 + aMin;
        const aEndMinutes = aStartMinutes + a.duration;

        // Verifica se há sobreposição
        return (
          (startMinutes >= aStartMinutes && startMinutes < aEndMinutes) ||
          (endMinutes > aStartMinutes && endMinutes <= aEndMinutes) ||
          (startMinutes <= aStartMinutes && endMinutes >= aEndMinutes)
        );
      });
    },

    /**
     * Retorna horários disponíveis para uma data
     */
    getAvailableSlots: (date: string, slotDuration: number = 30) => {
      const dayAppointments = appointments.filter(a =>
        a.date === date &&
        a.status !== AppointmentStatus.Cancelled
      );

      // Horário comercial: 9h às 18h
      const slots: string[] = [];
      for (let hour = 9; hour < 18; hour++) {
        for (let min = 0; min < 60; min += slotDuration) {
          const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
          slots.push(time);
        }
      }

      // Filtra slots ocupados
      return slots.filter(slot =>
        !helpers.hasTimeConflict(date, slot, slotDuration)
      );
    },
  };

  return {
    // Estado
    appointments,
    loading,
    error,
    hasMoreData,
    estimatedTotal,

    // Ações
    fetchAppointments,
    fetchAppointmentsByDate,
    fetchUpcoming,
    fetchRecentAppointments,
    fetchMoreAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    updateStatus,
    clearError,

    // Helpers
    ...helpers,
  };
}
