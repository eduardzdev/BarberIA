# Como Configurar Secrets no GitHub

Os workflows do GitHub Actions agora estão configurados para usar as variáveis de ambiente, mas você precisa adicioná-las como **Secrets** no repositório.

## Passo a Passo

1. **Acesse seu repositório no GitHub**: https://github.com/v7create/saas-agendabarber-app
2. Vá em **Settings** > **Secrets and variables** > **Actions**.
3. Clique em **New repository secret**.

2. **Navegue até Settings** (ícone de engrenagem no menu superior)

3. **No menu lateral esquerdo, clique em "Secrets and variables" → "Actions"**

4. **Clique no botão "New repository secret"** para cada variável abaixo:

## Secrets a Adicionar

Para cada secret, clique em "New repository secret", cole o **Name** e o **Value** correspondente do seu arquivo `.env.local`:

### 1. VITE_FIREBASE_API_KEY
- **Name**: `VITE_FIREBASE_API_KEY`
- **Value**: (copie o valor de `VITE_FIREBASE_API_KEY` do seu `.env.local`)

### 2. VITE_FIREBASE_AUTH_DOMAIN
- **Name**: `VITE_FIREBASE_AUTH_DOMAIN`
- **Value**: (copie o valor de `VITE_FIREBASE_AUTH_DOMAIN` do seu `.env.local`)

### 3. VITE_FIREBASE_PROJECT_ID
- **Name**: `VITE_FIREBASE_PROJECT_ID`
- **Value**: (copie o valor de `VITE_FIREBASE_PROJECT_ID` do seu `.env.local`)

### 4. VITE_FIREBASE_STORAGE_BUCKET
- **Name**: `VITE_FIREBASE_STORAGE_BUCKET`
- **Value**: (copie o valor de `VITE_FIREBASE_STORAGE_BUCKET` do seu `.env.local`)

### 5. VITE_FIREBASE_MESSAGING_SENDER_ID
- **Name**: `VITE_FIREBASE_MESSAGING_SENDER_ID`
- **Value**: (copie o valor de `VITE_FIREBASE_MESSAGING_SENDER_ID` do seu `.env.local`)

### 6. VITE_FIREBASE_APP_ID
- **Name**: `VITE_FIREBASE_APP_ID`
- **Value**: (copie o valor de `VITE_FIREBASE_APP_ID` do seu `.env.local`)

### 7. VITE_FIREBASE_MEASUREMENT_ID
- **Name**: `VITE_FIREBASE_MEASUREMENT_ID`
- **Value**: (copie o valor de `VITE_FIREBASE_MEASUREMENT_ID` do seu `.env.local`)

### 8. VITE_FIREBASE_APP_CHECK_KEY
- **Name**: `VITE_FIREBASE_APP_CHECK_KEY`
- **Value**: (copie o valor de `VITE_FIREBASE_APP_CHECK_KEY` do seu `.env.local`)

### 9. VITE_GEMINI_API_KEY (opcional)
- **Name**: `VITE_GEMINI_API_KEY`
- **Value**: (copie o valor de `VITE_GEMINI_API_KEY` do seu `.env.local`, se existir)

## Como Copiar os Valores

Abra o arquivo `.env.local` na raiz do projeto e copie apenas os valores (sem as aspas):

```
VITE_FIREBASE_API_KEY=AIza...           ← Copie apenas: AIza...
VITE_FIREBASE_AUTH_DOMAIN=saas-barb...  ← Copie apenas: saas-barb...
```

## Após Configurar

Depois de adicionar todos os secrets:

1. Faça commit das alterações nos arquivos de workflow:
```bash
git add .github/workflows/
git commit -m "chore: configure environment variables for GitHub Actions"
git push
```

2. O GitHub Actions executará automaticamente o build com as secrets configuradas

3. Verifique em: **Actions** tab → último workflow → deve completar com sucesso ✅

## Importante

⚠️ **Nunca commite o arquivo `.env.local`** - ele já está no `.gitignore`

✅ As secrets ficam criptografadas e seguras no GitHub

✅ Elas são injetadas apenas durante o build no GitHub Actions
