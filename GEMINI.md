# GEMINI.md - Contexto do Projeto BarberIA

Este arquivo contém informações essenciais sobre o projeto **BarberIA** para contextualizar o agente Gemini.

## 📌 Visão Geral do Projeto

**BarberIA** é uma plataforma SaaS **Mobile-First** para gerenciamento de barbearias. O sistema permite que profissionais gerenciem sua agenda, clientes e finanças, e oferece uma interface pública para clientes finais realizarem pré-agendamentos (que são confirmados via WhatsApp).

### Stack Tecnológico
*   **Frontend:** React 18, TypeScript, Vite
*   **Estilização:** Tailwind CSS (Mobile-first, Dark Mode exclusivo)
*   **State Management:** Zustand (8 stores especializados)
*   **Backend (BaaS):** Firebase (Auth, Firestore, Hosting, App Check)
*   **Roteamento:** React Router (HashRouter)
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

## 🔑 Configuração de Ambiente

As variáveis de ambiente ficam em `.env.local` (não comitado).
Prefixos obrigatórios: `VITE_FIREBASE_*`.

Exemplo de chaves críticas:
*   `VITE_FIREBASE_API_KEY`
*   `VITE_FIREBASE_PROJECT_ID`
*   `VITE_FIREBASE_APP_CHECK_KEY`
