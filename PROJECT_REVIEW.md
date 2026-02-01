# 📊 Revisão Técnica do Projeto - AgendaBarber
## Avaliação de Desenvolvimento Sênior

---

## 📋 Resumo Executivo

**Projeto:** AgendaBarber - Sistema SaaS de Gerenciamento de Barbearias  
**Tecnologias:** React 18, TypeScript, Vite, TailwindCSS, Firebase  
**Linhas de Código:** ~2.211 linhas  
**Data da Revisão:** Outubro 2025  
**Revisor:** Desenvolvedor Sênior

---

## 🔐 1. SEGURANÇA - Nota: 4.5/10

### ⚠️ Vulnerabilidades Críticas Identificadas

#### 1.1 Exposição de Credenciais Firebase (CRÍTICO)
**Problema:** Chaves de API Firebase expostas diretamente no código-fonte (`src/firebase.ts`)
```typescript
const firebaseConfig = {
  apiKey: "AIzaSyDkKVoLLlKtzdScoc40AhOlAAHlY5VeWGU", // ❌ EXPOSTO
  authDomain: "saas-barbearia-8d49a.firebaseapp.com",
  projectId: "saas-barbearia-8d49a",
  // ...
};
```

**Impacto:** 
- Qualquer pessoa com acesso ao código pode usar estas credenciais
- Risco de abuso da conta Firebase
- Possibilidade de vazamento no repositório Git

**Recomendação:**
- Mover todas as configurações sensíveis para variáveis de ambiente
- Adicionar `.env.local` ao `.gitignore` (já está)
- Usar `import.meta.env.VITE_FIREBASE_API_KEY` no código
- Documentar setup de variáveis de ambiente no README

#### 1.2 Vulnerabilidades de Dependências (ALTO)
**Problemas Detectados:**
- 12 vulnerabilidades moderadas identificadas via `npm audit`
- `undici` (6.0.0 - 6.21.1): Uso de valores insuficientemente aleatórios + DoS
- `esbuild` (<=0.24.2): Permite requisições não autorizadas ao dev server
- Múltiplas vulnerabilidades transitivas no Firebase SDK

**Pacotes Afetados:**
- `@firebase/auth`
- `@firebase/firestore`
- `@firebase/functions`
- `@firebase/storage`
- `vite` (via esbuild)

**Recomendação:**
```bash
npm audit fix  # Resolve issues sem breaking changes
npm update firebase  # Atualizar para versão mais recente
```

#### 1.3 Ausência de Validação de Entrada
**Problema:** Formulários não validam entrada do usuário adequadamente
- Emails não são validados antes do envio
- Telefones não possuem formato validado
- Campos numéricos aceitam valores não numéricos

**Recomendação:**
- Implementar biblioteca de validação (Zod, Yup)
- Adicionar validação client-side e server-side
- Sanitizar todas as entradas de usuário

#### 1.4 Proteção CSRF/XSS
**Status:** Não implementado
- Sem proteção contra Cross-Site Scripting
- Conteúdo dinâmico renderizado sem sanitização
- URLs externas (WhatsApp) não validadas

**Recomendação:**
- Usar `dangerouslySetInnerHTML` com extrema cautela
- Validar e sanitizar todas as URLs geradas dinamicamente
- Implementar Content Security Policy (CSP)

### ✅ Aspectos Positivos
- Firebase Auth configurado corretamente com email/password + Google
- Uso de HTTPS obrigatório via Firebase Hosting
- Tratamento de erros de autenticação implementado
- Proteção de rotas autenticadas implementada

---

## 🏗️ 2. ARQUITETURA - Nota: 5.5/10

### ⚠️ Problemas Arquiteturais

#### 2.1 Monolito de Páginas (CRÍTICO)
**Problema:** Todas as páginas em um único arquivo (`pages.tsx` - 1.412 linhas)

**Impactos:**
- Difícil manutenção e navegação
- Performance prejudicada (bundle único gigante)
- Conflitos em equipes (todos editando mesmo arquivo)
- Code review extremamente complexo
- Violação do princípio Single Responsibility

**Recomendação:**
```
src/pages/
  ├── LoginPage/
  │   ├── index.tsx
  │   ├── LoginForm.tsx
  │   └── styles.module.css
  ├── DashboardPage/
  │   ├── index.tsx
  │   ├── StatCard.tsx
  │   └── QuickActions.tsx
  ├── AppointmentsPage/
  │   └── index.tsx
  └── ...
```

#### 2.2 Ausência de Gerenciamento de Estado Global
**Problema:** Estado gerenciado apenas com useState local

**Impactos:**
- Props drilling em componentes aninhados
- Dificuldade em compartilhar estado entre páginas
- Lógica duplicada (ex: buscar appointments em múltiplas páginas)
- Performance: re-renders desnecessários

**Recomendação:**
- Implementar Context API para estado compartilhado
- Considerar Zustand ou Redux para apps maiores
- Criar hooks customizados (`useAppointments`, `useClients`)

#### 2.3 Dados Mockados Misturados com Lógica Real
**Problema:** Firebase parcialmente implementado, mas ainda usando MOCK_DATA

**Impactos:**
- Confusão sobre qual fonte de dados usar
- Testes não refletem comportamento real
- Migração gradual propensa a bugs

**Recomendação:**
```typescript
// Criar camada de abstração
interface DataService {
  getAppointments(): Promise<Appointment[]>;
  createAppointment(data: Appointment): Promise<void>;
}

class MockDataService implements DataService { /* ... */ }
class FirebaseDataService implements DataService { /* ... */ }

// Usar strategy pattern
const dataService = import.meta.env.VITE_USE_MOCK 
  ? new MockDataService() 
  : new FirebaseDataService();
```

#### 2.4 Ausência de Testes
**Problema:** Zero testes unitários, integração ou E2E

**Impactos:**
- Regressões não detectadas
- Refatoração arriscada
- Confiabilidade questionável
- Dificuldade em onboarding

**Recomendação:**
- Adicionar Vitest + React Testing Library
- Cobertura mínima: 70% para lógica de negócio
- Testes E2E com Playwright para fluxos críticos

### ✅ Aspectos Positivos
- Componentização básica bem estruturada
- Separação de concerns (components, pages, types, constants)
- TypeScript usado consistentemente
- React Router bem configurado
- Mobile-first design bem implementado

---

## 💻 3. QUALIDADE DE CÓDIGO - Nota: 6.5/10

### ⚠️ Problemas de Qualidade

#### 3.1 Componentes Muito Grandes
**Problema:** Componentes com múltiplas responsabilidades

**Exemplos:**
- `DashboardPage`: 200+ linhas com lógica de modais, formulários e listagens
- `AppointmentsPage`: Manipula estado, renderização e lógica de negócio

**Recomendação:**
- Separar lógica de apresentação (Container/Presentational pattern)
- Extrair formulários para componentes dedicados
- Criar custom hooks para lógica reutilizável

#### 3.2 Falta de Comentários e Documentação
**Problema:** Código sem JSDoc ou comentários explicativos

**Impacto:**
- Difícil entendimento para novos desenvolvedores
- Props sem documentação de tipo esperado
- Lógica complexa sem explicação

**Recomendação:**
```typescript
/**
 * Renderiza card de estatística no dashboard
 * @param icon - Nome do ícone do sistema (veja Icon.tsx)
 * @param title - Título da métrica
 * @param value - Valor principal a exibir
 * @param trend - Porcentagem de mudança (opcional)
 * @param trendUp - Se true, mostra tendência positiva
 */
const StatCard: React.FC<StatCardProps> = ({ /* ... */ }) => {
  // ...
}
```

#### 3.3 Hardcoded Strings e Magic Numbers
**Problema:** Strings e números espalhados pelo código

**Exemplos:**
- `"Confirmado"`, `"Pendente"` em múltiplos lugares
- Durações hardcoded (30, 60, 90 minutos)
- Cores (`violet-600`, `slate-900`) repetidas

**Recomendação:**
```typescript
// constants/ui.ts
export const COLORS = {
  primary: 'violet-600',
  background: 'slate-900',
  // ...
} as const;

// constants/business.ts
export const APPOINTMENT_DURATIONS = {
  SHORT: 30,
  MEDIUM: 60,
  LONG: 90,
} as const;
```

#### 3.4 Tratamento de Erros Inconsistente
**Problema:** Alguns erros são capturados, outros não

**Exemplos:**
- Promises sem `.catch()`
- `console.error` sem logging adequado
- Usuário não recebe feedback em falhas silenciosas

**Recomendação:**
- Implementar Error Boundary global
- Adicionar sistema de logging (Sentry, LogRocket)
- Toast notifications para todos os erros

### ✅ Aspectos Positivos
- TypeScript configurado estritamente
- Código passa no `tsc --noEmit` sem erros
- Naming conventions consistentes (camelCase, PascalCase)
- ESLint não necessário graças ao TypeScript estrito
- Componentes funcionais modernos (hooks)
- Código formatado consistentemente

---

## 🎨 4. UI/UX - Nota: 8.0/10

### ✅ Pontos Fortes

#### 4.1 Design System Consistente
- Paleta de cores bem definida (Slate + Violet)
- Tema dark exclusivo bem executado
- Espaçamentos consistentes (Tailwind spacing scale)
- Ícones padronizados via sistema Icon.tsx

#### 4.2 Mobile-First Bem Implementado
- Container `max-w-md` simula experiência mobile
- Touch-friendly (botões grandes, espaçamento adequado)
- Bottom navigation intuitiva
- Gestures considerados (sidebar slide)

#### 4.3 Componentes Reutilizáveis
- Card, Modal, Icon bem abstraídos
- Padrões consistentes (hover states, transitions)
- Animações suaves (`animate-fade-in`, `animate-slide-up`)

#### 4.4 Acessibilidade
- Atributos ARIA em modais (`aria-modal`, `role="dialog"`)
- Contraste adequado no tema dark
- Ícones com labels semânticos

### ⚠️ Áreas de Melhoria

#### 4.1 Falta de Loading States
**Problema:** Sem indicadores visuais durante operações assíncronas

**Recomendação:**
- Skeletons para carregamento de listas
- Spinners em botões durante submissão
- Progress bars para uploads

#### 4.2 Feedback Limitado
**Problema:** Poucas confirmações de sucesso/erro

**Recomendação:**
- Sistema de toast notifications global
- Confirmações antes de ações destrutivas
- Validação inline em formulários

#### 4.3 Responsividade Limitada
**Problema:** Otimizado APENAS para mobile (~400px)

**Recomendação:**
- Adicionar breakpoints para tablet e desktop
- Grid layouts adaptativos
- Menu lateral em vez de bottom nav em telas grandes

---

## ⚡ 5. PERFORMANCE - Nota: 5.0/10

### ⚠️ Problemas de Performance

#### 5.1 Bundle Size Excessivo (CRÍTICO)
**Problema:** Bundle único de 700KB (181KB gzipped)
```
dist/assets/index-DBUM7HtT.js   700.50 kB │ gzip: 181.46 kB
```

**Impactos:**
- First Load Time elevado
- Usuários mobile prejudicados
- Parsing de JavaScript lento

**Recomendação:**
```typescript
// Implementar code splitting
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage'));

// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom', 'react-router-dom'],
        firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
      }
    }
  }
}
```

#### 5.2 Ausência de Otimizações React
**Problema:** Re-renders desnecessários

**Exemplos:**
- Funções recriadas a cada render (falta `useCallback`)
- Computações repetidas (falta `useMemo`)
- Contextos sem otimização

**Recomendação:**
```typescript
// Antes
const handleClick = () => { /* ... */ };

// Depois
const handleClick = useCallback(() => { /* ... */ }, [deps]);

// Memoizar computações caras
const filteredAppointments = useMemo(() => 
  appointments.filter(/* ... */), 
  [appointments, filters]
);
```

#### 5.3 Imagens Não Otimizadas
**Problema:** Avatares carregados de pravatar.cc sem lazy loading

**Recomendação:**
- Implementar lazy loading de imagens
- Usar formatos modernos (WebP, AVIF)
- Adicionar placeholders (blur-up)

#### 5.4 Sem Service Worker / PWA
**Problema:** Não funciona offline, sem cache

**Recomendação:**
- Implementar Workbox para caching
- Adicionar manifest.json
- Cache-first strategy para assets estáticos

### ✅ Aspectos Positivos
- Vite usado (HMR rápido em desenvolvimento)
- Build otimizado com minificação
- CSS extraído separadamente (24KB)
- Sem bibliotecas pesadas desnecessárias

---

## 🔧 6. MANUTENIBILIDADE - Nota: 6.0/10

### ⚠️ Problemas de Manutenibilidade

#### 6.1 Ausência de Versionamento Semântico
**Problema:** `version: "0.0.0"` no package.json

**Recomendação:**
- Adotar Semantic Versioning (1.0.0)
- Manter CHANGELOG.md
- Usar conventional commits

#### 6.2 Documentação Incompleta
**Problema:** README básico, sem guias de contribuição

**Faltando:**
- Arquitetura detalhada
- Guia de contribuição (CONTRIBUTING.md)
- Documentação de API/componentes
- Troubleshooting

**Recomendação:**
```
docs/
  ├── ARCHITECTURE.md
  ├── CONTRIBUTING.md
  ├── DEPLOYMENT.md
  ├── COMPONENTS.md
  └── API.md
```

#### 6.3 Configuração de Ambiente Não Documentada
**Problema:** Variável `GEMINI_API_KEY` mencionada mas não explicada

**Recomendação:**
- Criar `.env.example` com todas as variáveis
- Documentar cada variável no README
- Script de setup (`npm run setup`)

#### 6.4 Sem CI/CD Completo
**Problema:** GitHub Actions só deploy, sem testes

**Recomendação:**
```yaml
# .github/workflows/ci.yml
- name: Run tests
  run: npm test
- name: Run lint
  run: npm run lint
- name: Check types
  run: npm run type-check
- name: Security audit
  run: npm audit --audit-level=moderate
```

### ✅ Aspectos Positivos
- TypeScript garante type safety
- Estrutura de pastas clara
- Separação de concerns (types, constants, components)
- Git configurado corretamente
- Copilot instructions bem documentadas

---

## 🔄 7. ESCALABILIDADE - Nota: 4.5/10

### ⚠️ Limitações de Escalabilidade

#### 7.1 Arquitetura Não Escalável
**Problema:** Monolito de páginas inviabiliza crescimento

**Impactos:**
- Dificulta trabalho em equipe
- Performance degrada com mais features
- Refatoração cada vez mais custosa

**Recomendação:**
- Migrar para arquitetura modular
- Feature folders (DDD approach)
```
features/
  ├── appointments/
  │   ├── components/
  │   ├── hooks/
  │   ├── services/
  │   └── types/
  ├── clients/
  └── financial/
```

#### 7.2 Firestore Não Otimizado
**Problema:** Queries potencialmente caras

**Exemplos:**
- `onSnapshot` sem limit pode carregar dados demais
- Sem paginação implementada
- Índices não documentados

**Recomendação:**
```typescript
// Implementar paginação
const appointmentsQuery = query(
  collection(db, 'appointments'),
  orderBy('date', 'desc'),
  limit(20)
);

// Usar cursor-based pagination
const nextPage = query(
  appointmentsQuery,
  startAfter(lastVisible)
);
```

#### 7.3 Sem Estratégia de Cache
**Problema:** Dados buscados repetidamente

**Recomendação:**
- React Query para caching automático
- Implementar stale-while-revalidate
- Cache de leitura no Firestore

#### 7.4 Multi-tenancy Não Considerado
**Problema:** Estrutura de dados não suporta múltiplas barbearias

**Recomendação:**
```typescript
// Estrutura Firestore escalável
barbershops/
  {barbershopId}/
    appointments/
    clients/
    services/
    settings/
```

### ✅ Aspectos Positivos
- Firebase é escalável por natureza
- Serverless (sem gerenciamento de infra)
- CDN via Firebase Hosting
- Auto-scaling do Firestore

---

## 🧪 8. TESTABILIDADE - Nota: 2.0/10

### ❌ Problemas Críticos

#### 8.1 Zero Testes Implementados
**Problema:** Nenhum teste unitário, integração ou E2E

**Impactos:**
- Qualquer mudança pode quebrar funcionalidades
- Refatoração extremamente arriscada
- Confiabilidade baixa
- Debugging manual demorado

#### 8.2 Código Difícil de Testar
**Problema:** Lógica acoplada a componentes

**Exemplos:**
- Formatação de datas misturada com renderização
- Validação inline em formulários
- Lógica de negócio em event handlers

**Recomendação:**
```typescript
// Extrair lógica pura para funções testáveis
export function formatAppointmentDate(date: string, time: string): string {
  // Lógica de formatação isolada
}

// Teste
describe('formatAppointmentDate', () => {
  it('should format today appointments correctly', () => {
    const result = formatAppointmentDate('2024-10-20', '14:30');
    expect(result).toBe('Hoje, 14:30');
  });
});
```

#### 8.3 Dependências Não Mockáveis
**Problema:** Firebase importado diretamente

**Recomendação:**
- Criar abstrações/interfaces
- Dependency injection
- Mock do Firebase em testes

### 📋 Recomendações de Setup

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "playwright": "^1.40.0"
  }
}
```

### ✅ Aspectos Positivos (Potenciais)
- TypeScript facilita testes type-safe
- Componentes funcionais mais fáceis de testar
- Mock data já existe (MOCK_APPOINTMENTS, etc.)

---

## 📱 9. MOBILE/RESPONSIVIDADE - Nota: 7.5/10

### ✅ Pontos Fortes

#### 9.1 Mobile-First Implementado
- Design otimizado para 375-428px
- Bottom navigation ergonômica
- Touch targets adequados (min 44x44px)
- Sidebar com gesture de slide

#### 9.2 Performance Mobile Considerada
- Ícones leves (react-icons)
- Sem bibliotecas pesadas
- CSS otimizado com Tailwind

### ⚠️ Áreas de Melhoria

#### 9.1 Sem Suporte Desktop
**Problema:** Layout quebra em telas >768px

**Recomendação:**
```css
/* Layout adaptativo */
.container {
  @apply max-w-md mx-auto lg:max-w-7xl;
}

.bottom-nav {
  @apply lg:hidden;
}

.sidebar {
  @apply lg:block lg:static lg:translate-x-0;
}
```

#### 9.2 Sem PWA Features
**Problema:** Não instalável como app

**Recomendação:**
- Adicionar manifest.json
- Implementar service worker
- Add to home screen prompt
- Splash screens

#### 9.3 Orientação Landscape Não Testada
**Problema:** Layout pode quebrar em landscape

**Recomendação:**
- Testar em múltiplas orientações
- Adaptar UI para landscape

---

## 🚀 10. DEVOPS/DEPLOYMENT - Nota: 7.0/10

### ✅ Pontos Fortes

#### 10.1 CI/CD Configurado
- GitHub Actions para deploy automático
- Deploy em Firebase Hosting
- Preview environments para PRs

#### 10.2 Build Otimizado
- Vite com tree-shaking
- Minificação automática
- Asset optimization

### ⚠️ Áreas de Melhoria

#### 10.1 Sem Ambientes Separados
**Problema:** Apenas produção configurada

**Recomendação:**
```
.env.development
.env.staging
.env.production

# Deploy strategy
- main → production
- develop → staging
- feature/* → preview
```

#### 10.2 Sem Monitoramento
**Problema:** Sem observabilidade em produção

**Recomendação:**
- Firebase Performance Monitoring
- Google Analytics ou Plausible
- Sentry para error tracking
- Lighthouse CI para performance

#### 10.3 Secrets Não Rotacionados
**Problema:** Credenciais expostas no código

**Recomendação:**
- GitHub Secrets para CI/CD
- Firebase App Check para segurança
- Rotação periódica de tokens

---

## 📊 RESUMO DAS NOTAS

| Categoria | Nota | Peso | Nota Ponderada |
|-----------|------|------|----------------|
| 🔐 Segurança | 4.5/10 | 20% | 0.90 |
| 🏗️ Arquitetura | 5.5/10 | 15% | 0.83 |
| 💻 Qualidade de Código | 6.5/10 | 15% | 0.98 |
| 🎨 UI/UX | 8.0/10 | 10% | 0.80 |
| ⚡ Performance | 5.0/10 | 10% | 0.50 |
| 🔧 Manutenibilidade | 6.0/10 | 10% | 0.60 |
| 🔄 Escalabilidade | 4.5/10 | 10% | 0.45 |
| 🧪 Testabilidade | 2.0/10 | 5% | 0.10 |
| 📱 Mobile/Responsividade | 7.5/10 | 3% | 0.23 |
| 🚀 DevOps/Deployment | 7.0/10 | 2% | 0.14 |

---

## 🎯 NOTA FINAL: 5.5/10

### Classificação: **PROJETO EM DESENVOLVIMENTO - REQUER MELHORIAS**

---

## 💭 ANÁLISE FINAL

### Pontos Positivos 🟢

1. **Design e UX excelentes**: UI polida, consistente e mobile-first bem executado
2. **TypeScript bem implementado**: Type safety garante qualidade básica
3. **Stack moderna e adequada**: React 18, Vite, TailwindCSS, Firebase são escolhas sólidas
4. **Componentização razoável**: Separação básica de componentes está ok
5. **Deploy automatizado**: CI/CD funcional facilita iterações

### Problemas Críticos 🔴

1. **SEGURANÇA COMPROMETIDA**: Credenciais expostas + 12 vulnerabilidades
2. **ARQUITETURA MONOLÍTICA**: 1.412 linhas em um arquivo inviabiliza crescimento
3. **ZERO TESTES**: Impossível garantir qualidade sem testes
4. **PERFORMANCE RUIM**: Bundle de 700KB é inaceitável para mobile-first
5. **NÃO ESCALÁVEL**: Estrutura atual não suporta crescimento

### Recomendações Prioritárias (Top 5) 🎯

#### 1. URGENTE: Resolver Segurança (1-2 dias)
```bash
# Mover credenciais para env
npm audit fix
# Rotacionar chaves expostas no Git
# Implementar variáveis de ambiente
```

#### 2. CRÍTICO: Refatorar Arquitetura (1-2 semanas)
- Separar pages.tsx em arquivos individuais
- Implementar gerenciamento de estado (Context/Zustand)
- Criar camada de serviços (data abstraction)

#### 3. ESSENCIAL: Implementar Testes (1 semana)
- Setup Vitest + React Testing Library
- Cobertura mínima 70% para lógica crítica
- Testes E2E com Playwright

#### 4. IMPORTANTE: Otimizar Performance (3-5 dias)
- Code splitting (lazy loading)
- Manual chunks (vendor, firebase)
- Implementar React.memo e useCallback

#### 5. DESEJÁVEL: Melhorar Documentação (2-3 dias)
- README completo com setup
- CONTRIBUTING.md
- Documentação de componentes

### Próximos Passos Sugeridos 📅

**Sprint 1 (Semana 1-2): Fundação**
- [ ] Resolver vulnerabilidades de segurança
- [ ] Mover credenciais para variáveis de ambiente
- [ ] Separar pages.tsx em arquivos individuais
- [ ] Implementar gerenciamento de estado básico

**Sprint 2 (Semana 3-4): Qualidade**
- [ ] Setup de testes (Vitest)
- [ ] Testes unitários para utils e hooks
- [ ] Testes de integração para páginas principais
- [ ] Code splitting e lazy loading

**Sprint 3 (Semana 5-6): Escalabilidade**
- [ ] Refatorar estrutura Firestore
- [ ] Implementar paginação
- [ ] Cache com React Query
- [ ] Documentação completa

### Conclusão Final 📝

O **AgendaBarber** é um projeto com **grande potencial** e uma **UI excepcional**, mas sofre de **problemas estruturais críticos** que impedem sua evolução e uso em produção de forma segura.

**Para um MVP/Protótipo**: 7.5/10 ✅  
**Para Produção**: 3.5/10 ❌  
**Nota Geral Ponderada**: **5.5/10** ⚠️

Com as melhorias sugeridas, o projeto tem potencial para alcançar **8.5-9.0/10** em 4-6 semanas de trabalho focado.

**Recomendação:** ⚠️ **NÃO DEPLOYAR EM PRODUÇÃO** sem resolver os problemas de segurança e implementar testes.

---

*Revisão realizada em Outubro de 2025 por Desenvolvedor Sênior*  
*Metodologia: Análise estática de código, auditoria de segurança, revisão de arquitetura e best practices*
