/**
 * Cliente HTTP da API PushinPay.
 *
 * Responsável só por: montar a base URL (prod/sandbox), anexar o Bearer token
 * e traduzir respostas/erros. Nenhuma regra de negócio mora aqui — isso fica
 * nas tools.
 */

const BASE_URLS = {
  production: "https://api.pushinpay.com.br",
  sandbox: "https://api-sandbox.pushinpay.com.br",
} as const;

export type Environment = keyof typeof BASE_URLS;

export interface PushinPayConfig {
  token: string;
  environment: Environment;
}

/**
 * Lê a configuração das variáveis de ambiente.
 * Padrão é `sandbox` — produção exige `PUSHINPAY_ENV=production` explícito,
 * pra evitar operar na conta real por acidente.
 */
export function loadConfig(): PushinPayConfig {
  const token = process.env.PUSHINPAY_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "PUSHINPAY_TOKEN não definido. Configure o token da sua conta PushinPay na variável de ambiente PUSHINPAY_TOKEN."
    );
  }

  const envRaw = (process.env.PUSHINPAY_ENV ?? "sandbox").trim().toLowerCase();
  const environment: Environment = envRaw === "production" ? "production" : "sandbox";

  return { token, environment };
}

export class PushinPayError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data: unknown
  ) {
    super(message);
    this.name = "PushinPayError";
  }
}

/** Resposta do endpoint GET /api/balance. Valores em centavos. */
export interface Balance {
  amount: number;
  blocked_balance: string;
}

/** Status possíveis de uma transação PIX. Não existe "failed". */
export type TransactionStatus = "created" | "paid" | "canceled";

/** Regra de split: divide parte do valor para outra conta PushinPay. */
export interface SplitRule {
  value: number;
  account_id: string;
}

/** Corpo do POST /api/pix/cashIn. Valores em centavos. */
export interface CreatePixChargeInput {
  value: number;
  webhook_url?: string;
  split_rules?: SplitRule[];
}

/** Resposta da criação de cobrança PIX. Valores em centavos. */
export interface PixCharge {
  id: string;
  status: TransactionStatus | string;
  value: number;
  /** Copia-e-cola / EMV para pagar. */
  qr_code?: string;
  /** Imagem do QR Code em base64 (pode ser grande). */
  qr_code_base64?: string;
  webhook_url?: string | null;
  split_rules?: SplitRule[] | null;
  created_at?: string;
  updated_at?: string;
}

/** Resposta do endpoint GET /api/transactions/{id}. Valores em centavos. */
export interface Transaction {
  id: string;
  status: TransactionStatus | string;
  value: number;
  description?: string | null;
  payment_type?: string | null;
  end_to_end_id?: string | null;
  payer_name?: string | null;
  payer_national_registration?: string | null;
  fee?: number | null;
  total?: number | null;
  split_rules?: unknown[] | null;
  pix_details?: { emv?: string; expiration_date?: string } | null;
  created_at?: string;
  updated_at?: string;
}

export class PushinPayClient {
  constructor(private readonly config: PushinPayConfig) {}

  get environment(): Environment {
    return this.config.environment;
  }

  get baseUrl(): string {
    return BASE_URLS[this.config.environment];
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let data: unknown = text;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // resposta não-JSON: mantém o texto cru
    }

    if (!res.ok) {
      const message =
        data && typeof data === "object" && "error" in data
          ? String((data as Record<string, unknown>).error)
          : `HTTP ${res.status}`;
      throw new PushinPayError(message, res.status, data);
    }

    return data as T;
  }

  /** GET /api/balance — saldo disponível e valor bloqueado (em centavos). */
  getBalance(): Promise<Balance> {
    return this.request<Balance>("GET", "/api/balance");
  }

  /**
   * GET /api/transactions/{id} — consulta uma transação PIX.
   *
   * A API responde 404 com um array vazio `[]` quando a transação não existe;
   * nesse caso normalizamos para um PushinPayError 404.
   */
  async getTransaction(id: string): Promise<Transaction> {
    const data = await this.request<Transaction | unknown[]>(
      "GET",
      `/api/transactions/${encodeURIComponent(id)}`
    );

    if (Array.isArray(data)) {
      throw new PushinPayError("Transação não encontrada.", 404, data);
    }

    return data as Transaction;
  }

  /** POST /api/pix/cashIn — cria uma cobrança PIX e retorna QR Code / copia-e-cola. */
  createPixCharge(input: CreatePixChargeInput): Promise<PixCharge> {
    return this.request<PixCharge>("POST", "/api/pix/cashIn", input);
  }
}
