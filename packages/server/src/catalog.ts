export type CatalogItemId = "gems_small" | "wizard_skin_arcane" | "castle_skin_gold" | "battle_pass";

export interface CatalogItem {
  readonly id: CatalogItemId;
  readonly title: string;
  readonly description: string;
  readonly stars: number;
  readonly kind: "gems" | "heroSkin" | "castleSkin" | "battlePass";
  readonly quantity?: number;
}

export const catalog: readonly CatalogItem[] = [
  {
    id: "gems_small",
    title: "Small Gem Pack",
    description: "Adds 80 gems for cosmetics and convenience purchases.",
    stars: 25,
    kind: "gems",
    quantity: 80
  },
  {
    id: "wizard_skin_arcane",
    title: "Arcane Wizard Skin",
    description: "Cosmetic hero skin for the Wizard.",
    stars: 75,
    kind: "heroSkin"
  },
  {
    id: "castle_skin_gold",
    title: "Golden Castle Skin",
    description: "Cosmetic castle skin for battle boards.",
    stars: 90,
    kind: "castleSkin"
  },
  {
    id: "battle_pass",
    title: "Battle Pass",
    description: "Cosmetic progression track for the current season.",
    stars: 150,
    kind: "battlePass"
  }
];

export function getCatalogItem(id: string): CatalogItem | undefined {
  return catalog.find((item) => item.id === id);
}

