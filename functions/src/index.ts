/**
 * Cloud Functions — Entry Point
 *
 * Exporta todas as Cloud Functions do projeto BarberIA.
 */

import * as admin from 'firebase-admin';

// Inicializar Firebase Admin SDK (singleton)
admin.initializeApp();

// ─── Webhook ────────────────────────────────────────────────
export { asaasWebhook } from './webhooks/asaas-webhook';

// ─── API pública (sign-up) ──────────────────────────────────
export { signUpAndSubscribe } from './api/sign-up-and-subscribe';

// ─── API autenticada (subscriptions) ────────────────────────
export {
    createSubscription,
    cancelSubscription,
    updateBarberCount,
} from './api/subscriptions';
