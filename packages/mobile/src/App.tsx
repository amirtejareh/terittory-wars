import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import {
  applyAction,
  chooseBotAction,
  createInitialGame,
  evaluateWinner,
  type GameState,
  type PlayerId,
  type Position
} from "@territory-wars/game-engine";
import { BoardCanvas } from "./components/BoardCanvas";

export default function App() {
  const [game, setGame] = useState<GameState>(() => createInitialGame());
  const [selected, setSelected] = useState<Position | undefined>();
  const glow = useSharedValue(0.35);

  useEffect(() => {
    glow.value = withRepeat(withTiming(1, { duration: 950 }), -1, true);
  }, [glow]);

  useEffect(() => {
    if (game.currentPlayer !== "red" || game.winner) {
      return;
    }

    const timer = setTimeout(() => {
      setGame((current) => applyAction(current, chooseBotAction(current, "red", "normal")));
    }, 450);

    return () => clearTimeout(timer);
  }, [game.currentPlayer, game.lastEvent, game.winner]);

  const endTurnStyle = useAnimatedStyle(() => ({
    shadowOpacity: glow.value,
    transform: [{ scale: 1 + glow.value * 0.018 }]
  }));

  const winner = useMemo(() => evaluateWinner(game, Boolean(game.winner)), [game]);
  const currentPlayer = game.players[game.currentPlayer];

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
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.hud}>
        <PlayerPanel name={game.players.blue.username} side="blue" mana={game.players.blue.mana} tiles={game.board.filter((tile) => tile.owner === "blue").length} />
        <View style={styles.timer}>
          <Text style={styles.title}>TERRITORY WARS</Text>
          <Text style={styles.turn}>{currentPlayer.username}</Text>
          <Text style={styles.seconds}>{game.matchSecondsRemaining}s</Text>
        </View>
        <PlayerPanel name={game.players.red.username} side="red" mana={game.players.red.mana} tiles={game.board.filter((tile) => tile.owner === "red").length} />
      </View>

      <BoardCanvas tiles={game.board} selected={selected} onTilePress={pressTile} />

      <View style={styles.actionBar}>
        <Pressable style={styles.skillButton} onPress={useAbility}>
          <Text style={styles.skillIcon}>*</Text>
          <Text style={styles.skillText}>ABILITY</Text>
          <Text style={styles.mana}>{game.players.blue.mana}/10</Text>
        </Pressable>
        <Animated.View style={[styles.endTurnWrap, endTurnStyle]}>
          <Pressable style={styles.endTurnButton} onPress={() => endTurn("blue")}>
            <Text style={styles.endTurnText}>END TURN</Text>
            <Text style={styles.actionHint}>{game.actionsRemaining} actions</Text>
          </Pressable>
        </Animated.View>
      </View>

      <View style={styles.nav}>
        {["HOME", "BATTLE", "HEROES", "RANK", "PROFILE"].map((label) => (
          <Text key={label} style={[styles.navItem, label === "BATTLE" && styles.navItemActive]}>
            {label}
          </Text>
        ))}
      </View>

      {winner.reason !== "inProgress" ? (
        <View style={styles.resultBanner}>
          <Text style={styles.resultText}>{winner.winner ? `${winner.winner.toUpperCase()} WINS` : "DRAW"}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

interface PlayerPanelProps {
  readonly name: string;
  readonly side: PlayerId;
  readonly mana: number;
  readonly tiles: number;
}

function PlayerPanel({ name, side, mana, tiles }: PlayerPanelProps) {
  return (
    <View style={[styles.playerPanel, side === "red" && styles.redPanel]}>
      <Text style={styles.playerName}>{name}</Text>
      <Text style={styles.statLine}>{tiles} tiles</Text>
      <Text style={styles.statLine}>{mana}/10 mana</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#071015",
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 12
  },
  hud: {
    minHeight: 116,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8
  },
  playerPanel: {
    flex: 1,
    minHeight: 82,
    borderWidth: 1,
    borderColor: "#2b87c6",
    padding: 10,
    backgroundColor: "#0d1b21"
  },
  redPanel: {
    borderColor: "#c44134"
  },
  playerName: {
    color: "#f4efe4",
    fontSize: 18,
    fontWeight: "800"
  },
  statLine: {
    color: "#d4c6a5",
    fontSize: 13,
    marginTop: 5
  },
  timer: {
    width: 132,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#c18a34",
    backgroundColor: "#0a1115",
    paddingVertical: 10
  },
  title: {
    color: "#f3c15a",
    fontSize: 13,
    fontWeight: "900"
  },
  turn: {
    color: "#6dd8ff",
    fontSize: 12,
    marginTop: 6
  },
  seconds: {
    color: "#fffdf7",
    fontSize: 20,
    fontWeight: "900"
  },
  actionBar: {
    minHeight: 122,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16
  },
  skillButton: {
    width: 132,
    height: 108,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#c18a34",
    backgroundColor: "#0d1b21"
  },
  skillIcon: {
    color: "#6dd8ff",
    fontSize: 36,
    fontWeight: "900",
    lineHeight: 36
  },
  skillText: {
    color: "#f4efe4",
    fontWeight: "800",
    marginTop: 4
  },
  mana: {
    color: "#6dd8ff",
    marginTop: 5,
    fontWeight: "700"
  },
  endTurnWrap: {
    flex: 1,
    height: 82,
    shadowColor: "#f5a623",
    shadowRadius: 18
  },
  endTurnButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#f5a623",
    backgroundColor: "#4f2509"
  },
  endTurnText: {
    color: "#fff6dc",
    fontSize: 20,
    fontWeight: "900"
  },
  actionHint: {
    color: "#f5d29b",
    marginTop: 4
  },
  nav: {
    minHeight: 62,
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#67441a"
  },
  navItem: {
    flex: 1,
    color: "#b99a6d",
    textAlign: "center",
    paddingTop: 18,
    fontSize: 12,
    fontWeight: "800"
  },
  navItemActive: {
    color: "#ffffff",
    backgroundColor: "#0b3550"
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

