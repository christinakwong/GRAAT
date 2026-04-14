export enum CardType {
  MUD_RAIN = "MUD_RAIN",
  MUD_BUCKET = "MUD_BUCKET",
  HOUSE = "HOUSE",
  LIGHTNING = "LIGHTNING",
  LIGHTNING_ROD = "LIGHTNING_ROD",
  BATHTUB = "BATHTUB",
  LOCK_DOOR = "LOCK_DOOR",
}

export interface Card {
  id: string;
  type: CardType;
  name: string;
  description: string;
}

export interface Character {
  id: string;
  isDirty: boolean;
  hasHouse: boolean;
  hasLightningRod: boolean;
  hasLock: boolean;
  imageSeed: string;
}

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  characters: Character[];
  hand: Card[];
}

export type GameState = "TITLE" | "GAME" | "WIN";

export const CARD_DATA: Record<CardType, { name: string; description: string }> = {
  [CardType.MUD_RAIN]: {
    name: "Mud Rain",
    description: "Makes all outdoor characters dirty.",
  },
  [CardType.MUD_BUCKET]: {
    name: "Mud Bucket",
    description: "Makes one character dirty.",
  },
  [CardType.HOUSE]: {
    name: "House",
    description: "Protects from Mud Rain.",
  },
  [CardType.LIGHTNING]: {
    name: "Lightning",
    description: "Burns a house.",
  },
  [CardType.LIGHTNING_ROD]: {
    name: "Lightning Rod",
    description: "Protects house from lightning.",
  },
  [CardType.BATHTUB]: {
    name: "Bathtub",
    description: "Cleans one of your characters.",
  },
  [CardType.LOCK_DOOR]: {
    name: "Lock the Door",
    description: "Protects from Mud Bucket. Needs House & Clean char.",
  },
};
