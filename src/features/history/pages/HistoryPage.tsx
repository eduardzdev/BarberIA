/**
 * HistoryPage - Página de Histórico de Atendimentos
 * 
 * Features:
 * - Histórico completo de atendimentos realizados (status = Concluído)
 * - Exportação de relatórios (placeholder)
 * - Busca por cliente ou serviço
 * - Filtros por período (placeholder)
 * - Stats cards (serviços realizados, receita total, ticket médio)
 * - Timeline detalhada com notas
 * 
 * Integração:
 * - AppointmentsStore (para histórico real filtrado por Concluído)
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import CardSkeleton from '@/components/common/CardSkeleton';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { useAppointments } from '@/hooks/useAppointments';
import { useServices } from '@/hooks/useServices';
import { AppointmentStatus } from '@/types';
import {
  endOfDay,
  endOfMonth,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths
} from 'date-fns';
import { exportFilteredHistory } from '@/services/export.service';

/**
 * StatCard - Card de estatística reutilizável
 */
interface StatCardProps {
  icon: string;
  title: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value }) => (
  <Card>
    <Icon name={icon} className="w-6 h-6 text-violet-400 mb-2" />
    <p className="text-2xl font-bold text-slate-100">{value}</p>
    <p className="text-xs text-slate-400 mt-1">{title}</p>
  </Card>
);

/**
 * HistoryDetailCard - Card detalhado de atendimento no histórico
 */
interface HistoryDetailCardProps {
  clientName: string;
  services: string;
  date: string;
  time: string;
  duration: number;
  price?: number;
  notes?: string;
}

const HistoryDetailCard: React.FC<HistoryDetailCardProps> = ({
  clientName,
  services,
  date,
  time,
  duration,
  price,
  notes
}) => {
  return (
    <div className="flex space-x-4">
      {/* Data e Hora */}
      <div className="text-center">
        <p className="font-bold text-slate-100">{date}</p>
        <p className="text-sm text-slate-400">{time}</p>
      </div>

      {/* Separador vertical */}
      <div className="w-px bg-slate-700 h-auto"></div>

      {/* Detalhes do atendimento */}
      <Card className="flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-slate-300 flex items-center">
              <Icon name="user" className="w-4 h-4 mr-2" />
              {clientName}
            </p>
            <p className="font-bold text-slate-100 text-lg">{services}</p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
            Concluído
          </span>
        </div>

        {/* Duração e Preço */}
        <div className="flex items-center justify-between text-sm text-slate-400 mt-3">
          <span>{duration}min</span>
          {price && (
            <span className="font-bold text-slate-100 text-base">
              R$ {price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Observações (se houver) */}
        {notes && (
          <p className="text-xs text-slate-500 italic mt-3 pt-3 border-t border-slate-700">
            "{notes}"
          </p>
        )}
      </Card>
    </div>
  );
};

/**
 * HistoryPage - Componente principal
 */
export const HistoryPage: React.FC = () => {
  const {
    appointments,
    fetchRecentAppointments,
    fetchMoreAppointments,
    hasMoreData,
    estimatedTotal,
    loading
  } = useAppointments({ autoFetch: false });
  const { services: catalogServices } = useServices({ autoFetch: true });
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState('30days');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedBarbers, setSelectedBarbers] = useState<string[]>([]);
  const [customDateRange, setCustomDateRange] = useState<{ start?: string; end?: string }>({});
  type PriceOperator = 'any' | 'gt' | 'lt' | 'eq';
  const [priceFilter, setPriceFilter] = useState<{ operator: PriceOperator; value?: number }>({ operator: 'any' });

  // Carrega dados iniciais
  useEffect(() => {
    fetchRecentAppointments(100); // Carrega últimos 100 agendamentos
  }, [fetchRecentAppointments]);

  // Handler para carregar mais
  const handleLoadMore = () => {
    fetchMoreAppointments(50); // Carrega mais 50 por vez
  };

  // Estado do modal de exportação
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Handler de exportação
  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simular progresso inicial
      setExportProgress(20);

      // Buscar TODOS os agendamentos (sem paginação)
      const allCompletedAppointments = filteredAppointments.filter(
        apt => apt.status === AppointmentStatus.Completed
      );

      setExportProgress(60);

      // Exportar com filtros aplicados
      exportFilteredHistory(allCompletedAppointments, {
        searchQuery,
        services: selectedServices,
        barbers: selectedBarbers,
      });

      setExportProgress(100);

      // Fechar modal após breve delay
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar dados. Tente novamente.');
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const parseAppointmentDate = useCallback((dateStr: string | undefined, time?: string | null) => {
    if (!dateStr) return null;
    const safeTime = time
      ? time.length === 5
        ? `${time}:00`
        : time
      : '00:00:00';
    const candidate = parseISO(`${dateStr}T${safeTime}`);
    if (isValid(candidate)) {
      return candidate;
    }

    const fallback = parseISO(`${dateStr}T00:00:00`);
    return isValid(fallback) ? fallback : null;
  }, []);

  // Filtrar apenas agendamentos concluídos
  const completedAppointments = useMemo(() => {
    return appointments.filter(a => a.status === AppointmentStatus.Completed);
  }, [appointments]);

  const uniqueServices = useMemo(() => {
    if (!catalogServices || catalogServices.length === 0) {
      return [] as string[];
    }

    const names = catalogServices
      .map(service => service.name)
      .filter(Boolean) as string[];

    const unique = Array.from(new Set(names));
    return unique.sort((a, b) => a.localeCompare(b));
  }, [catalogServices]);

  const showServiceOverflowGradient = uniqueServices.length > 4;

  const uniqueBarbers = useMemo(() => {
    const barberSet = new Set<string>();
    completedAppointments.forEach(appointment => {
      if (appointment.barberName) {
        barberSet.add(appointment.barberName);
      }
    });
    return Array.from(barberSet).sort((a, b) => a.localeCompare(b));
  }, [completedAppointments]);

  const periodFilteredAppointments = useMemo(() => {
    const sorted = [...completedAppointments].sort((a, b) => {
      const dateA = parseAppointmentDate(a.date, a.startTime);
      const dateB = parseAppointmentDate(b.date, b.startTime);

      if (dateA && dateB) {
        return dateB.getTime() - dateA.getTime();
      }

      if (!dateA && !dateB) {
        if (a.date === b.date) {
          return (b.startTime || '').localeCompare(a.startTime || '');
        }
        return (b.date || '').localeCompare(a.date || '');
      }

      return dateB ? 1 : -1;
    });

    if (periodFilter === 'all') {
      return sorted;
    }

    const today = startOfDay(new Date());
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (periodFilter) {
      case 'today': {
        startDate = startOfDay(today);
        endDate = endOfDay(today);
        break;
      }
      case 'yesterday': {
        const yesterday = subDays(today, 1);
        startDate = startOfDay(yesterday);
        endDate = endOfDay(yesterday);
        break;
      }
      case '7days': {
        startDate = startOfDay(subDays(today, 6));
        endDate = endOfDay(today);
        break;
      }
      case '30days': {
        startDate = startOfDay(subDays(today, 29));
        endDate = endOfDay(today);
        break;
      }
      case 'thisMonth': {
        startDate = startOfMonth(today);
        endDate = endOfDay(endOfMonth(today));
        break;
      }
      case 'lastMonth': {
        const lastMonthDate = subMonths(today, 1);
        startDate = startOfMonth(lastMonthDate);
        endDate = endOfDay(endOfMonth(lastMonthDate));
        break;
      }
      default: {
        return sorted;
      }
    }

    if (!startDate || !endDate) {
      return sorted;
    }

    return sorted.filter(app => {
      const appointmentDate = parseAppointmentDate(app.date, app.startTime);
      if (!appointmentDate) {
        return false;
      }
      return appointmentDate.getTime() >= startDate.getTime() && appointmentDate.getTime() <= endDate.getTime();
    });
  }, [completedAppointments, parseAppointmentDate, periodFilter]);

  const advancedFilteredAppointments = useMemo(() => {
    return periodFilteredAppointments.filter(appointment => {
      if (selectedServices.length > 0) {
        const hasService = appointment.services.some(service => selectedServices.includes(service));
        if (!hasService) {
          return false;
        }
      }

      if (selectedBarbers.length > 0) {
        if (!appointment.barberName || !selectedBarbers.includes(appointment.barberName)) {
          return false;
        }
      }

      if (priceFilter.operator !== 'any' && typeof priceFilter.value === 'number') {
        if (typeof appointment.price !== 'number') {
          return false;
        }

        if (priceFilter.operator === 'gt' && !(appointment.price > priceFilter.value)) {
          return false;
        }

        if (priceFilter.operator === 'lt' && !(appointment.price < priceFilter.value)) {
          return false;
        }

        if (priceFilter.operator === 'eq' && appointment.price !== priceFilter.value) {
          return false;
        }
      }

      if (customDateRange.start || customDateRange.end) {
        const appointmentDate = parseAppointmentDate(appointment.date, appointment.startTime);
        if (!appointmentDate) {
          return false;
        }

        if (customDateRange.start) {
          const start = startOfDay(parseISO(customDateRange.start));
          if (!isValid(start) || appointmentDate.getTime() < start.getTime()) {
            return false;
          }
        }

        if (customDateRange.end) {
          const end = endOfDay(parseISO(customDateRange.end));
          if (!isValid(end) || appointmentDate.getTime() > end.getTime()) {
            return false;
          }
        }
      }

      return true;
    });
  }, [customDateRange.end, customDateRange.start, parseAppointmentDate, periodFilteredAppointments, priceFilter.operator, priceFilter.value, selectedBarbers, selectedServices]);

  // Filtrar por busca
  const filteredAppointments = useMemo(() => {
    if (!searchQuery) return advancedFilteredAppointments;
    const query = searchQuery.toLowerCase();
    return advancedFilteredAppointments.filter(
      a =>
        a.clientName.toLowerCase().includes(query) ||
        a.services.some(s => s.toLowerCase().includes(query))
    );
  }, [advancedFilteredAppointments, searchQuery]);

  // Calcular stats
  const stats = useMemo(() => {
    const servicesCount = filteredAppointments.length;
    const totalRevenue = filteredAppointments.reduce((sum, a) => sum + (a.price || 0), 0);
    const averageTicket = servicesCount > 0 ? totalRevenue / servicesCount : 0;

    return {
      servicesCount,
      totalRevenue,
      averageTicket
    };
  }, [filteredAppointments]);

  const hasActiveAdvancedFilters = useMemo(() => {
    const priceActive = priceFilter.operator !== 'any' && typeof priceFilter.value === 'number';
    const dateActive = Boolean(customDateRange.start || customDateRange.end);
    return (
      selectedServices.length > 0 ||
      selectedBarbers.length > 0 ||
      priceActive ||
      dateActive
    );
  }, [customDateRange.end, customDateRange.start, priceFilter.operator, priceFilter.value, selectedBarbers.length, selectedServices.length]);

  const activeFilterTags = useMemo(() => {
    const tags: Array<{ id: string; label: string; onRemove: () => void }> = [];

    selectedServices.forEach(service => {
      tags.push({
        id: `service-${service}`,
        label: `Serviço: ${service}`,
        onRemove: () => {
          setSelectedServices(prev => prev.filter(item => item !== service));
        }
      });
    });

    selectedBarbers.forEach(barber => {
      tags.push({
        id: `barber-${barber}`,
        label: `Profissional: ${barber}`,
        onRemove: () => {
          setSelectedBarbers(prev => prev.filter(item => item !== barber));
        }
      });
    });

    if (priceFilter.operator !== 'any' && typeof priceFilter.value === 'number') {
      const operatorLabel =
        priceFilter.operator === 'gt'
          ? 'Acima de'
          : priceFilter.operator === 'lt'
            ? 'Abaixo de'
            : 'Igual a';

      tags.push({
        id: 'price-filter',
        label: `${operatorLabel} R$ ${priceFilter.value.toFixed(2)}`,
        onRemove: () => setPriceFilter({ operator: 'any' })
      });
    }

    if (customDateRange.start || customDateRange.end) {
      const start = customDateRange.start ? new Date(customDateRange.start).toLocaleDateString('pt-BR') : 'Início livre';
      const end = customDateRange.end ? new Date(customDateRange.end).toLocaleDateString('pt-BR') : 'Fim livre';

      tags.push({
        id: 'custom-range',
        label: `Data: ${start} → ${end}`,
        onRemove: () => setCustomDateRange({})
      });
    }

    return tags;
  }, [customDateRange.end, customDateRange.start, priceFilter, selectedBarbers, selectedServices]);

  const handleToggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service) ? prev.filter(item => item !== service) : [...prev, service]
    );
  };

  const handleToggleBarber = (barber: string) => {
    setSelectedBarbers(prev =>
      prev.includes(barber) ? prev.filter(item => item !== barber) : [...prev, barber]
    );
  };

  const handlePriceValueChange = (value: string) => {
    if (!value) {
      setPriceFilter(prev => ({ ...prev, value: undefined }));
      return;
    }
    const parsed = Number(value.replace(/[^0-9,.-]/g, '').replace(',', '.'));
    if (Number.isFinite(parsed)) {
      setPriceFilter(prev => ({ ...prev, value: parsed }));
    } else {
      setPriceFilter(prev => ({ ...prev, value: undefined }));
    }
  };

  const handleClearAdvancedFilters = () => {
    setSelectedServices([]);
    setSelectedBarbers([]);
    setCustomDateRange({});
    setPriceFilter({ operator: 'any' });
  };

  // Formatar datas para exibição
  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('pt-BR', { month: '2-digit', day: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <p className="text-2xl font-bold">Histórico de Atendimentos</p>
        <p className="text-slate-400">Acompanhe todos os serviços realizados</p>
      </div>

      {/* Botão de Exportação */}
      <button
        onClick={handleExport}
        disabled={filteredAppointments.length === 0 || isExporting}
        className="w-full bg-slate-800/50 border border-slate-700 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Icon name="download" className="w-5 h-5" />
        <span>Exportar Relatório</span>
      </button>

      {/* Campo de Busca */}
      <div className="relative">
        <Icon name="search" className="w-5 h-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar por cliente ou serviço..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {/* Filtros de Período */}
      <div className="flex space-x-3">
        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          className="flex-grow bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-100 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="today">Hoje</option>
          <option value="yesterday">Ontem</option>
          <option value="7days">Últimos 7 dias</option>
          <option value="30days">Últimos 30 dias</option>
          <option value="thisMonth">Este mês</option>
          <option value="lastMonth">Mês passado</option>
          <option value="all">Todos</option>
        </select>
        <button
          type="button"
          onClick={() => setIsFilterModalOpen(true)}
          className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 flex items-center justify-center space-x-2 hover:bg-slate-800 transition-colors"
        >
          <Icon name="filter" className="w-5 h-5 text-slate-400" />
          <span className="font-semibold">Filtros</span>
        </button>
      </div>

      {hasActiveAdvancedFilters && (
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2">
          {activeFilterTags.map(tag => (
            <span
              key={tag.id}
              className="flex items-center space-x-2 bg-violet-500/10 text-violet-200 text-xs font-medium px-3 py-1 rounded-full"
            >
              <span>{tag.label}</span>
              <button
                type="button"
                onClick={tag.onRemove}
                className="text-violet-200 hover:text-white"
                aria-label={`Remover filtro ${tag.label}`}
              >
                <Icon name="x" className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={handleClearAdvancedFilters}
            className="text-xs font-semibold text-slate-300 hover:text-white underline decoration-dotted"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon="scissors"
          title="Serviços Realizados"
          value={stats.servicesCount.toString()}
        />
        <StatCard
          icon="dollar"
          title="Receita Total"
          value={`R$ ${stats.totalRevenue.toFixed(0)}`}
        />
        <StatCard
          icon="clock"
          title="Ticket Médio"
          value={`R$ ${stats.averageTicket.toFixed(0)}`}
        />
        <StatCard
          icon="user"
          title="Clientes Atendidos"
          value={new Set(filteredAppointments.map(a => a.clientName)).size.toString()}
        />
      </div>

      {/* Histórico Detalhado */}
      <Card>
        <h3 className="font-bold text-slate-100 mb-2 flex items-center">
          <Icon name="history" className="w-5 h-5 mr-2 text-violet-400" />
          Histórico Detalhado
        </h3>
        <p className="text-sm text-slate-400 mb-6">
          Registro completo de todos os atendimentos realizados
        </p>
        <div className="space-y-5">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => (
              <HistoryDetailCard
                key={appointment.id}
                clientName={appointment.clientName}
                services={appointment.services.join(' + ')}
                date={formatDate(appointment.date)}
                time={appointment.startTime}
                duration={appointment.duration}
                price={appointment.price}
                notes={appointment.notes}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <Icon name="history" className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">Nenhum atendimento no histórico</p>
              <p className="text-sm text-slate-500">
                Os atendimentos concluídos aparecerão aqui
              </p>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {hasMoreData && filteredAppointments.length > 0 && (
          <div className="text-center pt-4">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center justify-center mx-auto space-x-2"
            >
              {loading ? (
                <CardSkeleton count={1} className="w-full" />
              ) : (
                <>
                  <Icon name="chevron-down" className="w-5 h-5" />
                  <span>Carregar mais agendamentos</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Data Indicator */}
        <div className="text-center text-sm text-slate-500 mt-4">
          {filteredAppointments.length > 0 && (
            <p>
              Mostrando {filteredAppointments.length} {hasMoreData ? `de ~${estimatedTotal}` : `de ${estimatedTotal}`} agendamento(s) concluído(s)
            </p>
          )}
          {hasActiveAdvancedFilters && filteredAppointments.length > 0 && (
            <p className="text-xs text-amber-400 mt-1">
              ⚠️ Filtros aplicados apenas aos agendamentos já carregados
            </p>
          )}
        </div>
      </Card>

      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filtros avançados"
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-2">Serviços</h4>
            {uniqueServices.length > 0 ? (
              <div className="relative">
                <div className="max-h-[168px] overflow-y-auto pr-1 space-y-2">
                  {uniqueServices.map(service => (
                    <label key={service} className="flex items-center space-x-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service)}
                        onChange={() => handleToggleService(service)}
                        className="form-checkbox rounded border-slate-600 bg-slate-800 text-violet-500"
                      />
                      <span>{service}</span>
                    </label>
                  ))}
                </div>
                {showServiceOverflowGradient && (
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Nenhum serviço cadastrado ainda.</p>
            )}
          </div>

          {uniqueBarbers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-2">Profissionais</h4>
              <div className="space-y-2">
                {uniqueBarbers.map(barber => (
                  <label key={barber} className="flex items-center space-x-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={selectedBarbers.includes(barber)}
                      onChange={() => handleToggleBarber(barber)}
                      className="form-checkbox rounded border-slate-600 bg-slate-800 text-violet-500"
                    />
                    <span>{barber}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">Preço</h4>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={priceFilter.operator}
                onChange={(event) => {
                  const operator = event.target.value as PriceOperator;
                  setPriceFilter(prev => ({ operator, value: operator === 'any' ? undefined : prev.value }));
                }}
                className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
              >
                <option value="any">Sem filtro</option>
                <option value="gt">Maior que</option>
                <option value="lt">Menor que</option>
                <option value="eq">Igual a</option>
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                value={priceFilter.value ?? ''}
                onChange={(event) => handlePriceValueChange(event.target.value)}
                placeholder="R$"
                className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                disabled={priceFilter.operator === 'any'}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">Período Personalizado</h4>
            <div className="grid grid-cols-1 gap-3">
              <label className="text-xs text-slate-400 space-y-1">
                <span>Data inicial</span>
                <input
                  type="date"
                  value={customDateRange.start ?? ''}
                  onChange={(event) => setCustomDateRange(prev => ({ ...prev, start: event.target.value || undefined }))}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  max={customDateRange.end}
                />
              </label>
              <label className="text-xs text-slate-400 space-y-1">
                <span>Data final</span>
                <input
                  type="date"
                  value={customDateRange.end ?? ''}
                  onChange={(event) => setCustomDateRange(prev => ({ ...prev, end: event.target.value || undefined }))}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  min={customDateRange.start}
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleClearAdvancedFilters}
              className="text-sm font-semibold text-slate-300 hover:text-white"
            >
              Limpar filtros
            </button>
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(false)}
              className="bg-violet-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Progresso de Exportação */}
      <Modal isOpen={isExporting} onClose={() => { }} title="Exportando dados...">
        <div className="space-y-4">
          <p className="text-slate-300">
            Preparando arquivo Excel com {filteredAppointments.length} agendamento(s)...
          </p>

          {/* Barra de progresso */}
          <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
            <div
              className="bg-violet-600 h-full transition-all duration-300 rounded-full flex items-center justify-center"
              style={{ width: `${exportProgress}%` }}
            >
              <span className="text-xs font-semibold text-white">
                {exportProgress}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center text-sm text-slate-400">
            <Icon name="loader" className="w-4 h-4 mr-2 animate-spin" />
            {exportProgress < 30 && 'Coletando dados...'}
            {exportProgress >= 30 && exportProgress < 70 && 'Formatando planilha...'}
            {exportProgress >= 70 && exportProgress < 100 && 'Gerando arquivo...'}
            {exportProgress === 100 && 'Concluído! 🎉'}
          </div>
        </div>
      </Modal>
    </div>
  );
};
