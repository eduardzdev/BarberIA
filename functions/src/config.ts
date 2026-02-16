/**
 * Configuração centralizada para Cloud Functions.
 * Secrets são lidos de variáveis de ambiente (functions/.env para emulador,
 * firebase functions:secrets:set para produção).
 */

export const config = {
    asaas: {
        apiKey: process.env.ASAAS_API_KEY || '',
        webhookToken: process.env.ASAAS_WEBHOOK_TOKEN || '',
        baseUrl: process.env.ASAAS_BASE_URL || 'https://api.asaas.com/v3',
    },
    encryptionKey: process.env.ENCRYPTION_KEY || '',
    region: 'southamerica-east1' as const,
};

export const PLANS = {
    basic: {
        name: 'Básico',
        basePrice: 47.00,
        extraBarberPrice: 24.00,
    },
    premium: {
        name: 'Premium',
        basePrice: 87.00,
        extraBarberPrice: 44.00,
    },
} as const;

export type PlanType = keyof typeof PLANS;
