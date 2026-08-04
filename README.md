# @pushinpay/mcp-server

Servidor [MCP](https://modelcontextprotocol.io) oficial da **PushinPay**. Conecta agentes de IA (Claude Desktop, Claude Code, Cursor) à API PushinPay para operações PIX — sem escrever código de integração.

> **Status:** v1 (em construção). Escopo somente-leitura + criação de cobrança. **Não** expõe saque, reembolso ou alteração de conta, por segurança.

## Tools disponíveis

| Tool | Descrição |
|------|-----------|
| `consultar_saldo` | Saldo disponível e valor bloqueado da conta |
| `consultar_transacao` | Status de uma transação PIX pelo ID (trava de 1 consulta/min embutida) |
| `criar_cobranca_pix` | Cria cobrança PIX (copia-e-cola + QR Code), com split opcional |

> Escopo v1: por segurança, **não** há saque, reembolso nem alteração de conta.

## Uso rápido

Não precisa clonar nada — roda direto via `npx`:

```bash
npx -y @pushinpay/mcp-server
```

O servidor lê a configuração de variáveis de ambiente:

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `PUSHINPAY_TOKEN` | sim | — | Token da sua conta (gere no painel) |
| `PUSHINPAY_ENV` | não | `sandbox` | `sandbox` ou `production` |

## Configuração no cliente de IA

### Claude Desktop / Claude Code

Adicione ao seu arquivo de config MCP:

```json
{
  "mcpServers": {
    "pushinpay": {
      "command": "npx",
      "args": ["-y", "@pushinpay/mcp-server"],
      "env": {
        "PUSHINPAY_TOKEN": "seu_token_aqui",
        "PUSHINPAY_ENV": "sandbox"
      }
    }
  }
}
```

### Cursor

Em `~/.cursor/mcp.json` (ou nas configurações de MCP do projeto), use o mesmo bloco acima.

Depois de configurar, peça em linguagem natural: _"Qual meu saldo na PushinPay?"_

## Desenvolvimento

```bash
npm install
npm run build      # compila TypeScript -> dist/
npm run dev        # roda em watch mode
npm run smoke      # teste ponta a ponta: autentica e lê o saldo
npm run inspect    # abre o MCP Inspector (UI para testar as tools)
```

Copie `.env.example` para `.env` e preencha `PUSHINPAY_TOKEN` para os testes locais.

## Especificação e Skill (download público)

- [`openapi.yaml`](openapi.yaml) — especificação OpenAPI 3.0 do núcleo PIX da API (cobrança, transação, reembolso, saque, saldo, assinaturas). Importe no Postman/Insomnia ou gere clientes automaticamente.
- [`skill/SKILL.md`](skill/SKILL.md) — Skill para Claude com as regras de uso da PushinPay. O arquivo `.skill` distribuível é essa pasta compactada.

## Segurança

- O token é lido do ambiente e **nunca** é logado.
- Tokens da PushinPay podem ser **atrelados a IP**. Para uso via MCP (máquina do dev, IP dinâmico), gere um token com IP liberado ou use o ambiente sandbox.
- Reporte vulnerabilidades conforme `SECURITY.md`.

## Licença

MIT
