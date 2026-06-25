import {
  ACTIONS_PER_TURN,
  BOARD_SIZE,
  CASTLE_HP,
  HEROES,
  MATCH_SECONDS,
  MAX_MANA,
  TILE_CAPTURE_COST,
  TILE_DEFENSE,
  TURN_SECONDS
} from "./constants.ts";
import {
  areAdjacent,
  countAdjacentOwned,
  countControlledCrystals,
  countOwnedTiles,
  createInitialBoard,
  getCastle,
  getOpponent,
  getTile,
  replaceTile
} from "./board.ts";
import type {
  CaptureAction,
  GameAction,
  GameEvent,
  GameState,
  HeroAbilityAction,
  HeroId,
  PlayerId,
  PlayerState,
  Position,
  Tile,
  WinnerResult
} from "./types.ts";

export interface NewGameOptions {
  readonly blueName?: string;
  readonly redName?: string;
  readonly blueHero?: HeroId;
  readonly redHero?: HeroId;
}

export function createInitialGame(options: NewGameOptions = {}): GameState {
  return {
    boardSize: BOARD_SIZE,
    board: createInitialBoard(),
    players: {
      blue: createPlayer("blue", options.blueName ?? "Amir", options.blueHero ?? "wizard"),
      red: createPlayer("red", options.redName ?? "AliKing", options.redHero ?? "darkLord")
    },
    currentPlayer: "blue",
    turnNumber: 1,
    actionsRemaining: ACTIONS_PER_TURN,
    matchSecondsRemaining: MATCH_SECONDS
  };
}

export function createPlayer(id: PlayerId, username: string, hero: HeroId): PlayerState {
  return {
    id,
    username,
    hero,
    mana: id === "blue" ? 6 : 4,
    maxMana: MAX_MANA,
    gold: 0,
    crystals: 0,
    rankPoints: 1000,
    xp: 0
  };
}

export function applyAction(state: GameState, action: GameAction): GameState {
  if (state.winner) {
    return withEvent(state, {
      type: "blocked",
      player: action.player,
      message: "Match is already finished."
    });
  }

  if (action.player !== state.currentPlayer) {
    return withEvent(state, {
      type: "blocked",
      player: action.player,
      message: "It is not this player's turn."
    });
  }

  if (action.type === "endTurn") {
    return endTurn(state, action.player);
  }

  if (action.type === "capture") {
    return captureTile(state, action);
  }

  return useHeroAbility(state, action);
}

export function captureTile(state: GameState, action: CaptureAction): GameState {
  const from = getTile(state.board, action.from);
  const to = getTile(state.board, action.to);

  if (!from || !to) {
    return withEvent(state, event("blocked", action.player, "Tile is outside the board.", action.from, action.to));
  }

  if (from.owner !== action.player) {
    return withEvent(state, event("blocked", action.player, "You can only expand from your own territory.", action.from, action.to));
  }

  if (!areAdjacent(action.from, action.to)) {
    return withEvent(state, event("blocked", action.player, "Target tile must be adjacent.", action.from, action.to));
  }

  if (to.type === "river") {
    return withEvent(state, event("blocked", action.player, "River blocks direct movement.", action.from, action.to));
  }

  if (to.owner === action.player) {
    return withEvent(state, event("blocked", action.player, "Tile is already yours.", action.from, action.to));
  }

  const cost = getCaptureCost(state, action.player, to);
  if (state.actionsRemaining < cost) {
    return withEvent(state, event("blocked", action.player, "Not enough actions remaining.", action.from, action.to));
  }

  if (to.owner === "neutral") {
    const nextTile: Tile = {
      ...to,
      owner: action.player,
      contestedBy: undefined,
      shieldedBy: undefined
    };
    return normalizeAfterBoardChange(
      {
        ...state,
        board: replaceTile(state.board, nextTile),
        actionsRemaining: state.actionsRemaining - cost,
        lastEvent: event("captured", action.player, `Captured ${to.type}.`, action.from, action.to)
      },
      action.player
    );
  }

  return attackEnemyTile(state, action, to, cost);
}

export function getCaptureCost(state: GameState, player: PlayerId, tile: Tile): number {
  if (tile.type === "forest" && state.players[player].hero === "ranger") {
    return 1;
  }

  return TILE_CAPTURE_COST[tile.type];
}

export function attackEnemyTile(state: GameState, action: CaptureAction, target: Tile, cost: number): GameState {
  const attacker = action.player;
  const defender = target.owner === "neutral" ? getOpponent(attacker) : target.owner;
  const attackStrength = getAttackStrength(state, attacker, target.position);
  const defenseStrength = getDefenseStrength(state, defender, target);

  if (target.type === "castle") {
    const damage = Math.max(1, attackStrength - Math.max(0, defenseStrength - 2));
    const nextCastleHp = Math.max(0, (target.castleHp ?? CASTLE_HP) - damage);
    const nextTile: Tile = {
      ...target,
      castleHp: nextCastleHp,
      owner: nextCastleHp <= 0 ? attacker : target.owner
    };
    const winner = nextCastleHp <= 0 ? attacker : undefined;

    return {
      ...state,
      board: replaceTile(state.board, nextTile),
      actionsRemaining: state.actionsRemaining - cost,
      winner,
      lastEvent: event("castleDamaged", attacker, `Castle took ${damage} damage.`, action.from, action.to)
    };
  }

  if (attackStrength > defenseStrength) {
    const nextTile: Tile = {
      ...target,
      owner: attacker,
      contestedBy: undefined,
      shieldedBy: undefined
    };
    return normalizeAfterBoardChange(
      {
        ...state,
        board: replaceTile(state.board, nextTile),
        actionsRemaining: state.actionsRemaining - cost,
        lastEvent: event("captured", attacker, `Won combat ${attackStrength}-${defenseStrength}.`, action.from, action.to)
      },
      attacker
    );
  }

  if (attackStrength === defenseStrength) {
    const nextTile: Tile = {
      ...target,
      contestedBy: attacker
    };
    return {
      ...state,
      board: replaceTile(state.board, nextTile),
      actionsRemaining: state.actionsRemaining - cost,
      lastEvent: event("contested", attacker, `Combat tied ${attackStrength}-${defenseStrength}.`, action.from, action.to)
    };
  }

  return {
    ...state,
    actionsRemaining: state.actionsRemaining - cost,
    lastEvent: event("failed", attacker, `Attack failed ${attackStrength}-${defenseStrength}.`, action.from, action.to)
  };
}

export function getAttackStrength(state: GameState, player: PlayerId, target: Position): number {
  const hero = state.players[player].hero;
  const heroBonus = hero === "wizard" ? 1 : 0;
  return 2 + heroBonus + countAdjacentOwned(state.board, target, player);
}

export function getDefenseStrength(state: GameState, defender: PlayerId, tile: Tile): number {
  const player = state.players[defender];
  const knightBonus = player.hero === "knight" && (tile.type === "plain" || tile.type === "forest") ? 1 : 0;
  const shieldBonus = tile.shieldedBy === defender ? 2 : 0;
  const darkLordPenalty = hasAdjacentDarkLordPressure(state, defender, tile.position) ? -1 : 0;
  return Math.max(0, TILE_DEFENSE[tile.type] + countAdjacentOwned(state.board, tile.position, defender) + knightBonus + shieldBonus + darkLordPenalty);
}

export function hasAdjacentDarkLordPressure(state: GameState, defender: PlayerId, position: Position): boolean {
  const attacker = getOpponent(defender);
  if (state.players[attacker].hero !== "darkLord") {
    return false;
  }

  return countAdjacentOwned(state.board, position, attacker) > 0;
}

export function useHeroAbility(state: GameState, action: HeroAbilityAction): GameState {
  const player = state.players[action.player];
  const hero = HEROES[player.hero];
  if (!hero) {
    return withEvent(state, event("blocked", action.player, "Unknown hero.", undefined, action.target));
  }

  if (player.mana < hero.manaCost) {
    return withEvent(state, event("blocked", action.player, "Not enough mana.", undefined, action.target));
  }

  const target = getTile(state.board, action.target);
  if (!target) {
    return withEvent(state, event("blocked", action.player, "Ability target is outside the board.", undefined, action.target));
  }

  if (player.hero === "wizard") {
    return wizardArcaneStrike(state, action, hero.manaCost, target);
  }

  if (player.hero === "knight") {
    return knightShieldWall(state, action, hero.manaCost, target);
  }

  if (player.hero === "darkLord") {
    return darkLordCorruption(state, action, hero.manaCost, target);
  }

  return rangerQuickMarch(state, action, hero.manaCost, target);
}

function wizardArcaneStrike(state: GameState, action: HeroAbilityAction, manaCost: number, target: Tile): GameState {
  if (!isWithinOwnedRange(state, action.player, target.position, 2)) {
    return withEvent(state, event("blocked", action.player, "Arcane Strike needs a target within 2 tiles of your territory.", undefined, target.position));
  }

  if (target.type === "river") {
    return spendMana(
      withEvent(state, event("abilityUsed", action.player, "Arcane Strike fizzled over the river.", undefined, target.position)),
      action.player,
      manaCost
    );
  }

  if (target.type === "castle" && target.owner !== action.player) {
    const nextHp = Math.max(0, (target.castleHp ?? CASTLE_HP) - 3);
    return spendMana(
      {
        ...state,
        board: replaceTile(state.board, {
          ...target,
          castleHp: nextHp,
          owner: nextHp <= 0 ? action.player : target.owner
        }),
        winner: nextHp <= 0 ? action.player : state.winner,
        lastEvent: event("castleDamaged", action.player, "Arcane Strike damaged the castle.", undefined, target.position)
      },
      action.player,
      manaCost
    );
  }

  if (target.owner === action.player) {
    return withEvent(state, event("blocked", action.player, "Target is already yours.", undefined, target.position));
  }

  return spendMana(
    normalizeAfterBoardChange(
      {
        ...state,
        board: replaceTile(state.board, { ...target, owner: action.player, contestedBy: undefined }),
        lastEvent: event("abilityUsed", action.player, "Arcane Strike captured a tile.", undefined, target.position)
      },
      action.player
    ),
    action.player,
    manaCost
  );
}

function knightShieldWall(state: GameState, action: HeroAbilityAction, manaCost: number, target: Tile): GameState {
  if (target.owner !== action.player) {
    return withEvent(state, event("blocked", action.player, "Shield Wall can only protect your territory.", undefined, target.position));
  }

  const protectedIds = new Set(
    [target, ...state.board.filter((tile) => tile.owner === action.player && countAdjacentOwned([target], tile.position, action.player) > 0)]
      .slice(0, 3)
      .map((tile) => tile.id)
  );
  const board = state.board.map((tile) => (protectedIds.has(tile.id) ? { ...tile, shieldedBy: action.player } : tile));

  return spendMana(
    {
      ...state,
      board,
      lastEvent: event("abilityUsed", action.player, "Shield Wall protected connected tiles.", undefined, target.position)
    },
    action.player,
    manaCost
  );
}

function darkLordCorruption(state: GameState, action: HeroAbilityAction, manaCost: number, target: Tile): GameState {
  if (target.owner !== "neutral") {
    return withEvent(state, event("blocked", action.player, "Corruption can only convert neutral land.", undefined, target.position));
  }

  if (!isWithinOwnedRange(state, action.player, target.position, 1)) {
    return withEvent(state, event("blocked", action.player, "Corruption needs adjacent territory.", undefined, target.position));
  }

  return spendMana(
    normalizeAfterBoardChange(
      {
        ...state,
        board: replaceTile(state.board, { ...target, owner: action.player }),
        lastEvent: event("abilityUsed", action.player, "Corruption converted neutral land.", undefined, target.position)
      },
      action.player
    ),
    action.player,
    manaCost
  );
}

function rangerQuickMarch(state: GameState, action: HeroAbilityAction, manaCost: number, target: Tile): GameState {
  if (target.owner !== "neutral" || target.type === "river") {
    return withEvent(state, event("blocked", action.player, "Quick March needs a neutral passable tile.", undefined, target.position));
  }

  if (!isWithinOwnedRange(state, action.player, target.position, 1)) {
    return withEvent(state, event("blocked", action.player, "Quick March needs adjacent territory.", undefined, target.position));
  }

  return spendMana(
    normalizeAfterBoardChange(
      {
        ...state,
        board: replaceTile(state.board, { ...target, owner: action.player }),
        actionsRemaining: Math.min(ACTIONS_PER_TURN, state.actionsRemaining + 1),
        lastEvent: event("abilityUsed", action.player, "Quick March captured land and refunded tempo.", undefined, target.position)
      },
      action.player
    ),
    action.player,
    manaCost
  );
}

function spendMana(state: GameState, player: PlayerId, amount: number): GameState {
  return {
    ...state,
    players: {
      ...state.players,
      [player]: {
        ...state.players[player],
        mana: Math.max(0, state.players[player].mana - amount)
      }
    }
  };
}

export function endTurn(state: GameState, player: PlayerId): GameState {
  const nextPlayer = getOpponent(player);
  const reducedSeconds = Math.max(0, state.matchSecondsRemaining - TURN_SECONDS);
  const nextState = startTurn(
    {
      ...state,
      currentPlayer: nextPlayer,
      turnNumber: state.turnNumber + 1,
      actionsRemaining: ACTIONS_PER_TURN,
      matchSecondsRemaining: reducedSeconds,
      board: state.board.map((tile) => (tile.shieldedBy === player ? { ...tile, shieldedBy: undefined } : tile)),
      lastEvent: event("turnEnded", player, "Turn ended.")
    },
    nextPlayer
  );

  if (reducedSeconds <= 0) {
    const result = evaluateWinner(nextState, true);
    return {
      ...nextState,
      winner: result.winner,
      lastEvent: {
        type: "turnEnded",
        player,
        message: `Match ended by ${result.reason}.`
      }
    };
  }

  return nextState;
}

export function startTurn(state: GameState, player: PlayerId): GameState {
  const crystals = countControlledCrystals(state.board, player);
  const shrineMana = state.board.some((tile) => tile.type === "shrine" && tile.owner === player) ? 1 : 0;
  const wizardMana = state.players[player].hero === "wizard" && state.turnNumber % 6 === 1 ? 1 : 0;
  const goldMines = state.board.filter((tile) => tile.type === "goldMine" && tile.owner === player).length;
  const manaGain = crystals + shrineMana + wizardMana;

  return {
    ...state,
    players: {
      ...state.players,
      [player]: {
        ...state.players[player],
        mana: Math.min(state.players[player].maxMana, state.players[player].mana + manaGain),
        crystals: state.players[player].crystals + crystals,
        gold: state.players[player].gold + goldMines
      }
    }
  };
}

export function evaluateWinner(state: GameState, force = false): WinnerResult {
  const blueCastle = getCastle(state.board, "blue");
  const redCastle = getCastle(state.board, "red");

  if (!blueCastle || (blueCastle.castleHp ?? 0) <= 0) {
    return { winner: "red", reason: "castleDestroyed" };
  }

  if (!redCastle || (redCastle.castleHp ?? 0) <= 0) {
    return { winner: "blue", reason: "castleDestroyed" };
  }

  if (!force && state.matchSecondsRemaining > 0) {
    return { reason: "inProgress" };
  }

  const blueTiles = countOwnedTiles(state.board, "blue");
  const redTiles = countOwnedTiles(state.board, "red");
  if (blueTiles !== redTiles) {
    return { winner: blueTiles > redTiles ? "blue" : "red", reason: "territory" };
  }

  if (state.players.blue.crystals !== state.players.red.crystals) {
    return { winner: state.players.blue.crystals > state.players.red.crystals ? "blue" : "red", reason: "crystals" };
  }

  const blueHp = blueCastle.castleHp ?? 0;
  const redHp = redCastle.castleHp ?? 0;
  if (blueHp !== redHp) {
    return { winner: blueHp > redHp ? "blue" : "red", reason: "castleHp" };
  }

  return { reason: "draw" };
}

export function getValidCaptureActions(state: GameState, player: PlayerId): readonly CaptureAction[] {
  if (state.currentPlayer !== player || state.actionsRemaining <= 0) {
    return [];
  }

  const actions: CaptureAction[] = [];
  for (const from of state.board) {
    if (from.owner !== player) {
      continue;
    }

    for (const to of state.board) {
      if (!areAdjacent(from.position, to.position) || to.owner === player || to.type === "river") {
        continue;
      }

      if (getCaptureCost(state, player, to) <= state.actionsRemaining) {
        actions.push({
          type: "capture",
          player,
          from: from.position,
          to: to.position
        });
      }
    }
  }

  return actions;
}

function normalizeAfterBoardChange(state: GameState, player: PlayerId): GameState {
  const winnerResult = evaluateWinner(state);
  return {
    ...state,
    winner: winnerResult.winner,
    players: {
      ...state.players,
      [player]: {
        ...state.players[player]
      }
    }
  };
}

function isWithinOwnedRange(state: GameState, player: PlayerId, target: Position, range: number): boolean {
  return state.board.some((tile) => {
    if (tile.owner !== player) {
      return false;
    }

    const distance = Math.abs(tile.position.x - target.x) + Math.abs(tile.position.y - target.y);
    return distance <= range;
  });
}

function event(type: GameEvent["type"], player: PlayerId, message: string, from?: Position, to?: Position): GameEvent {
  return {
    type,
    player,
    from,
    to,
    message
  };
}

function withEvent(state: GameState, nextEvent: GameEvent): GameState {
  return {
    ...state,
    lastEvent: nextEvent
  };
}
