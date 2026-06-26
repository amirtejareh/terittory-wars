import type { GameState } from "@territory-wars/game-engine";

interface BattleBootstrapResponse {
  readonly game: GameState;
}

export async function fetchBattleBootstrap(initData: string): Promise<GameState | undefined> {
  try {
    const response = await fetch("/api/battle/bootstrap", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ initData })
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

