/**
 * Teste end-to-end das tools de transação contra o SANDBOX.
 * Cria uma cobrança real de sandbox, consulta, e valida o 404.
 *
 * Rode: npx tsx --env-file=.env scripts/e2e.ts
 * Exige PUSHINPAY_TOKEN no ambiente. Só roda em sandbox por segurança.
 */
import { loadConfig, PushinPayClient, PushinPayError } from "../src/client.js";

async function main(): Promise<void> {
  const config = loadConfig();
  if (config.environment !== "sandbox") {
    throw new Error("Este teste só roda em sandbox. Defina PUSHINPAY_ENV=sandbox.");
  }
  const client = new PushinPayClient(config);
  console.log(`Ambiente: ${client.environment} (${client.baseUrl})\n`);

  // 1) criar_cobranca_pix
  console.log("1) Criando cobrança de R$ 1,00 (value: 100)...");
  const charge = await client.createPixCharge({ value: 100 });
  console.log(`   id: ${charge.id}`);
  console.log(`   status: ${charge.status}`);
  console.log(
    `   qr_code: ${charge.qr_code ? "presente (" + charge.qr_code.slice(0, 24) + "...)" : "AUSENTE ⚠️"}`
  );
  console.log(`   qr_code_base64: ${charge.qr_code_base64 ? "presente" : "ausente"}\n`);

  // 2) consultar_transacao
  console.log("2) Consultando a transação criada...");
  const tx = await client.getTransaction(charge.id);
  console.log(`   status: ${tx.status}`);
  console.log(`   value: ${tx.value} centavos`);
  console.log(`   payment_type: ${tx.payment_type ?? "-"}\n`);

  // 3) 404
  console.log("3) Testando 404 (id inexistente)...");
  try {
    await client.getTransaction("00000000-0000-0000-0000-000000000000");
    console.log("   ⚠️ esperava 404, mas a API retornou sucesso");
  } catch (e) {
    if (e instanceof PushinPayError && e.status === 404) {
      console.log("   404 tratado corretamente ✅");
    } else {
      throw e;
    }
  }

  console.log("\n✅ Round-trip completo das tools de transação.");
}

main().catch((e: unknown) => {
  console.error("❌", e instanceof Error ? e.message : e);
  process.exit(1);
});
