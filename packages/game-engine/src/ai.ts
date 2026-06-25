import { TILE_SCORE } from "./constants.ts";
import { getTile } from "./board.ts";
import { getAttackStrength, getDefenseStrength, getValidCaptureActions } from "./rules.ts";
import type { BotDifficulty, CaptureAction, GameAction, GameState, MoveOption, PlayerId } from "./types.ts";

export function chooseBotAction(state: GameState, player: PlayerId, difficulty: BotDifficulty = "normal"): GameAction {
  const moves = scoreMoves(state, player, difficulty);
  const bestMove = moves[0];

  if (!bestMove) {
    return { type: "endTurn", player };
  }

  return bestMove.action;
}

export function scoreMoves(state: GameState, player: PlayerId, difficulty: BotDifficulty): readonly MoveOption[] {
  const actions = getValidCaptureActions(state, player);
  const scored = actions.map((action) => ({
    action,
    score: scoreAction(state, action, difficulty)
  }));

  if (difficulty === "easy") {
    return scored.sort((a, b) => `${a.action.to.x}:${a.action.to.y}`.localeCompare(`${b.action.to.x}:${b.action.to.y}`));
  }

  return scored.sort((a, b) => b.score - a.score);
}

function scoreAction(state: GameState, action: CaptureAction, difficulty: BotDifficulty): number {
  const target = getTile(state.board, action.to);
  if (!target) {
    return -100;
  }

  let score = TILE_SCORE[target.type];

  if (target.owner !== "neutral") {
    score += getAttackStrength(state, action.player, target.position) - getDefenseStrength(state, target.owner, target);
  }

  if (difficulty === "hard") {
    if (target.type === "shrine") {
      score += 6;
    }
    if (target.type === "crystalMine") {
      score += 4;
    }
    if (target.type === "castle") {
      score += 10;
    }
  }

  return score;
}
