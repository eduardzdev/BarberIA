/**
 * AppointmentsStore - Store global de agendamentos usando Zustand
 * 
 * Gerencia todos os agendamentos da barbearia em tempo real.
 * 
 * Estado:
 * - appointments: Lista de agendamentos
 * - loading: Estado de carregamento
 * - error: Mensagem de erro
 * - hasMoreData: Indica se há mais dados para carregar
 * - lastVisibleDoc: Último documento carregado (para paginação)
 * - estimatedTotal: Estimativa do total de registros (baseado em dados carregados)
 * 
 * Ações:
 * - fetchAppointments: Busca todos os agendamentos
 * - fetchAppointmentsByDate: Busca agendamentos de uma data específica
 * - fetchUpcoming: Busca próximos agendamentos (hoje e futuros)
 * - createAppointment: Cria novo agendamento
 * - updateAppointment: Atualiza agendamento existente
 * - deleteAppointment: Remove agendamento
 * - updateStatus: Atualiza apenas o status de um agendamento
 * - fetchRecentAppointments: Busca últimos N agendamentos (para paginação)
 * - fetchMoreAppointments: Carrega mais agendamentos (paginação incremental)
 * 
 * Referências:
 * - ANALISE_COMPLETA_UI.md - Seção 3 (Appointments), Seção 4 (Agenda)
 * - DESCRICAO_FEATURES.md - Seção 3 (Gestão de Agendamentos)
 * - ESTADOS_ESPECIAIS.md - Seção "Agendamentos"
 * 
 * Padrão de uso:
 * ```typescript
 * const { appointments, loading, fetchUpcoming } = useAppointmentsStore();
 * 
 * useEffect(() => {
 *   fetchUpcoming();
 * }, []);
 * ```
 */

import { create } from 'zustand';
import { Appointment, AppointmentStatus, TransactionType } from '@/types';
import { BaseService } from '@/services/base.service';
import { where, orderBy, Timestamp, query, getDocs, limit, startAfter, DocumentSnapshot } from 'firebase/firestore';

// Instância do serviço de Firestore
const appointmentsService = new BaseService<Appointment>('appointments');

// Tipos para criação/atualização (sem ID)
export type CreateAppointmentData = Omit<Appointment, 'id'>;
export type UpdateAppointmentData = Partial<Omit<Appointment, 'id'>>;

interface AppointmentsState {
  // Estado
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  hasMoreData: boolean;
  lastVisibleDoc: DocumentSnapshot | null;
  estimatedTotal: number;

  // Ações de dados
  fetchAppointments: () => Promise<void>;
  fetchAppointmentsByDate: (date: string) => Promise<void>;
  fetchUpcoming: () => Promise<void>;
  createAppointment: (data: CreateAppointmentData) => Promise<string>;
  updateAppointment: (id: string, data: UpdateAppointmentData) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  updateStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  fetchRecentAppointments: (limitCount: number) => Promise<void>;
  fetchMoreAppointments: (limitCount: number) => Promise<void>;

  // Ações de controle
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppointmentsStore = create<AppointmentsState>((set, get) => ({
  // Estado inicial
  appointments: [],
  loading: false,
  error: null,
  hasMoreData: true,
  lastVisibleDoc: null,
  estimatedTotal: 0,

  // Busca todos os agendamentos (com limite de segurança)
  fetchAppointments: async () => {
    set({ loading: true, error: null });

    try {
      const appointments = await appointmentsService.getAll([
        orderBy('date', 'desc'),
        orderBy('startTime', 'asc')
      ], 200); // Limite de segurança

      set({
        appointments,
        loading: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Erro ao carregar agendamentos';

      console.error('Erro ao buscar agendamentos:', error);
      set({
        loading: false,
        error: errorMessage
      });
    }
  },

  // Busca últimos N agendamentos (paginação inicial)
  fetchRecentAppointments: async (limitCount: number) => {
    set({ loading: true, error: null, hasMoreData: true, lastVisibleDoc: null });

    try {
      const userId = appointmentsService['getCollectionRef']().path.split('/')[1];
      const colRef = appointmentsService['getCollectionRef']();

      const q = query(
        colRef,
        orderBy('date', 'desc'),
        orderBy('startTime', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const appointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Appointment[];

      const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
      const hasMore = snapshot.docs.length === limitCount;

      // Estimar total: se carregou o limite completo, provavelmente há mais
      const estimatedTotal = hasMore
        ? appointments.length * 2 // Estimativa conservadora
        : appointments.length; // Se não completou o limite, é o total

      set({
        appointments,
        lastVisibleDoc: lastVisible,
        hasMoreData: hasMore,
        estimatedTotal,
        loading: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Erro ao carregar agendamentos recentes';

      console.error('Erro ao buscar agendamentos recentes:', error);
      set({
        loading: false,
        error: errorMessage,
        hasMoreData: false
      });
    }
  },

  // Carrega mais agendamentos (paginação incremental)
  fetchMoreAppointments: async (limitCount: number) => {
    const { lastVisibleDoc: lastDoc, hasMoreData, appointments: currentAppointments } = get();

    if (!hasMoreData || !lastDoc) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const colRef = appointmentsService['getCollectionRef']();

      const q = query(
        colRef,
        orderBy('date', 'desc'),
        orderBy('startTime', 'desc'),
        startAfter(lastDoc),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const newAppointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Appointment[];

      const lastVisible = snapshot.docs[snapshot.docs.length - 1] || lastDoc;
      const hasMore = snapshot.docs.length === limitCount;

      const totalLoaded = currentAppointments.length + newAppointments.length;

      // Atualizar estimativa: se ainda há mais, estimar baseado no padrão de crescimento
      const estimatedTotal = hasMore
        ? Math.ceil(totalLoaded * 1.5) // Estimativa progressiva
        : totalLoaded; // Se não há mais, este é o total exato

      set((state) => ({
        appointments: [...state.appointments, ...newAppointments],
        lastVisibleDoc: lastVisible,
        hasMoreData: hasMore,
        estimatedTotal,
        loading: false,
        error: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Erro ao carregar mais agendamentos';

      console.error('Erro ao buscar mais agendamentos:', error);
      set({
        loading: false,
        error: errorMessage
      });
    }
  },

  // Busca agendamentos de uma data específica
  fetchAppointmentsByDate: async (date: string) => {
    set({ loading: true, error: null });

    try {
      const appointments = await appointmentsService.getAll([
        where('date', '==', date),
        orderBy('startTime', 'asc')
      ]);

      set({
        appointments,
        loading: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Erro ao carregar agendamentos da data';

      console.error('Erro ao buscar agendamentos por data:', error);
      set({
        loading: false,
        error: errorMessage
      });
    }
  },

  // Busca próximos agendamentos (hoje e futuros com limite de segurança)
  fetchUpcoming: async () => {
    set({ loading: true, error: null });

    try {
      const today = new Date().toISOString().split('T')[0];

      const appointments = await appointmentsService.getAll([
        where('date', '>=', today),
        orderBy('date', 'asc'),
        orderBy('startTime', 'asc')
      ], 50); // Limite de segurança para upcoming

      set({
        appointments,
        loading: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Erro ao carregar próximos agendamentos';

      console.error('Erro ao buscar próximos agendamentos:', error);
      set({
        loading: false,
        error: errorMessage
      });
    }
  },

  // Cria um novo agendamento
  createAppointment: async (data: CreateAppointmentData) => {
    set({ loading: true, error: null });

    try {
      // Validações
      if (!data.clientName || !data.date || !data.startTime) {
        throw new Error('Cliente, data e horário são obrigatórios');
      }

      if (!data.services || data.services.length === 0) {
        throw new Error('Selecione pelo menos um serviço');
      }

      if (data.duration && data.duration <= 0) {
        throw new Error('Duração deve ser maior que zero');
      }

      // Cria agendamento no Firestore
      const id = await appointmentsService.create({
        ...data,
        status: data.status || AppointmentStatus.Pending,
      });

      // Atualiza estado local
      const newAppointment: Appointment = {
        id,
        ...data,
        status: data.status || AppointmentStatus.Pending,
      };

      set((state) => ({
        appointments: [...state.appointments, newAppointment].sort((a, b) => {
          // Ordena por data e depois por horário
          if (a.date === b.date) {
            return a.startTime.localeCompare(b.startTime);
          }
          return b.date.localeCompare(a.date);
        }),
        loading: false,
        error: null,
      }));

      return id;
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Erro ao criar agendamento';

      console.error('Erro ao criar agendamento:', error);
      set({
        loading: false,
        error: errorMessage
      });

      throw error;
    }
  },

  // Atualiza um agendamento existente
  updateAppointment: async (id: string, data: UpdateAppointmentData) => {
    set({ loading: true, error: null });

    try {
      // Valida se agendamento existe
      const appointment = get().appointments.find(a => a.id === id);
      if (!appointment) {
        throw new Error('Agendamento não encontrado');
      }

      // Validações
      if (data.duration !== undefined && data.duration <= 0) {
        throw new Error('Duração deve ser maior que zero');
      }

      if (data.services !== undefined && data.services.length === 0) {
        throw new Error('Selecione pelo menos um serviço');
      }

      // Atualiza no Firestore
      await appointmentsService.update(id, data);

      // Atualiza estado local
      set((state) => ({
        appointments: state.appointments
          .map(a => a.id === id ? { ...a, ...data } : a)
          .sort((a, b) => {
            if (a.date === b.date) {
              return a.startTime.localeCompare(b.startTime);
            }
            return b.date.localeCompare(a.date);
          }),
        loading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Erro ao atualizar agendamento';

      console.error('Erro ao atualizar agendamento:', error);
      set({
        loading: false,
        error: errorMessage
      });

      throw error;
    }
  },

  // Remove um agendamento
  deleteAppointment: async (id: string) => {
    set({ loading: true, error: null });

    try {
      // Valida se agendamento existe
      const appointment = get().appointments.find(a => a.id === id);
      if (!appointment) {
        throw new Error('Agendamento não encontrado');
      }

      // Remove do Firestore
      await appointmentsService.delete(id);

      // Remove do estado local
      set((state) => ({
        appointments: state.appointments.filter(a => a.id !== id),
        loading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Erro ao excluir agendamento';

      console.error('Erro ao excluir agendamento:', error);
      set({
        loading: false,
        error: errorMessage
      });

      throw error;
    }
  },

  // Atualiza apenas o status de um agendamento (helper convenience)
  updateStatus: async (id: string, status: AppointmentStatus) => {
    try {
      const appointment = get().appointments.find(a => a.id === id);
      if (!appointment) {
        throw new Error('Agendamento não encontrado');
      }

      // Atualiza o status
      await get().updateAppointment(id, { status });

      // Se status muda para COMPLETED, atualiza dados do cliente e cria transação
      if (status === AppointmentStatus.Completed) {
        try {
          // 1. Atualiza estatísticas do cliente
          const { useClientsStore } = await import('./clients.store');
          const clientsStore = useClientsStore.getState();

          // Busca cliente por telefone (identificador único mais confiável)
          const existingClient = clientsStore.clients.find(
            (c) => c.phone === appointment.clientPhone
          );

          if (existingClient) {
            // Cliente já existe: atualiza estatísticas
            const newVisits = existingClient.visits + 1;
            const newSpent = existingClient.spent + (appointment.price || 0);
            const lastVisit = appointment.date;

            await clientsStore.updateClient(existingClient.id, {
              visits: newVisits,
              spent: newSpent,
              lastVisit,
            });
          } else {
            // Cliente não existe: cria novo registro
            await clientsStore.createClient({
              name: appointment.clientName,
              phone: appointment.clientPhone,
              email: `${appointment.clientPhone.replace(/\D/g, '')}@temp.com`, // Email temporário
              notes: '', // Notas vazias
              visits: 1,
              spent: appointment.price || 0,
              lastVisit: appointment.date,
            });
          }
        } catch (clientError) {
          console.warn('Aviso: Erro ao atualizar cliente:', clientError);
        }

        // 2. Cria transação financeira se há preço
        if (appointment.price && appointment.price > 0) {
          try {
            // Import dinâmico do financial store para evitar circular dependency
            const { useFinancialStore } = await import('./financial.store');
            const financialStore = useFinancialStore.getState();

            // Usa data/hora do próprio agendamento quando possível
            const dateStr = appointment.date;
            const timeStr = appointment.startTime;
            const category = appointment.services.length > 0 ? appointment.services.join(' + ') : 'Serviços';

            // Tenta inferir método de pagamento a partir da store da barbearia
            let paymentMethod = 'Não informado';
            try {
              const { useBarbershopStore } = await import('./barbershop.store');
              const barbershopState = useBarbershopStore.getState();
              const defaultPaymentMethod = barbershopState.shopInfo?.defaultPaymentMethod;
              const primaryMethod = barbershopState.paymentMethods?.[0];
              paymentMethod = defaultPaymentMethod || primaryMethod || paymentMethod;
            } catch (barbershopError) {
              console.warn('Aviso: não foi possível inferir método de pagamento padrão', barbershopError);
            }

            // Evita duplicar transações do mesmo agendamento
            const existing = financialStore.transactions.find(
              (transaction) =>
                transaction.referenceId === appointment.id &&
                transaction.referenceType === 'appointment'
            );

            if (!existing) {
              await financialStore.createTransaction({
                type: TransactionType.Income,
                description: `${appointment.clientName} - ${category}`,
                category,
                amount: appointment.price,
                date: dateStr,
                time: timeStr,
                paymentMethod,
                referenceId: appointment.id,
                referenceType: 'appointment'
              });
            }
          } catch (err) {
            // Log do erro mas não falha a operação principal
            console.warn('Aviso: Erro ao criar auto-transação:', err);
          }
        }
      }
    } catch (error) {
      // Erro já tratado no updateAppointment
      throw error;
    }
  },

  // Ações de controle
  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error, loading: false }),

  clearError: () => set({ error: null }),
}));
