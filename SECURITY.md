# Política de Segurança

## Reportar uma vulnerabilidade

Se você encontrar uma vulnerabilidade de segurança neste projeto ou na API da
PushinPay, **não abra uma issue pública**. Reporte de forma privada:

- E-mail: **security@pushinpay.com.br** _(confirmar canal oficial com o time)_

Inclua, se possível: descrição, passos de reprodução, impacto e versão afetada.
Responderemos o mais rápido possível e manteremos você informado sobre a correção.

## Boas práticas para quem usa este servidor

- **Nunca comite seu token.** Use variáveis de ambiente (`PUSHINPAY_TOKEN`); o
  arquivo `.env` é ignorado pelo Git.
- **Prefira o ambiente sandbox** para desenvolvimento e testes.
- **Escopo do token:** gere tokens com o menor privilégio necessário. Este
  servidor MCP, por decisão de projeto, não expõe saque, reembolso nem
  alteração de conta.
- Tokens podem ser atrelados a IP — libere apenas os IPs necessários no painel.

## Escopo

Este repositório contém apenas o servidor MCP (cliente da API). A infraestrutura
e a API da PushinPay têm seus próprios canais de segurança.
