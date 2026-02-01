# Guía de Deploy Seguro

Este documento cobre o processo para preparar o BarberIA para ambientes de produção, garantindo que as chaves sensíveis permaneçam fora do repositório e que o build falhe imediatamente caso qualquer credencial obrigatória esteja ausente.

## 1. Arquivos `.env`

O projeto utiliza o prefixo `VITE_` para expor as variáveis necessárias no bundle. Para manter as credenciais seguras e evitar commits acidentais:

- Utilize `.env.local` para desenvolvimento.
- Crie um `.env.production` com as credenciais reais de produção (não commitar).
- Opcionalmente, utilize `.env.preview` para homologação.

Sempre use o arquivo `.env.example` como referência para os nomes das variáveis:

```
cp .env.example .env.local
cp .env.example .env.production
```

> ⚠️ Nunca commite arquivos `.env.*` contendo chaves reais.

## 2. Validação Automática de Credenciais

O script `scripts/check-env.mjs` confere as variáveis obrigatórias antes de executar `vite build` e `vite preview`.

- Em caso de variáveis ausentes, o build é interrompido com uma mensagem indicando quais chaves precisam ser definidas.
- Arquivos carregados são informados no terminal para fácil auditoria.

### Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run build` | Executa `check-env` em modo produção e constrói o bundle |
| `npm run preview` | Carrega as variáveis de `preview`/`production` antes de servir o bundle |

## 3. Configurando Ambiente de Produção

1. Gere um novo arquivo `.env.production` e preencha com as chaves reais.
2. Garanta que o arquivo esteja listado no `.gitignore` (já configurado por padrão).
3. Execute `npm run build`; o script de verificação irá confirmar se todas as chaves obrigatórias existem.
4. Faça o deploy dos arquivos gerados em `dist/` para o serviço desejado (ex.: Firebase Hosting).

### Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

Certifique-se de que o domínio utilizado esteja autorizado em **Authentication → Settings → Authorized domains** no console do Firebase.

## 4. Checklist de Segurança

- [x] Nenhum arquivo `.env.*` com chaves reais versionado.
- [x] `scripts/check-env.mjs` garante falha precoce na ausência de chaves.
- [x] Código-fonte acessa as credenciais apenas via `import.meta.env`.
- [x] Logs de desenvolvimento não exibem nenhuma chave sensível.

Com esses passos, o projeto fica pronto para ser implantado em produção sem risco de expor segredos.
