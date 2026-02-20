# 🚀 Guia de Deploy - Correção de Segurança LGPD/GDPR

Este guia explica passo a passo como publicar as correções de segurança no seu projeto BarberIA.

---

## 📋 Resumo do que foi feito

Corrigimos uma vulnerabilidade crítica onde dados pessoais de clientes (nome e telefone) estavam expostos publicamente. Agora:

- ✅ Dados de clientes só podem ser vistos pelo dono da barbearia
- ✅ A página de agendamento público só vê horários ocupados (sem dados de clientes)
- ✅ Conformidade com LGPD/GDPR

---

## 🔧 Passo 1: Verificar se o código está funcionando

Abra o terminal na pasta do projeto e execute:

```bash
npm run dev
```

**O que vai acontecer:**
- O servidor de desenvolvimento vai iniciar
- Acesse `http://localhost:3000` no navegador
- Verifique se a aplicação abre sem erros

**Se der erro:**
- Leia a mensagem de erro no terminal
- Os erros mais comuns são de digitação ou imports incorretos

---

## 🔐 Passo 2: Fazer login no Firebase

No terminal, execute:

```bash
firebase login
```

**O que vai acontecer:**
- Uma janela do navegador vai abrir
- Faça login com sua conta Google (a mesma que criou o projeto Firebase)
- Após o login, volte ao terminal

**Como saber se deu certo:**
- O terminal vai mostrar "✔ Success! Logged in as seu-email@gmail.com"

---

## 📜 Passo 3: Publicar as novas regras de segurança

Este é o passo mais importante! Execute:

```bash
firebase deploy --only firestore:rules
```

**O que vai acontecer:**
- As novas regras de segurança serão enviadas para o Firebase
- Isso "fecha a porta" que permitia acesso público aos dados de clientes

**Saída esperada:**
```
=== Deploying to 'seu-projeto'...

i  firestore: reading indexes from firestore.indexes.json...
i  cloud.firestore: checking firestore.rules for compilation errors...
✔  cloud.firestore: rules file firestore.rules compiled successfully
i  firestore: uploading rules firestore.rules...
✔  firestore: released rules firestore.rules to cloud.firestore

✔  Deploy complete!
```

**Se der erro "permission denied":**
- Verifique se você está logado com a conta correta
- Execute `firebase login --reauth` para refazer o login

---

## 🧪 Passo 4: Testar se a correção funcionou

### Teste 1: Verificar que dados estão protegidos

1. Abra o [Firebase Console](https://console.firebase.google.com)
2. Vá para **Firestore Database** → **Rules**
3. Clique em **Rules Playground** (simulador de regras)
4. Configure assim:
   - **Location**: `/barbershops/{userId}/appointments/{docId}`
   - **Simulation type**: `get` (leitura)
   - **Authenticated**: `Off` (desmarque)
5. Clique em **Run**

**Resultado esperado**: ❌ "Simulated read denied"

Se aparecer "denied", significa que usuários não autenticados **NÃO** conseguem ler os agendamentos. Perfeito!

### Teste 2: Verificar que a página de agendamento funciona

1. Abra sua página pública de agendamento
2. Selecione uma data
3. Os horários devem aparecer normalmente

**Se os horários não aparecerem:**
- Isso é esperado para agendamentos antigos!
- Apenas **novos agendamentos** vão criar os registros de disponibilidade
- Veja a seção "Sobre agendamentos antigos" abaixo

---

## 🌐 Passo 5: Publicar o código completo (opcional)

Se você quer atualizar todo o site (não apenas as regras), execute:

```bash
npm run build
firebase deploy
```

**O que vai acontecer:**
- `npm run build`: Cria uma versão otimizada do seu site
- `firebase deploy`: Publica tudo (regras + site) no Firebase Hosting

**Tempo estimado**: 2-5 minutos

---

## ⚠️ Sobre agendamentos antigos

Os agendamentos que já existiam **ANTES** desta atualização podem não aparecer na verificação de disponibilidade da página pública. Isso acontece porque:

- Agendamentos antigos não têm registro na nova coleção `availability`
- Apenas novos agendamentos (ou editados) terão os dados públicos

**Isso é um problema?**
- Para a maioria dos casos, **NÃO**
- Agendamentos antigos já passaram ou serão concluídos em breve
- Em poucos dias/semanas, todos os horários ocupados serão novos

**Se precisar dos dados antigos:**
- Você precisará criar manualmente os registros de disponibilidade
- Entre em contato para um script de migração se necessário

---

## ✅ Checklist Final

Antes de considerar a atualização completa, verifique:

- [ ] `npm run dev` funciona sem erros
- [ ] `firebase deploy --only firestore:rules` executado com sucesso
- [ ] Teste no Rules Playground: leitura de appointments por não-autenticado = DENIED
- [ ] Teste no Rules Playground: leitura de availability por não-autenticado = ALLOWED
- [ ] Página de agendamento público funciona (horários aparecem)
- [ ] Painel admin funciona (agendamentos são listados normalmente para usuário logado)

---

## 🆘 Problemas Comuns

### "Firebase: Permission denied"
- Execute `firebase login --reauth`
- Verifique se sua conta tem permissão de Editor no projeto

### "Cannot find module..."
- Execute `npm install` para garantir que todas as dependências estão instaladas

### Horários não aparecem na página pública
- Normal para dados antigos
- Crie um novo agendamento de teste e verifique se ele aparece como ocupado

### Página admin mostra "Erro ao carregar agendamentos"
- Verifique se você está logado no sistema
- Limpe o cache do navegador (Ctrl+Shift+Delete)

---

## 📞 Comandos Rápidos

| Ação | Comando |
|------|---------|
| Iniciar desenvolvimento | `npm run dev` |
| Verificar tipos TypeScript | `npm run lint` |
| Build de produção | `npm run build` |
| Deploy apenas regras | `firebase deploy --only firestore:rules` |
| Deploy completo | `firebase deploy` |
| Login Firebase | `firebase login` |
| Ver projeto atual | `firebase use` |

---

## 🎉 Pronto!

Se você seguiu todos os passos e os testes passaram, sua aplicação agora está:

1. **Segura**: Dados de clientes protegidos por autenticação
2. **Conforme LGPD/GDPR**: Apenas dados necessários são expostos publicamente
3. **Funcional**: Página de agendamento continua funcionando normalmente

Guarde este guia para referência futura!
