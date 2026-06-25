export type PlayerId = "blue" | "red";
export type Owner = PlayerId | "neutral";

export type TileType =
  | "plain"
  | "forest"
  | "mountain"
  | "river"
  | "goldMine"
  | "crystalMine"
  | "ancientRuins"
  | "portal"
  | "castle"
  | "shrine";

export type HeroId = "wizard" | "knight" | "darkLord" | "ranger";

export type BotDifficulty = "easy" | "normal" | "hard";

export type ActionResultType =
  | "captured"
  | "contested"
  | "blocked"
  | "failed"
  | "castleDamaged"
  | "abilityUsed"
  | "turnEnded";

export interface Position {
  readonly x: number;
  readonly y: number;
}

export interface Tile {
  readonly id: string;
  readonly position: Position;
  readonly type: TileType;
  readonly owner: Owner;
  readonly contestedBy?: PlayerId | undefined;
  readonly shieldedBy?: PlayerId | undefined;
  readonly castleHp?: number | undefined;
  readonly portalCooldown?: number | undefined;
}

export interface HeroDefinition {
  readonly id: HeroId;
  readonly name: string;
  readonly activeName: string;
  readonly passiveName: string;
  readonly manaCost: number;
}

export interface PlayerState {
  readonly id: PlayerId;
  readonly username: string;
  readonly hero: HeroId;
  readonly mana: number;
  readonly maxMana: number;
  readonly gold: number;
  readonly crystals: number;
  readonly rankPoints: number;
  readonly xp: number;
}

export interface GameState {
  readonly boardSize: number;
  readonly board: readonly Tile[];
  readonly players: Record<PlayerId, PlayerState>;
  readonly currentPlayer: PlayerId;
  readonly turnNumber: number;
  readonly actionsRemaining: number;
  readonly matchSecondsRemaining: number;
  readonly winner?: PlayerId | undefined;
  readonly lastEvent?: GameEvent | undefined;
}

export interface GameEvent {
  readonly type: ActionResultType;
  readonly player: PlayerId;
  readonly from?: Position | undefined;
  readonly to?: Position | undefined;
  readonly message: string;
}

export interface CaptureAction {
  readonly type: "capture";
  readonly player: PlayerId;
  readonly from: Position;
  readonly to: Position;
}

export interface HeroAbilityAction {
  readonly type: "heroAbility";
  readonly player: PlayerId;
  readonly target: Position;
}

export interface EndTurnAction {
  readonly type: "endTurn";
  readonly player: PlayerId;
}

export type GameAction = CaptureAction | HeroAbilityAction | EndTurnAction;

export interface MoveOption {
  readonly action: CaptureAction;
  readonly score: number;
}

export interface WinnerResult {
  readonly winner?: PlayerId | undefined;
  readonly reason:
    | "castleDestroyed"
    | "territory"
    | "crystals"
    | "castleHp"
    | "draw"
    | "inProgress";
}
