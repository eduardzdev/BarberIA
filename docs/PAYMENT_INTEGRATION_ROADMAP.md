# 💳 Payment Integration Roadmap - Asaas

Este documento contém o plano completo de integração de pagamentos para quando você tiver acesso à conta Asaas.

---

## Visão Geral

**Gateway escolhido:** Asaas (recomendado para mercado brasileiro)  
**Por que Asaas:**
- Taxas baixas: 1.99% cartão, R$0.50 Pix, R$3 boleto
- Suporte nativo a CPF (sem necessidade de CNPJ)
- API simples e documentação em português
- Pix Automático suportado (junho 2025)

---

## Phase 1: Payment Integration (16-20 horas)

### 1.1 Criar conta Asaas
- [ ] Acessar https://www.asaas.com
- [ ] Criar conta com CPF pessoal
- [ ] Completar verificação de identidade
- [ ] Ativar modo sandbox para testes

### 1.2 Configurar API Keys
```env
# .env.local (NÃO comitar!)
VITE_ASAAS_API_KEY=xxx_sandbox_xxx
VITE_ASAAS_WEBHOOK_TOKEN=seu_token_secreto
VITE_SUBSCRIPTION_PRICE_BASIC=29.90
VITE_SUBSCRIPTION_PRICE_PREMIUM=49.90
```

### 1.3 Criar estrutura de arquivos
```
src/features/billing/
├── services/
│   └── asaas.service.ts       # Comunicação com API Asaas
├── components/
│   ├── SubscriptionCard.tsx   # Card do plano atual
│   ├── PaymentForm.tsx        # Formulário de pagamento
│   ├── BillingHistory.tsx     # Histórico de faturas
│   └── PlanSelector.tsx       # Seleção de plano
├── pages/
│   └── BillingPage.tsx        # Página de cobrança
└── hooks/
    └── useSubscription.ts     # Hook para estado de assinatura
```

### 1.4 Implementar asaas.service.ts

```typescript
// src/features/billing/services/asaas.service.ts
import axios from 'axios';

const API_BASE = import.meta.env.DEV 
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://www.asaas.com/api/v3';

const API_KEY = import.meta.env.VITE_ASAAS_API_KEY;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'access_token': API_KEY,
    'Content-Type': 'application/json'
  }
});

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  billingType: 'CREDIT_CARD' | 'PIX' | 'BOLETO';
  value: number;
  cycle: 'MONTHLY' | 'YEARLY';
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  nextDueDate: string;
}

export const asaasService = {
  // Criar cliente no Asaas
  async createCustomer(data: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone?: string;
  }): Promise<AsaasCustomer> {
    const response = await api.post('/customers', data);
    return response.data;
  },

  // Buscar cliente por email
  async findCustomerByEmail(email: string): Promise<AsaasCustomer | null> {
    const response = await api.get(`/customers?email=${email}`);
    return response.data.data?.[0] || null;
  },

  // Criar assinatura
  async createSubscription(data: {
    customerId: string;
    plan: 'basic' | 'premium';
    billingType: 'CREDIT_CARD' | 'PIX' | 'BOLETO';
    creditCard?: {
      holderName: string;
      number: string;
      expiryMonth: string;
      expiryYear: string;
      ccv: string;
    };
    creditCardHolderInfo?: {
      name: string;
      email: string;
      cpfCnpj: string;
      postalCode: string;
      addressNumber: string;
      phone: string;
    };
  }): Promise<AsaasSubscription> {
    const value = data.plan === 'premium' ? 49.90 : 29.90;
    
    const payload: any = {
      customer: data.customerId,
      billingType: data.billingType,
      cycle: 'MONTHLY',
      value,
      nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0],
      description: `Plano ${data.plan === 'premium' ? 'Premium' : 'Básico'} - BarberIA`
    };

    // Adicionar dados do cartão se for pagamento via cartão
    if (data.billingType === 'CREDIT_CARD' && data.creditCard) {
      payload.creditCard = data.creditCard;
      payload.creditCardHolderInfo = data.creditCardHolderInfo;
    }

    const response = await api.post('/subscriptions', payload);
    return response.data;
  },

  // Cancelar assinatura
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await api.delete(`/subscriptions/${subscriptionId}`);
  },

  // Buscar assinatura
  async getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    const response = await api.get(`/subscriptions/${subscriptionId}`);
    return response.data;
  },

  // Listar pagamentos de uma assinatura
  async listPayments(subscriptionId: string) {
    const response = await api.get(`/payments?subscription=${subscriptionId}`);
    return response.data.data;
  }
};
```

### 1.5 Atualizar Firestore com dados de assinatura

**Nova collection:** `barbershops/{userId}/subscription`

```typescript
interface SubscriptionData {
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  plan: 'basic' | 'premium';
  asaasCustomerId: string;
  asaasSubscriptionId: string;
  startDate: Timestamp;
  endDate: Timestamp;
  trialEndsAt?: Timestamp;
  lastPaymentDate?: Timestamp;
  nextPaymentDate?: Timestamp;
}
```

**Nova collection:** `barbershops/{userId}/payment_events` (para auditoria)

```typescript
interface PaymentEvent {
  type: 'payment_received' | 'payment_failed' | 'subscription_created' | 'subscription_cancelled';
  timestamp: Timestamp;
  asaasEventId: string;
  amount?: number;
  rawPayload: object; // Payload completo do webhook
}
```

### 1.6 Configurar Webhook

**URL do webhook:** `https://seu-projeto.web.app/api/asaas-webhook`

**Eventos para escutar:**
- `PAYMENT_RECEIVED` - Pagamento confirmado
- `PAYMENT_OVERDUE` - Pagamento atrasado
- `PAYMENT_DELETED` - Pagamento cancelado
- `SUBSCRIPTION_DELETED` - Assinatura cancelada

**Cloud Function para processar webhook:**

```typescript
// functions/src/webhooks/asaas.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const asaasWebhook = functions.https.onRequest(async (req, res) => {
  const { event, payment, subscription } = req.body;
  
  // Validar token de autenticação
  const token = req.headers['asaas-access-token'];
  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    res.status(401).send('Unauthorized');
    return;
  }

  const db = admin.firestore();
  
  try {
    switch (event) {
      case 'PAYMENT_RECEIVED':
        // Atualizar status da assinatura para ativo
        await db.collection('barbershops')
          .doc(payment.externalReference) // userId salvo como referência
          .collection('subscription')
          .doc('current')
          .update({
            status: 'active',
            lastPaymentDate: admin.firestore.Timestamp.now(),
            nextPaymentDate: admin.firestore.Timestamp.fromDate(
              new Date(payment.dueDate)
            )
          });
        break;

      case 'PAYMENT_OVERDUE':
        // Marcar como atrasado (ainda em grace period)
        await db.collection('barbershops')
          .doc(payment.externalReference)
          .collection('subscription')
          .doc('current')
          .update({
            status: 'overdue'
          });
        break;

      case 'SUBSCRIPTION_DELETED':
        // Marcar como cancelado
        await db.collection('barbershops')
          .doc(subscription.externalReference)
          .collection('subscription')
          .doc('current')
          .update({
            status: 'cancelled',
            endDate: admin.firestore.Timestamp.now()
          });
        break;
    }

    // Logar evento para auditoria
    await db.collection('barbershops')
      .doc(payment?.externalReference || subscription?.externalReference)
      .collection('payment_events')
      .add({
        type: event.toLowerCase().replace('_', '-'),
        timestamp: admin.firestore.Timestamp.now(),
        asaasEventId: payment?.id || subscription?.id,
        amount: payment?.value,
        rawPayload: req.body
      });

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal error');
  }
});
```

---

## Phase 2: Subscription Gatekeeper (8-10 horas)

### 2.1 Criar SubscriptionGuard

```typescript
// src/guards/SubscriptionGuard.tsx
import React, { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PaywallScreen } from '@/features/billing/components/PaywallScreen';
import { ExpiryBanner } from '@/features/billing/components/ExpiryBanner';

interface SubscriptionGuardProps {
  children: ReactNode;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
  const { user, subscription } = useAuth();

  // Se não tiver assinatura, considerar em trial
  if (!subscription) {
    return <>{children}</>;
  }

  // Calcular dias desde expiração
  const now = new Date();
  const endDate = subscription.endDate?.toDate() || now;
  const daysSinceExpiry = Math.floor(
    (now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Grace period: 7 dias após expiração
  const GRACE_PERIOD_DAYS = 7;
  const isInGracePeriod = subscription.status === 'expired' && daysSinceExpiry <= GRACE_PERIOD_DAYS;
  const isBlocked = subscription.status === 'expired' && daysSinceExpiry > GRACE_PERIOD_DAYS;

  // Bloquear acesso se expirado além do grace period
  if (isBlocked || subscription.status === 'cancelled') {
    return <PaywallScreen reason={subscription.status} />;
  }

  // Calcular dias restantes
  const daysRemaining = subscription.status === 'active'
    ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : -daysSinceExpiry;

  // Mostrar banner se perto de expirar ou em grace period
  const showWarning = daysRemaining <= 3 || isInGracePeriod;

  return (
    <>
      {showWarning && (
        <ExpiryBanner 
          daysRemaining={daysRemaining}
          isGracePeriod={isInGracePeriod}
        />
      )}
      {children}
    </>
  );
};
```

### 2.2 Criar PaywallScreen

```typescript
// src/features/billing/components/PaywallScreen.tsx
import React from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { useNavigate } from 'react-router-dom';

interface PaywallScreenProps {
  reason: 'expired' | 'cancelled';
}

export const PaywallScreen: React.FC<PaywallScreenProps> = ({ reason }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <div className="mb-6">
          <Icon name="lock" className="w-16 h-16 text-violet-400 mx-auto" />
        </div>

        <h1 className="text-2xl font-bold text-slate-100 mb-2">
          {reason === 'expired' ? 'Assinatura Expirada' : 'Assinatura Cancelada'}
        </h1>

        <p className="text-slate-400 mb-6">
          {reason === 'expired' 
            ? 'Sua assinatura expirou. Renove para continuar usando o BarberIA.'
            : 'Sua assinatura foi cancelada. Reative para recuperar o acesso.'}
        </p>

        <div className="space-y-4">
          <Button 
            variant="primary" 
            className="w-full"
            onClick={() => navigate('/billing')}
          >
            <Icon name="credit-card" className="w-5 h-5 mr-2" />
            {reason === 'expired' ? 'Renovar Assinatura' : 'Reativar Assinatura'}
          </Button>

          <Button 
            variant="ghost" 
            className="w-full"
            onClick={() => navigate('/export-data')}
          >
            <Icon name="download" className="w-5 h-5 mr-2" />
            Exportar meus dados
          </Button>
        </div>

        <p className="text-xs text-slate-500 mt-6">
          Seus dados estão salvos e seguros. Após renovar, você terá acesso completo novamente.
        </p>
      </Card>
    </div>
  );
};
```

### 2.3 Criar ExpiryBanner

```typescript
// src/features/billing/components/ExpiryBanner.tsx
import React from 'react';
import { Link } from 'react-router-dom';

interface ExpiryBannerProps {
  daysRemaining: number;
  isGracePeriod: boolean;
}

export const ExpiryBanner: React.FC<ExpiryBannerProps> = ({ 
  daysRemaining, 
  isGracePeriod 
}) => {
  const bgColor = isGracePeriod ? 'bg-red-600' : 'bg-amber-600';
  
  const message = isGracePeriod
    ? `Sua assinatura expirou há ${Math.abs(daysRemaining)} dia(s). Renove agora para evitar perda de acesso!`
    : daysRemaining === 0
      ? 'Sua assinatura expira hoje!'
      : `Sua assinatura expira em ${daysRemaining} dia(s).`;

  return (
    <div className={`${bgColor} text-white px-4 py-2 text-center text-sm`}>
      <span>{message}</span>
      <Link to="/billing" className="ml-2 underline font-semibold hover:no-underline">
        Renovar agora →
      </Link>
    </div>
  );
};
```

### 2.4 Proteger rotas com SubscriptionGuard

```typescript
// src/App.tsx ou router config
import { SubscriptionGuard } from '@/guards/SubscriptionGuard';

// Envolver rotas protegidas
<Route element={<SubscriptionGuard><Outlet /></SubscriptionGuard>}>
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/appointments" element={<AppointmentsPage />} />
  <Route path="/clients" element={<ClientsPage />} />
  <Route path="/financial" element={<FinancialPage />} />
  <Route path="/history" element={<HistoryPage />} />
  {/* ... outras rotas protegidas */}
</Route>

{/* Rotas NÃO protegidas */}
<Route path="/billing" element={<BillingPage />} />
<Route path="/export-data" element={<ExportDataPage />} />
```

---

## Phase 3: Billing Dashboard (10-12 horas)

### 3.1 Criar BillingPage

```typescript
// src/features/billing/pages/BillingPage.tsx
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SubscriptionCard } from '../components/SubscriptionCard';
import { PlanSelector } from '../components/PlanSelector';
import { BillingHistory } from '../components/BillingHistory';
import { Card } from '@/components/Card';

export const BillingPage: React.FC = () => {
  const { subscription } = useAuth();
  const [showPlanSelector, setShowPlanSelector] = useState(false);

  return (
    <div className="space-y-6 pb-6">
      <h1 className="text-2xl font-bold text-slate-100">Assinatura</h1>

      {/* Card do plano atual */}
      <SubscriptionCard 
        subscription={subscription}
        onChangePlan={() => setShowPlanSelector(true)}
      />

      {/* Seletor de planos (modal ou seção) */}
      {showPlanSelector && (
        <PlanSelector 
          currentPlan={subscription?.plan}
          onClose={() => setShowPlanSelector(false)}
        />
      )}

      {/* Histórico de pagamentos */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Histórico de Pagamentos
        </h2>
        <BillingHistory />
      </Card>

      {/* Informações de cancelamento */}
      <Card className="border-red-800">
        <h3 className="text-red-400 font-semibold mb-2">Cancelar Assinatura</h3>
        <p className="text-slate-400 text-sm mb-4">
          Ao cancelar, você continuará tendo acesso até o fim do período pago.
          Seus dados serão mantidos por 90 dias após o cancelamento.
        </p>
        <button className="text-red-400 text-sm hover:underline">
          Cancelar minha assinatura
        </button>
      </Card>
    </div>
  );
};
```

### 3.2 Planos sugeridos

| Plano | Preço | Inclui |
|-------|-------|--------|
| **Básico** | R$29,90/mês | 1 barbeiro, agendamentos ilimitados, link público |
| **Premium** | R$49,90/mês | 3 barbeiros, relatórios avançados, exportação Excel, suporte prioritário |

---

## Checklist Final

### Antes de ir para produção:
- [ ] Criar conta Asaas e verificar identidade
- [ ] Testar fluxo completo em sandbox
- [ ] Configurar webhook URL de produção
- [ ] Migrar para API key de produção
- [ ] Testar cobrança real com valor mínimo
- [ ] Configurar email transacional (confirmações)
- [ ] Documentar fluxo de suporte para disputas

### URLs importantes:
- **Dashboard Asaas:** https://www.asaas.com/dashboard
- **Documentação API:** https://docs.asaas.com
- **Status Page:** https://status.asaas.com
- **Sandbox:** https://sandbox.asaas.com

---

## Tempo total estimado: 34-42 horas

Prioridade de implementação:
1. Payment Integration (P0) - sem isso não há receita
2. Subscription Gatekeeper (P0) - sem isso o serviço é gratuito
3. Billing Dashboard (P1) - importante para transparência

**Data sugerida para retomar:** Quando tiver acesso à conta Asaas
