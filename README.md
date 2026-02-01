# 💈 BarberIA

<div align="center">
  
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Sistema SaaS Mobile-First para Gerenciamento de Barbearias**

[🚀 Demo](https://saas-barbearia-8d49a.web.app) • [📚 Documentação](#-documentação) • [🐛 Reportar Bug](https://github.com/seu-usuario/agendabarber/issues) • [✨ Solicitar Feature](https://github.com/seu-usuario/agendabarber/issues)

</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Começando](#-começando)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Documentação](#-documentação)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Roadmap](#-roadmap)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Sobre o Projeto

**BarberIA** é uma plataforma SaaS completa para gerenciamento de barbearias, oferecendo:

- 📱 **Interface Mobile-First** - Experiência otimizada para dispositivos móveis
- 👨‍💼 **Dashboard Profissional** - Controle completo da barbearia
- 📅 **Sistema de Agendamentos** - Gestão inteligente de horários
- 💰 **Controle Financeiro** - Relatórios e métricas em tempo real
- 🔗 **Integração WhatsApp** - Agendamento direto pelo WhatsApp
- 🌙 **Dark Theme Exclusivo** - Design moderno em tons escuros

### 🎨 Design Philosophy

- **Mobile-First**: Container `max-w-md` simulando experiência mobile
- **Dark Theme**: Paleta Slate + acentos Violet
- **Touch-Optimized**: Interações pensadas para touch
- **Portuguese Localization**: 100% em Português BR

---

## ✨ Funcionalidades

### 👨‍💼 Para Profissionais (Dashboard)

- ✅ Autenticação Firebase (Email/Password + Google)
- 📊 Dashboard com métricas em tempo real
- 📅 Gestão completa de agendamentos
- 👥 Cadastro e histórico de clientes
- 💰 Controle financeiro (receitas e despesas)
- 🏪 Configurações da barbearia
- ⚙️ Gerenciamento de serviços e preços
- 🔔 Notificações em tempo real

### 👤 Para Clientes (Tela Pública)

- 📱 Agendamento sem necessidade de login
- 🔍 Visualização de serviços e preços
- 👨‍🔧 Escolha de profissional
- 📅 Seleção de data e horário
- 💳 Opção de pagamento online (5% desconto)
- 📲 Confirmação via WhatsApp

---

## 🛠️ Tecnologias

### Core

- **[React 18](https://react.dev/)** - Biblioteca UI
- **[TypeScript](https://www.typescriptlang.org/)** - Type Safety
- **[Vite](https://vitejs.dev/)** - Build Tool
- **[React Router](https://reactrouter.com/)** - Roteamento

### Styling

- **[TailwindCSS](https://tailwindcss.com/)** - Utility-First CSS
- **[React Icons](https://react-icons.github.io/react-icons/)** - Ícones

### Backend & Auth

- **[Firebase Auth](https://firebase.google.com/docs/auth)** - Autenticação
- **[Cloud Firestore](https://firebase.google.com/docs/firestore)** - Banco de Dados
- **[Firebase Hosting](https://firebase.google.com/docs/hosting)** - Deploy

### Quality & Tooling

- **[Zustand](https://zustand-demo.pmnd.rs/)** - State Management
- **[Zod](https://zod.dev/)** - Validação de dados
- **[Playwright](https://playwright.dev/)** - Testes E2E
- **[Vitest](https://vitest.dev/)** - Testing Framework
- **[ESLint](https://eslint.org/)** - Linting
- **[Prettier](https://prettier.io/)** - Formatação

### Current Status

- ✅ **FASE 1: Segurança** - COMPLETA (Firestore Rules, App Check, Zod)
- ✅ **FASE 2: Arquitetura** - COMPLETA (8 Stores, 8 Hooks, Service Layer, Feature-based)
- 🚧 **FASE 3: Testes E2E** - EM PROGRESSO (95% - 20/21 testes passando)
  - ✅ Feature 1: Autenticação (6/6 testes - 100%)
  - ✅ Feature 2: Dashboard (4/4 testes - 100%)
  - ✅ Feature 3: Clientes CRUD (5/5 testes - 100%)
  - ⚠️ Feature 4: Appointments (5/6 testes - 83%)
  - ⏳ Features 5-12: Pendentes

📊 **[Ver Progresso Completo dos Testes](./docs/TESTE_E2E_PROGRESSO.md)**

---

## 🚀 Começando

### Pré-requisitos

- **Node.js** 18.x ou superior
- **npm** ou **pnpm**
- Conta no **Firebase** (gratuita)

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/agendabarber.git
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env.local
   cp .env.example .env.production
   ```
   
   Edite `.env.local` para desenvolvimento e `.env.production` com as chaves reais de produção (não versionar):
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   # ... outras variáveis
   ```

4. **Configure o Firebase**
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
   - Ative **Authentication** (Email/Password e Google)
   - Crie um banco **Cloud Firestore**
   - Copie as credenciais para `.env.local`

5. **Aplique as Security Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

6. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

7. **Abra no navegador**
   ```
   http://localhost:3000
   ```

> ℹ️ Consulte o documento [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) para orientações completas de deploy seguro.

---

## 📁 Estrutura do Projeto

```
barberia/
├── .github/              # GitHub Actions & workflows
├── public/               # Arquivos públicos estáticos
├── src/
│   ├── components/       # Componentes reutilizáveis
│   │   ├── common/      # Componentes básicos (Button, Input, etc)
│   │   ├── forms/       # Componentes de formulário
│   │   └── layout/      # Componentes de layout
│   ├── features/         # Features por domínio
│   │   ├── auth/        # Autenticação
│   │   ├── appointments/# Agendamentos
│   │   ├── clients/     # Clientes
│   │   └── financial/   # Financeiro
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Configurações e utilitários
│   │   ├── firebase.ts  # Configuração Firebase
│   │   ├── validations.ts # Schemas Zod
│   │   └── utils.ts     # Funções utilitárias
│   ├── pages/            # Páginas da aplicação
│   ├── services/         # Camada de serviços (API)
│   ├── store/            # Gerenciamento de estado
│   ├── types/            # Tipos TypeScript
│   ├── App.tsx           # Componente raiz
│   └── main.tsx          # Entry point
├── firestore.rules       # Regras de segurança Firestore
├── firestore.indexes.json # Índices Firestore
├── firebase.json         # Configuração Firebase
├── vite.config.ts        # Configuração Vite
├── tsconfig.json         # Configuração TypeScript
├── tailwind.config.js    # Configuração TailwindCSS
└── package.json          # Dependências e scripts
```

---

## 📚 Documentação

A documentação completa do projeto está organizada na pasta **`docs/`**:

### 📋 Documentação Principal
- **[docs/EXECUTIVE_SUMMARY.md](./docs/EXECUTIVE_SUMMARY.md)** - Resumo executivo e visão geral
- **[docs/STATUS_PROJETO.md](./docs/STATUS_PROJETO.md)** - Status atual do desenvolvimento
- **[docs/ROADMAP_COMPLETO.md](./docs/ROADMAP_COMPLETO.md)** - Roadmap detalhado por fases

### 🏗️ Arquitetura & Design
- **[docs/ANALISE_COMPLETA_UI.md](./docs/ANALISE_COMPLETA_UI.md)** - Análise UI completa (19.500 palavras)
- **[docs/FLUXO_NAVEGACAO.md](./docs/FLUXO_NAVEGACAO.md)** - Fluxos de navegação (8.200 palavras)
- **[docs/DESCRICAO_FEATURES.md](./docs/DESCRICAO_FEATURES.md)** - Features detalhadas (23.800 palavras)
- **[docs/ESTADOS_ESPECIAIS.md](./docs/ESTADOS_ESPECIAIS.md)** - Estados UI (15.400 palavras)
- **[docs/RESUMO_EXECUTIVO.md](./docs/RESUMO_EXECUTIVO.md)** - Resumo técnico (3.100 palavras)

### 🔧 Implementação
- **[docs/IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md)** - Plano de implementação
- **[docs/REFACTORING_REPORT.md](./docs/REFACTORING_REPORT.md)** - Relatório de refatoração
- **[docs/CODE_EXAMPLES.md](./docs/CODE_EXAMPLES.md)** - Exemplos práticos de código
- **[docs/CONFIGURATIONS.md](./docs/CONFIGURATIONS.md)** - Configurações do projeto
- **[docs/DEPENDENCIAS.md](./docs/DEPENDENCIAS.md)** - Dependências e versões

### 🧪 Testes E2E
- **[docs/TESTE_E2E_PROGRESSO.md](./docs/TESTE_E2E_PROGRESSO.md)** - � Progresso dos testes (95% - 20/21 testes)
- **[docs/PLAYWRIGHT_SETUP_COMPLETO.md](./docs/PLAYWRIGHT_SETUP_COMPLETO.md)** - Setup Playwright completo
- **[docs/GUIA_MCP_PLAYWRIGHT.md](./docs/GUIA_MCP_PLAYWRIGHT.md)** - Guia MCP + Playwright
- **[docs/COPILOT_PLAYWRIGHT_COMANDOS.md](./docs/COPILOT_PLAYWRIGHT_COMANDOS.md)** - Comandos úteis
- **[docs/CHECKLIST_PLAYWRIGHT.md](./docs/CHECKLIST_PLAYWRIGHT.md)** - Checklist de testes

### 🔒 Segurança
- **[docs/GUIA_APP_CHECK_RECAPTCHA.md](./docs/GUIA_APP_CHECK_RECAPTCHA.md)** - Setup Firebase App Check
- **[docs/APP_CHECK_CONFIRMACAO.md](./docs/APP_CHECK_CONFIRMACAO.md)** - Confirmação de configuração
- **[docs/FASE_1_CONCLUIDA.md](./docs/FASE_1_CONCLUIDA.md)** - Fase de Segurança completa

### 📅 Histórico de Desenvolvimento
- **[docs/FASE_2_COMPLETO.md](./docs/FASE_2_COMPLETO.md)** - Fase 2 (Arquitetura) completa
- **[docs/FASE_2_PROGRESSO.md](./docs/FASE_2_PROGRESSO.md)** - Progresso da Fase 2
- **[docs/FASE_2_INICIO.md](./docs/FASE_2_INICIO.md)** - Kickoff da Fase 2
- **[docs/REVISAO_FINAL.md](./docs/REVISAO_FINAL.md)** - Revisão final do código
- **[docs/REFERENCIA_RAPIDA.md](./docs/REFERENCIA_RAPIDA.md)** - Referência rápida do projeto

### 📖 Guias Rápidos

- [Como executar testes E2E](./docs/COPILOT_PLAYWRIGHT_COMANDOS.md)
- [Como configurar Firebase](./docs/GUIA_APP_CHECK_RECAPTCHA.md)
- [Como adicionar uma nova feature](./docs/CODE_EXAMPLES.md)
- [Boas práticas do projeto](./docs/ANALISE_COMPLETA_UI.md)

---

## 🎮 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento (porta 3000)

# Build
npm run build            # Build para produção (valida variáveis obrigatórias)
npm run preview          # Preview do build com validação de variáveis

# Qualidade
npm run lint             # Roda verificação TypeScript
npm run type-check       # Verifica tipos TypeScript

# Testes E2E
npm run test:e2e         # Roda todos os testes E2E
npm run test:e2e:ui      # Interface UI para testes Playwright
npm run test:e2e:debug   # Debug de testes com DevTools
npx playwright test e2e/auth.spec.ts  # Roda arquivo específico

# Firebase
firebase deploy          # Deploy completo
firebase deploy --only hosting  # Deploy apenas hosting
firebase deploy --only firestore:rules  # Deploy apenas rules
```

---

## 🗺️ Roadmap

### ✅ Fase 1: Segurança (COMPLETA)
- [x] Variáveis de ambiente (.env.local)
- [x] Firestore Security Rules
- [x] Firebase App Check (reCAPTCHA v3)
- [x] Validação com Zod
- [x] Deploy de Rules

### ✅ Fase 2: Arquitetura (COMPLETA)
- [x] 8 Zustand Stores criadas
- [x] 8 Custom Hooks implementados
- [x] Service Layer (BaseService + especializados)
- [x] Refatoração pages.tsx (4.100+ linhas extraídas)
- [x] Feature-based structure
- [x] Zero TypeScript errors

### 🚧 Fase 3: Testes E2E (EM PROGRESSO - 95%)
- [x] Playwright instalado e configurado
- [x] Feature 1: Autenticação (6/6 testes - 100%)
- [x] Feature 2: Dashboard (4/4 testes - 100%)
- [x] Feature 3: Clientes CRUD (5/5 testes - 100%)
- [x] Feature 4: Appointments (5/6 testes - 83%)
- [ ] Feature 5: Agenda (3 views)
- [ ] Feature 6: Financial
- [ ] Feature 7: Profile
- [ ] Features 8-12: Settings, History, Booking

📊 **[Ver Progresso Detalhado](./docs/TESTE_E2E_PROGRESSO.md)**

### 📋 Fase 4: Features Avançadas (PLANEJADO)
- [ ] Notificações real-time
- [ ] Export de relatórios (PDF, Excel)
- [ ] Filtros avançados
- [ ] Dashboard com gráficos (Chart.js)
- [ ] Sistema de avaliações
- [ ] Chat interno

### ⚡ Fase 5: Performance (PLANEJADO)
- [ ] Code splitting
- [ ] Lazy loading de rotas
- [ ] Image optimization
- [ ] Bundle analysis
- [ ] Lighthouse audit (90+ score)
- [ ] PWA setup

### 🧪 Fase 6: Qualidade (PLANEJADO)
- [ ] Unit tests (stores)
- [ ] Integration tests (hooks)
- [ ] E2E tests completos (100%)
- [ ] Error boundaries
- [ ] Analytics integration
- [ ] Sentry integration

### 🚀 Fase 7: Deploy & Produção (PLANEJADO)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Environment configs
- [ ] Custom domain
- [ ] SSL certificate
- [ ] Monitoring e alertas
- [ ] Backup automático

---

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### 📝 Padrões de Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona nova feature
fix: corrige bug
docs: atualiza documentação
style: formatação, lint
refactor: refatoração de código
test: adiciona testes
chore: tarefas de manutenção
```

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

---

## 👥 Autores

- **Seu Nome** - *Trabalho Inicial* - [seu-usuario](https://github.com/seu-usuario)

---

## 🙏 Agradecimentos

- Firebase Team pela excelente plataforma
- React Team pelas inovações constantes
- Comunidade open-source

---

## 📞 Contato

**Email**: seu-email@example.com  
**LinkedIn**: [seu-perfil](https://linkedin.com/in/seu-perfil)  
**Website**: [seu-website.com](https://seu-website.com)

---

<div align="center">

**[⬆ Voltar ao topo](#-barberia)**

Feito com ❤️ e muito ☕

</div>
