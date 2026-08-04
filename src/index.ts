#!/usr/bin/env node
/**
 * Servidor MCP da PushinPay.
 *
 * Expõe as operações da API PushinPay como "tools" que agentes de IA
 * (Claude Desktop, Claude Code, Cursor) podem chamar via protocolo MCP.
 *
 * Transporte: stdio. O stdout é reservado para o protocolo MCP —
 * qualquer log da aplicação vai para o stderr.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig, PushinPayClient } from "./client.js";
import { registerConsultarSaldo } from "./tools/consultarSaldo.js";
import { registerConsultarTransacao } from "./tools/consultarTransacao.js";
import { registerCriarCobrancaPix } from "./tools/criarCobrancaPix.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const client = new PushinPayClient(config);

  const server = new McpServer({
    name: "pushinpay",
    version: "0.1.0",
  });

  // Registro das tools (v1). Novas tools entram aqui.
  registerConsultarSaldo(server, client);
  registerConsultarTransacao(server, client);
  registerCriarCobrancaPix(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`[pushinpay-mcp] conectado — ambiente: ${config.environment} (${client.baseUrl})`);
}

main().catch((err: unknown) => {
  console.error(
    "[pushinpay-mcp] falha ao iniciar:",
    err instanceof Error ? err.message : err
  );
  process.exit(1);
});
