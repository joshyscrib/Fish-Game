export enum Rarity {
  COMMON = 'Common',
  PREMIUM = 'Premium',
  EXOTIC = 'Exotic',
  MYTHICAL = 'Mythical'
}

export enum FishType {
  MINNOW = 'Minnow',
  TROUT = 'River Trout',
  BASS = 'Largemouth Bass',
  SALMON = 'King Salmon',
  KOI = 'Golden Koi',
  CATFISH = 'Giant Catfish',
  EEL = 'Electric Eel',
  LEVIATHAN = 'River Spirit'
}

export interface Fish {
  id: string;
  type: FishType;
  rarity: Rarity;
  weight: number;
  value: number;
  caughtAt: number;
  description?: string; // AI generated lore
}

export enum GameState {
  IDLE = 'IDLE',
  ROWING = 'ROWING',
  CASTING_CHARGE = 'CASTING_CHARGE', // Optional charge mechanic if we want
  CASTING_ANIMATION = 'CASTING_ANIMATION',
  FISHING_WAIT = 'FISHING_WAIT',
  FISHING_BITE = 'FISHING_BITE',
  REELING = 'REELING',
  SHOP_OPEN = 'SHOP_OPEN',
  SHOW_CATCH = 'SHOW_CATCH'
}

export interface PlayerStats {
  money: number;
  inventory: Fish[];
  rodTier: number; // Affects rarity chance
  baitTier: number; // Affects bite speed
  boatTier: number; // Affects movement speed
}

export type ItemType = 'ROD' | 'BAIT' | 'BOAT';

export interface ShopItem {
  id: string;
  name: string;
  type: ItemType;
  tier: number;
  cost: number;
  desc: string;
}
