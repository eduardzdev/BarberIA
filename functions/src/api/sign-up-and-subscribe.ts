/**
 * signUpAndSubscribe — Cloud Function HTTP pública.
 *
 * Arquitetura Payment-First:
 * Pagamento é verificado ANTES de criar conta Firebase.
 *
 * Cartão de Crédito (síncrono ~5s):
 *   1. Cria customer Asaas → 2. Cria subscription → 3. Poll pagamento
 *   4a. CONFIRMED → Cria conta Firebase + Firestore → auto-login
 *   4b. PENDING após retries → Cria conta com pending_payment (webhook corrigirá)
 *   4c. REFUSED → Cancela tudo, retorna erro (ZERO escritas no Firebase)
 *
 * PIX (assíncrono):
 *   1. Cria customer Asaas → 2. Cria subscription → 3. Gera QR Code
 *   4. Armazena dados em pending_signups (senha criptografada)
 *   5. Retorna QR Code/copia-e-cola para o frontend
 *   6. Webhook PAYMENT_CONFIRMED → cria conta Firebase (em asaas-webhook.ts)
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { config } from '../config';
import { asaasClient, CreditCardData, CreditCardHolderInfo } from '../lib/asaas-client';
import { calculateMonthlyPrice, getPlanDescription } from '../lib/pricing';
import { encrypt } from '../lib/crypto';

interface SignUpRequest {
    name: string;
    email: string;
    password: string;
    cpfCnpj: string;
    phone: string;
    plan: 'basic' | 'premium';
    barberCount: number;
    billingType: 'CREDIT_CARD' | 'PIX';
    creditCard?: CreditCardData;
    creditCardHolderInfo?: CreditCardHolderInfo;
}

export const signUpAndSubscribe = onRequest(
    {
        region: config.region,
        cors: true,
        invoker: 'public',
        maxInstances: 10,
        serviceAccount: 'saas-barbearia-8d49a@appspot.gserviceaccount.com',
    },
    async (req, res) => {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method Not Allowed' });
            return;
        }

        const data: SignUpRequest = req.body;

        // ── Validação ─────────────────────────────────────────
        const errors: string[] = [];
        if (!data.name || data.name.length < 3) errors.push('Nome deve ter pelo menos 3 caracteres.');
        if (!data.email || !data.email.includes('@')) errors.push('Email inválido.');
        if (!data.password || data.password.length < 6) errors.push('Senha deve ter pelo menos 6 caracteres.');
        if (!data.cpfCnpj || data.cpfCnpj.length < 11) errors.push('CPF/CNPJ inválido.');
        if (!data.phone || data.phone.length < 10) errors.push('Telefone inválido.');
        if (!['basic', 'premium'].includes(data.plan)) errors.push('Plano inválido.');
        if (!data.barberCount || data.barberCount < 1) errors.push('Mínimo 1 barbeiro.');
        if (!['CREDIT_CARD', 'PIX'].includes(data.billingType)) errors.push('Forma de pagamento inválida.');
        if (data.billingType === 'CREDIT_CARD' && !data.creditCard) errors.push('Dados do cartão são obrigatórios.');

        if (errors.length > 0) {
            res.status(400).json({ error: 'Dados inválidos.', details: errors });
            return;
        }

        // Verificar se email já existe no Firebase Auth
        try {
            await admin.auth().getUserByEmail(data.email);
            res.status(409).json({ error: 'Este email já está cadastrado. Tente fazer login.' });
            return;
        } catch (err: any) {
            if (err.code !== 'auth/user-not-found') {
                throw err;
            }
            // OK: email não existe, podemos prosseguir
        }

        let asaasCustomerId: string | null = null;
        let asaasSubscriptionId: string | null = null;

        try {
            const monthlyValue = calculateMonthlyPrice(data.plan, data.barberCount);
            const nextDueDate = getNextDueDate();

            // ── Step 1: Criar customer Asaas (sem externalReference) ──
            const customer = await asaasClient.createCustomer({
                name: data.name,
                email: data.email,
                cpfCnpj: data.cpfCnpj.replace(/\D/g, ''),
                phone: data.phone.replace(/\D/g, ''),
            });
            asaasCustomerId = customer.id;
            console.info(`[SignUp] ✅ Customer Asaas: ${asaasCustomerId}`);

            // ── Step 2: Criar subscription Asaas ─────────────────
            const subscriptionPayload: Parameters<typeof asaasClient.createSubscription>[0] = {
                customer: asaasCustomerId,
                billingType: data.billingType,
                value: monthlyValue,
                cycle: 'MONTHLY',
                nextDueDate,
                description: getPlanDescription(data.plan, data.barberCount),
                externalReference: `pending:${asaasCustomerId}`,
            };

            if (data.billingType === 'CREDIT_CARD' && data.creditCard) {
                subscriptionPayload.creditCard = data.creditCard;
                subscriptionPayload.creditCardHolderInfo = data.creditCardHolderInfo;
            }

            const subscription = await asaasClient.createSubscription(subscriptionPayload);
            asaasSubscriptionId = subscription.id;
            console.info(`[SignUp] ✅ Subscription Asaas: ${asaasSubscriptionId}`);

            // ── Step 3: Fluxo específico por método de pagamento ──

            if (data.billingType === 'CREDIT_CARD') {
                await handleCreditCardFlow(data, asaasCustomerId, asaasSubscriptionId, monthlyValue, nextDueDate, res);
            } else {
                await handlePixFlow(data, asaasCustomerId, asaasSubscriptionId, monthlyValue, nextDueDate, res);
            }
        } catch (error: any) {
            console.error('[SignUp] ❌ Erro:', error.message || error);

            // ── Rollback Asaas ───────────────────────────────────
            if (asaasSubscriptionId) {
                try { await asaasClient.cancelSubscription(asaasSubscriptionId); } catch (e) {
                    console.error('[SignUp] Rollback subscription falhou:', e);
                }
            }
            // Nota: não deletamos o customer Asaas pois pode ser reutilizado

            const statusCode = error.code === 'auth/email-already-exists' ? 409 : 500;
            const message = error.code === 'auth/email-already-exists'
                ? 'Este email já está cadastrado. Tente fazer login.'
                : error.message || 'Erro interno ao criar conta.';

            res.status(statusCode).json({ error: message });
        }
    }
);

// ═══════════════════════════════════════════════════════════
// ─── CARTÃO DE CRÉDITO (síncrono) ────────────────────────
// ═══════════════════════════════════════════════════════════

async function handleCreditCardFlow(
    data: SignUpRequest,
    asaasCustomerId: string,
    asaasSubscriptionId: string,
    monthlyValue: number,
    nextDueDate: string,
    res: any,
) {
    // Poll: aguardar confirmação do pagamento (4 x 2.5s = ~10s)
    const payment = await pollFirstPayment(asaasSubscriptionId, 4, 2500);

    if (!payment) {
        throw new Error('Não foi possível verificar o pagamento. Tente novamente.');
    }

    const confirmed = ['CONFIRMED', 'RECEIVED'].includes(payment.status);

    // Para cartão de crédito, a autorização é quase instantânea (1-3s).
    // Se após 10s ainda está PENDING, o cartão será recusado.
    // NÃO criar conta — devolver erro para o usuário.
    if (!confirmed) {
        console.warn(`[SignUp] ❌ Cartão não confirmado após polling: status=${payment.status}`);
        throw new Error('Pagamento não aprovado. Verifique o limite do cartão ou tente outro método de pagamento.');
    }

    // ── Pagamento CONFIRMADO → Criar conta Firebase ──────
    const userId = await createFirebaseAccount(
        data, asaasCustomerId, asaasSubscriptionId, monthlyValue, nextDueDate, 'active',
    );

    // Atualizar externalReference no Asaas com o userId real
    try {
        await asaasClient.updateCustomer(asaasCustomerId, { externalReference: userId });
    } catch (e) {
        console.warn('[SignUp] Falha ao atualizar externalReference do customer:', e);
    }

    // Update subscription externalReference via Asaas API
    try {
        await asaasClient.updateSubscription(asaasSubscriptionId, { externalReference: userId } as any);
    } catch (e) {
        console.warn('[SignUp] Falha ao atualizar externalReference da subscription:', e);
    }

    const customToken = await admin.auth().createCustomToken(userId);

    console.info(`[SignUp] ✅ Conta criada via cartão: userId=${userId}, status=active`);

    res.status(201).json({
        success: true,
        customToken,
        status: 'active',
        monthlyValue,
    });
}

// ═══════════════════════════════════════════════════════════
// ─── PIX (assíncrono) ────────────────────────────────────
// ═══════════════════════════════════════════════════════════

async function handlePixFlow(
    data: SignUpRequest,
    asaasCustomerId: string,
    asaasSubscriptionId: string,
    monthlyValue: number,
    nextDueDate: string,
    res: any,
) {
    // Aguardar um momento para o pagamento ser gerado
    await sleep(1500);

    const payments = await asaasClient.listSubscriptionPayments(asaasSubscriptionId);
    const firstPayment = payments[0];

    if (!firstPayment) {
        throw new Error('Erro ao gerar cobrança PIX. Tente novamente.');
    }

    // Obter QR Code PIX
    let pixData: { encodedImage: string; payload: string } | null = null;
    try {
        pixData = await asaasClient.getPaymentPixQrCode(firstPayment.id);
    } catch (e) {
        console.warn('[SignUp] Falha ao gerar QR Code PIX:', e);
    }

    // ── Armazenar pending_signup (senha criptografada) ──────
    await admin.firestore()
        .collection('pending_signups')
        .doc(asaasCustomerId)
        .set({
            name: data.name,
            email: data.email,
            encryptedPassword: encrypt(data.password, config.encryptionKey),
            phone: data.phone.replace(/\D/g, ''),
            plan: data.plan,
            barberCount: data.barberCount,
            monthlyValue,
            asaasCustomerId,
            asaasSubscriptionId,
            billingType: 'PIX',
            nextDueDate,
            paymentId: firstPayment.id,
            createdAt: admin.firestore.Timestamp.now(),
            // Expira em 24h (PIX tem validade)
            expiresAt: admin.firestore.Timestamp.fromDate(
                new Date(Date.now() + 24 * 60 * 60 * 1000)
            ),
        });

    console.info(`[SignUp] ✅ Pending signup PIX: customer=${asaasCustomerId}`);

    res.status(201).json({
        success: true,
        status: 'awaiting_pix',
        pendingPayment: {
            invoiceUrl: firstPayment.invoiceUrl,
            pixQrCode: pixData?.encodedImage || null,
            pixCopiaECola: pixData?.payload || null,
            paymentId: firstPayment.id,
            value: monthlyValue,
            dueDate: firstPayment.dueDate,
        },
    });
}

// ═══════════════════════════════════════════════════════════
// ─── HELPERS ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════

/**
 * Cria conta Firebase Auth + docs Firestore.
 */
async function createFirebaseAccount(
    data: SignUpRequest,
    asaasCustomerId: string,
    asaasSubscriptionId: string,
    monthlyValue: number,
    nextDueDate: string,
    initialStatus: string,
): Promise<string> {
    const userRecord = await admin.auth().createUser({
        email: data.email,
        password: data.password,
        displayName: data.name,
        phoneNumber: formatPhoneForAuth(data.phone),
    }).catch(async (err) => {
        if (err.code === 'auth/invalid-phone-number') {
            return admin.auth().createUser({
                email: data.email,
                password: data.password,
                displayName: data.name,
            });
        }
        throw err;
    });

    const userId = userRecord.uid;
    const now = admin.firestore.Timestamp.now();

    // Criar doc de subscription
    await admin.firestore()
        .collection('barbershops')
        .doc(userId)
        .collection('subscription')
        .doc('current')
        .set({
            status: initialStatus,
            plan: data.plan,
            barberCount: data.barberCount,
            monthlyValue,
            asaasCustomerId,
            asaasSubscriptionId,
            startDate: now,
            nextPaymentDate: admin.firestore.Timestamp.fromDate(new Date(nextDueDate + 'T12:00:00Z')),
            createdAt: now,
            updatedAt: now,
        });

    // Registrar evento
    await admin.firestore()
        .collection('barbershops')
        .doc(userId)
        .collection('payment_events')
        .add({
            type: 'SUBSCRIPTION_CREATED',
            timestamp: now,
            asaasEventId: `signup_${asaasSubscriptionId}`,
            amount: monthlyValue,
            billingType: data.billingType,
            paymentStatus: initialStatus,
            rawPayload: {
                source: 'signUpAndSubscribe',
                plan: data.plan,
                barberCount: data.barberCount,
                subscriptionId: asaasSubscriptionId,
            },
        });

    return userId;
}

/**
 * Poll do primeiro pagamento. Retorna o payment ou null.
 */
async function pollFirstPayment(
    subscriptionId: string,
    maxRetries: number,
    delayMs: number,
): Promise<{ id: string; status: string; dueDate?: string } | null> {
    for (let i = 0; i < maxRetries; i++) {
        await sleep(delayMs);

        try {
            const payments = await asaasClient.listSubscriptionPayments(subscriptionId);
            const first = payments[0];

            if (!first) continue;

            // Estado terminal — retornar imediatamente
            if (['CONFIRMED', 'RECEIVED', 'REFUNDED', 'DELETED'].includes(first.status)) {
                return first;
            }

            console.info(`[SignUp] 🔄 Poll ${i + 1}/${maxRetries}: status=${first.status}`);
        } catch (e) {
            console.warn(`[SignUp] Poll ${i + 1} falhou:`, e);
        }
    }

    // Última tentativa
    try {
        const payments = await asaasClient.listSubscriptionPayments(subscriptionId);
        return payments[0] || null;
    } catch {
        return null;
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getNextDueDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
}

function formatPhoneForAuth(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('55') && digits.length >= 12) {
        return `+${digits}`;
    }
    return `+55${digits}`;
}
