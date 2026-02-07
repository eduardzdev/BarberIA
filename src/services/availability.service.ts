/**
 * AvailabilityService - Manages public availability slots
 * 
 * This service handles the sanitized availability collection that contains
 * ONLY time slot information without any client PII (LGPD/GDPR compliant).
 * 
 * The availability collection mirrors appointment times but is safe for
 * public read access on the booking page.
 */

import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    QueryConstraint
} from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { AvailabilitySlot, OccupiedSlot, AppointmentStatus } from '@/types';

export class AvailabilityService {

    /**
     * Creates an availability slot when an appointment is booked
     * Called internally after appointment creation
     */
    async createSlot(
        ownerId: string,
        data: {
            date: string;
            time: string;
            duration: number;
            barberName?: string;
            appointmentId: string;
        }
    ): Promise<string> {
        try {
            const colRef = collection(db, 'barbershops', ownerId, 'availability');

            const docRef = await addDoc(colRef, {
                date: data.date,
                time: data.time,
                duration: data.duration,
                barberName: data.barberName || null,
                appointmentId: data.appointmentId,
                createdAt: serverTimestamp(),
            });

            return docRef.id;
        } catch (error) {
            console.error('Erro ao criar slot de disponibilidade:', error);
            throw error;
        }
    }

    /**
     * Deletes an availability slot when an appointment is cancelled/deleted
     */
    async deleteSlotByAppointmentId(ownerId: string, appointmentId: string): Promise<void> {
        try {
            const colRef = collection(db, 'barbershops', ownerId, 'availability');
            const q = query(colRef, where('appointmentId', '==', appointmentId));
            const snapshot = await getDocs(q);

            const deletePromises = snapshot.docs.map(docSnap =>
                deleteDoc(doc(db, 'barbershops', ownerId, 'availability', docSnap.id))
            );

            await Promise.all(deletePromises);
        } catch (error) {
            console.error('Erro ao deletar slot de disponibilidade:', error);
            throw error;
        }
    }

    /**
     * Updates availability slot when appointment is rescheduled
     * Deletes old slot and creates new one
     */
    async updateSlot(
        ownerId: string,
        appointmentId: string,
        newData: {
            date: string;
            time: string;
            duration: number;
            barberName?: string;
        }
    ): Promise<void> {
        try {
            // Delete existing slot
            await this.deleteSlotByAppointmentId(ownerId, appointmentId);

            // Create new slot with updated data
            await this.createSlot(ownerId, {
                ...newData,
                appointmentId,
            });
        } catch (error) {
            console.error('Erro ao atualizar slot de disponibilidade:', error);
            throw error;
        }
    }

    /**
     * PUBLIC METHOD: Gets occupied time slots for a specific date
     * Returns ONLY time/duration/barberName - NO client data
     * Safe for unauthenticated public access
     */
    async getOccupiedSlots(ownerId: string, date: string): Promise<OccupiedSlot[]> {
        try {
            const colRef = collection(db, 'barbershops', ownerId, 'availability');
            const q = query(colRef, where('date', '==', date));

            const snapshot = await getDocs(q);

            return snapshot.docs.map(docSnap => {
                const data = docSnap.data();
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
    }
}

// Export singleton instance
export const availabilityService = new AvailabilityService();
