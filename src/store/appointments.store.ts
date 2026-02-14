/**
 * AppointmentsStore - Store global de agendamentos usando Zustand
 * 
 * Gerencia todos os agendamentos da barbearia com:
 * - Cache inteligente com validação de "staleness" (1 minuto)
 * - Persistência em localStorage para sobreviver a reloads
 * - Listener em tempo real para agendamentos de HOJE
 * 
 * Estado:
 * - appointments: Lista de agendamentos
 * - loading: Estado de carregamento
 * - error: Mensagem de erro
 * - dataLoaded/lastFetchedAt/fetchMode: Metadados de cache
 * - todayAppointments: Agendamentos de hoje (real-time)
 * 
 * Ações:
 * - fetchAppointments: Busca todos os agendamentos
 * - fetchUpcoming: Busca próximos agendamentos (hoje e futuros)
 * - subscribeTodayAppointments: Inicia listener em tempo real para hoje
 * - unsubscribeTodayAppointments: Para o listener
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Appointment, AppointmentStatus, TransactionType } from '@/types';
import { BaseService } from '@/services/base.service';
import {
  where,
  orderBy,
  query,
  getDocs,
  limit,
  startAfter,
  DocumentSnapshot,
  onSnapshot,
  Unsubscribe,
  collection
} from 'firebase/firestore';
import { db, auth } from '@/firebase';
import {
  shouldRefetch,
  markAsFetched,
  resetCache,
  createSafeRehydrateHandler,
  PERSIST_VERSION,
  CacheableStateWithMode
} from '@/lib/store-helpers';

// Instância do serviço de Firestore
const appointmentsService = new BaseService<Appointment>('appointments');

// Tipos para criação/atualização (sem ID)
export type CreateAppointmentData = Omit<Appointment, 'id'>;
export type UpdateAppointmentData = Partial<Omit<Appointment, 'id'>>;

interface AppointmentsState extends CacheableStateWithMode {
  // Estado
  appointments: Appointment[];
  todayAppointments: Appointment[];
  loading: boolean;
  error: string | null;
  hasMoreData: boolean;
  lastVisibleDoc: DocumentSnapshot | null;
  estimatedTotal: number;

  // Real-time listener
  _todayUnsubscribe: Unsubscribe | null;

  // Ações de dados
  fetchAppointments: (forceRefresh?: boolean) => Promise<void>;
  fetchAppointmentsByDate: (date: string, forceRefresh?: boolean) => Promise<void>;
  fetchUpcoming: (forceRefresh?: boolean) => Promise<void>;
  createAppointment: (data: CreateAppointmentData) => Promise<string>;
  updateAppointment: (id: string, data: UpdateAppointmentData) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  updateStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  fetchRecentAppointments: (limitCount: number, forceRefresh?: boolean) => Promise<void>;
  fetchMoreAppointments: (limitCount: number) => Promise<void>;

  // Real-time
  subscribeTodayAppointments: () => void;
  unsubscribeTodayAppointments: () => void;

  // Ações de controle
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  clearCache: () => void;
}

export const useAppointmentsStore = create<AppointmentsState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      appointments: [],
      todayAppointments: [],
      loading: false,
      error: null,
      hasMoreData: true,
      lastVisibleDoc: null,
      estimatedTotal: 0,

      // Cache state
      dataLoaded: false,
      lastFetchedAt: null,
      fetchMode: null,

      // Listener reference (não persistido)
      _todayUnsubscribe: null,

      // Busca todos os agendamentos (com limite de segurança)
      fetchAppointments: async (forceRefresh = false) => {
        const state = get();

        // Check cache validity
        if (!shouldRefetch(state, 'all', forceRefresh)) {
          return;
        }

        set({ loading: true, error: null });

        try {
          const appointments = await appointmentsService.getAll([
            orderBy('date', 'desc'),
            orderBy('startTime', 'asc')
          ], 200); // Limite de segurança

          set({
            appointments,
            loading: false,
            error: null,
            ...markAsFetched('all'),
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
      fetchRecentAppointments: async (limitCount: number, forceRefresh = false) => {
        const state = get();

        if (!shouldRefetch(state, 'recent', forceRefresh)) {
          return;
        }

        set({ loading: true, error: null, hasMoreData: true, lastVisibleDoc: null });

        try {
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

          const estimatedTotal = hasMore
            ? appointments.length * 2
            : appointments.length;

          set({
            appointments,
            lastVisibleDoc: lastVisible,
            hasMoreData: hasMore,
            estimatedTotal,
            loading: false,
            error: null,
            ...markAsFetched('recent'),
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

          const estimatedTotal = hasMore
            ? Math.ceil(totalLoaded * 1.5)
            : totalLoaded;

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
      fetchAppointmentsByDate: async (date: string, forceRefresh = false) => {
        const state = get();

        if (!shouldRefetch(state, `date:${date}`, forceRefresh)) {
          return;
        }

        set({ loading: true, error: null });

        try {
          const appointments = await appointmentsService.getAll([
            where('date', '==', date),
            orderBy('startTime', 'asc')
          ]);

          set({
            appointments,
            loading: false,
            error: null,
            ...markAsFetched(`date:${date}`),
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
      fetchUpcoming: async (forceRefresh = false) => {
        const state = get();

        if (!shouldRefetch(state, 'upcoming', forceRefresh)) {
          return;
        }

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
            error: null,
            ...markAsFetched('upcoming'),
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

      // ============================================
      // REAL-TIME LISTENER - AGENDAMENTOS DE HOJE
      // ============================================

      subscribeTodayAppointments: () => {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          console.warn('subscribeTodayAppointments: Usuário não autenticado');
          return;
        }

        // Evitar múltiplas subscrições
        const existing = get()._todayUnsubscribe;
        if (existing) {
          return;
        }

        const today = new Date().toISOString().split('T')[0];
        const colRef = collection(db, 'barbershops', userId, 'appointments');
        const q = query(
          colRef,
          where('date', '==', today),
          orderBy('startTime', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const todayAppointments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Appointment[];

          set({ todayAppointments });
        }, (error) => {
          console.error('Erro no listener de agendamentos de hoje:', error);
        });

        set({ _todayUnsubscribe: unsubscribe });
      },

      unsubscribeTodayAppointments: () => {
        const unsubscribe = get()._todayUnsubscribe;
        if (unsubscribe) {
          unsubscribe();
          set({ _todayUnsubscribe: null });
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
              if (a.date === b.date) {
                return a.startTime.localeCompare(b.startTime);
              }
              return b.date.localeCompare(a.date);
            }),
            loading: false,
            error: null,
            lastFetchedAt: Date.now(),
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
            lastFetchedAt: Date.now(),
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
            lastFetchedAt: Date.now(),
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

              const existingClient = clientsStore.clients.find(
                (c) => c.phone === appointment.clientPhone
              );

              if (existingClient) {
                const newVisits = existingClient.visits + 1;
                const newSpent = existingClient.spent + (appointment.price || 0);
                const lastVisit = appointment.date;

                await clientsStore.updateClient(existingClient.id, {
                  visits: newVisits,
                  spent: newSpent,
                  lastVisit,
                });
              } else {
                await clientsStore.createClient({
                  name: appointment.clientName,
                  phone: appointment.clientPhone,
                  email: `${appointment.clientPhone.replace(/\D/g, '')}@temp.com`,
                  notes: '',
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
                const { useFinancialStore } = await import('./financial.store');
                const financialStore = useFinancialStore.getState();

                const dateStr = appointment.date;
                const timeStr = appointment.startTime;
                const category = appointment.services.length > 0 ? appointment.services.join(' + ') : 'Serviços';

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
                console.warn('Aviso: Erro ao criar auto-transação:', err);
              }
            }
          }
        } catch (error) {
          throw error;
        }
      },

      // Ações de controle
      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error, loading: false }),

      clearError: () => set({ error: null }),

      clearCache: () => set({
        ...resetCache(),
        appointments: [],
        todayAppointments: [],
      }),
    }),
    {
      name: 'barberia-appointments',
      storage: createJSONStorage(() => localStorage),
      version: PERSIST_VERSION,
      onRehydrateStorage: () => createSafeRehydrateHandler('appointments'),
      partialize: (state) => ({
        appointments: state.appointments,
        dataLoaded: state.dataLoaded,
        lastFetchedAt: state.lastFetchedAt,
        fetchMode: state.fetchMode,
        estimatedTotal: state.estimatedTotal,
        // Não persistimos: loading, error, lastVisibleDoc, todayAppointments, _todayUnsubscribe
      }),
    }
  )
);
