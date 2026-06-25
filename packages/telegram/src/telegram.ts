export interface TelegramWebApp {
  readonly initData: string;
  readonly initDataUnsafe?: {
    readonly user?: {
      readonly id: number;
      readonly username?: string;
      readonly first_name?: string;
    };
  };
  ready: () => void;
  expand: () => void;
  openInvoice: (url: string, callback?: (status: "paid" | "cancelled" | "failed" | "pending") => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getTelegramApp(): TelegramWebApp | undefined {
  return window.Telegram?.WebApp;
}

export function bootTelegram(): TelegramWebApp | undefined {
  const app = getTelegramApp();
  app?.ready();
  app?.expand();
  return app;
}

export async function openStarsInvoice(itemId: string): Promise<string> {
  const telegram = getTelegramApp();
  const response = await fetch("/api/shop/invoice", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      itemId,
      initData: telegram?.initData ?? ""
    })
  });

  if (!response.ok) {
    throw new Error(`Invoice failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as { invoiceUrl: string };
  telegram?.openInvoice(payload.invoiceUrl);
  return payload.invoiceUrl;
}

