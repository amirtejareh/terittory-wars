import { Canvas, Circle, Group, RoundedRect } from "@shopify/react-native-skia";
import type { Position, Tile, TileType } from "@territory-wars/game-engine";
import { StyleSheet, View, Pressable, useWindowDimensions } from "react-native";

interface BoardCanvasProps {
  readonly tiles: readonly Tile[];
  readonly selected?: Position;
  readonly onTilePress: (position: Position) => void;
}

const tileColors: Record<TileType, string> = {
  plain: "#89744f",
  forest: "#2f7140",
  mountain: "#6b737a",
  river: "#116b99",
  goldMine: "#a46f18",
  crystalMine: "#216da8",
  ancientRuins: "#80786b",
  portal: "#3850aa",
  castle: "#4f4b55",
  shrine: "#79612c"
};

export function BoardCanvas({ tiles, selected, onTilePress }: BoardCanvasProps) {
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 28, 640);
  const cell = boardSize / 6;
  const inset = Math.max(2, cell * 0.035);
  const marker = Math.max(6, cell * 0.12);

  return (
    <View style={[styles.frame, { width: boardSize, height: boardSize }]}>
      <Canvas style={styles.canvas}>
        {tiles.map((tile) => {
          const x = tile.position.x * cell;
          const y = tile.position.y * cell;
          const selectedTile = selected?.x === tile.position.x && selected.y === tile.position.y;
          const ownerGlow = tile.owner === "blue" ? "#1da7ff" : tile.owner === "red" ? "#ff3c30" : "#2f2a22";
          const tileColor = selectedTile ? "#f3c15a" : tileColors[tile.type];

          return (
            <Group key={tile.id}>
              <RoundedRect x={x} y={y} width={cell - 1} height={cell - 1} r={8} color={ownerGlow} />
              <RoundedRect x={x + inset} y={y + inset} width={cell - inset * 2 - 1} height={cell - inset * 2 - 1} r={7} color={tileColor} />
              {tile.type === "crystalMine" ? <Circle cx={x + cell / 2} cy={y + cell / 2} r={marker} color="#6de7ff" /> : null}
              {tile.type === "goldMine" ? <Circle cx={x + cell / 2} cy={y + cell / 2} r={marker} color="#ffc547" /> : null}
              {tile.type === "shrine" ? <Circle cx={x + cell / 2} cy={y + cell / 2} r={marker * 1.2} color="#f7dc72" /> : null}
            </Group>
          );
        })}
      </Canvas>
      <View pointerEvents="box-none" style={styles.touchGrid}>
        {tiles.map((tile) => (
          <Pressable
            key={tile.id}
            accessibilityRole="button"
            accessibilityLabel={`${tile.type} ${tile.owner}`}
            style={{ width: cell, height: cell }}
            onPress={() => onTilePress(tile.position)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: 1,
    alignSelf: "center",
    borderWidth: 2,
    borderColor: "#c18a34",
    backgroundColor: "#10171a",
    overflow: "hidden"
  },
  canvas: {
    ...StyleSheet.absoluteFillObject
  },
  touchGrid: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    flexWrap: "wrap"
  }
});
