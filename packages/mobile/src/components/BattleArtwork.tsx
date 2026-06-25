import type { GameState, Position, Tile } from "@territory-wars/game-engine";
import { ImageBackground, Pressable, StyleSheet, View, type LayoutChangeEvent, type ImageSourcePropType } from "react-native";
import { useMemo, useState } from "react";

const emptyBattleArtwork = require("../../assets/boards/battle-empty.png") as ImageSourcePropType;

const ARTWORK_WIDTH = 1024;
const ARTWORK_HEIGHT = 1536;

const BOARD_RECT = {
  x: 38,
  y: 316,
  width: 948,
  height: 838
};

const ABILITY_RECT = {
  x: 408,
  y: 1082,
  width: 220,
  height: 270
};

const END_TURN_RECT = {
  x: 682,
  y: 1190,
  width: 318,
  height: 128
};

interface BattleArtworkProps {
  readonly game: GameState;
  readonly selected?: Position | undefined;
  readonly onAbilityPress: () => void;
  readonly onEndTurnPress: () => void;
  readonly onTilePress: (position: Position) => void;
}

interface LayoutSize {
  readonly width: number;
  readonly height: number;
}

interface ArtworkRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export function BattleArtwork({ game, selected, onAbilityPress, onEndTurnPress, onTilePress }: BattleArtworkProps) {
  const [layout, setLayout] = useState<LayoutSize>();
  const imageFrame = useMemo(() => (layout ? getCoverFrame(layout) : undefined), [layout]);

  function handleLayout(event: LayoutChangeEvent) {
    setLayout({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height
    });
  }

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <ImageBackground source={emptyBattleArtwork} resizeMode="cover" style={styles.artwork} />
      {imageFrame ? (
        <>
          {game.board.map((tile) => (
            <Pressable
              key={tile.id}
              accessibilityRole="button"
              accessibilityLabel={`${tile.type} ${tile.owner}`}
              style={[styles.tileButton, getTileStyle(tile.position, imageFrame)]}
              onPress={() => onTilePress(tile.position)}
            >
              <View pointerEvents="none" style={getTileOverlayStyle(tile, selected)} />
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" accessibilityLabel="Hero ability" style={[styles.hotspot, getMappedStyle(ABILITY_RECT, imageFrame)]} onPress={onAbilityPress} />
          <Pressable accessibilityRole="button" accessibilityLabel="End turn" style={[styles.hotspot, getMappedStyle(END_TURN_RECT, imageFrame)]} onPress={onEndTurnPress} />
        </>
      ) : null}
    </View>
  );
}

function getCoverFrame(layout: LayoutSize) {
  const scale = Math.max(layout.width / ARTWORK_WIDTH, layout.height / ARTWORK_HEIGHT);
  const width = ARTWORK_WIDTH * scale;
  const height = ARTWORK_HEIGHT * scale;

  return {
    scale,
    left: (layout.width - width) / 2,
    top: (layout.height - height) / 2
  };
}

function getMappedStyle(rect: ArtworkRect, imageFrame: ReturnType<typeof getCoverFrame>) {
  return {
    left: imageFrame.left + rect.x * imageFrame.scale,
    top: imageFrame.top + rect.y * imageFrame.scale,
    width: rect.width * imageFrame.scale,
    height: rect.height * imageFrame.scale
  };
}

function getTileStyle(position: Position, imageFrame: ReturnType<typeof getCoverFrame>) {
  const cellWidth = BOARD_RECT.width / 6;
  const cellHeight = BOARD_RECT.height / 6;

  return getMappedStyle(
    {
      x: BOARD_RECT.x + position.x * cellWidth,
      y: BOARD_RECT.y + position.y * cellHeight,
      width: cellWidth,
      height: cellHeight
    },
    imageFrame
  );
}

function getTileOverlayStyle(tile: Tile, selected?: Position) {
  const selectedTile = selected?.x === tile.position.x && selected.y === tile.position.y;

  if (selectedTile) {
    return [styles.tileOverlay, styles.selectedTile];
  }

  if (tile.owner === "blue") {
    return [styles.tileOverlay, styles.blueTile];
  }

  if (tile.owner === "red") {
    return [styles.tileOverlay, styles.redTile];
  }

  if (tile.contestedBy) {
    return [styles.tileOverlay, styles.contestedTile];
  }

  return styles.tileOverlay;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05090c"
  },
  artwork: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  tileButton: {
    position: "absolute"
  },
  tileOverlay: {
    flex: 1,
    borderWidth: 1,
    borderColor: "transparent"
  },
  blueTile: {
    backgroundColor: "rgba(0, 149, 255, 0.18)",
    borderColor: "rgba(98, 208, 255, 0.45)"
  },
  redTile: {
    backgroundColor: "rgba(255, 42, 28, 0.16)",
    borderColor: "rgba(255, 94, 82, 0.45)"
  },
  selectedTile: {
    backgroundColor: "rgba(255, 194, 63, 0.24)",
    borderWidth: 2,
    borderColor: "rgba(255, 224, 115, 0.9)"
  },
  contestedTile: {
    backgroundColor: "rgba(255, 194, 63, 0.14)",
    borderColor: "rgba(255, 224, 115, 0.55)"
  },
  hotspot: {
    position: "absolute"
  }
});
