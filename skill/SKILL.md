---
name: pushinpay
description: >
  Integrar e operar a API PIX da PushinPay (gateway de pagamento brasileiro):
  criar cobranças PIX, consultar transações e saldo, reembolsos, saques e
  assinaturas recorrentes. Use quando o usuário quiser gerar um PIX, receber
  pagamentos, consultar status/saldo, ou integrar a PushinPay com IA.
---

# PushinPay — guia de integração

A PushinPay é um PSP brasileiro. Você pode operá-la de duas formas:

1. **MCP server (recomendado):** instale `@pushinpaybr/mcp-server` e use as tools
   `criar_cobranca_pix`, `consultar_transacao`, `consultar_saldo`. Elas já aplicam
   as regras críticas abaixo.
2. **API REST direta:** `Authorization: Bearer SEU_TOKEN` + `Accept: application/json`.
   Base produção `https://api.pushinpay.com.br`, sandbox `https://api-sandbox.pushinpay.com.br`.

## Regras que você DEVE respeitar

- **Valores sempre em centavos** (inteiro). 1000 = R$ 10,00. Nunca envie decimais.
- **Consulta de transação: no máximo 1x/minuto por transação.** Polling agressivo
  pode BLOQUEAR a conta do usuário. O certo é usar `webhook_url` e só consultar
  quando o cliente final disser que pagou.
- **Não existe status "failed".** Uma cobrança não paga fica `created` até expirar
  ou ser cancelada. Status possíveis: `created`, `paid`, `canceled`.
- **Token pode ser atrelado a IP.** Se der `401 "IP não configurado"`, oriente o
  usuário a liberar o IP (ou usar `*`) no painel.
- **Só preencha `webhook_url` se houver um servidor pronto** para receber a notificação.

## Operações principais

### Criar cobrança PIX
`POST /api/pix/cashIn` — body: `value` (centavos, obrigatório, mín. 50),
`description` (opcional), `webhook_url` (opcional), `split_rules` (opcional:
lista de `{ value, account_id }`; a soma não pode exceder `value`).
Retorna `id`, `qr_code` (copia-e-cola) e `qr_code_base64` (imagem).

### Consultar transação
`GET /api/transactions/{id}` — retorna `status`, `value`, `payer_name`, etc.
Respeite o limite de 1x/min. 404 vem como array vazio `[]`.

### Consultar saldo
`GET /api/balance` — `{ "amount": <centavos>, "blocked_balance": "<centavos>" }`.

### Reembolso
`POST /api/transactions/{id}/refund` — prazo de até 30 dias. Estornar uma
cobrança de assinatura NÃO cancela a assinatura.

### Saque
`POST /api/pix/cashOut` — `value` (mín. 100), `pix_key`, `pix_key_type`.
Só para chaves vinculadas ao CPF/CNPJ do titular.

### Assinaturas (PIX recorrente)
`POST /api/pix/cashIn/subscription` — `value`, `frequency` (1=Semanal, 2=Mensal,
3=Semestral, 4=Anual, 5=Bimestral, 6=Trimestral, 7=Quadrimestral),
`pix_recurring_retry_policy` (1 ou 2) e `webhook_url` (obrigatório).
Cancelar: `DELETE /api/pix/cashIn/subscription/{id}/cancel`.

## Webhooks

Payload base: `{ id, value, status, end_to_end_id }`. Em pagamentos confirmados
inclui `payer_name` e `payer_national_registration`. Responda 2xx rápido, valide
o header customizado configurado no painel e trate reentregas de forma idempotente
usando o `id`.

## Referências

- Especificação completa: `openapi.yaml` (OpenAPI 3.0)
- Documentação: https://app.theneo.io/pushinpay/pix
- Painel: https://app.pushinpay.com.br
