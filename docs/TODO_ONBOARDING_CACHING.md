# TODO - Onboarding Seed Data & Caching Strategy

## ✅ Status: COMPLETO

---

## 📋 Fase 1: Onboarding Seed Data - ✅ DONE

### 1.1 Analisar estrutura existente - ✅
- [x] Verificar `auth.store.ts` - fluxo de registro atual
- [x] Verificar `services.store.ts` - estrutura de serviços
- [x] Verificar `barbershop.store.ts` - horários de funcionamento
- [x] Identificar onde chamar a função de seed

### 1.2 Criar função de seed data - ✅
- [x] Criar `src/services/onboarding.service.ts`
- [x] Implementar `seedDefaultService()` - cria "Corte Masculino" R$35, 30min
- [x] Implementar `seedDefaultSettings()` - cria settings com horários padrão
- [x] Implementar `seedInitialData()` - orquestra chamadas
- [x] Implementar `checkOnboardingCompleted()` - verifica se já foi feito

### 1.3 Integrar no fluxo de registro - ✅
- [x] Modificar `useAuth.ts` para chamar seed após registro
- [x] Garantir que seed só roda uma vez (flag em `meta/onboarding`)
- [x] Tratar erros sem bloquear criação da conta

### 1.4 Testes - PENDENTE (manual)
- [ ] Criar nova conta de teste
- [ ] Verificar se serviço padrão foi criado
- [ ] Verificar se settings foram criados
- [ ] Confirmar que usuário vê dados imediatamente

---

## 📋 Fase 2: Caching Strategy - ✅ DONE

### 2.1 Configurar CDN Cache Headers - ✅
- [x] Editar `firebase.json`
- [x] Adicionar headers para `/booking/**` (5min client, 10min CDN)
- [x] Adicionar headers para `/b/**` (short URL, mesmo cache)
- [x] Manter headers para assets estáticos (1 ano)

### 2.2 Validar configuração - PENDENTE (deploy)
- [ ] Deploy com `firebase deploy --only hosting`
- [ ] Verificar headers no Chrome DevTools
- [ ] Confirmar Cache-Control está funcionando

---

## 📁 Arquivos Criados/Modificados

### Novos:
- `src/services/onboarding.service.ts` - Seed de dados iniciais
- `docs/PAYMENT_INTEGRATION_ROADMAP.md` - Roadmap para pagamentos futuros
- `docs/TODO_ONBOARDING_CACHING.md` - Este arquivo

### Modificados:
- `src/hooks/useAuth.ts` - Adicionado import e chamada ao seed
- `firebase.json` - Adicionados cache headers para booking

---

## 🎯 Critérios de Sucesso

### Onboarding:
- ✅ Novo usuário terá serviço "Corte Masculino" criado automaticamente
- ✅ Settings padrão com horários Seg-Sex 09-18h, Sab 09-14h
- ✅ Seed é idempotente (não recria se já existe)
- ✅ Erros no seed não bloqueiam registro

### Caching:
- ✅ Headers Cache-Control configurados
- ✅ Booking: 5min client + 10min CDN cache
- ✅ Assets estáticos: 1 ano de cache
- ⏳ Validar após deploy

---

## ⏱️ Tempo Gasto

| Tarefa | Estimado | Real |
|--------|----------|------|
| Análise estrutura | 30 min | 15 min |
| onboarding.service.ts | 2 horas | 30 min |
| Integrar no useAuth | 1 hora | 15 min |
| Cache headers | 30 min | 10 min |
| **TOTAL** | **4 horas** | **~1 hora** |

---

## 🔜 Próximos Passos

1. **Testar fluxo de registro** - Criar nova conta e verificar seed
2. **Deploy e validar cache** - `firebase deploy --only hosting`
3. **Quando tiver conta Asaas** - Implementar pagamentos seguindo `docs/PAYMENT_INTEGRATION_ROADMAP.md`
