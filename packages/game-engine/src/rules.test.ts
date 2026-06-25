import { describe, expect, it } from "vitest";
import { applyAction, createInitialGame, evaluateWinner, getValidCaptureActions } from "./rules.ts";

describe("Territory Wars rules", () => {
  it("creates a 6x6 board with one castle per player", () => {
    const game = createInitialGame();

    expect(game.board).toHaveLength(36);
    expect(game.board.filter((tile) => tile.type === "castle" && tile.owner === "blue")).toHaveLength(1);
    expect(game.board.filter((tile) => tile.type === "castle" && tile.owner === "red")).toHaveLength(1);
  });

  it("captures an adjacent neutral tile", () => {
    const game = createInitialGame();
    const next = applyAction(game, {
      type: "capture",
      player: "blue",
      from: { x: 0, y: 0 },
      to: { x: 0, y: 1 }
    });

    expect(next.board.find((tile) => tile.id === "0:1")?.owner).toBe("blue");
    expect(next.actionsRemaining).toBe(2);
    expect(next.lastEvent?.type).toBe("captured");
  });

  it("spends two actions on mountain tiles", () => {
    const game = createInitialGame();
    const next = applyAction(game, {
      type: "capture",
      player: "blue",
      from: { x: 0, y: 0 },
      to: { x: 1, y: 0 }
    });

    const riverAttempt = applyAction(next, {
      type: "capture",
      player: "blue",
      from: { x: 1, y: 0 },
      to: { x: 2, y: 0 }
    });

    expect(riverAttempt.lastEvent?.type).toBe("captured");
    expect(riverAttempt.actionsRemaining).toBe(0);
  });

  it("returns valid bot capture actions for the current player", () => {
    const game = createInitialGame();

    expect(getValidCaptureActions(game, "blue").length).toBeGreaterThan(0);
    expect(getValidCaptureActions(game, "red")).toHaveLength(0);
  });

  it("evaluates a forced territory winner", () => {
    const game = applyAction(createInitialGame(), {
      type: "capture",
      player: "blue",
      from: { x: 0, y: 0 },
      to: { x: 0, y: 1 }
    });

    expect(evaluateWinner(game, true)).toEqual({ winner: "blue", reason: "territory" });
  });
});
