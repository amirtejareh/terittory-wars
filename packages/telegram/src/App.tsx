import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyAction,
  chooseBotAction,
  createInitialGame,
  evaluateWinner,
  type GameState,
  type Position
} from "@territory-wars/game-engine";
import { fetchBattleBootstrap } from "./api";
import { BattleArtwork } from "./components/BattleArtwork";
import { bootTelegram, openStarsInvoice } from "./telegram";
import "./styles.css";

export default function App() {
  const [game, setGame] = useState<GameState>(() => createInitialGame());
  const [selected, setSelected] = useState<Position | undefined>();
  const [shopStatus, setShopStatus] = useState("SHOP");

  useEffect(() => {
    const telegram = bootTelegram();
    let cancelled = false;

    void fetchBattleBootstrap(telegram?.initData ?? "").then((nextGame) => {
      if (!cancelled && nextGame) {
        setGame(nextGame);
      }
    });

    return () => {
      cancelled = true;
    };
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
      <BattleArtwork
        game={game}
        selected={selected}
        onAbilityPress={() => {
          const target = selected ?? { x: 2, y: 2 };
          setGame((current) => applyAction(current, { type: "heroAbility", player: "blue", target }));
        }}
        onEndTurnPress={() => {
          setSelected(undefined);
          setGame((current) => applyAction(current, { type: "endTurn", player: "blue" }));
        }}
        onTilePress={pressTile}
      />
      <button type="button" className="stars-test-button" onClick={buyGems}>
        {shopStatus}
      </button>
      {winner.reason !== "inProgress" ? <div className="result-banner">{winner.winner ? `${winner.winner.toUpperCase()} WINS` : "DRAW"}</div> : null}
    </main>
  );
}
