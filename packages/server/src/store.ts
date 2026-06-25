import type { CatalogItem } from "./catalog.js";

export interface UserRecord {
  readonly telegramId: string;
  readonly username: string;
  readonly gems: number;
  readonly coins: number;
  readonly selectedHero: string;
  readonly ownedSkins: readonly string[];
  readonly rankPoints: number;
}

export interface PaymentRecord {
  readonly telegramPaymentChargeId: string;
  readonly providerPaymentChargeId?: string | undefined;
  readonly telegramId: string;
  readonly itemId: string;
  readonly stars: number;
  readonly createdAt: string;
}

const users = new Map<string, UserRecord>();
const payments = new Map<string, PaymentRecord>();

export function upsertUser(telegramId: string, username: string): UserRecord {
  const current = users.get(telegramId);
  if (current) {
    return current;
  }

  const next: UserRecord = {
    telegramId,
    username,
    gems: 0,
    coins: 0,
    selectedHero: "wizard",
    ownedSkins: [],
    rankPoints: 1000
  };
  users.set(telegramId, next);
  return next;
}

export function getUser(telegramId: string): UserRecord | undefined {
  return users.get(telegramId);
}

export function grantCatalogItem(telegramId: string, item: CatalogItem, payment: Omit<PaymentRecord, "telegramId" | "itemId" | "stars" | "createdAt">): UserRecord {
  if (payments.has(payment.telegramPaymentChargeId)) {
    const existing = users.get(telegramId);
    if (!existing) {
      throw new Error("Duplicate payment belongs to an unknown user.");
    }
    return existing;
  }

  const current = users.get(telegramId) ?? upsertUser(telegramId, `user_${telegramId}`);
  const ownedSkins = new Set(current.ownedSkins);
  let gems = current.gems;

  if (item.kind === "gems") {
    gems += item.quantity ?? 0;
  } else {
    ownedSkins.add(item.id);
  }

  const next: UserRecord = {
    ...current,
    gems,
    ownedSkins: [...ownedSkins]
  };

  users.set(telegramId, next);
  payments.set(payment.telegramPaymentChargeId, {
    ...payment,
    telegramId,
    itemId: item.id,
    stars: item.stars,
    createdAt: new Date().toISOString()
  });

  return next;
}
