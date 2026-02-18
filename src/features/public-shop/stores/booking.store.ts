import { create } from 'zustand';
import { Service, Combo, Barber, PublicShopData } from '@/types';
import { publicAppointmentService } from '../services/public-appointment.service';

interface BookingState {
  // Dados da Barbearia (Contexto)
  shopData: PublicShopData | null;

  // Estado da Seleção
  isOpen: boolean;
  step: number;
  selectedServices: (Service | Combo)[];
  selectedBarber: Barber | null;
  selectedDate: string; // YYYY-MM-DD
  selectedTime: string; // HH:MM
  clientInfo: {
    name: string;
    phone: string;
  };

  // Status
  loading: boolean;
  error: string | null;

  // Actions
  initBooking: (shopData: PublicShopData, initialService?: Service | Combo) => void;
  closeBooking: () => void;
  toggleService: (service: Service | Combo) => void;
  selectBarber: (barber: Barber | null) => void;
  selectDateTime: (date: string, time: string) => void;
  setClientInfo: (name: string, phone: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  confirmBooking: () => Promise<string>; // Retorna ID do agendamento
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  shopData: null,
  isOpen: false,
  step: 1,
  selectedServices: [],
  selectedBarber: null,
  selectedDate: '',
  selectedTime: '',
  clientInfo: { name: '', phone: '' },
  loading: false,
  error: null,

  initBooking: (shopData, initialService) => {
    set({
      shopData,
      isOpen: true,
      step: initialService ? 2 : 1, // Se já escolheu serviço, vai para passo 2? Ou mantém no 1 pra confirmar? Vamos manter no 1 mas pré-selecionado
      selectedServices: initialService ? [initialService] : [],
      selectedBarber: null,
      selectedDate: '',
      selectedTime: '',
      clientInfo: { name: '', phone: '' },
      error: null
    });
  },

  closeBooking: () => {
    set({ isOpen: false });
  },

  toggleService: (service) => {
    const current = get().selectedServices;
    const exists = current.find(s => s.id === service.id);

    if (exists) {
      set({ selectedServices: current.filter(s => s.id !== service.id) });
    } else {
      set({ selectedServices: [...current, service] });
    }
  },

  selectBarber: (barber) => {
    set({ selectedBarber: barber });
  },

  selectDateTime: (date, time) => {
    set({ selectedDate: date, selectedTime: time });
  },

  setClientInfo: (name, phone) => {
    set({ clientInfo: { name, phone } });
  },

  nextStep: () => {
    set(state => ({ step: state.step + 1 }));
  },

  prevStep: () => {
    set(state => ({ step: state.step - 1 }));
  },

  reset: () => {
    set({
      step: 1,
      selectedServices: [],
      selectedBarber: null,
      selectedDate: '',
      selectedTime: '',
      clientInfo: { name: '', phone: '' },
      error: null
    });
  },

  confirmBooking: async () => {
    const state = get();
    if (!state.shopData) throw new Error('Dados da barbearia não carregados');

    set({ loading: true, error: null });

    try {
      // Calcular duração total e preço
      const duration = state.selectedServices.reduce((acc, s) => acc + s.duration, 0);
      const price = state.selectedServices.reduce((acc, s) => acc + (s.promotionalPrice || s.price), 0);
      const serviceNames = state.selectedServices.map(s => s.name);
      const serviceIds = state.selectedServices.map(s => s.id);

      const appointmentData = {
        clientName: state.clientInfo.name,
        clientPhone: state.clientInfo.phone,
        services: serviceNames, // Usando nomes para compatibilidade com sistema legado
        serviceIds: serviceIds, // IDs salvos para referência futura
        barberName: state.selectedBarber?.name || 'Qualquer Profissional',
        barberId: state.selectedBarber?.id || null,
        date: state.selectedDate,
        startTime: state.selectedTime,
        duration,
        price,
        notes: 'Agendamento via Site',
      };

      const id = await publicAppointmentService.createAppointment(
        state.shopData.ownerId,
        appointmentData as any // Type assertion for extra fields
      );

      set({ loading: false, isOpen: false });
      return id;
    } catch (error) {
      console.error(error);
      set({ loading: false, error: 'Erro ao criar agendamento. Tente novamente.' });
      throw error;
    }
  }
}));
