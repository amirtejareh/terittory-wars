import type { GameState } from "@territory-wars/game-engine";

interface BattleBootstrapResponse {
  readonly game: GameState;
}

type EnvGlobal = typeof globalThis & {
  readonly process?: {
    readonly env?: Record<string, string | undefined>;
  };
};

const env = (globalThis as EnvGlobal).process?.env;
const apiBaseUrl = env?.EXPO_PUBLIC_API_BASE_URL ?? env?.PUBLIC_API_BASE_URL ?? "";

export async function fetchBattleBootstrap(): Promise<GameState | undefined> {
  if (!apiBaseUrl) {
    return undefined;
  }

  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/battle/bootstrap`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        username: "Amir"
      })
    });

    if (!response.ok) {
      return undefined;
    }

    const payload = (await response.json()) as BattleBootstrapResponse;
    return payload.game;
  } catch {
    return undefined;
  }
}

