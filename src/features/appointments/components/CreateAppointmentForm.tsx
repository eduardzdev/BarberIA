import React, { useEffect, useMemo, useState, useId } from 'react';
import { useAppointments } from '@/hooks/useAppointments';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { useBarbershop } from '@/hooks/useBarbershop';
import { useUI } from '@/hooks/useUI';
import { AppointmentStatus } from '@/types';
import { formatPhone } from '@/lib/validations';
import { getAvailableHalfHourSlots, isHalfHourSlot } from '@/constants';
import { Icon } from '@/components/Icon';

interface CreateAppointmentFormProps {
  onClose: () => void;
  mode?: 'create' | 'edit';
  appointmentId?: string;
  defaultValues?: {
    clientName?: string;
    clientPhone?: string;
    date?: string;
    startTime?: string;
    services?: string[];
    notes?: string;
    duration?: number;
    price?: number;
    status?: AppointmentStatus;
    barberName?: string;
  };
  onSuccess?: () => void;
}

/**
 * Formulário reutilizável para criar novos agendamentos.
 * Aceita valores padrão para facilitar pré-preenchimento a partir da Agenda.
 */
export const CreateAppointmentForm: React.FC<CreateAppointmentFormProps> = ({
  onClose,
  mode = 'create',
  appointmentId,
  defaultValues,
  onSuccess,
}) => {
  const { createAppointment, updateAppointment, appointments } = useAppointments();
  const { clients } = useClients({ autoFetch: true });
  const { services } = useServices({ autoFetch: true });
  const { barbers } = useBarbershop({ autoFetch: true });
  const { success, error: showError } = useUI();

  const [clientName, setClientName] = useState(defaultValues?.clientName || '');
  const [clientPhone, setClientPhone] = useState(defaultValues?.clientPhone || '');
  const [selectedServices, setSelectedServices] = useState<string[]>(
    defaultValues?.services || []
  );
  const [date, setDate] = useState(
    defaultValues?.date || new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState(defaultValues?.startTime || '');
  const [duration, setDuration] = useState(defaultValues?.duration || 30);
  const [notes, setNotes] = useState(defaultValues?.notes || '');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<AppointmentStatus>(
    defaultValues?.status || AppointmentStatus.Pending
  );
  const [selectedBarber, setSelectedBarber] = useState(defaultValues?.barberName || '');

  const availableTimes = useMemo(
    () =>
      getAvailableHalfHourSlots(appointments, date, {
        excludeAppointmentId: mode === 'edit' ? appointmentId : undefined,
        includeTimes: defaultValues?.startTime ? [defaultValues.startTime] : [],
      }),
    [appointments, date, mode, appointmentId, defaultValues?.startTime]
  );

  const timeListId = useId();

  // Atualiza campos quando defaultValues mudar (ex: Agenda preenche horário)
  useEffect(() => {
    if (!defaultValues) {
      return;
    }

    if (defaultValues.clientName !== undefined) {
      setClientName(defaultValues.clientName);
    }
    if (defaultValues.clientPhone !== undefined) {
      setClientPhone(defaultValues.clientPhone);
    }
    if (defaultValues.services) {
      setSelectedServices(defaultValues.services);
    }
    if (defaultValues.date) {
      setDate(defaultValues.date);
    }
    if (defaultValues.startTime !== undefined) {
      setStartTime(defaultValues.startTime);
    }
    if (defaultValues.duration !== undefined) {
      setDuration(defaultValues.duration);
    }
    if (defaultValues.notes !== undefined) {
      setNotes(defaultValues.notes);
    }
    if (defaultValues.status !== undefined) {
      setStatus(defaultValues.status);
    }
    if (defaultValues.barberName !== undefined) {
      setSelectedBarber(defaultValues.barberName);
    }
  }, [defaultValues]);

  useEffect(() => {
    if (startTime && !availableTimes.includes(startTime)) {
      setStartTime('');
    }
  }, [availableTimes, startTime]);

  const computedTotalPrice = useMemo(
    () =>
      selectedServices.reduce((sum, serviceName) => {
        const service = services.find((s) => s.name === serviceName);
        return sum + (service?.price || 0);
      }, 0),
    [selectedServices, services]
  );

  const totalPrice = computedTotalPrice > 0
    ? computedTotalPrice
    : defaultValues?.price || 0;

  const fillFromClient = (name: string) => {
    const selected = clients.find((client) => client.name === name);
    if (selected) {
      setClientPhone(selected.phone);
    }
  };

  const toggleService = (serviceName: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceName)
        ? prev.filter((service) => service !== serviceName)
        : [...prev, serviceName]
    );
  };

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
    if (!clientName.trim() || !date || !startTime || selectedServices.length === 0) {
      showError('Preencha os campos obrigatórios (Cliente, Data, Horário e Serviços)');
      return;
    }

    // Validar seleção de profissional (obrigatório se houver barbeiros cadastrados)
    if (barbers.length > 0 && !selectedBarber) {
      showError('Selecione o profissional responsável');
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

    let formattedPhone = '';
    if (clientPhone.trim()) {
      formattedPhone = formatPhone(clientPhone);
      const digitsOnly = formattedPhone.replace(/\D/g, '');
      if (digitsOnly.length < 10 || digitsOnly.length > 11) {
        showError('Informe um telefone válido no formato (11) 99999-9999 ou deixe em branco');
        return;
      }
      setClientPhone(formattedPhone);
    }

    setLoading(true);
    try {
      const statusToApply = mode === 'edit' ? status : AppointmentStatus.Pending;

      const payload = {
        clientName: clientName.trim(),
        clientPhone: formattedPhone,
        date,
        startTime,
        status: statusToApply,
        duration,
        price: totalPrice,
        services: selectedServices,
        notes: notes.trim(),
        barberName: selectedBarber || undefined,
      };

      if (mode === 'edit' && appointmentId) {
        await updateAppointment(appointmentId, payload);
        success('Agendamento atualizado com sucesso!');
      } else {
        await createAppointment(payload);
        success('Agendamento criado com sucesso!');
      }

      onClose();
      onSuccess?.();
    } catch (error) {
      showError('Erro ao salvar agendamento');
      console.error('Erro ao salvar agendamento:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div>
        <label className="flex items-center text-sm font-medium text-slate-400 mb-1">
          <Icon name="user" className="w-4 h-4 mr-2 text-violet-400" />
          Cliente *
        </label>
        <input
          type="text"
          value={clientName}
          onChange={(event) => {
            const value = event.target.value;
            setClientName(value);
            fillFromClient(value);
          }}
          placeholder="Nome do cliente"
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="flex items-center text-sm font-medium text-slate-400 mb-1">
          <Icon name="phone" className="w-4 h-4 mr-2 text-violet-400" />
          Telefone
        </label>
        <input
          type="tel"
          value={clientPhone}
          onChange={(event) => setClientPhone(event.target.value)}
          placeholder="(00) 00000-0000"
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="flex items-center text-sm font-medium text-slate-400 mb-2">
          <Icon name="scissors" className="w-4 h-4 mr-2 text-violet-400" />
          Serviços * <span className="text-green-400 font-bold ml-1">(R$ {totalPrice.toFixed(2)})</span>
        </label>
        <div className="max-h-48 overflow-y-auto border border-slate-600 rounded-lg p-3 bg-slate-700/30">
          {services.length === 0 ? (
            <p className="text-slate-400 text-sm">Nenhum serviço disponível</p>
          ) : (
            Object.entries(
              services.reduce((acc, service) => {
                const cat = service.category || 'Outros';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(service);
                return acc;
              }, {} as Record<string, typeof services>)
            ).map(([category, items]) => (
              <div key={category} className="mb-4 last:mb-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wider">
                  {category === 'combos' ? 'Combos Promocionais' : category}
                </p>
                <div className="space-y-2">
                  {items.map((service) => (
                    <label key={service.id} className="flex items-center space-x-2 cursor-pointer transition-colors hover:bg-slate-700/20 p-1 -mx-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service.name)}
                        onChange={() => toggleService(service.name)}
                        className="w-4 h-4 text-violet-600 bg-slate-700 border-slate-600 rounded focus:ring-2 focus:ring-violet-500"
                      />
                      <span className="text-slate-200 text-sm">
                        {service.name} - R$ {service.price.toFixed(2)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Seleção de Profissional */}
      {barbers.length > 0 && (
        <div>
          <label className="flex items-center text-sm font-medium text-slate-400 mb-1">
            <Icon name="star" className="w-4 h-4 mr-2 text-violet-400" />
            Profissional *
          </label>
          <select
            value={selectedBarber}
            onChange={(event) => setSelectedBarber(event.target.value)}
            className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Selecione o profissional</option>
            {barbers.map((barber) => (
              <option key={barber.id} value={barber.name}>
                {barber.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="flex items-center text-sm font-medium text-slate-400 mb-1">
          <Icon name="calendar" className="w-4 h-4 mr-2 text-violet-400" />
          Data *
        </label>
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="flex items-center text-sm font-medium text-slate-400 mb-1">
          <Icon name="clock" className="w-4 h-4 mr-2 text-violet-400" />
          Horário *
        </label>
        <input
          type="time"
          min="08:00"
          max="20:00"
          step={1800}
          list={timeListId}
          value={startTime}
          onChange={(event) => handleTimeChange(event.target.value)}
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
        <label className="flex items-center text-sm font-medium text-slate-400 mb-1">
          <Icon name="history" className="w-4 h-4 mr-2 text-violet-400" />
          Duração (minutos)
        </label>
        <input
          type="number"
          value={duration}
          onChange={(event) => setDuration(parseInt(event.target.value, 10) || 0)}
          min="15"
          step="15"
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="flex items-center text-sm font-medium text-slate-400 mb-1">
          <Icon name="pencil" className="w-4 h-4 mr-2 text-violet-400" />
          Notas
        </label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Observações sobre o agendamento..."
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          rows={2}
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
          {loading ? 'Salvando...' : 'Agendar'}
        </button>
      </div>
    </div>
  );
};
