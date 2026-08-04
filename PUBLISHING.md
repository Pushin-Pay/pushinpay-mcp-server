# Publicação — checklist

Passo a passo para publicar o `@pushinpaybr/mcp-server` no npm e registrá-lo no
MCP Registry. **Requer credenciais corporativas** — não rode com conta pessoal.

## Pré-requisitos (item 2 do card — governança)

- [ ] Org GitHub `Pushin-Pay` criada, com este repo em `github.com/Pushin-Pay/pushinpay-mcp-server`.
- [ ] Org npm `@pushinpaybr` criada, com 2FA obrigatório para publicação.
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
npm login --scope=@pushinpaybr          # conta corporativa + 2FA
npm run build                         # gera dist/ (também roda no prepublishOnly)
npm publish --access public           # pacote com escopo precisa de --access public
```

Teste em máquina limpa depois:

```bash
PUSHINPAY_TOKEN=xxx npx -y @pushinpaybr/mcp-server
```

## 3. Registrar no MCP Registry (namespace `br.com.pushinpay` — DNS)

Pré-requisitos: pacote npm **0.1.1** (com `mcpName`) já publicado no passo 2, e
`server.json` válido (`./mcp-publisher validate`).

### 3.1 Instalar a CLI
```bash
curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" | tar xz mcp-publisher
```

### 3.2 Registro TXT no DNS de pushinpay.com.br (infra)
A chave já está em `key.pem` (gitignored). Adicione na raiz do domínio:
```
Nome:  @  (pushinpay.com.br)
Tipo:  TXT
Valor: v=MCPv1; k=ed25519; p=<PUBLIC_KEY>
```
Reobter o valor da chave pública:
```bash
echo "v=MCPv1; k=ed25519; p=$(openssl pkey -in key.pem -pubout -outform DER | tail -c 32 | base64)"
```

### 3.3 Login (após o TXT propagar) e publicar
```bash
PRIVATE_KEY="$(openssl pkey -in key.pem -noout -text | grep -A3 'priv:' | tail -n +2 | tr -d ' :\n')"
./mcp-publisher login dns --domain pushinpay.com.br --private-key "${PRIVATE_KEY}"
./mcp-publisher publish
```

### 3.4 Verificar
```bash
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=br.com.pushinpay/mcp"
```

> `server.json` já está pronto e validado (schema 2025-12-11, `name` = `br.com.pushinpay/mcp`,
> igual ao `mcpName` do `package.json`). A chave privada (`key.pem`) nunca vai pro Git.

## 4. Pós-publicação

- [ ] Servidor listado no registry sob `br.com.pushinpay`.
- [ ] Landing (item 7) aponta para o comando `npx`, o `openapi.yaml` e a Skill.
- [ ] Tag de versão no Git: `git tag v0.1.0 && git push --tags`.

## Versionamento

Suba a `version` no `package.json` **e** no `server.json` juntos a cada release.
