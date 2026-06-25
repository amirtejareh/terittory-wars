import { BOARD_SIZE, CASTLE_HP } from "./constants.js";
import type { Owner, PlayerId, Position, Tile, TileType } from "./types.js";

const layout: readonly (readonly TileType[])[] = [
  ["castle", "mountain", "plain", "forest", "mountain", "castle"],
  ["plain", "forest", "river", "plain", "forest", "plain"],
  ["crystalMine", "plain", "shrine", "plain", "goldMine", "mountain"],
  ["mountain", "goldMine", "plain", "ancientRuins", "plain", "crystalMine"],
  ["plain", "forest", "river", "portal", "forest", "plain"],
  ["plain", "mountain", "plain", "river", "mountain", "plain"]
];

export function tileId(position: Position): string {
  return `${position.x}:${position.y}`;
}

export function createTile(position: Position, type: TileType, owner: Owner = "neutral"): Tile {
  return {
    id: tileId(position),
    position,
    type,
    owner,
    castleHp: type === "castle" ? CASTLE_HP : undefined
  };
}

export function createInitialBoard(): readonly Tile[] {
  const tiles: Tile[] = [];

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    const row = layout[y];
    if (!row) {
      throw new Error(`Missing board layout row ${y}`);
    }

    for (let x = 0; x < BOARD_SIZE; x += 1) {
      const type = row[x];
      if (!type) {
        throw new Error(`Missing board layout tile ${x}:${y}`);
      }

      let owner: Owner = "neutral";
      if (type === "castle" && x === 0) {
        owner = "blue";
      }
      if (type === "castle" && x === BOARD_SIZE - 1) {
        owner = "red";
      }

      tiles.push(createTile({ x, y }, type, owner));
    }
  }

  return tiles;
}

export function getTile(board: readonly Tile[], position: Position): Tile | undefined {
  return board.find((tile) => tile.position.x === position.x && tile.position.y === position.y);
}

export function replaceTile(board: readonly Tile[], nextTile: Tile): readonly Tile[] {
  return board.map((tile) => (tile.id === nextTile.id ? nextTile : tile));
}

export function isInsideBoard(position: Position, boardSize = BOARD_SIZE): boolean {
  return position.x >= 0 && position.x < boardSize && position.y >= 0 && position.y < boardSize;
}

export function getAdjacentPositions(position: Position, boardSize = BOARD_SIZE): readonly Position[] {
  const candidates: readonly Position[] = [
    { x: position.x + 1, y: position.y },
    { x: position.x - 1, y: position.y },
    { x: position.x, y: position.y + 1 },
    { x: position.x, y: position.y - 1 }
  ];

  return candidates.filter((candidate) => isInsideBoard(candidate, boardSize));
}

export function areAdjacent(a: Position, b: Position): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
}

export function getOpponent(player: PlayerId): PlayerId {
  return player === "blue" ? "red" : "blue";
}

export function countOwnedTiles(board: readonly Tile[], player: PlayerId): number {
  return board.filter((tile) => tile.owner === player).length;
}

export function countControlledCrystals(board: readonly Tile[], player: PlayerId): number {
  return board.filter((tile) => tile.owner === player && tile.type === "crystalMine").length;
}

export function countAdjacentOwned(board: readonly Tile[], position: Position, player: PlayerId): number {
  return getAdjacentPositions(position).filter((candidate) => getTile(board, candidate)?.owner === player).length;
}

export function getCastle(board: readonly Tile[], player: PlayerId): Tile | undefined {
  return board.find((tile) => tile.type === "castle" && tile.owner === player);
}
