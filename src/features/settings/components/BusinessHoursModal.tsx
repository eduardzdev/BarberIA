/**
 * BusinessHoursModal - Modal para configurar horários de funcionamento
 *
 * Funcionalidades:
 * - Configurar horário de abertura e fechamento para cada dia da semana
 * - Checkbox para inativar dias (ex: dia de folga)
 * - Checkbox para intervalo de almoço
 * - Se marcar intervalo, solicitar horário de início e duração
 */

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/Icon';
import { useBarbershop } from '@/hooks/useBarbershop';
import { useUI } from '@/hooks/useUI';

interface BusinessHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DaySchedule {
  dayOfWeek: number;
  dayName: string;
  isActive: boolean;
  openTime: string;
  closeTime: string;
  hasLunchBreak: boolean;
  lunchStart: string;
  lunchDuration: number; // em minutos
}

const DEFAULT_SCHEDULE: Omit<DaySchedule, 'dayOfWeek' | 'dayName'>[] = [
  { isActive: false, openTime: '09:00', closeTime: '18:00', hasLunchBreak: false, lunchStart: '12:00', lunchDuration: 60 }, // Domingo
  { isActive: true, openTime: '09:00', closeTime: '18:00', hasLunchBreak: false, lunchStart: '12:00', lunchDuration: 60 }, // Segunda
  { isActive: true, openTime: '09:00', closeTime: '18:00', hasLunchBreak: false, lunchStart: '12:00', lunchDuration: 60 }, // Terça
  { isActive: true, openTime: '09:00', closeTime: '18:00', hasLunchBreak: false, lunchStart: '12:00', lunchDuration: 60 }, // Quarta
  { isActive: true, openTime: '09:00', closeTime: '18:00', hasLunchBreak: false, lunchStart: '12:00', lunchDuration: 60 }, // Quinta
  { isActive: true, openTime: '09:00', closeTime: '18:00', hasLunchBreak: false, lunchStart: '12:00', lunchDuration: 60 }, // Sexta
  { isActive: true, openTime: '09:00', closeTime: '18:00', hasLunchBreak: false, lunchStart: '12:00', lunchDuration: 60 }, // Sábado
];

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const BusinessHoursModal: React.FC<BusinessHoursModalProps> = ({ isOpen, onClose }) => {
  const { businessHours, updateBusinessHours } = useBarbershop();
  const { success, error: showError } = useUI();

  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);

  // Inicializar schedule quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      // Se já existe um schedule detalhado no formato novo
      if (businessHours?.schedule && Array.isArray(businessHours.schedule) && businessHours.schedule.length > 0) {
        const loadedSchedule = DAY_NAMES.map((dayName, index) => {
          const existingDay = businessHours.schedule!.find(d => d.dayOfWeek === index);

          if (existingDay) {
            return {
              dayOfWeek: index,
              dayName,
              isActive: existingDay.isOpen,
              openTime: existingDay.startTime,
              closeTime: existingDay.endTime,
              hasLunchBreak: existingDay.hasLunchBreak,
              lunchStart: existingDay.lunchStart,
              lunchDuration: existingDay.lunchDuration,
            };
          }

          // Se não tiver config para esse dia específico, usa default
          return {
            ...DEFAULT_SCHEDULE[index],
            dayOfWeek: index,
            dayName,
          } as DaySchedule;
        });
        setSchedule(loadedSchedule);
      } else {
        // Fallback para estrutura antiga ou defaults
        const initialSchedule = DAY_NAMES.map((dayName, index) => {
          // Tenta inferir da estrutura antiga (daysOfWeek, opening, closing)
          // businessHours pode ter propriedades antigas que não estão na tipagem atual mas existem no objeto
          const oldBusinessHours = businessHours as any;
          const isActive = oldBusinessHours?.daysOfWeek?.includes(index) ?? DEFAULT_SCHEDULE[index].isActive;

          return {
            dayOfWeek: index,
            dayName,
            isActive,
            openTime: oldBusinessHours?.opening || DEFAULT_SCHEDULE[index].openTime,
            closeTime: oldBusinessHours?.closing || DEFAULT_SCHEDULE[index].closeTime,
            hasLunchBreak: DEFAULT_SCHEDULE[index].hasLunchBreak,
            lunchStart: DEFAULT_SCHEDULE[index].lunchStart,
            lunchDuration: DEFAULT_SCHEDULE[index].lunchDuration,
          };
        });
        setSchedule(initialSchedule);
      }
    }
  }, [isOpen, businessHours]);

  if (!isOpen) return null;

  const toggleDay = (dayOfWeek: number) => {
    setSchedule(prev =>
      prev.map(day =>
        day.dayOfWeek === dayOfWeek ? { ...day, isActive: !day.isActive } : day
      )
    );
  };

  const updateDayField = (
    dayOfWeek: number,
    field: keyof DaySchedule,
    value: string | boolean | number
  ) => {
    setSchedule(prev =>
      prev.map(day => (day.dayOfWeek === dayOfWeek ? { ...day, [field]: value } : day))
    );
  };

  const handleSave = async () => {
    const activeDays = schedule.filter(day => day.isActive);

    if (activeDays.length === 0) {
      showError('Selecione pelo menos um dia de funcionamento');
      return;
    }

    // Validar horários de todos os dias ativos
    for (const day of activeDays) {
      if (day.openTime >= day.closeTime) {
        showError(`${day.dayName}: Horário de abertura deve ser antes do fechamento`);
        return;
      }

      if (day.hasLunchBreak) {
        if (day.lunchStart < day.openTime || day.lunchStart >= day.closeTime) {
          showError(`${day.dayName}: Horário de almoço deve estar dentro do expediente`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      // Converter para o formato de persistência
      const newSchedule = schedule.map(day => ({
        dayOfWeek: day.dayOfWeek,
        isOpen: day.isActive,
        startTime: day.openTime,
        endTime: day.closeTime,
        hasLunchBreak: day.hasLunchBreak,
        lunchStart: day.lunchStart,
        lunchDuration: day.lunchDuration
      }));

      await updateBusinessHours({
        schedule: newSchedule
      });

      success('Horários atualizados com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar horários:', error);
      showError('Erro ao salvar horários. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2">
      <div className="bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm mx-2 max-h-[90vh] overflow-y-auto border border-slate-800">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100">Horários de Funcionamento</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {schedule.map(day => (
            <div
              key={day.dayOfWeek}
              className={`border rounded-lg p-4 transition-colors ${day.isActive
                ? 'bg-slate-800/50 border-slate-700'
                : 'bg-slate-800/20 border-slate-700/50'
                }`}
            >
              {/* Cabeçalho do dia */}
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.isActive}
                    onChange={() => toggleDay(day.dayOfWeek)}
                    className="w-5 h-5 text-violet-600 bg-slate-700 border-slate-600 rounded focus:ring-violet-500"
                  />
                  <span className={`font-semibold ${day.isActive ? 'text-slate-100' : 'text-slate-500'}`}>
                    {day.dayName}
                  </span>
                </label>
                {!day.isActive && (
                  <span className="text-xs text-red-400 font-medium">Fechado</span>
                )}
              </div>

              {/* Horários */}
              {day.isActive && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Abertura</label>
                      <input
                        type="time"
                        value={day.openTime}
                        onChange={(e) => updateDayField(day.dayOfWeek, 'openTime', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Fechamento</label>
                      <input
                        type="time"
                        value={day.closeTime}
                        onChange={(e) => updateDayField(day.dayOfWeek, 'closeTime', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  </div>

                  {/* Intervalo de almoço */}
                  <div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={day.hasLunchBreak}
                        onChange={(e) =>
                          updateDayField(day.dayOfWeek, 'hasLunchBreak', e.target.checked)
                        }
                        className="w-4 h-4 text-violet-600 bg-slate-700 border-slate-600 rounded focus:ring-violet-500"
                      />
                      <span className="text-sm text-slate-300">Fecha ao meio dia (intervalo de almoço)</span>
                    </label>

                    {day.hasLunchBreak && (
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Início do intervalo</label>
                          <input
                            type="time"
                            value={day.lunchStart}
                            onChange={(e) =>
                              updateDayField(day.dayOfWeek, 'lunchStart', e.target.value)
                            }
                            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Duração (minutos)</label>
                          <select
                            value={day.lunchDuration}
                            onChange={(e) =>
                              updateDayField(day.dayOfWeek, 'lunchDuration', parseInt(e.target.value))
                            }
                            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                          >
                            <option value={30}>30 min</option>
                            <option value={60}>1 hora</option>
                            <option value={90}>1h 30min</option>
                            <option value={120}>2 horas</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-4 flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${loading
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-violet-600 text-white hover:bg-violet-700'
              }`}
          >
            {loading ? 'Salvando...' : 'Salvar Horários'}
          </button>
        </div>
      </div>
    </div>
  );
};
