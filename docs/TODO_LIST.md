# 📋 Backlog Imediato – BarberIA (atualizado em 25/10/2025)

## 🔥 Prioridade Alta (liberação beta)
- [ ] Exercitar fluxo completo em produção (login → cliente → agendamento → conclusão) num dispositivo mobile real e registrar problemas de UX.
- [ ] Ajustar Dashboard e Agenda para usar o mesmo padrão de cartão compacto com estados reativos e modais conectados.
- [ ] Reativar o teste Playwright de criação de agendamento e cobrir o novo comportamento do `ClientCard`.

## 🛠️ Prioridade Média (estabilização)
- [ ] Automatizar criação de transação financeira ao concluir um agendamento.
- [ ] Preencher HistoryPage com dados reais (substituir mocks) e revisar métricas exibidas.
- [ ] Configurar Google Analytics 4 / Firebase Analytics para monitoramento pós-lançamento.

## 📦 Preparação de Release
- [x] `.env.production` criado e validado.
- [x] `npm run build` / deploy Firebase executados.
- [ ] Registrar insights de uso após 48h e revisar backlog.

> Atualize este arquivo ao concluir cada item para manter o roadmap alinhado com a etapa beta em produção.# 📋 TODO List - BarberIA

**Última Atualização:** 17/10/2025 - 00:00  
**Status Geral:** 🟢 Fases 1-2 Concluídas - Pronto para Fase 3

---

## ✅ FASE 1: Segurança - COMPLETA ✅

**Duração Real:** 2 horas  
**Status:** 🟢 100% Concluído
**Data de Conclusão:** 14/10/2025

- [x] Variáveis de ambiente (.env.local + .env.example)
- [x] Firestore Security Rules (protegendo collections)
- [x] Firebase App Check (reCAPTCHA v3 invisível)
- [x] Validação Zod (schemas para todas as entidades)
- [x] Deploy das Rules no Firebase
- [x] Testes de segurança

**Documentação:**
- [docs/FASE_1_CONCLUIDA.md](./docs/FASE_1_CONCLUIDA.md)
- [docs/GUIA_APP_CHECK_RECAPTCHA.md](./docs/GUIA_APP_CHECK_RECAPTCHA.md)

---

## ✅ FASE 2: Arquitetura - COMPLETA ✅

**Duração Real:** 3 dias  
**Status:** 🟢 100% Concluído
**Data de Conclusão:** 17/10/2025

### 2.1 State Management (Zustand Stores) ✅
- [x] AuthStore - Autenticação global
- [x] AppointmentsStore - Agendamentos com real-time
- [x] ClientsStore - Clientes com busca/filtros
- [x] FinancialStore - Transações e estatísticas
- [x] ServicesStore - Catálogo de serviços CRUD
- [x] BarbershopStore - Configuração da loja
- [x] NotificationsStore - Notificações real-time
- [x] UIStore - Estado transiente de UI

### 2.2 Custom Hooks ✅
- [x] useAuth - Hook de autenticação
- [x] useAppointments - Hook de agendamentos
- [x] useClients - Hook de clientes
- [x] useFinancial - Hook financeiro
- [x] useServices - Hook de serviços
- [x] useBarbershop - Hook de configuração
- [x] useNotifications - Hook de notificações
- [x] useUI - Hook de UI state

### 2.3 Service Layer ✅
- [x] BaseService - CRUD genérico com TypeScript generics
- [x] AppointmentService - Operações especializadas
- [x] Integração com Firestore
- [x] Type safety completo

### 2.4 Refatoração de Componentes ✅
- [x] Extrair LoginPage de pages.tsx (200 linhas)
- [x] Extrair RegisterPage de pages.tsx (250 linhas)
- [x] Extrair BookingPage de pages.tsx (700 linhas)
- [x] Extrair DashboardPage de pages.tsx (587 linhas)
- [x] Extrair AppointmentsPage de pages.tsx (650 linhas)
- [x] Extrair AgendaPage de pages.tsx (650 linhas)
- [x] Extrair ClientsPage de pages.tsx (520 linhas)
- [x] Extrair FinancialPage de pages.tsx (500 linhas)
- [x] Extrair ProfilePage de pages.tsx (200 linhas)
- [x] Extrair Settings pages de pages.tsx (1.100 linhas)
- [x] Extrair HistoryPage de pages.tsx (193 linhas) ✅ CONCLUÍDA!
- [x] **Total:** ~4.100 linhas extraídas ✅

### 2.5 Feature-Based Structure ✅
- [x] src/features/auth/
- [x] src/features/booking/
- [x] src/features/dashboard/
- [x] src/features/appointments/
- [x] src/features/agenda/
- [x] src/features/clients/
- [x] src/features/financial/
- [x] src/features/history/ ✅ NOVA!
- [x] src/features/profile/
- [x] src/features/settings/

### 2.6 Quality Checks ✅
- [x] Zero TypeScript errors
- [x] Todas as importações funcionando
- [x] Navegação testada manualmente
- [x] Stores conectadas e funcionando
- [x] Monólito completamente refatorado

**Documentação:**
- [docs/STATUS_PROJETO.md](./STATUS_PROJETO.md) ✅ Atualizado
- [RESUMO_TECNICO_PROJETO.md](../RESUMO_TECNICO_PROJETO.md) ✅ Criado

**Estatísticas Finais:**
- **8 Stores** criadas e funcionando
- **8 Hooks** implementados
- **10 Páginas** extraídas (100% do monólito)
- **~4.100 linhas** de código refatoradas
- **0 erros** TypeScript
- **100% funcional**

**🎉 FASE 2 CONCLUÍDA COM SUCESSO! 🎉**

---

## � FASE 3.5: Integração Completa de Dados - EM ANDAMENTO

**Duração Estimada:** ~2h15min  
**Status:** 🟡 0% Iniciado  
**Início:** 17/10/2025  
**Prioridade:** 🔴 CRÍTICA (bloqueia testes E2E assertivos)

**Objetivo:** Garantir que TODOS os dados sejam reais e reativos antes de otimizações.

**Documentação:** `docs/AUDITORIA_DADOS_FASE_3.5.md`

### 3.5.1 Prioridade 1: Corrigir Bug Crítico ⏳
**Tempo:** 15 min + 5 min teste

- [ ] **Task 1.1:** Corrigir botão "Novo Agendamento" no Dashboard
  - Arquivo: `DashboardPage.tsx` linha 554-562
  - Problema: Navega para rota inexistente `/appointments/new`
  - Solução: Trocar por `openModal('newAppointment')`
  - Teste: Clicar no botão → Modal deve abrir

- [ ] **Task 1.2:** Verificar modal de novo agendamento
  - Arquivo: `DashboardPage.tsx`
  - Ação: Garantir que modal chama `createAppointment()`
  - Teste: Preencher form → Salvar → Verificar Firestore

### 3.5.2 Prioridade 2: Integrar Appointments ↔ Financial ⏳
**Tempo:** 30 min + 10 min teste

- [ ] **Task 2.1:** Auto-criar transação quando agendamento concluído
  - Arquivo: `appointments.store.ts`
  - Lógica: Listener que dispara `financial.store.ts`
  - Quando: Status muda para "Concluído"
  - Ação: Criar transação de receita automaticamente
  - Teste: Criar agendamento → Concluir → Verificar transação em FinancialPage

### 3.5.3 Prioridade 3: Dashboard 100% Reativo ⏳
**Tempo:** 20 min + 5 min teste

- [ ] **Task 3.1:** Recalcular KPIs com useMemo
  - Arquivo: `DashboardPage.tsx`
  - Ação: Mover cálculos para `useMemo` com dependências corretas
  - KPIs: todayRevenue, appointmentStats, clientStats
  - Teste: Criar transação → "Receita Hoje" atualiza automaticamente

### 3.5.4 Prioridade 4: HistoryPage com Dados Reais ⏳
**Tempo:** 25 min + 10 min teste

- [ ] **Task 4.1:** Substituir MOCK_HISTORY
  - Arquivo: `HistoryPage.tsx`
  - Ação: Usar `useAppointments()` filtrado por "Concluído"
  - Teste: Concluir agendamento → Aparece no histórico

- [ ] **Task 4.2:** Calcular stats dinamicamente
  - Arquivo: `HistoryPage.tsx`
  - Remover: Valores hardcoded ("4", "R$ 215")
  - Calcular: totalServices, totalRevenue, avgRating, avgTicket
  - Teste: Stats refletem dados reais

### 3.5.5 Prioridade 5: BookingPage Validação ⏳
**Tempo:** 10 min + 5 min teste

- [ ] **Task 5.1:** Verificar se BookingPage usa dados reais
  - Arquivo: `BookingPage.tsx`
  - Ação: Confirmar uso de `useServices()` (não mock)
  - Teste: Criar serviço → Deve aparecer em Booking

### 3.5.6 Validação Final (Fluxo Completo) ⏳
**Tempo:** 35 min

- [ ] **Teste 1:** Criar Serviço → Aparece em Appointments select
- [ ] **Teste 2:** Criar Cliente → "Total Clientes" aumenta (Dashboard)
- [ ] **Teste 3:** Criar Agendamento → Aparece em Dashboard/Appointments/Agenda
- [ ] **Teste 4:** Concluir Agendamento → Cria transação + Aparece em History
- [ ] **Teste 5:** Criar Transação → Atualiza "Receita Hoje"

**Resultado Esperado:**
- ✅ 100% dados reais (6/6 features)
- ✅ Dashboard totalmente reativo
- ✅ Fluxo completo funcional
- ✅ Pronto para testes E2E assertivos

---

## 🚧 FASE 3: Testes E2E - PAUSADO (95%)

**Duração Estimada:** 3-5 dias  
**Status:** 🟡 95% Concluído (20/21 testes passando)  
**Início:** 15/10/2025

### 3.1 Setup Playwright ✅
- [x] Instalar Playwright
- [x] Configurar playwright.config.ts
- [x] Criar scripts npm (test:e2e, test:e2e:ui, test:e2e:debug)
- [x] Configurar base URL (localhost:3000)
- [x] Criar usuário de teste no Firebase
- [x] Documentar configuração

### 3.2 Testes por Feature

#### ✅ Feature 1: Autenticação (6/6 - 100%)
- [x] deve fazer login com sucesso
- [x] deve mostrar erro com credenciais inválidas
- [x] deve navegar para página de registro
- [x] deve exibir campo de nome completo no cadastro
- [x] deve ter botão de continuar com Google
- [x] deve ter botão de continuar sem login
- **Arquivo:** `e2e/auth.spec.ts`
- **Tempo:** 11.3s

#### ✅ Feature 2: Dashboard (4/4 - 100%)
- [x] deve exibir stats cards
- [x] deve exibir agendamentos recentes
- [x] deve abrir modal de novo agendamento
- [x] deve navegar entre as seções usando bottom nav
- **Arquivo:** `e2e/dashboard.spec.ts`
- **Tempo:** 9.7s

#### ✅ Feature 3: Clientes CRUD (5/5 - 100%)
- [x] deve exibir lista de clientes
- [x] deve buscar cliente por nome
- [x] deve abrir modal de novo cliente
- [x] deve filtrar clientes por status
- [x] deve criar novo cliente
- **Arquivo:** `e2e/clients.spec.ts`
- **Tempo:** 18.0s
- **Bugs Corrigidos:** data-testid adicionado

#### ⚠️ Feature 4: Appointments (5/6 - 83%)
- [x] deve navegar para página de agendamentos
- [x] deve exibir lista de agendamentos
- [x] deve abrir modal de novo agendamento
- [ ] ⏭️ deve criar novo agendamento (SKIP - timeout 45s)
- [x] deve filtrar agendamentos
- [x] deve visualizar detalhes de agendamento
- **Arquivo:** `e2e/appointments.spec.ts`
- **Tempo:** 10.9s (com skip)
- **Problemas Conhecidos:** Teste de criação com timeout persistente

#### 📋 Feature 5: Agenda (3 Views) - PENDENTE
- [ ] deve exibir agenda em modo Timeline
- [ ] deve exibir agenda em modo Kanban
- [ ] deve exibir agenda em modo Calendar
- [ ] deve alternar entre os 3 modos de visualização
- [ ] deve filtrar por profissional
- [ ] deve filtrar por data
- [ ] deve criar agendamento via modal
- [ ] deve arrastar e soltar cards (drag & drop)
- **Arquivo:** `e2e/agenda.spec.ts`
- **Testes Esperados:** ~8 testes

#### 📋 Feature 6: Financial - PENDENTE
- [ ] deve exibir resumo financeiro
- [ ] deve listar transações
- [ ] deve criar nova receita
- [ ] deve criar nova despesa
- [ ] deve filtrar por período
- [ ] deve filtrar por tipo
- **Arquivo:** `e2e/financial.spec.ts`
- **Testes Esperados:** ~6 testes

#### 📋 Feature 7: Profile - PENDENTE
- [ ] deve exibir dados do perfil
- [ ] deve editar informações básicas
- [ ] deve alterar senha
- **Arquivo:** `e2e/profile.spec.ts`
- **Testes Esperados:** ~3 testes

#### 📋 Feature 8: Settings - Shop - PENDENTE
- [ ] deve adicionar profissional
- [ ] deve editar horário de funcionamento
- [ ] deve configurar métodos de pagamento
- [ ] deve editar informações da barbearia
- [ ] deve fazer upload de logo/capa
- **Arquivo:** `e2e/settings-shop.spec.ts`
- **Testes Esperados:** ~5 testes

#### 📋 Feature 9: Settings - Services - PENDENTE
- [ ] deve listar serviços
- [ ] deve criar novo serviço
- [ ] deve editar serviço
- [ ] deve excluir serviço
- **Arquivo:** `e2e/settings-services.spec.ts`
- **Testes Esperados:** ~4 testes

#### 📋 Feature 10: Settings - App - PENDENTE
- [ ] deve visualizar configurações do app
- [ ] deve alterar notificações
- [ ] deve fazer logout
- **Arquivo:** `e2e/settings-app.spec.ts`
- **Testes Esperados:** ~3 testes

#### 📋 Feature 11: History - PENDENTE
- [ ] deve exibir histórico de atendimentos
- [ ] deve filtrar por período
- [ ] deve buscar por cliente
- [ ] deve visualizar detalhes de atendimento
- **Arquivo:** `e2e/history.spec.ts`
- **Testes Esperados:** ~4 testes

#### 📋 Feature 12: Booking (Public) - PENDENTE
- [ ] deve acessar página pública sem login
- [ ] deve visualizar serviços disponíveis
- [ ] deve selecionar profissional
- [ ] deve selecionar data e horário
- [ ] deve gerar link WhatsApp
- **Arquivo:** `e2e/booking.spec.ts`
- **Testes Esperados:** ~5 testes

### 3.3 Métricas e Qualidade
- [x] Criar relatório de progresso
- [x] Documentar padrões de correção
- [x] Screenshots on failure
- [x] Videos on failure
- [ ] Relatório final com screenshots
- [ ] Coverage report

**Documentação:**
- [docs/TESTE_E2E_PROGRESSO.md](./docs/TESTE_E2E_PROGRESSO.md) - Relatório completo
- [docs/PLAYWRIGHT_SETUP_COMPLETO.md](./docs/PLAYWRIGHT_SETUP_COMPLETO.md)
- [docs/GUIA_MCP_PLAYWRIGHT.md](./docs/GUIA_MCP_PLAYWRIGHT.md)

**Estatísticas Atuais:**
- **Features Testadas:** 4/12 (33%)
- **Testes Passando:** 20/21 (95%)
- **Testes Falhando:** 0
- **Testes Pulados:** 1
- **Tempo Total:** ~2 minutos

---

## 📋 FASE 4: Features Avançadas - PLANEJADO

**Duração Estimada:** 5-7 dias  
**Status:** ⏳ Aguardando Fase 3

### 4.1 Notificações Real-Time
- [ ] Sistema de notificações com Firestore listeners
- [ ] Notificações de novos agendamentos
- [ ] Notificações de cancelamentos
- [ ] Notificações de lembretes (30min antes)
- [ ] Contador de notificações não lidas
- [ ] Marcar como lida/não lida
- [ ] Limpar todas as notificações

### 4.2 Relatórios e Exports
- [ ] Export de agendamentos para PDF
- [ ] Export de relatório financeiro para Excel
- [ ] Gráficos de receita mensal (Chart.js)
- [ ] Gráficos de agendamentos por serviço
- [ ] Gráficos de performance por profissional
- [ ] Relatório de clientes VIP

### 4.3 Filtros Avançados
- [ ] Filtro multi-select de serviços
- [ ] Filtro por faixa de preço
- [ ] Filtro por rating de cliente
- [ ] Filtro combinado (AND/OR)
- [ ] Salvar filtros personalizados
- [ ] Busca global inteligente

### 4.4 WhatsApp Integration
- [ ] Template de mensagem customizável
- [ ] Confirmação automática via WhatsApp
- [ ] Lembrete automático 24h antes
- [ ] Lembrete automático 1h antes
- [ ] Link de cancelamento via WhatsApp
- [ ] Pesquisa de satisfação pós-atendimento

### 4.5 Sistema de Avaliações
- [ ] Cliente avaliar atendimento (1-5 estrelas)
- [ ] Cliente deixar comentário
- [ ] Profissional visualizar avaliações
- [ ] Dashboard de avaliações
- [ ] Badge de melhor profissional
- [ ] Responder avaliações

---

## ⚡ FASE 5: Performance e Otimização - PLANEJADO

**Duração Estimada:** 2-3 dias  
**Status:** ⏳ Aguardando Fase 4

### 5.1 Code Splitting
- [ ] Lazy loading de páginas
- [ ] Dynamic imports para modais
- [ ] Suspense boundaries
- [ ] Error boundaries

### 5.2 Bundle Optimization
- [ ] Análise de bundle (Vite Bundle Analyzer)
- [ ] Tree shaking
- [ ] Minificação agressiva
- [ ] Remover código morto

### 5.3 Image Optimization
- [ ] Lazy loading de imagens
- [ ] WebP format
- [ ] Placeholder blur
- [ ] Responsive images

### 5.4 Lighthouse Audit
- [ ] Performance > 90
- [ ] Accessibility > 90
- [ ] Best Practices > 90
- [ ] SEO > 90

### 5.5 PWA Setup
- [ ] Service Worker
- [ ] Manifest.json
- [ ] Offline support
- [ ] Install prompt
- [ ] Push notifications

---

## 🧪 FASE 6: Qualidade e Testes - PLANEJADO

**Duração Estimada:** 3-4 dias  
**Status:** ⏳ Aguardando Fase 5

### 6.1 Unit Tests (Stores)
- [ ] AuthStore tests
- [ ] AppointmentsStore tests
- [ ] ClientsStore tests
- [ ] FinancialStore tests
- [ ] ServicesStore tests
- [ ] BarbershopStore tests
- [ ] NotificationsStore tests
- [ ] UIStore tests
- [ ] Coverage > 80%

### 6.2 Integration Tests (Hooks)
- [ ] useAuth tests
- [ ] useAppointments tests
- [ ] useClients tests
- [ ] useFinancial tests
- [ ] useServices tests
- [ ] useBarbershop tests
- [ ] useNotifications tests
- [ ] useUI tests
- [ ] Coverage > 70%

### 6.3 E2E Tests (Completos)
- [ ] Completar Features 5-12
- [ ] Testes de fluxos críticos
- [ ] Testes de edge cases
- [ ] Testes de erros
- [ ] Coverage > 90%

### 6.4 Error Handling
- [ ] Error boundaries globais
- [ ] Error tracking (Sentry)
- [ ] User-friendly error messages
- [ ] Retry mechanisms
- [ ] Fallback UI

### 6.5 Monitoring
- [ ] Google Analytics 4
- [ ] Firebase Analytics
- [ ] Custom events tracking
- [ ] User behavior flow
- [ ] Conversion tracking

---

## 🚀 FASE 7: Deploy e Produção - PLANEJADO

**Duração Estimada:** 1-2 dias  
**Status:** ⏳ Aguardando Fase 6

### 7.1 CI/CD Pipeline
- [ ] GitHub Actions workflow
- [ ] Automated tests on PR
- [ ] Automated build on merge
- [ ] Automated deploy to Firebase
- [ ] Rollback strategy

### 7.2 Environment Management
- [ ] Development environment
- [ ] Staging environment
- [ ] Production environment
- [ ] Environment-specific configs
- [ ] Secret management

### 7.3 Domain & SSL
- [ ] Custom domain setup
- [ ] SSL certificate (Let's Encrypt)
- [ ] DNS configuration
- [ ] Redirect HTTP → HTTPS
- [ ] WWW redirect

### 7.4 Monitoring & Alerts
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Error rate alerts
- [ ] Performance monitoring
- [ ] Firebase Crashlytics
- [ ] Weekly health reports

### 7.5 Backup & Recovery
- [ ] Automated Firestore backup
- [ ] Backup retention policy (30 days)
- [ ] Disaster recovery plan
- [ ] Restore testing
- [ ] Documentation

---

## 📊 Métricas Gerais do Projeto

### Progresso por Fase
```
FASE 1 (Segurança)        ████████████████████ 100%
FASE 2 (Arquitetura)      ████████████████████ 100%
FASE 3 (Testes E2E)       ███████████████████░  95%
FASE 4 (Features Avançad) ░░░░░░░░░░░░░░░░░░░░   0%
FASE 5 (Performance)      ░░░░░░░░░░░░░░░░░░░░   0%
FASE 6 (Qualidade)        ░░░░░░░░░░░░░░░░░░░░   0%
FASE 7 (Deploy)           ░░░░░░░░░░░░░░░░░░░░   0%
```

### Tempo Investido
- **FASE 1:** 2 horas
- **FASE 2:** 2 dias
- **FASE 3:** ~4 horas (em progresso)
- **Total até agora:** ~2,5 dias

### Estimativa de Conclusão
- **Fases Restantes:** 4, 5, 6, 7
- **Tempo Estimado:** 11-16 dias
- **Conclusão Prevista:** ~2-3 semanas

---

## 🎯 Próximos Passos Imediatos

### Esta Sessão (Hoje)
1. ✅ ~~Organizar documentação na pasta docs/~~
2. ✅ ~~Atualizar README.md~~
3. ✅ ~~Criar TESTE_E2E_PROGRESSO.md~~
4. ⏳ **Testar Feature 5: Agenda (próximo)**
5. ⏳ Testar Features 6-12
6. ⏳ Investigar timeout do teste de appointments

### Próxima Sessão
1. Completar Feature 5-8 (Agenda, Financial, Profile, Settings)
2. Completar Features 9-12 (Services, App, History, Booking)
3. Gerar relatório final com 100% de cobertura
4. Marcar FASE 3 como COMPLETA ✅

### Semana Atual
1. Iniciar FASE 4 (Features Avançadas)
2. Implementar notificações real-time
3. Adicionar export de relatórios
4. Melhorar filtros

---

## 📝 Notas de Desenvolvimento

### Lições Aprendidas (FASE 3)
1. **Seletores E2E:** Usar `placeholder` ao invés de `name` em inputs
2. **Navegação:** URL direta mais confiável que cliques (`page.goto('/#/clients')`)
3. **Botões de Submit:** Verificar texto exato ("Criar", "Cadastrar", "Atualizar")
4. **Validação Flexível:** Aceitar múltiplos cenários de sucesso (modal fecha OU botão retorna)
5. **data-testid:** Adicionar em componentes para facilitar E2E tests

### Decisões Técnicas
- **Zustand** escolhido para state management (mais leve que Redux)
- **Playwright** escolhido para E2E (melhor que Cypress para multi-browser)
- **Zod** para validação (type-safe e composable)
- **Feature-based structure** (melhor organização que pages/)

### Pendências Técnicas
- [ ] Investigar timeout no teste de criar appointment
- [ ] Adicionar `name` attributes aos inputs (acessibilidade)
- [ ] Implementar skeleton loaders
- [ ] Adicionar error boundaries
- [ ] Otimizar re-renders desnecessários

---

**Mantido por:** [Victor] (v7developer)  
**Última Revisão:** 15/10/2025 - 20:45  
**Próxima Revisão:** Após completar Feature 5 (Agenda)
