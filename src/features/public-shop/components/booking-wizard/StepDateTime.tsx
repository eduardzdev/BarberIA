import React, { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';
import { useBookingStore } from '../../stores/booking.store';
import { publicAppointmentService } from '../../services/public-appointment.service';
import { OccupiedSlot } from '@/types';
import { addDays, format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const StepDateTime: React.FC = () => {
    const {
        shopData,
        selectedDate,
        selectedTime,
        selectDateTime,
        selectedBarber,
        selectedServices
    } = useBookingStore();

    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Gerar próximos 14 dias
    const today = new Date();
    const nextDays = Array.from({ length: 14 }, (_, i) => addDays(today, i));

    useEffect(() => {
        const fetchAvailability = async () => {
            if (!selectedDate || !shopData) return;

            setLoadingSlots(true);
            try {
                // 1. Buscar slots ocupados (LGPD compliant - sem dados de clientes)
                const occupiedSlots = await publicAppointmentService.getOccupiedSlots(
                    shopData.ownerId,
                    selectedDate
                );

                // 2. Definir horário de funcionamento
                const dateObj = parseISO(selectedDate);
                const dayOfWeek = dateObj.getDay();

                // Tenta pegar do shopData ou usa fallback se não existir
                // Necessário pois businessHours pode não estar salvo em lojas antigas
                let schedule = shopData.businessHours?.schedule?.find(s => s.dayOfWeek === dayOfWeek);

                // Fallback
                if (!schedule) {
                    // Se for Domingo (0), padrão fechado. Outros dias 09:00 - 19:00
                    if (dayOfWeek === 0) {
                        schedule = { dayOfWeek, isOpen: false } as any;
                    } else {
                        schedule = {
                            dayOfWeek,
                            isOpen: true,
                            startTime: '09:00',
                            endTime: '19:00',
                            hasLunchBreak: false,
                            lunchStart: '12:00',
                            lunchDuration: 60
                        };
                    }
                }

                if (!schedule || !schedule.isOpen || !schedule.startTime || !schedule.endTime) {
                    setAvailableSlots([]);
                    return;
                }

                const [startH, startM] = schedule.startTime.split(':').map(Number);
                const [endH, endM] = schedule.endTime.split(':').map(Number);

                const openingTimeMinutes = startH * 60 + startM;
                const closingTimeMinutes = endH * 60 + endM;

                // Intervalo de slots (ex: 30 min)
                const interval = 30;

                // Lunch break
                let lunchStartMin = -1;
                let lunchEndMin = -1;
                if (schedule.hasLunchBreak && schedule.lunchStart) {
                    const [lH, lM] = schedule.lunchStart.split(':').map(Number);
                    lunchStartMin = lH * 60 + lM;
                    lunchEndMin = lunchStartMin + (schedule.lunchDuration || 60);
                }

                // Gerar slots possíveis
                const slots: string[] = [];
                for (let time = openingTimeMinutes; time < closingTimeMinutes; time += interval) {
                    // Pular almoço
                    if (lunchStartMin !== -1 && time >= lunchStartMin && time < lunchEndMin) {
                        continue;
                    }

                    const h = Math.floor(time / 60);
                    const m = time % 60;
                    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                    slots.push(timeStr);
                }

                // Filtrar slots ocupados
                const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0) || 30; // Min 30 min se vazio

                const freeSlots = slots.filter(slot => {
                    const [slotH, slotM] = slot.split(':').map(Number);
                    const slotStartMinutes = slotH * 60 + slotM;
                    const slotEndMinutes = slotStartMinutes + totalDuration;

                    // Verificar se termina depois do expediente
                    if (slotEndMinutes > closingTimeMinutes) return false;

                    // Verificar colisão com slots ocupados (OccupiedSlot - sem PII)
                    const hasConflict = occupiedSlots.some((slot: OccupiedSlot) => {
                        if (selectedBarber && slot.barberName !== selectedBarber.name) {
                            return false;
                        }

                        const [slotH, slotM] = slot.time.split(':').map(Number);
                        const slotStart = slotH * 60 + slotM;
                        const slotEnd = slotStart + slot.duration;

                        return (
                            (slotStartMinutes >= slotStart && slotStartMinutes < slotEnd) ||
                            (slotEndMinutes > slotStart && slotEndMinutes <= slotEnd) ||
                            (slotStartMinutes <= slotStart && slotEndMinutes >= slotEnd)
                        );
                    });

                    return !hasConflict;
                });

                setAvailableSlots(freeSlots);
            } catch (error) {
                console.error(error);
                setAvailableSlots([]); // Fail safe
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchAvailability();
    }, [selectedDate, shopData, selectedBarber, selectedServices]);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-bold text-slate-800 mb-3">Selecione o Dia</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {nextDays.map(date => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const isSelected = selectedDate === dateStr;
                        const isToday = isSameDay(date, today);

                        // Dia da semana (0-6)
                        const dayOfWeek = date.getDay();
                        const schedule = shopData?.businessHours?.schedule.find(s => s.dayOfWeek === dayOfWeek);
                        const isOpen = schedule?.isOpen ?? false;

                        return (
                            <button
                                key={dateStr}
                                onClick={() => isOpen && selectDateTime(dateStr, '')}
                                disabled={!isOpen}
                                className={`
                                    flex flex-col items-center min-w-[4rem] p-3 rounded-xl border transition-all
                                    ${!isOpen ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-100 grayscale' : ''}
                                    ${isSelected
                                        ? 'bg-shop-primary text-white border-shop-primary shadow-lg scale-105'
                                        : isOpen ? 'bg-white text-slate-600 border-slate-200 hover:border-shop-primary hover:text-shop-primary' : ''
                                    }
                                `}
                            >
                                <span className="text-xs font-medium uppercase">
                                    {format(date, 'EEE', { locale: ptBR })}
                                </span>
                                <span className="text-xl font-bold">
                                    {format(date, 'd')}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {selectedDate && (
                <div className="animate-fade-in-up">
                    <h3 className="font-bold text-slate-800 mb-3">Horários Disponíveis</h3>
                    {loadingSlots ? (
                        <div className="flex justify-center p-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shop-primary"></div>
                        </div>
                    ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                            {availableSlots.map(time => (
                                <button
                                    key={time}
                                    onClick={() => selectDateTime(selectedDate, time)}
                                    className={`
                                        py-2 px-3 rounded-lg text-sm font-semibold transition-colors
                                        ${selectedTime === time
                                            ? 'bg-shop-primary text-white shadow-md'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:border-shop-primary hover:text-shop-primary'
                                        }
                                    `}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm text-center py-4 bg-slate-50 rounded-lg border border-slate-100">
                            Nenhum horário disponível para esta data.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
