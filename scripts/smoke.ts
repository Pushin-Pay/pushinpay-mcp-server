/**
 * Teste de fumaça (não faz parte do MCP).
 *
 * Valida ponta a ponta que o cliente autentica e lê o saldo, usando o token
 * do seu ambiente. Rode com:  npm run smoke
 *
 * Exige PUSHINPAY_TOKEN no ambiente. PUSHINPAY_ENV=sandbox por padrão.
 */
import { loadConfig, PushinPayClient } from "../src/client.js";

async function main(): Promise<void> {
  const client = new PushinPayClient(loadConfig());
  console.log(`Ambiente: ${client.environment} (${client.baseUrl})`);

  const balance = await client.getBalance();
  const reais = (balance.amount / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  console.log("✅ Autenticou e leu o saldo:");
  console.log(`   Disponível: ${reais} (${balance.amount} centavos)`);
  console.log(`   Bloqueado:  ${balance.blocked_balance} centavos`);
}

main().catch((err: unknown) => {
  console.error("❌ Falhou:", err instanceof Error ? err.message : err);
  process.exit(1);
});
