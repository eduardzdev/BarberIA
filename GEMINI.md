# GEMINI.md - Contexto do Projeto BarberIA

Este arquivo contém informações essenciais sobre o projeto **BarberIA** para contextualizar o agente Gemini.

## 📌 Visão Geral do Projeto

**BarberIA** é uma plataforma SaaS **Mobile-First** para gerenciamento de barbearias. O sistema permite que profissionais gerenciem sua agenda, clientes e finanças, e oferece uma interface pública para clientes finais realizarem pré-agendamentos (que são confirmados via WhatsApp).

### Stack Tecnológico
*   **Frontend:** React 18, TypeScript, Vite
*   **Estilização:** Tailwind CSS (Mobile-first, Dark Mode exclusivo)
*   **State Management:** Zustand (8 stores especializados)
*   **Backend (BaaS):** Firebase (Auth, Firestore, Hosting, App Check)
*   **Roteamento:** React Router (BrowserRouter)
*   **Testes E2E:** Playwright
*   **Validação:** Zod
*   **Ícones:** React Icons

---

## 🏗️ Arquitetura e Estrutura

O projeto segue uma arquitetura baseada em **features** (`src/features`), separando logicamente os domínios da aplicação.

### Estrutura de Diretórios (`src/`)

*   **`features/`**: Módulos principais. Cada feature contém seus próprios componentes, páginas e hooks específicos se necessário.
    *   `auth`: Login, Registro, Recuperação de senha.
    *   `dashboard`: Visão geral, KPIs, Gráficos.
    *   `agenda`: Visualizações de calendário, kanban e timeline.
    *   `appointments`: CRUD de agendamentos.
    *   `clients`: Gestão de clientes.
    *   `financial`: Controle de caixa (receitas/despesas).
    *   `profile`: Configuração do perfil da barbearia.
    *   `settings`: Configurações gerais (Serviços, Loja, App).
    *   `booking`: Página pública de agendamento (externa).
    *   `history`: Histórico de atividades.
*   **`store/`**: Estado global gerenciado pelo **Zustand**.
    *   Ex: `auth.store.ts`, `appointments.store.ts`, `ui.store.ts`.
*   **`hooks/`**: Custom hooks que conectam componentes às stores e services.
    *   Padrão: `useAppointments`, `useAuth`, `useClients`.
*   **`services/`**: Camada de comunicação com o Firebase.
    *   `base.service.ts`: Classe genérica para CRUD Firestore.
    *   `appointment.service.ts`: Lógica específica de agendamentos.
*   **`components/`**: Componentes reutilizáveis globais (`Button`, `Input`, `Modal`, `Layout`).
*   **`lib/`**: Configurações de bibliotecas (Firebase, Zod).

### Fluxo de Dados
1.  **Componente** chama um **Hook** (ex: `useAppointments`).
2.  **Hook** interage com a **Store** (Zustand).
3.  **Store** chama o **Service** (Firebase).
4.  **Service** executa a operação no Firestore.
5.  Estado é atualizado reativamente.

---

## 🚀 Comandos de Desenvolvimento

| Ação | Comando | Descrição |
| :--- | :--- | :--- |
| **Iniciar Dev Server** | `npm run dev` | Roda em `http://localhost:3000` |
| **Build de Produção** | `npm run build` | Gera arquivos estáticos em `dist/` |
| **Preview Build** | `npm run preview` | Testa o build localmente |
| **Testes E2E** | `npm run test:e2e` | Executa testes do Playwright |
| **Lint** | `npm run lint` | Verifica tipos TypeScript |
| **Deploy** | `firebase deploy` | Publica no Firebase Hosting |

---

## 📝 Convenções de Código

### TypeScript & React
*   **Estrito:** Sem `any`. Tipagem forte em todas as interfaces.
*   **Componentes Funcionais:** Uso exclusivo de Hooks.
*   **Alias:** Use `@/` para imports (ex: `import Button from '@/components/Button'`).
*   **Nomeação:** PascalCase para componentes, camelCase para funções/hooks.

### Estilização (Tailwind)
*   **Dark Mode:** O app é nativamente escuro (slate-950).
*   **Mobile-First:** Layouts pensados primariamente para telas pequenas.
*   **Cores:** Uso intensivo de `slate` (backgrounds) e `violet` (primary).

### Firebase
*   **Segurança:** Regras do Firestore rigorosas (`firestore.rules`).
*   **App Check:** Proteção com reCAPTCHA v3 habilitada.
*   **Coleções:** Estrutura aninhada por usuário: `barbershops/{userId}/{collection}`.

### Testes (Playwright)
*   Locators resilientes (ex: `getByRole`, `getByPlaceholder`).
*   Evitar locators acoplados a implementação (ex: seletores CSS complexos).

---

## 🛡️ Segurança e Performance (Remediações Recentes)

Para mitigar riscos identificados em auditoria técnica, as seguintes melhorias foram implementadas:

### 1. Proteção de Dados (LGPD/GDPR)
*   **Coleção `availability`:** Criada para armazenar apenas dados de disponibilidade (data, hora, barbeiro, duração) para consulta pública.
*   **Isolamento de PII:** A coleção `appointments` (contendo nomes e telefones de clientes) agora é acessível **apenas** por usuários autenticados (barbeiros).
*   **Sincronização:** O `AppointmentService` sincroniza automaticamente criações, edições e deleções para a coleção `availability`.

### 2. Otimização de Custos e Performance
*   **Paginação Firestore:** Implementada paginação baseada em cursor (`fetchRecentAppointments`, `fetchMoreAppointments`) para evitar carregamento massivo de dados.
*   **Estimativa de Total:** Sistema de contagem aproximada (`estimatedTotal`) que mostra "100 de ~350 agendamentos" sem queries extras.
*   **Exportação Eficiente:** Sistema de export para Excel com suporte a grandes datasets, respeitando filtros e paginação.
*   **Limites de Segurança:**
    *   **Histórico:** Carga inicial de 100 itens + botão "Carregar Mais" (50 itens).
    *   **Agenda/Dashboard:** Limite fixo de 50 agendamentos futuros.
    *   **Geral:** Limite de segurança de 200 itens em buscas globais.
*   **Base Service:** A classe `BaseService` agora suporta nativamente o parâmetro `limitCount`.

---

## 🚀 Próximos Passos para Crescimento

Melhorias recomendadas para otimização de longo prazo:

### 1. Server-Side Filters via Cloud Functions
**O que é:** Mover filtros de busca (por cliente, serviço, período) para o backend usando Cloud Functions.

**Por que é importante:**
- Atualmente, para buscar "João" no histórico, precisamos carregar 1.000 agendamentos no cliente e filtrar em JavaScript = 1.000 leituras Firestore
- Com Cloud Functions: mesma busca = 10-50 leituras (apenas resultados relevantes)
- Economia de 95% em reads quando dataset > 10.000 appointments
- Permite buscas complexas (fuzzy search, regex) sem impacto de performance

**Quando implementar:** Dataset > 10.000 agendamentos ou quando usuários reclamarem de lentidão em buscas

**Tempo estimado:** 8-12 horas

### 2. Infinite Scroll
**O que é:** Substituir botão "Carregar Mais" por carregamento automático ao rolar a página.

**Por que é importante:**
- UX mais moderna e fluida (similar a Instagram/Twitter)
- Reduz cliques manuais do usuário
- Melhora percepção de velocidade da aplicação

**Quando implementar:** Quando usuários frequentemente clicam "Carregar Mais" múltiplas vezes

**Tempo estimado:** 4-6 horas

### 3. Testes E2E para Paginação
**O que é:** Testes automatizados com Playwright para validar comportamento de paginação.

**Por que é importante:**
- Previne regressões ao adicionar novas features
- Garante que paginação funciona com datasets grandes
- Valida que estimativas de total estão corretas

**Quando implementar:** Antes de lançar para produção com múltiplos usuários

**Tempo estimado:** 3-4 horas

### 4. Auto-Archival (>2 anos)
**O que é:** Mover automaticamente agendamentos com mais de 2 anos para uma collection de arquivo.

**Por que é importante:**
- Mantém collection principal leve (queries mais rápidas)
- Reduz custos de leitura em operações diárias
- Dados antigos ainda acessíveis quando necessário

**Quando implementar:** Quando tiver ~5.000+ agendamentos históricos

**Tempo estimado:** 6-8 horas

### 5. Dashboard de Custos
**O que é:** Painel para monitorar leituras Firestore em tempo real e estimar custos mensais.

**Por que é importante:**
- Visibilidade sobre padrões de uso
- Alertas quando custos excedem limites
- Identificação de queries problemáticas

**Quando implementar:** Quando ultrapassar 50% da cota gratuita do Firebase

**Tempo estimado:** 8-12 horas

---

## 🔑 Configuração de Ambiente

As variáveis de ambiente ficam em `.env.local` (não comitado).
Prefixos obrigatórios: `VITE_FIREBASE_*`.

Exemplo de chaves críticas:
*   `VITE_FIREBASE_API_KEY`
*   `VITE_FIREBASE_PROJECT_ID`
*   `VITE_FIREBASE_APP_CHECK_KEY`
