import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PushinPayClient, PushinPayError } from "../client.js";
import { centavosParaBRL } from "../format.js";

export function registerConsultarSaldo(server: McpServer, client: PushinPayClient): void {
  server.registerTool(
    "consultar_saldo",
    {
      title: "Consultar saldo",
      description:
        "Retorna o saldo disponível e o valor bloqueado da conta PushinPay. " +
        "Todos os valores são em centavos (ex.: 1000 = R$ 10,00). " +
        "`blocked_balance` são valores temporariamente retidos (ex.: prevenção/segurança).",
      inputSchema: {},
    },
    async () => {
      try {
        const balance = await client.getBalance();
        const disponivel = centavosParaBRL(balance.amount);
        const bloqueado = centavosParaBRL(Number(balance.blocked_balance));

        return {
          content: [
            {
              type: "text",
              text:
                `Saldo disponível: ${disponivel} (${balance.amount} centavos)\n` +
                `Bloqueado: ${bloqueado} (${balance.blocked_balance} centavos)\n\n` +
                `JSON: ${JSON.stringify(balance)}`,
            },
          ],
        };
      } catch (err) {
        const message =
          err instanceof PushinPayError
            ? `${err.message} (HTTP ${err.status})`
            : "Erro inesperado ao consultar o saldo.";
        return {
          content: [{ type: "text", text: `Falha ao consultar saldo: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
