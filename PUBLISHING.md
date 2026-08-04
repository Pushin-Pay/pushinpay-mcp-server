# Publicação — checklist

Passo a passo para publicar o `@pushinpay/mcp-server` no npm e registrá-lo no
MCP Registry. **Requer credenciais corporativas** — não rode com conta pessoal.

## Pré-requisitos (item 2 do card — governança)

- [ ] Org GitHub `Pushin-Pay` criada, com este repo em `github.com/Pushin-Pay/pushinpay-mcp-server`.
- [ ] Org npm `@pushinpay` criada, com 2FA obrigatório para publicação.
- [ ] Você é membro com permissão de publish em ambas.

## 1. Git remoto

```bash
git remote add origin https://github.com/Pushin-Pay/pushinpay-mcp-server.git
git push -u origin main
```

> O repositório já foi inicializado localmente com o primeiro commit. O `.env`
> real é ignorado; o `.env.example` está sem token.

## 2. Publicar no npm

```bash
npm login --scope=@pushinpay          # conta corporativa + 2FA
npm run build                         # gera dist/ (também roda no prepublishOnly)
npm publish --access public           # pacote com escopo precisa de --access public
```

Teste em máquina limpa depois:

```bash
PUSHINPAY_TOKEN=xxx npx -y @pushinpay/mcp-server
```

## 3. Registrar no MCP Registry

Namespace: `br.com.pushinpay/mcp` (verificação por domínio).

```bash
# instalar a CLI oficial do registry
npm i -g @modelcontextprotocol/publisher   # confirmar nome atual da CLI

# autenticar (verificação de domínio via DNS/HTTP conforme instrução da CLI)
mcp-publisher login

# publicar usando o manifesto server.json deste repo
mcp-publisher publish
```

> `server.json` já está preenchido (npm `@pushinpay/mcp-server`, env
> `PUSHINPAY_TOKEN`/`PUSHINPAY_ENV`). Ajuste a versão do `$schema` se o registry
> tiver atualizado o formato.

## 4. Pós-publicação

- [ ] Servidor listado no registry sob `br.com.pushinpay`.
- [ ] Landing (item 7) aponta para o comando `npx`, o `openapi.yaml` e a Skill.
- [ ] Tag de versão no Git: `git tag v0.1.0 && git push --tags`.

## Versionamento

Suba a `version` no `package.json` **e** no `server.json` juntos a cada release.
