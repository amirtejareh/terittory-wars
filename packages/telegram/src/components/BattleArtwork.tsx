import {
  BATTLE_ARTWORK_RECTS,
  BATTLE_ARTWORK_SIZE,
  type GameState,
  type Position,
  type Tile
} from "@territory-wars/game-engine";
import battleEmptyUrl from "../../../mobile/assets/boards/battle-empty.png";

interface BattleArtworkProps {
  readonly game: GameState;
  readonly selected?: Position | undefined;
  readonly onAbilityPress: () => void;
  readonly onEndTurnPress: () => void;
  readonly onTilePress: (position: Position) => void;
}

interface ArtworkRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export function BattleArtwork({ game, selected, onAbilityPress, onEndTurnPress, onTilePress }: BattleArtworkProps) {
  return (
    <section className="battle-art-screen">
      <div className="battle-art-frame" style={{ backgroundImage: `url(${battleEmptyUrl})` }}>
        {game.board.map((tile) => (
          <button
            key={tile.id}
            type="button"
            aria-label={`${tile.type} ${tile.owner}`}
            className="battle-tile-button"
            style={getTileStyle(tile.position)}
            onClick={() => onTilePress(tile.position)}
          >
            <span className={getTileClassName(tile, selected)} />
          </button>
        ))}
        <button type="button" aria-label="Hero ability" className="battle-hotspot" style={getMappedStyle(BATTLE_ARTWORK_RECTS.ability)} onClick={onAbilityPress} />
        <button type="button" aria-label="End turn" className="battle-hotspot" style={getMappedStyle(BATTLE_ARTWORK_RECTS.endTurn)} onClick={onEndTurnPress} />
      </div>
    </section>
  );
}

function getMappedStyle(rect: ArtworkRect) {
  return {
    left: `${(rect.x / BATTLE_ARTWORK_SIZE.width) * 100}%`,
    top: `${(rect.y / BATTLE_ARTWORK_SIZE.height) * 100}%`,
    width: `${(rect.width / BATTLE_ARTWORK_SIZE.width) * 100}%`,
    height: `${(rect.height / BATTLE_ARTWORK_SIZE.height) * 100}%`
  };
}

function getTileStyle(position: Position) {
  const cellWidth = BATTLE_ARTWORK_RECTS.board.width / 6;
  const cellHeight = BATTLE_ARTWORK_RECTS.board.height / 6;

  return getMappedStyle({
    x: BATTLE_ARTWORK_RECTS.board.x + position.x * cellWidth,
    y: BATTLE_ARTWORK_RECTS.board.y + position.y * cellHeight,
    width: cellWidth,
    height: cellHeight
  });
}

function getTileClassName(tile: Tile, selected?: Position): string {
  const selectedTile = selected?.x === tile.position.x && selected.y === tile.position.y;

  if (selectedTile) {
    return "battle-tile-overlay selected";
  }

  if (tile.owner === "blue") {
    return "battle-tile-overlay blue";
  }

  if (tile.owner === "red") {
    return "battle-tile-overlay red";
  }

  if (tile.contestedBy) {
    return "battle-tile-overlay contested";
  }

  return "battle-tile-overlay";
}

