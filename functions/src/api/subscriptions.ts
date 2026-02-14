/**
 * Cloud Functions para gerenciar assinaturas de usuários autenticados.
 *
 * - createSubscription: Cria nova assinatura para usuário existente
 * - cancelSubscription: Cancela assinatura ativa
 * - updateBarberCount: Altera nº de barbeiros e recalcula valor
 * - getSubscriptionStatus: Consulta status atual
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { config } from '../config';
import { asaasClient } from '../lib/asaas-client';
import { calculateMonthlyPrice, getPlanDescription } from '../lib/pricing';
import type { PlanType } from '../config';

/**
 * Cria assinatura para usuário já autenticado (ex: após demo_approved).
 */
export const createSubscription = onCall(
    { region: config.region },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'Usuário não autenticado.');
        }

        const userId = request.auth.uid;
        const { plan, barberCount, billingType, creditCard, creditCardHolderInfo } = request.data;

        if (!plan || !barberCount || !billingType) {
            throw new HttpsError('invalid-argument', 'Plan, barberCount e billingType são obrigatórios.');
        }

        const db = admin.firestore();
        const subRef = db.collection('barbershops').doc(userId).collection('subscription').doc('current');

        // Verificar se já tem subscription ativa
        const existingSub = await subRef.get();
        if (existingSub.exists && ['active', 'pending_payment'].includes(existingSub.data()?.status)) {
            throw new HttpsError('already-exists', 'Já existe uma assinatura ativa.');
        }

        try {
            // Buscar ou criar customer no Asaas
            let customer = await asaasClient.findCustomerByExternalRef(userId);

            if (!customer) {
                const user = await admin.auth().getUser(userId);
                const subData = existingSub.data();

                customer = await asaasClient.createCustomer({
                    name: user.displayName || 'Barbeiro',
                    email: user.email || '',
                    cpfCnpj: request.data.cpfCnpj || subData?.cpfCnpj || '',
                    phone: user.phoneNumber?.replace('+55', '') || '',
                    externalReference: userId,
                });
            }

            // Criar subscription
            const monthlyValue = calculateMonthlyPrice(plan as PlanType, barberCount);
            const nextDueDate = getNextDueDate();

            const subscriptionPayload: Parameters<typeof asaasClient.createSubscription>[0] = {
                customer: customer.id,
                billingType,
                value: monthlyValue,
                cycle: 'MONTHLY',
                nextDueDate,
                description: getPlanDescription(plan as PlanType, barberCount),
                externalReference: userId,
            };

            if (billingType === 'CREDIT_CARD' && creditCard) {
                subscriptionPayload.creditCard = creditCard;
                subscriptionPayload.creditCardHolderInfo = creditCardHolderInfo;
            }

            const subscription = await asaasClient.createSubscription(subscriptionPayload);
            const now = admin.firestore.Timestamp.now();
            const initialStatus = billingType === 'CREDIT_CARD' ? 'active' : 'pending_payment';

            await subRef.set({
                status: initialStatus,
                plan,
                barberCount,
                monthlyValue,
                asaasCustomerId: customer.id,
                asaasSubscriptionId: subscription.id,
                startDate: now,
                nextPaymentDate: admin.firestore.Timestamp.fromDate(new Date(nextDueDate + 'T12:00:00Z')),
                createdAt: now,
                updatedAt: now,
            });

            return { success: true, subscriptionId: subscription.id, status: initialStatus, monthlyValue };
        } catch (error: any) {
            console.error('[createSubscription] Erro:', error.message);
            throw new HttpsError('internal', error.message || 'Erro ao criar assinatura.');
        }
    }
);

/**
 * Cancela assinatura ativa.
 */
export const cancelSubscription = onCall(
    { region: config.region },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'Usuário não autenticado.');
        }

        const userId = request.auth.uid;
        const db = admin.firestore();
        const subRef = db.collection('barbershops').doc(userId).collection('subscription').doc('current');
        const subDoc = await subRef.get();

        if (!subDoc.exists) {
            throw new HttpsError('not-found', 'Nenhuma assinatura encontrada.');
        }

        const subData = subDoc.data()!;
        if (!subData.asaasSubscriptionId) {
            throw new HttpsError('failed-precondition', 'Assinatura sem ID do Asaas.');
        }

        try {
            await asaasClient.cancelSubscription(subData.asaasSubscriptionId);
            const now = admin.firestore.Timestamp.now();

            await subRef.update({
                status: 'cancelled',
                endDate: now,
                updatedAt: now,
            });

            // Log de auditoria
            await db.collection('barbershops').doc(userId).collection('payment_events').add({
                type: 'SUBSCRIPTION_CANCELLED',
                timestamp: now,
                asaasEventId: subData.asaasSubscriptionId,
                rawPayload: { cancelledBy: 'user', userId },
            });

            return { success: true };
        } catch (error: any) {
            console.error('[cancelSubscription] Erro:', error.message);
            throw new HttpsError('internal', error.message || 'Erro ao cancelar assinatura.');
        }
    }
);

/**
 * Atualiza número de barbeiros e recalcula valor no Asaas.
 */
export const updateBarberCount = onCall(
    { region: config.region },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'Usuário não autenticado.');
        }

        const userId = request.auth.uid;
        const { barberCount } = request.data;

        if (!barberCount || barberCount < 1) {
            throw new HttpsError('invalid-argument', 'Mínimo 1 barbeiro.');
        }

        const db = admin.firestore();
        const subRef = db.collection('barbershops').doc(userId).collection('subscription').doc('current');
        const subDoc = await subRef.get();

        if (!subDoc.exists) {
            throw new HttpsError('not-found', 'Nenhuma assinatura encontrada.');
        }

        const subData = subDoc.data()!;
        const plan = subData.plan as PlanType;
        const newValue = calculateMonthlyPrice(plan, barberCount);

        try {
            // Atualizar no Asaas
            if (subData.asaasSubscriptionId) {
                await asaasClient.updateSubscription(subData.asaasSubscriptionId, {
                    value: newValue,
                });
            }

            // Atualizar no Firestore
            await subRef.update({
                barberCount,
                monthlyValue: newValue,
                updatedAt: admin.firestore.Timestamp.now(),
            });

            return { success: true, barberCount, monthlyValue: newValue };
        } catch (error: any) {
            console.error('[updateBarberCount] Erro:', error.message);
            throw new HttpsError('internal', error.message || 'Erro ao atualizar barbeiros.');
        }
    }
);

function getNextDueDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
}
