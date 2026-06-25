import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyAction,
  chooseBotAction,
  createInitialGame,
  evaluateWinner,
  type GameState,
  type Position
} from "@territory-wars/game-engine";
import { PixiBoard } from "./components/PixiBoard";
import { bootTelegram, openStarsInvoice } from "./telegram";
import "./styles.css";

export default function App() {
  const [game, setGame] = useState<GameState>(() => createInitialGame());
  const [selected, setSelected] = useState<Position | undefined>();
  const [shopStatus, setShopStatus] = useState("SHOP");

  useEffect(() => {
    bootTelegram();
  }, []);

  useEffect(() => {
    if (game.currentPlayer !== "red" || game.winner) {
      return;
    }

    const timer = window.setTimeout(() => {
      setGame((current) => applyAction(current, chooseBotAction(current, "red", "normal")));
    }, 380);

    return () => window.clearTimeout(timer);
  }, [game.currentPlayer, game.lastEvent, game.winner]);

  const winner = useMemo(() => evaluateWinner(game, Boolean(game.winner)), [game]);

  const pressTile = useCallback(
    (position: Position) => {
      const tile = game.board.find((candidate) => candidate.position.x === position.x && candidate.position.y === position.y);
      if (!tile || game.currentPlayer !== "blue" || game.winner) {
        return;
      }

      if (tile.owner === "blue") {
        setSelected(position);
        return;
      }

      if (!selected) {
        return;
      }

      setGame((current) =>
        applyAction(current, {
          type: "capture",
          player: "blue",
          from: selected,
          to: position
        })
      );
      setSelected(undefined);
    },
    [game, selected]
  );

  async function buyGems() {
    setShopStatus("OPENING");
    try {
      await openStarsInvoice("gems_small");
      setShopStatus("INVOICE");
    } catch {
      setShopStatus("FAILED");
    }
  }

  return (
    <main className="app-shell">
      <section className="top-hud">
        <PlayerPanel name={game.players.blue.username} tone="blue" mana={game.players.blue.mana} tiles={game.board.filter((tile) => tile.owner === "blue").length} />
        <div className="crest">
          <strong>TERRITORY WARS</strong>
          <span>{game.currentPlayer === "blue" ? "Your Turn" : "Enemy Turn"}</span>
          <b>{game.matchSecondsRemaining}s</b>
        </div>
        <PlayerPanel name={game.players.red.username} tone="red" mana={game.players.red.mana} tiles={game.board.filter((tile) => tile.owner === "red").length} />
      </section>

      <PixiBoard tiles={game.board} selected={selected} onTilePress={pressTile} />

      <section className="bottom-actions">
        <button type="button" className="square-action" onClick={buyGems}>
          {shopStatus}
        </button>
        <button
          type="button"
          className="square-action"
          onClick={() => {
            const target = selected ?? { x: 2, y: 2 };
            setGame((current) => applyAction(current, { type: "heroAbility", player: "blue", target }));
          }}
        >
          ABILITY
        </button>
        <button
          type="button"
          className="end-turn"
          onClick={() => {
            setSelected(undefined);
            setGame((current) => applyAction(current, { type: "endTurn", player: "blue" }));
          }}
        >
          END TURN
          <span>{game.actionsRemaining} actions</span>
        </button>
      </section>

      <nav className="nav-row">
        {["HOME", "BATTLE", "HEROES", "RANK", "PROFILE"].map((item) => (
          <span key={item} className={item === "BATTLE" ? "active" : ""}>
            {item}
          </span>
        ))}
      </nav>

      {winner.reason !== "inProgress" ? <div className="result-banner">{winner.winner ? `${winner.winner.toUpperCase()} WINS` : "DRAW"}</div> : null}
    </main>
  );
}

interface PlayerPanelProps {
  readonly name: string;
  readonly tone: "blue" | "red";
  readonly mana: number;
  readonly tiles: number;
}

function PlayerPanel({ name, tone, mana, tiles }: PlayerPanelProps) {
  return (
    <div className={`player-panel ${tone}`}>
      <strong>{name}</strong>
      <span>{tiles} tiles</span>
      <span>{mana}/10 mana</span>
    </div>
  );
}

