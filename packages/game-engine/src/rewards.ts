import type { PlayerId } from "./types.js";

export interface RewardInput {
  readonly winner?: PlayerId | undefined;
  readonly player: PlayerId;
  readonly firstWinOfDay?: boolean | undefined;
}

export interface MatchReward {
  readonly rankPoints: number;
  readonly coins: number;
  readonly xp: number;
}

export function calculateMatchReward(input: RewardInput): MatchReward {
  const won = input.winner === input.player;
  const firstWinBonus = won && input.firstWinOfDay ? 50 : 0;

  return {
    rankPoints: won ? 25 : -15,
    coins: (won ? 120 : 35) + firstWinBonus,
    xp: won ? 100 : 40
  };
}
