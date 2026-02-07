import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Appointment, AppointmentStatus, NotificationType, OccupiedSlot } from '@/types';

export const publicAppointmentService = {
  /**
   * @deprecated Use getOccupiedSlots instead - this method exposes PII
   * Kept for reference only - DO NOT USE IN PRODUCTION
   */
  async getAppointmentsByDate(ownerId: string, date: string): Promise<Appointment[]> {
    console.warn('DEPRECATED: getAppointmentsByDate exposes PII. Use getOccupiedSlots instead.');
    try {
      const colRef = collection(db, 'barbershops', ownerId, 'appointments');
      const q = query(
        colRef,
        where('date', '==', date),
        where('status', '!=', AppointmentStatus.Cancelled)
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Appointment[];
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      throw error;
    }
  },

  /**
   * Gets occupied time slots for a date without exposing client data
   * LGPD/GDPR compliant - returns only time/duration/barberName
   */
  async getOccupiedSlots(ownerId: string, date: string): Promise<OccupiedSlot[]> {
    try {
      const colRef = collection(db, 'barbershops', ownerId, 'availability');
      const q = query(colRef, where('date', '==', date));

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          time: data.time,
          duration: data.duration,
          barberName: data.barberName || undefined,
        };
      });
    } catch (error) {
      console.error('Erro ao buscar slots ocupados:', error);
      throw error;
    }
  },

  /**
   * Cria um agendamento público
   */
  async createAppointment(ownerId: string, data: Omit<Appointment, 'id' | 'createdAt' | 'status'>): Promise<string> {
    try {
      const colRef = collection(db, 'barbershops', ownerId, 'appointments');

      const docRef = await addDoc(colRef, {
        ...data,
        status: AppointmentStatus.Confirmed,
        createdAt: serverTimestamp(),
        // Campos extras para controle
        origin: 'public_site'
      });

      // Create availability slot for public booking sync
      try {
        await addDoc(collection(db, 'barbershops', ownerId, 'availability'), {
          date: data.date,
          time: data.startTime,
          duration: data.duration,
          barberName: data.barberName || null,
          appointmentId: docRef.id,
          createdAt: serverTimestamp(),
        });
      } catch (availError) {
        console.error('Falha ao criar slot de disponibilidade pública:', availError);
        // Don't fail the booking if availability sync fails
      }

      // Cria notificação para o barbeiro
      await this.createNotification(ownerId, data);

      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      throw error;
    }
  },

  /**
   * Helper privado para notificar o barbeiro
   */
  async createNotification(ownerId: string, appointment: any) {
    try {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const [year, month, day] = appointment.date.split('-');
      const formattedDate = `${day}/${month}`;

      await addDoc(collection(db, 'barbershops', ownerId, 'notifications'), {
        title: 'Novo Agendamento pelo Site',
        description: `Cliente ${appointment.clientName} agendou para ${formattedDate} às ${appointment.startTime}`,
        type: NotificationType.NewAppointment,
        time,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Erro ao notificar barbeiro:', error);
      // Não falha o agendamento se a notificação falhar
    }
  }
};
