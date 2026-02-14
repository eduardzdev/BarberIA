/**
 * BarbershopStore - Store Zustand para configurações da barbearia
 * 
 * Gerencia configurações globais:
 * - Profissionais (barbeiros)
 * - Horário de funcionamento
 * - Métodos de pagamento aceitos
 * - Informações da barbearia (nome, telefone, endereço)
 * - Integração com Firebase Firestore
 * 
 * Nota: Este store usa um documento único 'settings' para manter
 * todas as configurações centralizadas.
 * 
 * Referências:
 * - ANALISE_COMPLETA_UI.md - Seção 10 (Configurações)
 * - DESCRICAO_FEATURES.md - Seção 7 (Perfil e Configurações)
 * 
 * Exemplo de uso:
 * ```typescript
 * const { barbers, addBarber, updateBusinessHours } = useBarbershopStore();
 * 
 * // Adicionar profissional
 * await addBarber({ name: 'João Silva', avatarUrl: '...' });
 * 
 * // Atualizar horário
 * await updateBusinessHours({ 
 *   opening: '09:00', 
 *   closing: '18:00' 
 * });
 * ```
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Barber } from '@/types';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuthStore } from './auth.store';
import { STALE_THRESHOLD_MS, createSafeRehydrateHandler, PERSIST_VERSION } from '@/lib/store-helpers';

// Estrutura de configurações
export interface DaySchedule {
  dayOfWeek: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
  hasLunchBreak: boolean;
  lunchStart: string;
  lunchDuration: number;
}

export interface BarbershopSettings {
  // Profissionais
  barbers: Barber[];

  // Horário de funcionamento (agora detalhado por dia)
  businessHours: {
    // Mantendo retrocompatibilidade opcional ou migrando estrutura
    schedule: DaySchedule[];
  };

  // Métodos de pagamento
  paymentMethods: string[];

  // Informações da barbearia
  shopInfo: {
    name: string;
    phone: string;
    address: string;
    description?: string;
    defaultPaymentMethod?: string;
    // Profile fields
    username?: string;
    coverImageUrl?: string;
    logoUrl?: string;
    city?: string;
    state?: string;
    // Social media
    instagram?: string;
    facebook?: string;
    website?: string;
    // Website Settings
    slug?: string;
    theme?: {
      primaryColor: string;
      secondaryColor: string;
      font: string;
      mode?: 'light' | 'dark';
    };
    layout?: {
      showHero: boolean;
      heroTitle: string;
      heroSubtitle?: string;
      heroImage?: string;
      showAbout: boolean;
      aboutText?: string;
      aboutImage?: string;
    };
    // Onboarding
    onboardingCompleted?: boolean;
  };
}

// Valores padrão
const defaultSchedule: DaySchedule[] = [
  { dayOfWeek: 0, isOpen: false, startTime: '09:00', endTime: '13:00', hasLunchBreak: false, lunchStart: '12:00', lunchDuration: 60 }, // Domingo
  { dayOfWeek: 1, isOpen: true, startTime: '09:00', endTime: '19:00', hasLunchBreak: true, lunchStart: '12:00', lunchDuration: 60 }, // Segunda
  { dayOfWeek: 2, isOpen: true, startTime: '09:00', endTime: '19:00', hasLunchBreak: true, lunchStart: '12:00', lunchDuration: 60 }, // Terça
  { dayOfWeek: 3, isOpen: true, startTime: '09:00', endTime: '19:00', hasLunchBreak: true, lunchStart: '12:00', lunchDuration: 60 }, // Quarta
  { dayOfWeek: 4, isOpen: true, startTime: '09:00', endTime: '19:00', hasLunchBreak: true, lunchStart: '12:00', lunchDuration: 60 }, // Quinta
  { dayOfWeek: 5, isOpen: true, startTime: '09:00', endTime: '19:00', hasLunchBreak: true, lunchStart: '12:00', lunchDuration: 60 }, // Sexta
  { dayOfWeek: 6, isOpen: true, startTime: '09:00', endTime: '18:00', hasLunchBreak: false, lunchStart: '12:00', lunchDuration: 60 }, // Sábado
];

const defaultSettings: BarbershopSettings = {
  barbers: [],
  businessHours: {
    schedule: defaultSchedule
  },
  paymentMethods: ['Dinheiro', 'Cartão', 'Pix'],
  shopInfo: {
    name: 'Minha Barbearia',
    phone: '',
    address: '',
    description: '',
    defaultPaymentMethod: 'Dinheiro',
  },
};

interface BarbershopState extends BarbershopSettings {
  loading: boolean;
  settingsLoaded: boolean;
  lastFetchedAt: number | null;
  error: string | null;

  // Actions
  fetchSettings: (forceRefresh?: boolean) => Promise<void>;
  updateSettings: (settings: Partial<BarbershopSettings>) => Promise<void>;

  // Barbers
  addBarber: (barber: Omit<Barber, 'id'>) => Promise<string>;
  updateBarber: (id: string, data: Partial<Omit<Barber, 'id'>>) => Promise<void>;
  removeBarber: (id: string) => Promise<void>;

  // Business Hours
  updateBusinessHours: (hours: Partial<BarbershopSettings['businessHours']>) => Promise<void>;

  // Payment Methods
  addPaymentMethod: (method: string) => Promise<void>;
  removePaymentMethod: (method: string) => Promise<void>;

  // Shop Info
  updateShopInfo: (info: Partial<BarbershopSettings['shopInfo']>) => Promise<void>;

  clearError: () => void;
  clearCache: () => void;
}

/**
 * Helper para obter referência do documento de settings
 */
function getSettingsDocRef() {
  const userId = useAuthStore.getState().user?.uid;
  if (!userId) {
    throw new Error('Usuário não autenticado');
  }
  return doc(db, 'barbershops', userId, 'settings', 'config');
}

export const useBarbershopStore = create<BarbershopState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      ...defaultSettings,
      loading: false,
      settingsLoaded: false,
      lastFetchedAt: null,
      error: null,

      /**
       * Busca configurações do Firestore
       * Usa staleness de 1 minuto para evitar fetches desnecessários
       */
      fetchSettings: async (forceRefresh = false) => {
        const state = get();

        // Check cache validity (usa STALE_THRESHOLD_MS compartilhado do store-helpers)
        if (!forceRefresh && state.settingsLoaded && state.lastFetchedAt) {
          if (Date.now() - state.lastFetchedAt < STALE_THRESHOLD_MS) {
            return;
          }
        }

        set({ loading: true, error: null });
        try {
          const docRef = getSettingsDocRef();
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data() as BarbershopSettings;
            set({
              ...data,
              loading: false,
              settingsLoaded: true,
              lastFetchedAt: Date.now(),
            });
          } else {
            // Se não existe, criar com valores padrão
            await setDoc(docRef, defaultSettings);
            set({
              ...defaultSettings,
              loading: false,
              settingsLoaded: true,
              lastFetchedAt: Date.now(),
            });
          }
        } catch (err) {
          console.error('Erro ao buscar configurações:', err);
          set({
            error: 'Erro ao carregar configurações',
            loading: false
          });
        }
      },

      /**
       * Atualiza configurações completas
       */
      updateSettings: async (settings: Partial<BarbershopSettings>) => {
        set({ loading: true, error: null });
        try {
          const docRef = getSettingsDocRef();
          // Use setDoc with merge to create or update the document
          await setDoc(docRef, settings, { merge: true });

          set((state) => ({
            ...state,
            ...settings,
            loading: false,
            lastFetchedAt: Date.now(),
          }));
        } catch (err) {
          console.error('Erro ao atualizar configurações:', err);
          set({
            error: 'Erro ao salvar configurações',
            loading: false
          });
          throw err;
        }
      },

      /**
       * Adiciona um profissional
       */
      addBarber: async (barber: Omit<Barber, 'id'>) => {
        set({ loading: true, error: null });
        try {
          if (!barber.name.trim()) {
            throw new Error('Nome é obrigatório');
          }

          const newBarber: Barber = {
            ...barber,
            id: `barber-${Date.now()}`,
          };

          const updatedBarbers = [...get().barbers, newBarber];
          await get().updateSettings({ barbers: updatedBarbers });

          return newBarber.id;
        } catch (err) {
          console.error('Erro ao adicionar profissional:', err);
          const message = err instanceof Error ? err.message : 'Erro ao adicionar profissional';
          set({ error: message, loading: false });
          throw err;
        }
      },

      /**
       * Atualiza um profissional
       */
      updateBarber: async (id: string, data: Partial<Omit<Barber, 'id'>>) => {
        set({ loading: true, error: null });
        try {
          const current = get().barbers.find(b => b.id === id);
          if (!current) {
            throw new Error('Profissional não encontrado');
          }

          if (data.name !== undefined && !data.name.trim()) {
            throw new Error('Nome não pode ser vazio');
          }

          const updatedBarbers = get().barbers.map(b =>
            b.id === id ? { ...b, ...data } : b
          );

          await get().updateSettings({ barbers: updatedBarbers });
        } catch (err) {
          console.error('Erro ao atualizar profissional:', err);
          const message = err instanceof Error ? err.message : 'Erro ao atualizar profissional';
          set({ error: message, loading: false });
          throw err;
        }
      },

      /**
       * Remove um profissional
       */
      removeBarber: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const updatedBarbers = get().barbers.filter(b => b.id !== id);
          await get().updateSettings({ barbers: updatedBarbers });
        } catch (err) {
          console.error('Erro ao remover profissional:', err);
          set({
            error: 'Erro ao remover profissional',
            loading: false
          });
          throw err;
        }
      },

      /**
       * Atualiza horário de funcionamento
       */
      updateBusinessHours: async (hours: Partial<BarbershopSettings['businessHours']>) => {
        set({ loading: true, error: null });
        try {
          const updatedBusinessHours = {
            ...get().businessHours,
            ...hours,
          };

          // Persistir no Firestore (o merge do setDoc cuidará de atualizar apenas o campo businessHours)
          await get().updateSettings({ businessHours: updatedBusinessHours });
        } catch (err) {
          console.error('Erro ao atualizar horário:', err);
          const message = err instanceof Error ? err.message : 'Erro ao atualizar horário';
          set({ error: message, loading: false });
          throw err;
        }
      },

      /**
       * Adiciona método de pagamento
       */
      addPaymentMethod: async (method: string) => {
        set({ loading: true, error: null });
        try {
          if (!method.trim()) {
            throw new Error('Método de pagamento não pode ser vazio');
          }

          const current = get().paymentMethods;
          if (current.includes(method)) {
            throw new Error('Método já existe');
          }

          const updated = [...current, method];
          await get().updateSettings({ paymentMethods: updated });
        } catch (err) {
          console.error('Erro ao adicionar método de pagamento:', err);
          const message = err instanceof Error ? err.message : 'Erro ao adicionar método';
          set({ error: message, loading: false });
          throw err;
        }
      },

      /**
       * Remove método de pagamento
       */
      removePaymentMethod: async (method: string) => {
        set({ loading: true, error: null });
        try {
          const updated = get().paymentMethods.filter(m => m !== method);
          await get().updateSettings({ paymentMethods: updated });
        } catch (err) {
          console.error('Erro ao remover método de pagamento:', err);
          set({
            error: 'Erro ao remover método',
            loading: false
          });
          throw err;
        }
      },

      /**
       * Atualiza informações da barbearia
       */
      updateShopInfo: async (info: Partial<BarbershopSettings['shopInfo']>) => {
        set({ loading: true, error: null });
        try {
          // Filtra valores undefined pois Firestore não aceita
          const filteredInfo = Object.fromEntries(
            Object.entries(info).filter(([_, value]) => value !== undefined)
          );

          const updatedInfo = {
            ...get().shopInfo,
            ...filteredInfo,
          };

          if (updatedInfo.name && !updatedInfo.name.trim()) {
            throw new Error('Nome não pode ser vazio');
          }

          await get().updateSettings({ shopInfo: updatedInfo });
        } catch (err) {
          console.error('Erro ao atualizar informações:', err);
          const message = err instanceof Error ? err.message : 'Erro ao atualizar informações';
          set({ error: message, loading: false });
          throw err;
        }
      },

      /**
       * Limpa mensagem de erro
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Limpa cache para forçar refetch
       */
      clearCache: () => {
        set({
          ...defaultSettings,
          settingsLoaded: false,
          lastFetchedAt: null,
        });
      },
    }),
    {
      name: 'barberia-barbershop',
      storage: createJSONStorage(() => localStorage),
      version: PERSIST_VERSION,
      onRehydrateStorage: () => createSafeRehydrateHandler('barbershop'),
      partialize: (state) => ({
        barbers: state.barbers,
        businessHours: state.businessHours,
        paymentMethods: state.paymentMethods,
        shopInfo: state.shopInfo,
        settingsLoaded: state.settingsLoaded,
        lastFetchedAt: state.lastFetchedAt,
      }),
    }
  )
);
