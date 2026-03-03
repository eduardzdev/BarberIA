/**
 * NotificationsStore - Store Zustand para notificações em tempo real
 * 
 * Gerencia notificações com:
 * - Real-time updates via Firestore onSnapshot
 * - Marcar como lido/não lido
 * - Filtros por tipo e status
 * - Contagem de não lidas
 * - Exclusão de notificações
 * 
 * Nota: Este store usa onSnapshot para atualizações em tempo real,
 * diferente dos outros stores que usam queries manuais.
 * 
 * Referências:
 * - ANALISE_COMPLETA_UI.md - Seção 3 (Header com sino de notificações)
 * - ESTADOS_ESPECIAIS.md - Seção "Notificações"
 * 
 * Exemplo de uso:
 * ```typescript
 * const { notifications, markAsRead, unreadCount } = useNotificationsStore();
 * 
 * // Marcar como lida
 * await markAsRead(notification.id);
 * 
 * // Contagem não lidas
 * \`Você tem ${unreadCount} notificações não lidas\`);
 * ```
 */

import { create } from 'zustand';
import { Notification, NotificationType } from '@/types';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Unsubscribe,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuthStore } from './auth.store';

// Types para criação
export type CreateNotificationData = Omit<Notification, 'id' | 'time'>;

interface NotificationsState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  unreadCount: number;

  // Actions
  startListening: () => void;
  stopListening: () => void;
  createNotification: (data: CreateNotificationData) => Promise<string>;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  clearError: () => void;
}

/**
 * Helper para obter referência da coleção de notificações
 */
function getNotificationsCollectionRef() {
  const userId = useAuthStore.getState().user?.uid;
  if (!userId) {
    throw new Error('Usuário não autenticado');
  }
  return collection(db, 'barbershops', userId, 'notifications');
}

let unsubscribe: Unsubscribe | null = null;

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,
  unreadCount: 0,

  /**
   * Inicia listener em tempo real
   */
  startListening: () => {
    // Se já está ouvindo, não faz nada
    if (unsubscribe) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const colRef = getNotificationsCollectionRef();
      const q = query(colRef, orderBy('createdAt', 'desc'));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const notifications: Notification[] = [];
          snapshot.forEach((doc) => {
            notifications.push({
              id: doc.id,
              ...doc.data(),
            } as Notification);
          });

          const unreadCount = notifications.filter(n => !n.read).length;

          set({
            notifications,
            unreadCount,
            loading: false
          });
        },
        (error) => {
          console.error('Erro no listener de notificações:', error);
          set({
            error: 'Erro ao ouvir notificações',
            loading: false
          });
        }
      );
    } catch (err) {
      console.error('Erro ao iniciar listener:', err);
      set({
        error: 'Erro ao iniciar listener',
        loading: false
      });
    }
  },

  /**
   * Para listener em tempo real
   */
  stopListening: () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  },

  /**
   * Cria uma nova notificação
   */
  createNotification: async (data: CreateNotificationData) => {
    try {
      if (!data.title.trim()) {
        throw new Error('Título é obrigatório');
      }

      const colRef = getNotificationsCollectionRef();
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const docRef = await addDoc(colRef, {
        ...data,
        time,
        read: false,
        createdAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (err) {
      console.error('Erro ao criar notificação:', err);
      const message = err instanceof Error ? err.message : 'Erro ao criar notificação';
      set({ error: message });
      throw err;
    }
  },

  /**
   * Marca notificação como lida
   */
  markAsRead: async (id: string) => {
    try {
      const userId = useAuthStore.getState().user?.uid;
      if (!userId) throw new Error('Usuário não autenticado');

      const docRef = doc(db, 'barbershops', userId, 'notifications', id);
      await updateDoc(docRef, { read: true });
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
      set({ error: 'Erro ao marcar notificação' });
      throw err;
    }
  },

  /**
   * Marca notificação como não lida
   */
  markAsUnread: async (id: string) => {
    try {
      const userId = useAuthStore.getState().user?.uid;
      if (!userId) throw new Error('Usuário não autenticado');

      const docRef = doc(db, 'barbershops', userId, 'notifications', id);
      await updateDoc(docRef, { read: false });
    } catch (err) {
      console.error('Erro ao marcar como não lida:', err);
      set({ error: 'Erro ao marcar notificação' });
      throw err;
    }
  },

  /**
   * Marca todas como lidas
   */
  markAllAsRead: async () => {
    try {
      const unreadNotifications = get().notifications.filter(n => !n.read);

      const promises = unreadNotifications.map(n =>
        get().markAsRead(n.id)
      );

      await Promise.all(promises);
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err);
      set({ error: 'Erro ao marcar todas notificações' });
      throw err;
    }
  },

  /**
   * Remove uma notificação
   */
  deleteNotification: async (id: string) => {
    try {
      const userId = useAuthStore.getState().user?.uid;
      if (!userId) throw new Error('Usuário não autenticado');

      const docRef = doc(db, 'barbershops', userId, 'notifications', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Erro ao remover notificação:', err);
      set({ error: 'Erro ao remover notificação' });
      throw err;
    }
  },

  /**
   * Remove todas as notificações
   */
  clearAll: async () => {
    try {
      const notifications = get().notifications;

      const promises = notifications.map(n =>
        get().deleteNotification(n.id)
      );

      await Promise.all(promises);
    } catch (err) {
      console.error('Erro ao limpar notificações:', err);
      set({ error: 'Erro ao limpar notificações' });
      throw err;
    }
  },

  /**
   * Limpa mensagem de erro
   */
  clearError: () => {
    set({ error: null });
  },
}));
