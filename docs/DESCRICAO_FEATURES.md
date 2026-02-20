# 🎯 Descrição de Features - AgendaBarber

**Data:** 15 de outubro de 2025  
**Baseado em:** Análise completa de 23 screenshots

---

## 📋 ÍNDICE DE FEATURES

1. [Autenticação e Acesso](#1-autenticação-e-acesso)
2. [Dashboard Principal](#2-dashboard-principal)
3. [Gestão de Agendamentos](#3-gestão-de-agendamentos)
4. [Gestão de Clientes](#4-gestão-de-clientes)
5. [Gestão Financeira](#5-gestão-financeira)
6. [Configurações da Barbearia](#6-configurações-da-barbearia)
7. [Gestão de Serviços](#7-gestão-de-serviços)
8. [Perfil da Empresa](#8-perfil-da-empresa)
9. [Notificações](#9-notificações)
10. [Agendamento Público](#10-agendamento-público-booking)
11. [Configurações do Aplicativo](#11-configurações-do-aplicativo)

---

## 1. AUTENTICAÇÃO E ACESSO

### **Feature: Sistema de Login/Cadastro**

#### **Propósito:**
Controlar acesso ao painel profissional da barbearia através de autenticação segura via Firebase Auth.

#### **Componentes:**
- `LoginPage` com tabs (Login/Cadastro)
- `useAuth` hook
- `AuthStore` (Zustand)
- Validação com Zod (`loginSchema`, `registerSchema`)

#### **Funcionalidades:**

##### **1.1 Login com Email/Senha**
- **Input:** Email + Senha
- **Validação:** 
  - Email válido
  - Senha mínima 6 caracteres
- **Ação:** `await signInWithEmailAndPassword(auth, email, password)`
- **Sucesso:** Redirect para `/dashboard` + Toast "Bem-vindo de volta!"
- **Erro:** Toast com mensagem traduzida

##### **1.2 Login com Google**
- **Trigger:** Botão "Continuar com Google"
- **Ação:** `await signInWithRedirect(auth, googleProvider)`
- **Callback:** `getRedirectResult(auth)` no App.tsx
- **Sucesso:** Redirect para `/dashboard`
- **Erro:** Toast "Erro ao autenticar com Google"

##### **1.3 Cadastro de Nova Conta**
- **Tab:** "Cadastro"
- **Campos:**
  - Nome completo
  - Email
  - Senha
  - Confirmar senha
- **Validação:**
  - Email único (Firebase)
  - Senhas coincidem
- **Ação:** `await createUserWithEmailAndPassword(auth, email, password)`
- **Pós-cadastro:** Cria documento em `barbershops/{uid}` com dados iniciais
- **Sucesso:** Redirect para `/dashboard` + Toast "Conta criada!"

##### **1.4 Acesso sem Login**
- **Trigger:** Botão "Continuar sem login"
- **Ação:** Navigate para `/booking` (página pública)
- **Limitação:** Não salva dados, apenas gera link WhatsApp

##### **1.5 Persistência de Sessão**
- **Implementação:** `onAuthStateChanged(auth, callback)`
- **Localização:** `App.tsx` useEffect
- **Ação:** Atualiza `AuthStore.setUser(user)` automaticamente
- **Logout:** Limpa sessão + Redirect para `/login`

#### **Modelos de Dados:**
```typescript
interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}
```

#### **Estados:**
- **Idle:** Formulário vazio
- **Submitting:** Botão com spinner, campos desabilitados
- **Success:** Redirect automático
- **Error:** Mensagem de erro visível abaixo dos campos

---

## 2. DASHBOARD PRINCIPAL

### **Feature: Hub Central de Gestão**

#### **Propósito:**
Fornecer visão executiva do negócio com métricas em tempo real e acesso rápido às principais ações.

#### **Componentes:**
- `DashboardPage`
- `StatCard` (componente reutilizável)
- `AppointmentCard` (componente reutilizável)
- `useAppointments`, `useClients`, `useFinancial` hooks

#### **Funcionalidades:**

##### **2.1 Cartões de Estatísticas**
- **Agendamentos Hoje:**
  - Valor: Contagem de appointments com `date === today`
  - Mudança: Comparação com dia anterior
  - Cor indicador: Verde (positivo) / Vermelho (negativo)
  - Ícone: Calendário

- **Receita Hoje:**
  - Valor: Soma de `transactions` do tipo `income` com `date === today`
  - Mudança: % comparado com semana anterior
  - Formato: `R$ 450`
  - Ícone: Cifrão

- **Total de Clientes:**
  - Valor: Contagem de `clients` com `status === 'Ativo'`
  - Subtítulo: "Clientes ativos"
  - Ícone: Grupo de pessoas

- **Próximo Cliente:**
  - Valor: Horário do próximo appointment (`status === 'Confirmado'`)
  - Nome: Cliente do appointment
  - Ícone: Relógio
  - Estado especial: `--:--` se não houver próximo

##### **2.2 Ações Rápidas (Grid 2x2)**
- **Novo Agendamento:**
  - Ação: Abre modal `AppointmentForm`
  - Ícone: Calendário
  
- **Cadastrar Cliente:**
  - Ação: Abre modal `ClientForm`
  - Ícone: Pessoa com +
  
- **Registrar Pagamento:**
  - Ação: Abre modal `TransactionForm`
  - Ícone: Cartão de crédito
  
- **Ver Agenda:**
  - Ação: Navigate para `/agenda`
  - Ícone: Relógio

##### **2.3 Lista de Próximos Agendamentos**
- **Query:** Appointments com `date >= today` ordenados por `date, time` (limit 5)
- **Cada Card:**
  - Nome do cliente
  - Data e horário formatados
  - Lista de serviços (comma-separated)
  - Nome do profissional
  - Valor total (destaque verde)
  - Botão WhatsApp (abre conversa com mensagem)
  - Menu 3 dots:
    - Editar → Modal com dados preenchidos
    - Cancelar → Confirm dialog → Atualiza status

##### **2.4 Data e Hora Atual**
- **Formato:** "Quarta-Feira, 15 De Outubro De 2025"
- **Atualização:** Em tempo real (useEffect com interval)

##### **2.5 Botão CTA Principal**
- **Label:** "+ Novo Agendamento"
- **Estilo:** Violeta, full-width, destaque
- **Ação:** Abre modal `AppointmentForm`

#### **Modelos de Dados:**
```typescript
interface DashboardStats {
  appointmentsToday: {
    count: number;
    change: string; // ex: "+2 desde ontem"
  };
  revenueToday: {
    amount: number;
    change: string; // ex: "+12.5% esta semana"
  };
  totalClients: {
    count: number;
    subtitle: string;
  };
  nextClient: {
    time: string; // "14:30"
    name: string; // "João Silva"
  } | null;
}

interface QuickAction {
  id: string;
  label: string;
  icon: BiIconType;
  action: () => void;
}
```

#### **Estados:**
- **Loading:** Skeleton screens nos cards
- **Loaded:** Dados exibidos
- **Empty:** "Nenhum agendamento hoje" (em vez da lista)
- **Error:** Banner de erro no topo da página

---

## 3. GESTÃO DE AGENDAMENTOS

### **Feature: Agenda Completa com Múltiplas Visualizações**

#### **Propósito:**
Gerenciar todos os agendamentos da barbearia com visualizações flexíveis (calendário, kanban, timeline).

#### **Componentes:**
- `AgendaPage`
- `CalendarView`, `KanbanView`, `TimelineView` (sub-componentes)
- `AppointmentCard`
- `AppointmentForm` (modal)
- `useAppointments` hook
- `AppointmentsStore` (Zustand)

#### **Funcionalidades:**

##### **3.1 Navegação de Data**
- **Botões:**
  - `<` Dia anterior
  - `[Hoje]` Volta para data atual
  - `>` Próximo dia
- **Display:** Data selecionada formatada
- **Ação:** Atualiza query de appointments

##### **3.2 Estatísticas do Dia Selecionado**
- **Total Agendamentos:** Count de appointments na data
- **Confirmados:** Count com `status === 'Confirmado'`
- **Pendentes:** Count com `status === 'Pendente'`
- **Próximo Cliente:** Horário e nome do próximo appointment

##### **3.3 Tabs de Visualização**
- **Calendário:**
  - Grid mensal
  - Indicadores de dias com agendamentos
  - Click no dia → Filtra timeline
  
- **Kanban:**
  - Colunas por status (Pendente, Confirmado, Em Andamento, Concluído, Cancelado)
  - Drag & drop para mudar status (opcional)
  - Cards com resumo do appointment
  
- **Timeline:**
  - Lista vertical por horário (ex: 08:00, 08:30, 09:00...)
  - Slots vazios: Botão "[Agendar]"
  - Slots ocupados: AppointmentCard completo
  - Scroll vertical

##### **3.4 Criação de Agendamento**
- **Trigger:** 
  - Botão "+" no header
  - Botão "[Agendar]" em slot vazio (Timeline)
  - Ação rápida no Dashboard
- **Modal:** `AppointmentForm`
  - Cliente (autocomplete ou novo)
  - Profissional (select)
  - Serviços (multi-select)
  - Data (date picker)
  - Hora (time picker)
- **Validação:**
  - Horário disponível (não conflitante)
  - Duração total dos serviços cabe no horário
  - Cliente e profissional selecionados
- **Ação:** 
  - `appointmentService.create(data)`
  - Verifica conflito: `appointmentService.hasTimeConflict(date, time, professionalId)`
  - Atualiza `AppointmentsStore`
- **Sucesso:** Toast "Agendamento criado!" + Fecha modal

##### **3.5 Edição de Agendamento**
- **Trigger:** Menu 3 dots → "Editar"
- **Modal:** `AppointmentForm` com dados preenchidos
- **Ação:** `appointmentService.update(id, data)`
- **Sucesso:** Toast "Agendamento atualizado!"

##### **3.6 Cancelamento de Agendamento**
- **Trigger:** Menu 3 dots → "Cancelar"
- **Confirm:** "Tem certeza que deseja cancelar?"
- **Ação:** 
  - `appointmentService.update(id, { status: 'Cancelado' })`
  - Mantém no histórico (não deleta)
- **Sucesso:** Toast "Agendamento cancelado"

##### **3.7 Integração WhatsApp**
- **Botão:** Verde com ícone WhatsApp em cada card
- **Ação:** 
  - Formata mensagem: `"Olá {cliente}, confirmando seu agendamento para {data} às {hora}. Serviços: {lista}. Total: {valor}"`
  - Abre: `window.open('https://wa.me/{telefone}?text={mensagem}')`

##### **3.8 Filtros**
- **Botão:** "Filtros" no header
- **Modal/Panel:** Opções de filtro
  - Status (multi-select)
  - Profissional (select)
  - Tipo de serviço (select)
  - Faixa de valor (range)
- **Aplicação:** Atualiza query em tempo real

#### **Modelos de Dados:**
```typescript
interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  professionalId: string;
  professionalName: string;
  serviceIds: string[];
  serviceNames: string[];
  date: string; // ISO date
  time: string; // "14:30"
  duration: number; // minutos totais
  price: number;
  status: AppointmentStatus;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

enum AppointmentStatus {
  Pending = 'Pendente',
  Confirmed = 'Confirmado',
  InProgress = 'Em Andamento',
  Completed = 'Concluído',
  Canceled = 'Cancelado',
}

interface TimeSlot {
  time: string; // "08:00"
  status: 'available' | 'booked' | 'blocked';
  appointment?: Appointment;
}
```

#### **Estados:**
- **Loading:** Skeleton nos slots/cards
- **Empty:** "Nenhum agendamento para este dia"
- **Loaded:** Appointments exibidos
- **Conflict:** Mensagem de erro ao tentar agendar horário conflitante
- **Error:** Banner de erro

---

## 4. GESTÃO DE CLIENTES

### **Feature: Base de Clientes Completa**

#### **Propósito:**
Gerenciar informações de todos os clientes da barbearia, incluindo histórico, avaliações e notas personalizadas.

#### **Componentes:**
- `ClientsPage`
- `ClientCard` (com estados collapsed/expanded)
- `ClientForm` (modal)
- `useClients` hook
- `ClientsStore` (Zustand)

#### **Funcionalidades:**

##### **4.1 Busca em Tempo Real**
- **Input:** "Buscar por nome, telefone ou email..."
- **Ação:** Filtra lista localmente (debounce 300ms)
- **Matching:** Case-insensitive, partial match
- **Display:** "X clientes encontrados"

##### **4.2 Filtros Avançados**
- **Botão:** "Filtros" (ícone funil)
- **Modal:** Opções de filtro
  - Status: Ativo/Inativo
  - VIP: Sim/Não
  - Ordenação: A-Z, Mais Gastos, Mais Visitas
- **Aplicação:** Combina com busca

##### **4.3 Estatísticas Globais**
- **Total de Clientes:** Count total
- **Clientes Ativos:** Count com `status === 'Ativo'`
- **Clientes VIP:** Count com `isVIP === true`
- **Receita Total:** Soma de `totalSpent` de todos os clientes

##### **4.4 Lista de Clientes (Cards)**
- **Estado Collapsed:**
  - Avatar (iniciais ou foto)
  - Nome
  - Status badge (Ativo/Inativo)
  - Telefone
  - Email
  - Menu 3 dots
  
- **Estado Expanded (click no card):**
  - Tudo do collapsed +
  - Última Visita (data formatada)
  - Avaliação (5 estrelas + rating numérico)
  - Total de Visitas
  - Gasto Total
  - Notas (texto em itálico, cinza)

##### **4.5 Criação de Cliente**
- **Trigger:** Botão "+ Novo Cliente"
- **Modal:** `ClientForm`
  - Nome Completo
  - Telefone (máscara: `(11) 99999-9999`)
  - Email (opcional)
- **Validação:** 
  - Nome obrigatório (min 3 chars)
  - Telefone válido (regex)
  - Email válido (se preenchido)
- **Ação:** `clientService.create(data)`
- **Sucesso:** Toast "Cliente cadastrado!" + Fecha modal

##### **4.6 Edição de Cliente**
- **Trigger:** Menu 3 dots → "Editar"
- **Modal:** `ClientForm` com dados preenchidos
- **Campos editáveis:** Nome, Telefone, Email, Status, VIP, Notas
- **Ação:** `clientService.update(id, data)`
- **Sucesso:** Toast "Cliente atualizado!"

##### **4.7 Exclusão de Cliente**
- **Trigger:** Menu 3 dots → "Excluir"
- **Confirm:** "Tem certeza? Esta ação não pode ser desfeita."
- **Ação:** `clientService.delete(id)`
- **Regra:** Não pode excluir se tiver appointments futuros (validação)
- **Sucesso:** Toast "Cliente removido"

##### **4.8 Sistema de Avaliação**
- **Display:** 5 estrelas (amarelo) + rating numérico (0.0 - 5.0)
- **Edição:** Click nas estrelas (no card expandido ou modal)
- **Cálculo:** Média de avaliações de appointments concluídos (futuro)
- **Atual:** Campo editável manualmente

##### **4.9 Gestão de Clientes VIP**
- **Toggle:** Checkbox/Switch no form de edição
- **Indicador:** Badge ou estrela no card
- **Filtro:** Opção de filtrar apenas VIP
- **Benefícios:** (Implícito - pode ter descontos, prioridade, etc)

##### **4.10 Notas Personalizadas**
- **Campo:** Textarea no form de edição
- **Propósito:** Anotar preferências, observações
- **Exemplo:** "Cliente fiel, prefere corte baixo nas laterais"
- **Display:** Card expandido, estilo itálico

#### **Modelos de Dados:**
```typescript
interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string; // URL ou null (gera iniciais)
  status: 'Ativo' | 'Inativo';
  isVIP: boolean;
  lastVisit: string | null; // ISO date
  rating: number; // 0-5
  visits: number;
  totalSpent: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ClientStats {
  total: number;
  active: number;
  vip: number;
  totalRevenue: number;
}
```

#### **Estados:**
- **Loading:** Skeleton cards
- **Empty:** "Nenhum cliente cadastrado" + CTA
- **Loaded:** Lista de clientes
- **Searching:** "Buscando..." (debounce)
- **NoResults:** "Nenhum cliente encontrado para '{query}'"
- **Error:** Banner de erro

---

## 5. GESTÃO FINANCEIRA

### **Feature: Controle Financeiro Completo**

#### **Propósito:**
Acompanhar receitas, despesas e lucro líquido da barbearia com dashboards e histórico de transações.

#### **Componentes:**
- `FinancialPage`
- `TransactionCard`
- `TransactionForm` (modal)
- `PaymentMethodsChart` (componente de barras)
- `useFinancial` hook
- `FinancialStore` (Zustand)

#### **Funcionalidades:**

##### **5.1 Dashboard Financeiro**
- **Receita Mensal:**
  - Valor: Soma de `transactions` (type `income`) no mês atual
  - Mudança: % vs mês anterior
  - Cor: Verde (positivo) / Vermelho (negativo)
  
- **Receita Semanal:**
  - Valor: Soma de `transactions` (type `income`) nos últimos 7 dias
  - Mudança: % vs semana anterior
  
- **Receita Diária:**
  - Valor: Soma de `transactions` (type `income`) hoje
  - Data: Exibida no card
  
- **Lucro Líquido:**
  - Valor: Receita Total - Despesas Totais (mês atual)
  - Label: "Receita - Despesas"

##### **5.2 Distribuição de Formas de Pagamento**
- **Título:** "Formas de Pagamento"
- **Subtítulo:** "Distribuição dos recebimentos do mês"
- **Visualização:** Barras horizontais (progress bars)
- **Cada Método:**
  - Nome (PIX, Dinheiro, Cartão)
  - Percentual do total
  - Valor absoluto
  - Barra violeta proporcional
- **Cálculo:** 
  - Total = Soma de todas as receitas do mês
  - % = (Soma do método / Total) * 100

##### **5.3 Histórico de Transações**
- **Título:** "Transações Recentes"
- **Query:** Últimas 10 transações ordenadas por `date DESC, time DESC`
- **Cada Card:**
  - Ícone: ↑ (receita, verde) / ↓ (despesa, vermelho)
  - Descrição (ex: "João Silva" ou "Conta de Luz")
  - Data e hora formatadas
  - Categoria/Serviço
  - Valor com sinal (+ verde, - vermelho)
  - Background com glow sutil (verde/vermelho)
- **Link:** "Ver Todas as Transações" (futuro: página completa)

##### **5.4 Registro de Transação**
- **Trigger:** Botão "+ Nova Transação"
- **Modal:** `TransactionForm`
  - Toggle: Receita/Despesa
  - Descrição (ex: "Corte João Silva")
  - Valor (R$)
  - Forma de Pagamento (select)
  - Categoria (opcional - para despesas)
  - Data (default: hoje)
- **Validação:**
  - Descrição obrigatória
  - Valor > 0
  - Forma de pagamento selecionada
- **Ação:** `transactionService.create(data)`
- **Sucesso:** Toast "Transação registrada!" + Atualiza stats

##### **5.5 Registro Automático via Appointment**
- **Trigger:** Appointment com status → "Concluído"
- **Ação:** Cria transaction automaticamente
  - Type: `income`
  - Description: `{clientName} - {services}`
  - Amount: `appointment.price`
  - PaymentMethod: `appointment.paymentMethod`
  - Date: `appointment.date`
- **Vinculação:** `transaction.appointmentId = appointment.id`

##### **5.6 Edição de Transação**
- **Trigger:** Menu 3 dots → "Editar"
- **Modal:** `TransactionForm` com dados preenchidos
- **Campos editáveis:** Descrição, Valor, Forma de Pagamento, Categoria
- **Ação:** `transactionService.update(id, data)`
- **Sucesso:** Toast "Transação atualizada!"

##### **5.7 Exclusão de Transação**
- **Trigger:** Menu 3 dots → "Excluir"
- **Confirm:** "Tem certeza?"
- **Ação:** `transactionService.delete(id)`
- **Regra:** Não pode excluir transações vinculadas a appointments
- **Sucesso:** Toast "Transação removida"

##### **5.8 Filtros de Data**
- **Botão:** "Filtrar por período"
- **Opções:**
  - Hoje
  - Esta Semana
  - Este Mês
  - Período Customizado (date range picker)
- **Aplicação:** Recarrega transactions e stats

##### **5.9 Exportação (Futuro)**
- **Botão:** "Exportar Relatório"
- **Formatos:** PDF, Excel
- **Conteúdo:** Transações + Resumo financeiro

#### **Modelos de Dados:**
```typescript
interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  category: string; // "Serviço", "Estoque", "Despesas Fixas", etc
  amount: number;
  paymentMethod: string; // "PIX", "Dinheiro", "Cartão"
  date: string; // ISO date
  time: string; // "14:30"
  appointmentId?: string; // se vinculado
  createdAt: string;
  updatedAt: string;
}

interface FinancialStats {
  monthlyRevenue: {
    amount: number;
    change: string; // "+15.2%"
  };
  weeklyRevenue: {
    amount: number;
    change: string;
  };
  dailyRevenue: {
    amount: number;
    date: string;
  };
  netProfit: {
    amount: number; // receita - despesas
  };
  paymentMethods: {
    [key: string]: {
      percentage: number;
      amount: number;
    };
  };
}
```

#### **Estados:**
- **Loading:** Skeleton nos cards de valores
- **Empty:** "Nenhuma transação registrada neste período"
- **Loaded:** Transações e stats exibidos
- **Error:** Banner de erro

---

## 6. CONFIGURAÇÕES DA BARBEARIA

### **Feature: Gerenciamento da Barbearia**

#### **Propósito:**
Configurar profissionais, horários de funcionamento e formas de pagamento aceitas.

#### **Componentes:**
- `BarbershopConfigPage`
- `ProfessionalCard`
- `ProfessionalForm` (modal)
- `BusinessHoursEditor`
- `useBarbershop` hook
- `BarbershopStore` (Zustand)

#### **Funcionalidades:**

##### **6.1 Gestão de Profissionais**
- **Lista:** Cards com foto/avatar e nome
- **Botão:** "+ Adicionar Novo"
- **Modal:** `ProfessionalForm`
  - Nome
  - Foto (upload opcional)
  - Especialidades (multi-select de serviços)
  - Horários disponíveis (grid semanal)
- **Ação Criar:** `professionalService.create(data)`
- **Ação Editar:** Menu 3 dots → "Editar" → Modal
- **Ação Remover:** Menu 3 dots → "Remover" → Confirm
- **Validação:** Não pode remover se tiver appointments futuros

##### **6.2 Horários de Funcionamento**
- **Display:** Lista por dia da semana
  - Segunda a Sexta: 09:00 - 19:00
  - Sábado: 09:00 - 16:00
  - Domingo: Fechado (texto vermelho)
- **Botão:** "Editar"
- **Modal:** `BusinessHoursEditor`
  - Cada dia: Toggle Aberto/Fechado
  - Se aberto: Time picker início e fim
  - Checkbox: "Aplicar para todos os dias úteis"
- **Validação:**
  - Horário fim > horário início
  - Horários em intervalos de 30 min
- **Ação:** `barbershopService.update({ businessHours: data })`
- **Sucesso:** Toast "Horários atualizados!"

##### **6.3 Formas de Pagamento**
- **Lista:** Toggles para cada método
  - PIX (ON/OFF)
  - Dinheiro (ON/OFF)
  - Cartão de Crédito/Débito (ON/OFF)
- **Ação:** `barbershopService.update({ paymentMethods: data })`
- **Impacto:** 
  - Afeta options em formulários de appointment/transaction
  - Afeta página de booking pública

#### **Modelos de Dados:**
```typescript
interface Professional {
  id: string;
  name: string;
  photo?: string;
  specialties: string[]; // serviceIds
  availability: {
    [day: string]: {
      enabled: boolean;
      start: string; // "09:00"
      end: string; // "18:00"
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface BusinessHours {
  [day: string]: {
    open: boolean;
    start: string; // "09:00"
    end: string; // "19:00"
  };
}

interface Barbershop {
  id: string; // === user.uid
  name: string;
  professionals: Professional[];
  businessHours: BusinessHours;
  paymentMethods: {
    pix: boolean;
    cash: boolean;
    card: boolean;
  };
  // outros configs...
}
```

#### **Estados:**
- **Loading:** Skeleton nos profissionais
- **Empty:** "Nenhum profissional cadastrado"
- **Loaded:** Dados exibidos
- **Error:** Banner de erro

---

## 7. GESTÃO DE SERVIÇOS

### **Feature: Catálogo de Serviços**

#### **Propósito:**
Gerenciar todos os serviços oferecidos pela barbearia com preços e durações.

#### **Componentes:**
- `ServicesPage`
- `ServiceCard`
- `ServiceForm` (modal)
- `useServices` hook
- `ServicesStore` (Zustand)

#### **Funcionalidades:**

##### **7.1 Lista de Serviços**
- **Display:** Cards em lista vertical
- **Cada Card:**
  - Nome do serviço
  - Duração (ex: "30 min")
  - Preço (ex: "R$ 40.00")
  - Menu 3 dots
- **Ordenação:** Alfabética ou por preço

##### **7.2 Criação de Serviço**
- **Trigger:** Botão "+ Novo Serviço"
- **Modal:** `ServiceForm`
  - Nome (ex: "Corte")
  - Duração (number input + select: min/hora)
  - Preço (R$)
  - Descrição (opcional)
  - Ativo (toggle - default ON)
- **Validação:**
  - Nome obrigatório (min 3 chars)
  - Duração > 0
  - Preço > 0
- **Ação:** `serviceService.create(data)`
- **Sucesso:** Toast "Serviço criado!"

##### **7.3 Edição de Serviço**
- **Trigger:** Menu 3 dots → "Editar"
- **Modal:** `ServiceForm` com dados preenchidos
- **Ação:** `serviceService.update(id, data)`
- **Sucesso:** Toast "Serviço atualizado!"

##### **7.4 Desativação/Ativação**
- **Trigger:** Menu 3 dots → "Desativar" ou "Ativar"
- **Ação:** `serviceService.update(id, { isActive: !isActive })`
- **Efeito:** Serviço desativado não aparece em seleções de appointment

##### **7.5 Exclusão de Serviço**
- **Trigger:** Menu 3 dots → "Excluir"
- **Confirm:** "Tem certeza? Appointments futuros com este serviço serão afetados."
- **Ação:** `serviceService.delete(id)`
- **Regra:** Marca como `isActive: false` em vez de deletar (soft delete)
- **Sucesso:** Toast "Serviço removido"

##### **7.6 Serviços Combinados**
- **Exemplos:** "Corte + Barba", "Degradê + Platinado"
- **Implementação:** Nomes descritivos, duração e preço próprios
- **Alternativa futura:** Sistema de "combos" com múltiplos serviços

#### **Modelos de Dados:**
```typescript
interface Service {
  id: string;
  name: string;
  duration: number; // minutos
  price: number;
  description?: string;
  isActive: boolean;
  category?: string; // "Cabelo", "Barba", "Outros"
  createdAt: string;
  updatedAt: string;
}
```

#### **Estados:**
- **Loading:** Skeleton cards
- **Empty:** "Nenhum serviço cadastrado"
- **Loaded:** Lista de serviços
- **Error:** Banner de erro

---

## 8. PERFIL DA EMPRESA

### **Feature: Perfil Público da Barbearia**

#### **Propósito:**
Gerenciar informações públicas da barbearia (foto, descrição, contato, redes sociais).

#### **Componentes:**
- `ProfilePage`
- `ProfileForm` (inline editing)
- `useBarbershop` hook

#### **Funcionalidades:**

##### **8.1 Informações Básicas**
- **Banner:** Foto de capa (upload)
- **Avatar:** Logo da barbearia (upload)
- **Nome:** Ex: "André Barber"
- **Username:** Ex: "@andrebarber"
- **Botão:** "Editar Perfil" → Modo edição

##### **8.2 Sobre Nós**
- **Campo:** Textarea
- **Exemplo:** "A melhor barbearia da cidade, especializada em cortes clássicos e modernos..."
- **Limite:** 500 caracteres
- **Edição:** Inline ou modal

##### **8.3 Contato e Localização**
- **Endereço:**
  - Rua, número, bairro
  - Cidade, estado
  - Link (opcional): Abre Google Maps
  
- **Telefone/WhatsApp:**
  - Número formatado
  - Badge: "WhatsApp"
  - Click: Abre WhatsApp Business

##### **8.4 Redes Sociais**
- **Links:**
  - Instagram
  - Facebook
  - TikTok
  - Website
- **Edição:** Input para URL de cada rede
- **Display:** Ícone + Chevron → Abre em nova aba

##### **8.5 Edição de Perfil**
- **Trigger:** Botão "Editar Perfil"
- **Estado:** Campos se tornam editáveis
- **Upload de Imagens:** 
  - Click no banner/avatar → File picker
  - Upload para Firebase Storage
  - Atualiza URL no Firestore
- **Ação Salvar:** `barbershopService.update(data)`
- **Ação Cancelar:** Reverte para dados anteriores
- **Sucesso:** Toast "Perfil atualizado!"

#### **Modelos de Dados:**
```typescript
interface BarbershopProfile {
  name: string;
  username: string;
  banner?: string; // URL
  avatar?: string; // URL
  about: string;
  address: {
    street: string;
    city: string;
    state: string;
  };
  phone: string;
  socialMedia: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    website?: string;
  };
}
```

#### **Estados:**
- **Viewing:** Dados exibidos (não editáveis)
- **Editing:** Campos editáveis + Botões Cancelar/Salvar
- **Uploading:** Spinner ao fazer upload de imagens
- **Success:** Toast "Perfil atualizado!"
- **Error:** Banner de erro

---

## 9. NOTIFICAÇÕES

### **Feature: Sistema de Notificações em Tempo Real**

#### **Propósito:**
Alertar o usuário sobre eventos importantes (novos agendamentos, metas atingidas, lembretes).

#### **Componentes:**
- `NotificationsPanel` (slide-in)
- `NotificationCard`
- `useNotifications` hook
- `NotificationsStore` (Zustand)

#### **Funcionalidades:**

##### **9.1 Badge Contador**
- **Localização:** Header (todas as páginas)
- **Display:** Badge vermelho com número
- **Cálculo:** Count de `notifications` com `read === false`
- **Atualização:** Em tempo real (Firestore listener)

##### **9.2 Panel de Notificações**
- **Trigger:** Click no badge
- **Animação:** Slide-in from right
- **Overlay:** Escurece conteúdo atrás
- **Fechar:** Click no overlay ou botão X

##### **9.3 Lista de Notificações**
- **Ordenação:** Mais recentes primeiro
- **Cada Card:**
  - Ícone (depende do tipo)
  - Título (bold)
  - Descrição
  - Timestamp relativo ("2 min atrás", "1h atrás", "ontem")
  - Badge roxo (se não lida)
- **Tipos:**
  - **Novo Agendamento:** Ícone calendário
  - **Meta Atingida:** Ícone gráfico
  - **Lembrete:** Ícone sino
  - **Cancelamento:** Ícone X

##### **9.4 Marcar como Lida**
- **Ação Individual:** Click na notificação
  - Marca como lida
  - Navega para página relevante (ex: agenda se for agendamento)
- **Ação em Lote:** Link "Marcar todas como lidas"
  - Atualiza todas de uma vez

##### **9.5 Geração de Notificações**
- **Novo Agendamento:** 
  - Trigger: `appointmentService.create()`
  - Mensagem: "{clientName} agendou um {services} para {time}."
  
- **Meta Diária:**
  - Trigger: `revenueToday >= dailyGoal`
  - Mensagem: "Você atingiu R$ {valor} de receita hoje. Parabéns!"
  
- **Lembrete:**
  - Trigger: Cron job (1h antes do appointment)
  - Mensagem: "Lembrete: {clientName} tem agendamento às {time}."

##### **9.6 Persistência**
- **Storage:** Firestore `notifications` subcollection
- **Listener:** Real-time updates com `onSnapshot()`
- **Limpeza:** Auto-delete após 30 dias (Cloud Function)

#### **Modelos de Dados:**
```typescript
interface Notification {
  id: string;
  type: 'appointment' | 'goal' | 'reminder' | 'cancellation';
  title: string;
  description: string;
  icon: BiIconType;
  read: boolean;
  createdAt: string; // ISO timestamp
  relatedId?: string; // appointmentId, etc
  relatedPath?: string; // ex: "/agenda"
}
```

#### **Estados:**
- **Loading:** Skeleton no panel
- **Empty:** "Nenhuma notificação"
- **Loaded:** Lista de notificações
- **Error:** Banner de erro

---

## 10. AGENDAMENTO PÚBLICO (BOOKING)

### **Feature: Página de Agendamento para Clientes**

#### **Propósito:**
Permitir que clientes finais agendem serviços sem necessidade de login, gerando link de WhatsApp para confirmação.

#### **Componentes:**
- `BookingPage`
- `ServiceSelector` (multi-select)
- `ProfessionalSelector` (radio)
- `DateTimePicker`
- `PaymentSelector`

#### **Funcionalidades:**

##### **10.1 Step 1: Escolha de Serviços**
- **Display:** Lista de serviços com checkbox
- **Cada Serviço:**
  - Nome
  - Duração
  - Preço
- **Multi-select:** Permite escolher vários serviços
- **Total:** Soma automática dos preços
- **Botão:** "Próximo" (desabilitado se nenhum selecionado)

##### **10.2 Step 2: Escolha de Profissional**
- **Display:** Grid de profissionais (fotos circulares)
- **Seleção:** Radio button (apenas 1)
- **Highlight:** Borda violeta no selecionado
- **Botões:** "Voltar" | "Próximo"

##### **10.3 Step 3: Data e Horário**
- **Date Picker:** Input com calendário
- **Horários Disponíveis:**
  - Query: Busca slots livres do profissional selecionado
  - Display: Grid de horários (ex: 09:00, 10:00, 11:00...)
  - Desabilitados: Horários já ocupados (cinza claro)
  - Selecionado: Background violeta
- **Validação:** Duração total dos serviços cabe no slot
- **Botões:** "Voltar" | "Próximo"

##### **10.4 Step 4: Forma de Pagamento**
- **Opções:**
  - "Pagar agora" (e ganhe 5% de desconto!)
  - "Pagar no local"
- **Seleção:** Radio button
- **Desconto:** Se "pagar agora", aplica 5% no total
- **Total Final:** Exibido em destaque
- **Botão:** "Confirmar no WhatsApp" (verde)

##### **10.5 Geração de Link WhatsApp**
- **Trigger:** Click em "Confirmar no WhatsApp"
- **Formatação da Mensagem:**
  ```
  Olá! Gostaria de agendar:
  
  Serviços: [lista de serviços]
  Profissional: [nome do profissional]
  Data: [DD/MM/YYYY] às [HH:MM]
  Total: R$ [valor]
  Pagamento: [no local / PIX agora]
  ```
- **Ação:** `window.open('https://wa.me/{barbershopPhone}?text={encodedMessage}')`
- **Importante:** Não salva no Firebase (apenas gera link)

##### **10.6 Navegação entre Steps**
- **Indicadores:** Números 1, 2, 3, 4 (visual)
- **Botões:** "Voltar" retorna ao step anterior
- **Validação:** Não permite avançar sem seleção

##### **10.7 Responsividade**
- **Layout:** Mobile-first (vertical)
- **Grid:** 2 colunas para serviços/horários
- **Touch-friendly:** Botões grandes

#### **Fluxo de Dados:**
```typescript
interface BookingData {
  services: Service[];
  professional: Professional;
  date: string;
  time: string;
  paymentMethod: 'now' | 'later';
  total: number;
}
```

#### **Estados:**
- **Step 1:** Selecionando serviços
- **Step 2:** Selecionando profissional
- **Step 3:** Selecionando data/hora
- **Step 4:** Escolhendo pagamento
- **Loading:** Buscando horários disponíveis (Step 3)
- **Error:** "Erro ao buscar horários"

---

## 11. CONFIGURAÇÕES DO APLICATIVO

### **Feature: Preferências do Aplicativo**

#### **Propósito:**
Configurar aparência, conta e notificações do app.

#### **Componentes:**
- `SettingsPage`
- `useBarbershop` hook (para salvar preferências)

#### **Funcionalidades:**

##### **11.1 Aparência**
- **Tema:**
  - Toggle: Claro | Escuro
  - Atualização: Em tempo real (TailwindCSS class toggle)
  - Persistência: LocalStorage `theme`
  - Default: Escuro

##### **11.2 Conta**
- **Email:**
  - Display: Email do usuário logado (não editável)
  - Ícone: Pessoa
  
- **Redefinir Senha:**
  - Link: Redireciona para modal
  - Modal: Input email → Envia link de reset
  - Ação: `sendPasswordResetEmail(auth, email)`
  - Sucesso: Toast "Email enviado!"

##### **11.3 Notificações**
- **Novos Agendamentos:**
  - Toggle: ON/OFF
  - Efeito: Habilita/desabilita notificações de appointments
  
- **Lembretes de Agendamento:**
  - Toggle: ON/OFF
  - Efeito: Habilita/desabilita lembretes 1h antes

##### **11.4 Mais**
- **Dados e Privacidade:**
  - Link: Nova página ou modal
  - Conteúdo: Política de privacidade, LGPD
  
- **Suporte:**
  - Link: Abre WhatsApp ou email de suporte
  
- **Novidades do App:**
  - Modal: Changelog com últimas atualizações

#### **Modelos de Dados:**
```typescript
interface AppSettings {
  theme: 'light' | 'dark';
  notifications: {
    newAppointments: boolean;
    reminders: boolean;
  };
}
```

#### **Estados:**
- **Loading:** Skeleton ao carregar
- **Loaded:** Configurações exibidas
- **Saving:** Spinner ao salvar
- **Success:** Toast "Configurações salvas"
- **Error:** Banner de erro

---

## 🎨 DESIGN SYSTEM

### **Cores Principais:**
- **Primary:** Violet-600 (#7C3AED)
- **Background:** Slate-950 (#0C1222)
- **Cards:** Slate-900 (#0F1729)
- **Borders:** Slate-800 (#1E293B)
- **Text:** White, Slate-300
- **Success:** Green-500
- **Error:** Red-500

### **Tipografia:**
- **Font:** System font stack (sans-serif)
- **Títulos:** Bold, 1.5rem - 2rem
- **Body:** Regular, 1rem
- **Small:** 0.875rem

### **Espaçamento:**
- **Cards:** p-4 (1rem padding)
- **Gaps:** gap-4 (1rem entre elementos)
- **Margin:** my-4 (1rem vertical)

---

**Fim da Descrição de Features**
