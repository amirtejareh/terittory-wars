import { createHmac, timingSafeEqual } from "node:crypto";
import type { CatalogItem } from "./catalog.js";

export interface TelegramUser {
  readonly id: number;
  readonly username?: string;
  readonly first_name?: string;
  readonly last_name?: string;
}

export interface ValidatedTelegramSession {
  readonly user: TelegramUser;
  readonly authDate: number;
}

export interface SuccessfulPayment {
  readonly currency: string;
  readonly total_amount: number;
  readonly invoice_payload: string;
  readonly telegram_payment_charge_id: string;
  readonly provider_payment_charge_id?: string;
}

export interface TelegramUpdate {
  readonly update_id: number;
  readonly pre_checkout_query?: {
    readonly id: string;
    readonly from: TelegramUser;
    readonly currency: string;
    readonly total_amount: number;
    readonly invoice_payload: string;
  };
  readonly message?: {
    readonly from?: TelegramUser;
    readonly successful_payment?: SuccessfulPayment;
  };
}

export interface PaymentPayload {
  readonly telegramId: string;
  readonly itemId: string;
  readonly nonce: string;
}

export function validateTelegramInitData(initData: string, botToken: string, maxAgeSeconds = 86_400): ValidatedTelegramSession {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  const authDate = Number(params.get("auth_date"));
  const userJson = params.get("user");

  if (!hash || !authDate || !userJson) {
    throw new Error("Telegram initData is missing required fields.");
  }

  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (ageSeconds > maxAgeSeconds) {
    throw new Error("Telegram initData is expired.");
  }

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expected = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (!safeEqualHex(expected, hash)) {
    throw new Error("Telegram initData signature is invalid.");
  }

  return {
    user: JSON.parse(userJson) as TelegramUser,
    authDate
  };
}

export function devTelegramSession(): ValidatedTelegramSession {
  return {
    user: {
      id: 1000,
      username: "local_player",
      first_name: "Local"
    },
    authDate: Math.floor(Date.now() / 1000)
  };
}

export async function createStarsInvoiceLink(botToken: string, item: CatalogItem, payload: PaymentPayload, testEnvironment: boolean): Promise<string> {
  const endpoint = `https://api.telegram.org/bot${botToken}/${testEnvironment ? "test/" : ""}createInvoiceLink`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      title: item.title,
      description: item.description,
      payload: JSON.stringify(payload),
      provider_token: "",
      currency: "XTR",
      prices: [
        {
          label: item.title,
          amount: item.stars
        }
      ]
    })
  });

  const body = (await response.json()) as { ok: boolean; result?: string; description?: string };
  if (!body.ok || !body.result) {
    throw new Error(body.description ?? "Telegram invoice creation failed.");
  }

  return body.result;
}

export async function answerPreCheckoutQuery(botToken: string, queryId: string, ok: boolean, errorMessage?: string): Promise<void> {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      pre_checkout_query_id: queryId,
      ok,
      error_message: errorMessage
    })
  });

  const body = (await response.json()) as { ok: boolean; description?: string };
  if (!body.ok) {
    throw new Error(body.description ?? "Telegram pre-checkout answer failed.");
  }
}

export function parsePaymentPayload(payload: string): PaymentPayload {
  const parsed = JSON.parse(payload) as Partial<PaymentPayload>;
  if (!parsed.telegramId || !parsed.itemId || !parsed.nonce) {
    throw new Error("Payment payload is invalid.");
  }

  return {
    telegramId: parsed.telegramId,
    itemId: parsed.itemId,
    nonce: parsed.nonce
  };
}

function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}
