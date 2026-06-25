import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  applyAction,
  chooseBotAction,
  createInitialGame,
  evaluateWinner,
  type GameState,
  type PlayerId,
  type Position
} from "@territory-wars/game-engine";
import { BattleArtwork } from "./components/BattleArtwork";

export default function App() {
  const [game, setGame] = useState<GameState>(() => createInitialGame());
  const [selected, setSelected] = useState<Position | undefined>();

  useEffect(() => {
    if (game.currentPlayer !== "red" || game.winner) {
      return;
    }

    const timer = setTimeout(() => {
      setGame((current) => applyAction(current, chooseBotAction(current, "red", "normal")));
    }, 450);

    return () => clearTimeout(timer);
  }, [game.currentPlayer, game.lastEvent, game.winner]);

  const winner = useMemo(() => evaluateWinner(game, Boolean(game.winner)), [game]);

  function pressTile(position: Position) {
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
  }

  function useAbility() {
    const target = selected ?? { x: 2, y: 2 };
    setGame((current) =>
      applyAction(current, {
        type: "heroAbility",
        player: "blue",
        target
      })
    );
  }

  function endTurn(player: PlayerId) {
    setSelected(undefined);
    setGame((current) =>
      applyAction(current, {
        type: "endTurn",
        player
      })
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <BattleArtwork game={game} selected={selected} onAbilityPress={useAbility} onEndTurnPress={() => endTurn("blue")} onTilePress={pressTile} />

      {winner.reason !== "inProgress" ? (
        <View style={styles.resultBanner}>
          <Text style={styles.resultText}>{winner.winner ? `${winner.winner.toUpperCase()} WINS` : "DRAW"}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#05090c"
  },
  resultBanner: {
    position: "absolute",
    left: 24,
    right: 24,
    top: "42%",
    minHeight: 88,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#f3c15a",
    backgroundColor: "#090d0fcc"
  },
  resultText: {
    color: "#fff6dc",
    fontSize: 28,
    fontWeight: "900"
  }
});
