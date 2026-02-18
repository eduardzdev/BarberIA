/**
 * BookingPage - Página pública de agendamento (sem autenticação)
 * 
 * Fluxo de 4 passos para clientes agendarem serviços via WhatsApp:
 * 1. Escolher serviços (múltiplos)
 * 2. Escolher profissional
 * 3. Escolher data e horário
 * 4. Escolher forma de pagamento
 * 
 * Features:
 * - Sem necessidade de login
 * - Confirmação via WhatsApp (não salva no sistema)
 * - Cálculo automático de total
 * - Desconto de 5% para pagamento antecipado
 * - Validação de campos obrigatórios
 * 
 * Referências:
 * - ANALISE_COMPLETA_UI.md - Seção 12 (Booking Page)
 * - FLUXO_NAVEGACAO.md - Seção 2 (Fluxo de Agendamento Público)
 * - DESCRICAO_FEATURES.md - Seção 11 (Agendamento Público)
 * - ESTADOS_ESPECIAIS.md - Seção "Booking"
 * 
 * Dependências:
 * - ServicesStore - Para buscar lista de serviços disponíveis
 * - Barber mock data - Profissionais disponíveis (futuro: BarbershopStore)
 * 
 * Exemplo de uso:
 * ```typescript
 * // Em App.tsx (rota pública)
 * <Route path="/booking" element={<BookingPage />} />
 * ```
 */

import React, { useState, useMemo } from 'react';
import CardSkeleton from '@/components/common/CardSkeleton';
import { useNavigate } from 'react-router-dom';
import { useServices } from '@/hooks/useServices';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Service, Barber } from '@/types';
import { MOCK_SERVICES } from '@/constants';

// Mock data de profissionais (futuro: vir do BarbershopStore)
const MOCK_BARBERS: Barber[] = [
  {
    id: '1',
    name: 'André',
    avatarUrl: ''
  },
  {
    id: '2',
    name: 'Bruno',
    avatarUrl: ''
  },
  {
    id: '3',
    name: 'Carlos',
    avatarUrl: ''
  },
];

// Mock de horários disponíveis (futuro: integração com agenda real)
const AVAILABLE_TIMES = [
  '09:00', '10:00', '11:00',
  '13:00', '14:00', '15:00',
  '16:00', '17:00'
];

// Tipo para forma de pagamento
type PaymentMethod = 'online' | 'local';

export const BookingPage: React.FC = () => {
  // Navegação
  const navigate = useNavigate();

  // Estado do ServicesStore
  const { services: firebaseServices, loading, error } = useServices({ autoFetch: true });

  // Usar MOCK_SERVICES como fallback se não houver serviços do Firebase
  const servicesToDisplay = firebaseServices.length > 0 ? firebaseServices : MOCK_SERVICES;

  // Step 1: Serviços selecionados
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);

  // Step 2: Profissional selecionado
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(MOCK_BARBERS[0]);

  // Step 3: Data e horário
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Step 4: Forma de pagamento
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('local');

  /**
   * Toggle de seleção de serviço (permite múltiplos)
   */
  const toggleService = (service: Service) => {
    setSelectedServices(prev =>
      prev.find(s => s.id === service.id)
        ? prev.filter(s => s.id !== service.id)
        : [...prev, service]
    );
  };

  /**
   * Cálculo do total com desconto opcional
   */
  const total = useMemo(() => {
    const subtotal = selectedServices.reduce(
      (acc, service) => acc + service.price,
      0
    );
    // Desconto de 5% para pagamento online
    return paymentMethod === 'online' ? subtotal * 0.95 : subtotal;
  }, [selectedServices, paymentMethod]);

  /**
   * Validação: todas as etapas completas?
   */
  const isValid = useMemo(() => {
    return (
      selectedServices.length > 0 &&
      selectedBarber !== null &&
      selectedTime !== null
    );
  }, [selectedServices, selectedBarber, selectedTime]);

  /**
   * Gera link do WhatsApp com mensagem pré-formatada
   */
  const generateWhatsAppLink = () => {
    if (!isValid) return '#';

    const servicesText = selectedServices
      .map(s => s.name)
      .join(', ');

    const dateFormatted = new Date(selectedDate + 'T00:00:00')
      .toLocaleDateString('pt-BR');

    const message = encodeURIComponent(
      `Olá! Gostaria de confirmar meu agendamento:

📋 Serviços: ${servicesText}
👤 Profissional: ${selectedBarber?.name}
📅 Data: ${dateFormatted}
🕐 Horário: ${selectedTime}
💰 Total: R$ ${total.toFixed(2)}
💳 Pagamento: ${paymentMethod === 'local' ? 'No local' : 'Pagamento online (com 5% de desconto)'}`
    );

    // TODO: Substituir por número real da barbearia (futuro: BarbershopStore)
    const phone = '5511999999999';
    return `https://wa.me/${phone}?text=${message}`;
  };

  /**
   * Handler para confirmar agendamento
   */
  const handleConfirm = () => {
    if (!isValid) {
      // Feedback visual já está no botão desabilitado
      // Não precisamos de alert, só prevenir ação
      return;
    }

    // Redireciona para WhatsApp
    window.open(generateWhatsAppLink(), '_blank');
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900 shadow-2xl shadow-violet-900/50 min-h-screen p-4 space-y-6 relative">
      {/* Botão de volta - Canto superior esquerdo */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => navigate('/#/login')}
          className="flex items-center gap-2 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
          title="Voltar para login"
        >
          <Icon name="left" className="text-lg" />
          <span className="text-sm font-medium">Voltar</span>
        </button>
      </div>

      {/* Header */}
      <div className="pt-8">
        <h1 className="text-3xl font-bold text-slate-100">
          Faça seu Agendamento
        </h1>
        <p className="text-slate-400">
          Rápido, fácil e sem login.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <div className="p-4">
            <CardSkeleton count={3} />
          </div>
        </Card>
      )}

      {/* Error State - apenas mostrar se não temos fallback */}
      {error && firebaseServices.length === 0 && (
        <Card className="bg-blue-500/10 border-blue-500">
          <div className="flex items-center gap-2 text-blue-400">
            <Icon name="info" className="text-xl" />
            <span>Usando serviços padrão da barbearia</span>
          </div>
        </Card>
      )}

      {/* Step 1: Escolha os Serviços */}
      {!loading && (
        <Card>
          <h2 className="font-bold text-slate-100 mb-4 text-lg flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-600 text-white text-sm">
              1
            </span>
            Escolha os Serviços
          </h2>

          {servicesToDisplay.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              Nenhum serviço disponível no momento.
            </div>
          ) : (
            <div className="space-y-3">
              {servicesToDisplay.map(service => {
                const isSelected = selectedServices.some(s => s.id === service.id);

                return (
                  <div
                    key={service.id}
                    onClick={() => toggleService(service)}
                    className={`
                      flex justify-between items-center p-3 rounded-lg 
                      cursor-pointer transition-all border
                      ${isSelected
                        ? 'bg-violet-600/30 border-violet-500'
                        : 'bg-slate-700/50 border-slate-700 hover:bg-slate-700'
                      }
                    `}
                  >
                    <div>
                      <p className="font-semibold text-slate-100">
                        {service.name}
                      </p>
                      <p className="text-sm text-slate-400">
                        {service.duration} min
                      </p>
                    </div>
                    <p className="font-bold text-slate-200">
                      R$ {service.price.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Step 2: Escolha o Profissional */}
      <Card>
        <h2 className="font-bold text-slate-100 mb-4 text-lg flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-600 text-white text-sm">
            2
          </span>
          Escolha o Profissional
        </h2>

        <div className="flex space-x-3 overflow-x-auto pb-2">
          {MOCK_BARBERS.map(barber => {
            const isSelected = selectedBarber?.id === barber.id;

            return (
              <div
                key={barber.id}
                onClick={() => setSelectedBarber(barber)}
                className={`
                  flex flex-col items-center p-3 rounded-lg 
                  cursor-pointer border-2 transition-all min-w-[100px]
                  ${isSelected
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-transparent hover:border-slate-600'
                  }
                `}
              >
                {barber.avatarUrl ? (
                  <img
                    src={barber.avatarUrl}
                    alt={barber.name}
                    className="w-16 h-16 rounded-full mb-2 object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full mb-2 bg-slate-800 flex items-center justify-center border-2 border-slate-700">
                    <Icon name="user" className="w-8 h-8 text-slate-600" />
                  </div>
                )}
                <p className="font-semibold text-slate-200 text-center">
                  {barber.name}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Step 3: Escolha a Data e Horário */}
      <Card>
        <h2 className="font-bold text-slate-100 mb-4 text-lg flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-600 text-white text-sm">
            3
          </span>
          Escolha a Data e Horário
        </h2>

        {/* Data */}
        <div className="mb-4">
          <label className="text-sm font-medium text-slate-400 mb-1 block">
            Data
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Horários */}
        <div>
          <label className="text-sm font-medium text-slate-400 mb-2 block">
            Horário
          </label>
          <div className="grid grid-cols-4 gap-2">
            {AVAILABLE_TIMES.map(time => {
              const isSelected = selectedTime === time;

              return (
                <button
                  key={time}
                  type="button"
                  onClick={() => setSelectedTime(time)}
                  className={`
                    p-2 rounded-lg text-center font-semibold transition-all
                    ${isSelected
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/50'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    }
                  `}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Step 4: Pagamento */}
      <Card>
        <h2 className="font-bold text-slate-100 mb-4 text-lg flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-600 text-white text-sm">
            4
          </span>
          Pagamento
        </h2>

        <div className="space-y-3">
          {/* Pagamento Online */}
          <div
            onClick={() => setPaymentMethod('online')}
            className={`
              flex justify-between items-center p-3 rounded-lg 
              cursor-pointer transition-all border
              ${paymentMethod === 'online'
                ? 'bg-violet-600/30 border-violet-500'
                : 'bg-slate-700/50 border-slate-700 hover:bg-slate-700'
              }
            `}
          >
            <div>
              <p className="font-semibold text-slate-100">
                Pagar agora
              </p>
              <p className="text-sm text-green-400">
                e ganhe 5% de desconto!
              </p>
            </div>
            {paymentMethod === 'online' && (
              <Icon name="check-circle" className="text-violet-400 text-xl" />
            )}
          </div>

          {/* Pagamento Local */}
          <div
            onClick={() => setPaymentMethod('local')}
            className={`
              flex justify-between items-center p-3 rounded-lg 
              cursor-pointer transition-all border
              ${paymentMethod === 'local'
                ? 'bg-violet-600/30 border-violet-500'
                : 'bg-slate-700/50 border-slate-700 hover:bg-slate-700'
              }
            `}
          >
            <p className="font-semibold text-slate-100">
              Pagar no local
            </p>
            {paymentMethod === 'local' && (
              <Icon name="check-circle" className="text-violet-400 text-xl" />
            )}
          </div>
        </div>
      </Card>

      {/* Footer: Total e Confirmação */}
      <div className="sticky bottom-0 py-4 bg-slate-900 border-t border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <span className="text-slate-400 font-medium">Total</span>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">
              R$ {total.toFixed(2)}
            </div>
            {paymentMethod === 'online' && selectedServices.length > 0 && (
              <div className="text-xs text-green-400">
                Desconto de 5% aplicado
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={!isValid}
          className={`
            w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2
            transition-all
            ${isValid
              ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/50'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }
          `}
        >
          <Icon name="whatsapp" className="text-xl" />
          <span>Confirmar no WhatsApp</span>
        </button>

        {!isValid && (
          <p className="text-center text-xs text-slate-500 mt-2">
            Preencha todos os campos para continuar
          </p>
        )}
      </div>
    </div>
  );
};
