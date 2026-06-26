import { randomUUID } from "node:crypto";
import { applyAction, calculateMatchReward, createBattleViewSnapshot, createInitialGame, evaluateWinner, type GameAction } from "@territory-wars/game-engine";
import { catalog, getCatalogItem } from "./catalog.js";
import { getUser, grantCatalogItem, upsertUser } from "./store.js";
import {
  answerPreCheckoutQuery,
  createStarsInvoiceLink,
  devTelegramSession,
  parsePaymentPayload,
  validateTelegramInitData,
  type TelegramUpdate,
  type ValidatedTelegramSession
} from "./telegram.js";

export interface ApiRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: Record<string, string | string[] | undefined>;
  readonly body?: unknown;
}

export interface ApiResponse {
  readonly status: number;
  readonly headers?: Record<string, string>;
  readonly body?: unknown;
}

export async function handleApiRequest(request: ApiRequest): Promise<ApiResponse> {
  if (request.method === "OPTIONS") {
    return empty(204);
  }

  const url = new URL(request.url, "http://territory-wars.local");
  const path = url.pathname.replace(/^\/api/, "") || "/";

  try {
    if (request.method === "GET" && path === "/health") {
      return json(200, {
        ok: true,
        service: "territory-wars-api"
      });
    }

    if (request.method === "POST" && path === "/session") {
      const { initData } = readBody<{ initData?: string }>(request.body);
      const session = resolveSession(initData ?? "");
      const username = session.user.username ?? session.user.first_name ?? `user_${session.user.id}`;
      const user = upsertUser(String(session.user.id), username);
      return json(200, { user });
    }

    if (request.method === "GET" && path === "/shop/catalog") {
      return json(200, { items: catalog });
    }

    if ((request.method === "GET" || request.method === "POST") && path === "/battle/bootstrap") {
      const { initData, username } = readBody<{ initData?: string; username?: string }>(request.body);
      const session = initData ? resolveSession(initData) : undefined;
      const blueName = session?.user.username ?? session?.user.first_name ?? username ?? "Amir";
      const game = createInitialGame({ blueName });

      return json(200, {
        game,
        snapshot: createBattleViewSnapshot(game),
        assets: {
          battleBackground: "battle-empty"
        }
      });
    }

    if (request.method === "POST" && path === "/shop/invoice") {
      const { initData, itemId } = readBody<{ initData?: string; itemId?: string }>(request.body);
      const item = itemId ? getCatalogItem(itemId) : undefined;
      if (!item) {
        return json(404, { error: "Catalog item was not found." });
      }

      const session = resolveSession(initData ?? "");
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const telegramId = String(session.user.id);
      const username = session.user.username ?? session.user.first_name ?? `user_${telegramId}`;
      upsertUser(telegramId, username);

      if (!botToken) {
        return json(200, {
          invoiceUrl: `https://t.me/territory_wars_dev_invoice/${item.id}`,
          mode: "local-mock"
        });
      }

      const invoiceUrl = await createStarsInvoiceLink(
        botToken,
        item,
        {
          telegramId,
          itemId: item.id,
          nonce: randomUUID()
        },
        process.env.TELEGRAM_TEST_ENV === "true"
      );

      return json(200, { invoiceUrl });
    }

    if (request.method === "POST" && path === "/matches/validate") {
      const { player, actions, firstWinOfDay } = readBody<{ player?: "blue" | "red"; actions?: GameAction[]; firstWinOfDay?: boolean }>(request.body);
      const replayed = (actions ?? []).reduce((state, action) => applyAction(state, action), createInitialGame());
      const result = evaluateWinner(replayed, true);
      const reward = calculateMatchReward({
        winner: result.winner,
        player: player ?? "blue",
        firstWinOfDay
      });

      return json(200, {
        result,
        reward,
        lastEvent: replayed.lastEvent
      });
    }

    if (request.method === "POST" && (path === "/telegram/webhook" || path === "/webhook")) {
      return handleTelegramWebhook(request);
    }

    return json(404, { error: "Route was not found." });
  } catch (error) {
    return json(400, {
      error: error instanceof Error ? error.message : "Unknown API error."
    });
  }
}

async function handleTelegramWebhook(request: ApiRequest): Promise<ApiResponse> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return json(503, { error: "TELEGRAM_BOT_TOKEN is not configured." });
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const requestSecret = header(request, "x-telegram-bot-api-secret-token");
  if (secret && requestSecret !== secret) {
    return json(401, { error: "Webhook secret is invalid." });
  }

  const update = readBody<TelegramUpdate>(request.body);

  if (update.pre_checkout_query) {
    const payload = parsePaymentPayload(update.pre_checkout_query.invoice_payload);
    const item = getCatalogItem(payload.itemId);
    await answerPreCheckoutQuery(botToken, update.pre_checkout_query.id, Boolean(item), item ? undefined : "Item is no longer available.");
    return json(200, { ok: true });
  }

  const payment = update.message?.successful_payment;
  if (payment) {
    const payload = parsePaymentPayload(payment.invoice_payload);
    const item = getCatalogItem(payload.itemId);
    if (!item) {
      return json(404, { error: "Paid item was not found." });
    }

    const user = grantCatalogItem(payload.telegramId, item, {
      telegramPaymentChargeId: payment.telegram_payment_charge_id,
      providerPaymentChargeId: payment.provider_payment_charge_id
    });

    return json(200, { ok: true, user });
  }

  return json(200, { ok: true, ignored: true });
}

function resolveSession(initData: string): ValidatedTelegramSession {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return devTelegramSession();
  }

  return validateTelegramInitData(initData, botToken);
}

function readBody<T>(body: unknown): T {
  if (!body) {
    return {} as T;
  }

  if (typeof body === "string") {
    return JSON.parse(body) as T;
  }

  return body as T;
}

function header(request: ApiRequest, name: string): string | undefined {
  const value = request.headers[name] ?? request.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function json(status: number, body: unknown): ApiResponse {
  return {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,x-telegram-bot-api-secret-token"
    },
    body
  };
}

function empty(status: number): ApiResponse {
  return {
    status,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,x-telegram-bot-api-secret-token"
    }
  };
}
