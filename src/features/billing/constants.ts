/**
 * Constantes de billing compartilhadas pelo frontend.
 *
 * Espelha os valores de functions/src/config.ts para exibição.
 * Em produção, estes valores devem estar sincronizados.
 */

export const BILLING_PLANS = {
    basic: {
        id: 'basic' as const,
        name: 'Básico',
        basePrice: 47.00,
        extraBarberPrice: 24.00,
        features: [
            'Agendamentos ilimitados',
            'Gestão de clientes',
            'Link público de agendamento',
            'Controle financeiro básico',
            'Notificações push',
            'Suporte por WhatsApp',
        ],
    },
    premium: {
        id: 'premium' as const,
        name: 'Premium',
        basePrice: 87.00,
        extraBarberPrice: 44.00,
        popular: true,
        features: [
            'Tudo do plano Básico',
            'Até 5 barbeiros',
            'Relatórios avançados',
            'Exportação Excel',
            'Personalização do site público',
            'Suporte prioritário',
        ],
    },
} as const;

export const GRACE_PERIOD_DAYS = 5;

export function calculatePrice(plan: 'basic' | 'premium', barberCount: number): number {
    const config = BILLING_PLANS[plan];
    const extras = Math.max(0, barberCount - 1);
    return Math.round((config.basePrice + extras * config.extraBarberPrice) * 100) / 100;
}

export function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
