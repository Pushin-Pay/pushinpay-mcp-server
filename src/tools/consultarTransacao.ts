import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PushinPayClient, PushinPayError, type Transaction } from "../client.js";
import { centavosParaBRL } from "../format.js";

/**
 * Trava de 1 consulta por minuto por transação.
 *
 * A PushinPay pode BLOQUEAR a conta que faz polling agressivo. Em vez de só
 * documentar, a tool impede na prática: se a mesma transação foi consultada há
 * menos de 60s, devolve o último status conhecido (cache) e orienta o agente a
 * usar webhook, sem tocar na API.
 */
const MIN_INTERVAL_MS = 60_000;
const ultimaConsulta = new Map<string, { at: number; data: Transaction }>();

function formatarTransacao(tx: Transaction): string {
  const linhas = [
    `Status: ${tx.status}`,
    `Valor: ${centavosParaBRL(tx.value)} (${tx.value} centavos)`,
  ];

  if (tx.end_to_end_id) linhas.push(`end_to_end_id: ${tx.end_to_end_id}`);
  if (tx.payer_name) linhas.push(`Pagador: ${tx.payer_name}`);
  if (tx.pix_details?.expiration_date) {
    linhas.push(`Expira em: ${tx.pix_details.expiration_date}`);
  }

  // Orientação embutida: enquanto não pago, reforça webhook em vez de polling.
  if (tx.status === "created") {
    linhas.push(
      "",
      "ℹ️ Ainda não paga. NÃO consulte de novo em menos de 1 min — prefira " +
        "receber a confirmação via webhook (webhook_url na criação da cobrança)."
    );
  }

  return linhas.join("\n");
}

export function registerConsultarTransacao(server: McpServer, client: PushinPayClient): void {
  server.registerTool(
    "consultar_transacao",
    {
      title: "Consultar transação PIX",
      description:
        "Consulta o status de uma transação PIX pelo ID. Status possíveis: " +
        "created, paid, canceled (não existe 'failed'). " +
        "IMPORTANTE: a API permite no máximo 1 consulta por minuto por transação — " +
        "consultas mais frequentes podem BLOQUEAR a conta. Esta tool aplica essa trava " +
        "automaticamente e orienta o uso de webhooks para confirmação de pagamento.",
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe("ID (UUID) da transação PIX retornado na criação da cobrança."),
      },
    },
    async ({ id }) => {
      const agora = Date.now();
      const cache = ultimaConsulta.get(id);

      // Trava de 1x/min: dentro da janela, responde do cache sem chamar a API.
      if (cache && agora - cache.at < MIN_INTERVAL_MS) {
        const desde = Math.floor((agora - cache.at) / 1000);
        const faltam = Math.ceil((MIN_INTERVAL_MS - (agora - cache.at)) / 1000);
        return {
          content: [
            {
              type: "text",
              text:
                `⏳ Esta transação foi consultada há ${desde}s. Para não arriscar o ` +
                `bloqueio da conta, a PushinPay permite no máximo 1 consulta/min. ` +
                `Aguarde ${faltam}s, ou melhor: use o webhook para ser avisado do pagamento.\n\n` +
                `Último status conhecido:\n${formatarTransacao(cache.data)}`,
            },
          ],
        };
      }

      try {
        const tx = await client.getTransaction(id);
        ultimaConsulta.set(id, { at: agora, data: tx });

        return {
          content: [
            {
              type: "text",
              text: `${formatarTransacao(tx)}\n\nJSON: ${JSON.stringify(tx)}`,
            },
          ],
        };
      } catch (err) {
        if (err instanceof PushinPayError && err.status === 404) {
          return {
            content: [{ type: "text", text: `Transação não encontrada para o ID informado.` }],
            isError: true,
          };
        }
        const message =
          err instanceof PushinPayError
            ? `${err.message} (HTTP ${err.status})`
            : "Erro inesperado ao consultar a transação.";
        return {
          content: [{ type: "text", text: `Falha ao consultar transação: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
