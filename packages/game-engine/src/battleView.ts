import { countOwnedTiles, getCastle } from "./board.ts";
import type { GameState, PlayerId } from "./types.ts";

export const BATTLE_ARTWORK_SIZE = {
  width: 1024,
  height: 1536
} as const;

export const BATTLE_ARTWORK_RECTS = {
  board: {
    x: 38,
    y: 316,
    width: 948,
    height: 838
  },
  ability: {
    x: 408,
    y: 1082,
    width: 220,
    height: 270
  },
  endTurn: {
    x: 682,
    y: 1190,
    width: 318,
    height: 128
  }
} as const;

export interface BattlePlayerView {
  readonly id: PlayerId;
  readonly username: string;
  readonly hero: string;
  readonly mana: number;
  readonly maxMana: number;
  readonly territory: number;
  readonly castleHp: number;
  readonly rankPoints: number;
}

export interface BattleViewSnapshot {
  readonly currentPlayer: PlayerId;
  readonly turnNumber: number;
  readonly actionsRemaining: number;
  readonly matchSecondsRemaining: number;
  readonly players: Record<PlayerId, BattlePlayerView>;
}

export function createBattleViewSnapshot(game: GameState): BattleViewSnapshot {
  return {
    currentPlayer: game.currentPlayer,
    turnNumber: game.turnNumber,
    actionsRemaining: game.actionsRemaining,
    matchSecondsRemaining: game.matchSecondsRemaining,
    players: {
      blue: createPlayerView(game, "blue"),
      red: createPlayerView(game, "red")
    }
  };
}

function createPlayerView(game: GameState, player: PlayerId): BattlePlayerView {
  const castle = getCastle(game.board, player);
  const playerState = game.players[player];

  return {
    id: player,
    username: playerState.username,
    hero: playerState.hero,
    mana: playerState.mana,
    maxMana: playerState.maxMana,
    territory: countOwnedTiles(game.board, player),
    castleHp: castle?.castleHp ?? 0,
    rankPoints: playerState.rankPoints
  };
}

