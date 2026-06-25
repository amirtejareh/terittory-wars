import { Application, Container, Graphics } from "pixi.js";
import { useEffect, useRef } from "react";
import type { Position, Tile, TileType } from "@territory-wars/game-engine";

interface PixiBoardProps {
  readonly tiles: readonly Tile[];
  readonly selected?: Position | undefined;
  readonly onTilePress: (position: Position) => void;
}

const tileColors: Record<TileType, number> = {
  plain: 0x8b7650,
  forest: 0x2f7140,
  mountain: 0x727a82,
  river: 0x116b99,
  goldMine: 0xb37a1d,
  crystalMine: 0x216da8,
  ancientRuins: 0x80786b,
  portal: 0x4355a8,
  castle: 0x4f4b55,
  shrine: 0x80662d
};

export function PixiBoard({ tiles, selected, onTilePress }: PixiBoardProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function mount() {
      const host = hostRef.current;
      if (!host) {
        return;
      }

      const app = new Application();
      await app.init({
        backgroundAlpha: 0,
        antialias: true,
        resizeTo: host
      });

      if (cancelled) {
        app.destroy();
        return;
      }

      host.appendChild(app.canvas);
      appRef.current = app;
      drawBoard(app, tiles, selected, onTilePress);
    }

    void mount();

    return () => {
      cancelled = true;
      appRef.current?.destroy(true);
      appRef.current = null;
    };
  }, []);

  useEffect(() => {
    const app = appRef.current;
    if (!app) {
      return;
    }

    drawBoard(app, tiles, selected, onTilePress);
  }, [tiles, selected, onTilePress]);

  return <div ref={hostRef} className="pixi-board" />;
}

function drawBoard(app: Application, tiles: readonly Tile[], selected: Position | undefined, onTilePress: (position: Position) => void) {
  app.stage.removeChildren();

  const size = Math.min(app.renderer.width, app.renderer.height);
  const cell = size / 6;
  const board = new Container();
  board.x = (app.renderer.width - size) / 2;
  board.y = 0;
  app.stage.addChild(board);

  for (const tile of tiles) {
    const selectedTile = selected?.x === tile.position.x && selected.y === tile.position.y;
    const glow = tile.owner === "blue" ? 0x1da7ff : tile.owner === "red" ? 0xff3c30 : 0x2f2a22;
    const fill = selectedTile ? 0xf3c15a : tileColors[tile.type];
    const x = tile.position.x * cell;
    const y = tile.position.y * cell;

    const graphics = new Graphics();
    graphics.roundRect(x, y, cell - 1, cell - 1, 8).fill(glow);
    graphics.roundRect(x + 3, y + 3, cell - 7, cell - 7, 7).fill(fill);

    if (tile.type === "goldMine" || tile.type === "crystalMine" || tile.type === "shrine") {
      graphics.circle(x + cell / 2, y + cell / 2, Math.max(6, cell * 0.12)).fill(tile.type === "goldMine" ? 0xffc547 : tile.type === "shrine" ? 0xf7dc72 : 0x6de7ff);
    }

    graphics.eventMode = "static";
    graphics.cursor = "pointer";
    graphics.on("pointertap", () => onTilePress(tile.position));
    board.addChild(graphics);
  }
}
