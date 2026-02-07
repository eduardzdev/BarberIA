/**
 * OnboardingService - Seed de dados iniciais para novos usuários
 * 
 * Cria automaticamente dados padrão para reduzir fricção:
 * - 1 Serviço exemplo: "Corte Masculino" R$35, 30min
 * - Settings com horários padrão: Seg-Sex 09-18h, Sab 09-14h
 * 
 * Este serviço é chamado automaticamente após o registro
 * de um novo usuário (ver useAuth.ts).
 * 
 * Referências:
 * - GEMINI.md - Seção "Onboarding SaaS"
 * - AuditoriaTecnica.md - Seção 3 "Onboarding Frio"
 */

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import type { Service } from '@/types';
import type { BarbershopSettings, DaySchedule } from '@/store/barbershop.store';

// Serviço padrão criado automaticamente
const DEFAULT_SERVICE: Omit<Service, 'id'> = {
    name: 'Corte Masculino',
    price: 35,
    duration: 30,
    active: true,
};

// Horários padrão: Seg-Sex 09-18h, Sab 09-14h, Dom fechado
const DEFAULT_SCHEDULE: DaySchedule[] = [
    { dayOfWeek: 0, isOpen: false, startTime: '09:00', endTime: '13:00', hasLunchBreak: false, lunchStart: '12:00', lunchDuration: 60 }, // Domingo
    { dayOfWeek: 1, isOpen: true, startTime: '09:00', endTime: '18:00', hasLunchBreak: true, lunchStart: '12:00', lunchDuration: 60 },  // Segunda
    { dayOfWeek: 2, isOpen: true, startTime: '09:00', endTime: '18:00', hasLunchBreak: true, lunchStart: '12:00', lunchDuration: 60 },  // Terça
    { dayOfWeek: 3, isOpen: true, startTime: '09:00', endTime: '18:00', hasLunchBreak: true, lunchStart: '12:00', lunchDuration: 60 },  // Quarta
    { dayOfWeek: 4, isOpen: true, startTime: '09:00', endTime: '18:00', hasLunchBreak: true, lunchStart: '12:00', lunchDuration: 60 },  // Quinta
    { dayOfWeek: 5, isOpen: true, startTime: '09:00', endTime: '18:00', hasLunchBreak: true, lunchStart: '12:00', lunchDuration: 60 },  // Sexta
    { dayOfWeek: 6, isOpen: true, startTime: '09:00', endTime: '14:00', hasLunchBreak: false, lunchStart: '12:00', lunchDuration: 60 }, // Sábado
];

// Settings padrão para novos usuários
const DEFAULT_SETTINGS: BarbershopSettings = {
    barbers: [],
    businessHours: {
        schedule: DEFAULT_SCHEDULE,
    },
    paymentMethods: ['Dinheiro', 'Cartão', 'Pix'],
    shopInfo: {
        name: '', // Será preenchido pelo onboarding modal
        phone: '',
        address: '',
        description: '',
        defaultPaymentMethod: 'Pix',
    },
};

/**
 * Verifica se o usuário já completou o onboarding
 */
export async function checkOnboardingCompleted(userId: string): Promise<boolean> {
    try {
        const metaRef = doc(db, 'barbershops', userId, 'meta', 'onboarding');
        const metaSnap = await getDoc(metaRef);

        if (metaSnap.exists()) {
            return metaSnap.data()?.completed === true;
        }

        return false;
    } catch (error) {
        console.error('Erro ao verificar onboarding:', error);
        return false;
    }
}

/**
 * Cria serviço padrão para novo usuário
 */
async function seedDefaultService(userId: string): Promise<string> {
    const serviceId = `service-${Date.now()}`;
    const serviceRef = doc(db, 'barbershops', userId, 'services', serviceId);

    await setDoc(serviceRef, {
        ...DEFAULT_SERVICE,
        id: serviceId,
        createdAt: new Date().toISOString(),
    });

    console.log('[Onboarding] Serviço padrão criado:', serviceId);
    return serviceId;
}

/**
 * Cria settings padrão para novo usuário
 */
async function seedDefaultSettings(userId: string): Promise<void> {
    const settingsRef = doc(db, 'barbershops', userId, 'settings', 'config');

    await setDoc(settingsRef, {
        ...DEFAULT_SETTINGS,
        createdAt: new Date().toISOString(),
    });

    console.log('[Onboarding] Settings padrão criados');
}

/**
 * Marca onboarding como completo
 */
async function markOnboardingCompleted(userId: string): Promise<void> {
    const metaRef = doc(db, 'barbershops', userId, 'meta', 'onboarding');

    await setDoc(metaRef, {
        completed: true,
        completedAt: new Date().toISOString(),
        version: '1.0.0', // Para futuras migrações
    });

    console.log('[Onboarding] Marcado como completo');
}

/**
 * Executa todo o fluxo de seed de dados para novo usuário
 * 
 * IMPORTANTE: Esta função é idempotente - não recria dados
 * se o onboarding já foi completado.
 * 
 * @param userId - ID do usuário recém-registrado
 * @returns true se seed foi executado, false se já existia
 */
export async function seedInitialData(userId: string): Promise<boolean> {
    try {
        // Verificar se já foi feito
        const alreadyCompleted = await checkOnboardingCompleted(userId);
        if (alreadyCompleted) {
            console.log('[Onboarding] Já completado, ignorando seed');
            return false;
        }

        console.log('[Onboarding] Iniciando seed de dados para:', userId);

        // Executar seeds em paralelo para performance
        await Promise.all([
            seedDefaultService(userId),
            seedDefaultSettings(userId),
        ]);

        // Marcar como completo
        await markOnboardingCompleted(userId);

        console.log('[Onboarding] Seed completo com sucesso!');
        return true;
    } catch (error) {
        // Log do erro mas não bloqueia o registro
        console.error('[Onboarding] Erro durante seed:', error);
        // Retorna false mas não lança exceção - usuário pode usar app sem seed
        return false;
    }
}

/**
 * Reseta o onboarding (para testes/dev)
 * 
 * ATENÇÃO: Não use em produção - isso deleta dados!
 */
export async function resetOnboarding(userId: string): Promise<void> {
    if (import.meta.env.PROD) {
        console.warn('[Onboarding] Reset não permitido em produção');
        return;
    }

    const metaRef = doc(db, 'barbershops', userId, 'meta', 'onboarding');
    await setDoc(metaRef, {
        completed: false,
        resetAt: new Date().toISOString(),
    });

    console.log('[Onboarding] Reset completo - próximo login fará seed novamente');
}
