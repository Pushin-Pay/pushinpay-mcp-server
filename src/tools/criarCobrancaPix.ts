import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PushinPayClient, PushinPayError } from "../client.js";
import { centavosParaBRL } from "../format.js";

export function registerCriarCobrancaPix(server: McpServer, client: PushinPayClient): void {
  server.registerTool(
    "criar_cobranca_pix",
    {
      title: "Criar cobrança PIX",
      description:
        "Cria uma cobrança PIX (cash-in) e retorna o código copia-e-cola (EMV) e o QR Code. " +
        "Valores SEMPRE em centavos (ex.: 1000 = R$ 10,00; nunca decimais). " +
        "Opcionalmente aceita split entre contas PushinPay e uma webhook_url para notificação. " +
        "Após criar, prefira aguardar o pagamento via webhook em vez de ficar consultando o status.",
      inputSchema: {
        value: z
          .number()
          .int("value deve ser inteiro (centavos).")
          .positive("value deve ser maior que zero.")
          .describe("Valor total da cobrança em CENTAVOS (ex.: 1000 = R$ 10,00). Obrigatório."),
        webhook_url: z
          .string()
          .url("webhook_url deve ser uma URL válida.")
          .optional()
          .describe(
            "URL para receber a notificação de pagamento. Só preencha se tiver um servidor pronto para receber."
          ),
        split_rules: z
          .array(
            z.object({
              value: z
                .number()
                .int()
                .positive()
                .describe("Parte do split em centavos."),
              account_id: z
                .string()
                .min(1)
                .describe("UUID da conta PushinPay que recebe esta parte."),
            })
          )
          .optional()
          .describe("Divisão do valor entre contas PushinPay. A soma não pode exceder value."),
      },
    },
    async ({ value, webhook_url, split_rules }) => {
      // Validação embutida: a soma dos splits não pode exceder o valor total.
      if (split_rules && split_rules.length > 0) {
        const soma = split_rules.reduce((acc, r) => acc + r.value, 0);
        if (soma > value) {
          return {
            content: [
              {
                type: "text",
                text:
                  `Split inválido: a soma das regras (${centavosParaBRL(soma)}) ` +
                  `excede o valor da cobrança (${centavosParaBRL(value)}). ` +
                  `Ajuste os valores para que a soma seja no máximo igual ao total.`,
              },
            ],
            isError: true,
          };
        }
      }

      try {
        const charge = await client.createPixCharge({ value, webhook_url, split_rules });

        // Não devolvemos o qr_code_base64 inteiro (imagem grande) no texto —
        // apenas sinalizamos que existe, para não poluir o contexto do agente.
        const { qr_code_base64, ...semImagem } = charge;

        const linhas = [
          `Cobrança criada ✅`,
          `ID: ${charge.id}`,
          `Status: ${charge.status}`,
          `Valor: ${centavosParaBRL(charge.value)} (${charge.value} centavos)`,
        ];
        if (charge.qr_code) linhas.push(``, `Copia-e-cola (EMV):`, charge.qr_code);
        if (qr_code_base64) {
          linhas.push(``, `(QR Code em imagem base64 disponível no campo qr_code_base64 — omitido aqui por tamanho.)`);
        }
        if (charge.webhook_url) linhas.push(``, `Webhook: ${charge.webhook_url}`);
        linhas.push(``, `Use consultar_transacao com o ID acima para acompanhar (máx. 1x/min).`);
        linhas.push(``, `JSON (sem a imagem): ${JSON.stringify(semImagem)}`);

        return { content: [{ type: "text", text: linhas.join("\n") }] };
      } catch (err) {
        const message =
          err instanceof PushinPayError
            ? `${err.message} (HTTP ${err.status})`
            : "Erro inesperado ao criar a cobrança.";
        return {
          content: [{ type: "text", text: `Falha ao criar cobrança PIX: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
