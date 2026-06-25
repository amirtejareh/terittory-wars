import type { HeroDefinition, HeroId, PlayerId, TileType } from "./types.js";

export const BOARD_SIZE = 6;
export const TURN_SECONDS = 20;
export const MATCH_SECONDS = 240;
export const ACTIONS_PER_TURN = 3;
export const CASTLE_HP = 20;
export const MAX_MANA = 10;

export const PLAYERS: readonly PlayerId[] = ["blue", "red"];

export const HEROES: Record<HeroId, HeroDefinition> = {
  wizard: {
    id: "wizard",
    name: "Wizard",
    activeName: "Arcane Strike",
    passiveName: "+1 mana every 3 own turns",
    manaCost: 3
  },
  knight: {
    id: "knight",
    name: "Knight",
    activeName: "Shield Wall",
    passiveName: "Plain and forest tiles gain +1 defense",
    manaCost: 2
  },
  darkLord: {
    id: "darkLord",
    name: "Dark Lord",
    activeName: "Corruption",
    passiveName: "Enemy border tiles lose 1 defense",
    manaCost: 3
  },
  ranger: {
    id: "ranger",
    name: "Ranger",
    activeName: "Quick March",
    passiveName: "Forest captures cost 0 extra tempo",
    manaCost: 2
  }
};

export const TILE_CAPTURE_COST: Record<TileType, number> = {
  plain: 1,
  forest: 1,
  mountain: 2,
  river: 99,
  goldMine: 1,
  crystalMine: 1,
  ancientRuins: 1,
  portal: 1,
  castle: 3,
  shrine: 2
};

export const TILE_DEFENSE: Record<TileType, number> = {
  plain: 1,
  forest: 2,
  mountain: 3,
  river: 99,
  goldMine: 1,
  crystalMine: 1,
  ancientRuins: 2,
  portal: 2,
  castle: 5,
  shrine: 3
};

export const TILE_SCORE: Record<TileType, number> = {
  plain: 1,
  forest: 2,
  mountain: 2,
  river: 0,
  goldMine: 3,
  crystalMine: 3,
  ancientRuins: 3,
  portal: 4,
  castle: 5,
  shrine: 5
};
