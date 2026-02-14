/**
 * Webhook handler para eventos do Asaas.
 *
 * Duas responsabilidades:
 * 1. Atualizar status de assinaturas existentes (cartão mensal)
 * 2. Criar contas Firebase para pagamentos PIX confirmados (pending_signups)
 *
 * Fluxos de eventos (documentação Asaas):
 *   Cartão OK:        PAYMENT_CREATED → PAYMENT_CONFIRMED → PAYMENT_RECEIVED (32d)
 *   Cartão recusado:  PAYMENT_CREATED → PAYMENT_CREDIT_CARD_CAPTURE_REFUSED
 *   PIX OK:           PAYMENT_CREATED → PAYMENT_RECEIVED
 *
 * Segurança:
 * - Valida token `asaas-access-token`
 * - Idempotência por eventId + type
 * - Sempre retorna 200 (evita fila de penalização Asaas)
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { config } from '../config';
import { asaasClient } from '../lib/asaas-client';
import { decrypt } from '../lib/crypto';

export const asaasWebhook = onRequest(
    {
        region: config.region,
        cors: false,
        invoker: 'public',
        serviceAccount: 'saas-barbearia-8d49a@appspot.gserviceaccount.com',
    },
    async (req, res) => {
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }

        // Validar token
        const token = req.headers['asaas-access-token'] as string | undefined;
        if (!token || token !== config.asaas.webhookToken) {
            console.warn('[Webhook] Token inválido:', token?.substring(0, 10));
            res.status(401).send('Unauthorized');
            return;
        }

        try {
            const body = req.body;
            const event = body.event as string | undefined;
            const payment = body.payment as Record<string, any> | undefined;

            console.info(`[Webhook] Evento: ${event}`);

            if (!event || !payment) {
                res.status(200).send('OK - ignored');
                return;
            }

            const db = admin.firestore();
            const now = admin.firestore.Timestamp.now();
            const externalRef = payment.externalReference as string | undefined;

            // ── Idempotência ──────────────────────────────────────
            const eventId = body.id || payment.id;

            // ── Decidir fluxo ─────────────────────────────────────
            if (externalRef?.startsWith('pending:')) {
                // FLUXO PIX: pending signup → criar conta
                await handlePendingSignup(db, event, payment, externalRef, eventId, now);
            } else if (externalRef) {
                // FLUXO REGULAR: usuário existente → atualizar status
                await handleExistingUser(db, event, payment, externalRef, eventId, now, body);
            } else {
                console.info('[Webhook] Sem externalReference, ignorando.');
            }

            res.status(200).send('OK');
        } catch (error) {
            console.error('[Webhook] Erro:', error);
            res.status(200).send('OK - error logged');
        }
    }
);

// ═══════════════════════════════════════════════════════════
// ─── FLUXO 1: PENDING SIGNUP (PIX) ──────────────────────
// ═══════════════════════════════════════════════════════════

async function handlePendingSignup(
    db: admin.firestore.Firestore,
    event: string,
    payment: Record<string, any>,
    externalRef: string,
    eventId: string,
    now: admin.firestore.Timestamp,
) {
    const asaasCustomerId = externalRef.replace('pending:', '');

    // Só processar confirmações de pagamento
    if (!['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'].includes(event)) {
        console.info(`[Webhook] Evento ${event} para pending signup — ignorando (aguardando confirmação)`);
        return;
    }

    // Buscar pending_signup
    const pendingRef = db.collection('pending_signups').doc(asaasCustomerId);
    const pendingDoc = await pendingRef.get();

    if (!pendingDoc.exists) {
        console.warn(`[Webhook] pending_signup não encontrado: ${asaasCustomerId}`);
        return;
    }

    const pending = pendingDoc.data()!;

    // Verificar se já foi processado (idempotência)
    if (pending.processed) {
        console.info(`[Webhook] pending_signup já processado: ${asaasCustomerId}`);
        return;
    }

    console.info(`[Webhook] 🎉 PIX confirmado! Criando conta para: ${pending.email}`);

    try {
        // Descriptografar senha
        const password = decrypt(pending.encryptedPassword, config.encryptionKey);

        // Criar usuário Firebase Auth
        const userRecord = await admin.auth().createUser({
            email: pending.email,
            password,
            displayName: pending.name,
            phoneNumber: formatPhoneForAuth(pending.phone),
        }).catch(async (err) => {
            if (err.code === 'auth/invalid-phone-number') {
                return admin.auth().createUser({
                    email: pending.email,
                    password,
                    displayName: pending.name,
                });
            }
            throw err;
        });

        const userId = userRecord.uid;

        // Criar doc Firestore de subscription
        await db.collection('barbershops').doc(userId)
            .collection('subscription').doc('current')
            .set({
                status: 'active',
                plan: pending.plan,
                barberCount: pending.barberCount,
                monthlyValue: pending.monthlyValue,
                asaasCustomerId: pending.asaasCustomerId,
                asaasSubscriptionId: pending.asaasSubscriptionId,
                startDate: now,
                nextPaymentDate: admin.firestore.Timestamp.fromDate(
                    new Date(addMonths(pending.nextDueDate))
                ),
                createdAt: now,
                updatedAt: now,
            });

        // Registrar evento de pagamento
        await db.collection('barbershops').doc(userId)
            .collection('payment_events')
            .add({
                type: event,
                timestamp: now,
                asaasEventId: eventId,
                amount: payment.value || pending.monthlyValue,
                billingType: 'PIX',
                paymentStatus: 'CONFIRMED',
                rawPayload: { source: 'webhook_pix_signup', customerId: asaasCustomerId },
            });

        // Atualizar externalReference no Asaas
        try {
            await asaasClient.updateCustomer(asaasCustomerId, { externalReference: userId });
            await asaasClient.updateSubscription(pending.asaasSubscriptionId, { externalReference: userId } as any);
        } catch (e) {
            console.warn('[Webhook] Falha ao atualizar externalReference:', e);
        }

        // Marcar como processado (não deletar — manter para auditoria)
        await pendingRef.update({ processed: true, userId, processedAt: now });

        console.info(`[Webhook] ✅ Conta PIX criada: userId=${userId}, email=${pending.email}`);
    } catch (error: any) {
        console.error(`[Webhook] ❌ Falha ao criar conta PIX:`, error);
        await pendingRef.update({ error: error.message, errorAt: now });
    }
}

// ═══════════════════════════════════════════════════════════
// ─── FLUXO 2: USUÁRIO EXISTENTE ─────────────────────────
// ═══════════════════════════════════════════════════════════

async function handleExistingUser(
    db: admin.firestore.Firestore,
    event: string,
    payment: Record<string, any>,
    userId: string,
    eventId: string,
    now: admin.firestore.Timestamp,
    fullBody: Record<string, any>,
) {
    const subscriptionRef = db
        .collection('barbershops').doc(userId)
        .collection('subscription').doc('current');

    // Idempotência
    const existing = await db.collection('barbershops').doc(userId)
        .collection('payment_events')
        .where('asaasEventId', '==', eventId)
        .where('type', '==', event)
        .limit(1).get();

    if (!existing.empty) {
        console.info(`[Webhook] Já processado: ${event}/${eventId}`);
        return;
    }

    // Verificar se doc existe
    const subDoc = await subscriptionRef.get();
    const subExists = subDoc.exists;

    switch (event) {
        case 'PAYMENT_CONFIRMED':
        case 'PAYMENT_RECEIVED': {
            if (subExists) {
                await subscriptionRef.update({
                    status: 'active',
                    lastPaymentDate: now,
                    nextPaymentDate: payment.dueDate
                        ? admin.firestore.Timestamp.fromDate(new Date(addMonths(payment.dueDate)))
                        : null,
                    updatedAt: now,
                });
            }
            console.info(`[Webhook] ✅ Pagamento confirmado: userId=${userId}, R$${payment.value}`);
            break;
        }

        case 'PAYMENT_OVERDUE': {
            if (subExists) {
                await subscriptionRef.update({
                    status: 'overdue',
                    overdueStartDate: now,
                    updatedAt: now,
                });
            }
            console.info(`[Webhook] ⚠️ Pagamento atrasado: userId=${userId}`);
            break;
        }

        case 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED': {
            if (subExists) {
                await subscriptionRef.update({
                    status: 'payment_failed',
                    failureReason: 'Cartão recusado.',
                    updatedAt: now,
                });
            }
            console.info(`[Webhook] ❌ Cartão recusado: userId=${userId}`);
            break;
        }

        case 'PAYMENT_DELETED':
        case 'PAYMENT_REFUNDED':
        case 'PAYMENT_PARTIALLY_REFUNDED': {
            if (subExists) {
                await subscriptionRef.update({ status: 'blocked', updatedAt: now });
            }
            console.info(`[Webhook] 🔒 ${event}: userId=${userId}`);
            break;
        }

        case 'PAYMENT_CREATED':
        case 'PAYMENT_UPDATED':
        case 'PAYMENT_BANK_SLIP_VIEWED':
        case 'PAYMENT_CHECKOUT_VIEWED': {
            console.info(`[Webhook] ℹ️ ${event}: userId=${userId}`);
            break;
        }

        default:
            console.info(`[Webhook] Evento não mapeado: ${event}`);
    }

    // Log de auditoria
    await db.collection('barbershops').doc(userId)
        .collection('payment_events')
        .add({
            type: event,
            timestamp: now,
            asaasEventId: eventId,
            amount: payment.value || 0,
            billingType: payment.billingType || null,
            paymentStatus: payment.status || null,
            rawPayload: fullBody,
        });
}

// ═══════════════════════════════════════════════════════════
// ─── HELPERS ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════

function addMonths(dateStr: string): string {
    const date = new Date(dateStr + 'T12:00:00Z');
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
}

function formatPhoneForAuth(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('55') && digits.length >= 12) {
        return `+${digits}`;
    }
    return `+55${digits}`;
}
