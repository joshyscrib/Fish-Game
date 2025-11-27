import { Rarity, FishType, ShopItem } from './types';

// --- Configuration ---
export const GAME_CONFIG = {
  GRAVITY: 0.5,
  WATER_Y: 450, // Increased to match new height
  CANVAS_W: 1000, // Increased width
  CANVAS_H: 600 // Increased height
};

// --- Game Balance ---
export const FISH_DATA: Record<FishType, { baseValue: number; weightRange: [number, number]; rarity: Rarity }> = {
  [FishType.MINNOW]: { baseValue: 5, weightRange: [0.1, 0.5], rarity: Rarity.COMMON },
  [FishType.TROUT]: { baseValue: 15, weightRange: [1, 5], rarity: Rarity.COMMON },
  [FishType.BASS]: { baseValue: 30, weightRange: [3, 8], rarity: Rarity.COMMON },
  [FishType.SALMON]: { baseValue: 60, weightRange: [5, 15], rarity: Rarity.PREMIUM },
  [FishType.KOI]: { baseValue: 120, weightRange: [2, 6], rarity: Rarity.PREMIUM },
  [FishType.CATFISH]: { baseValue: 150, weightRange: [10, 30], rarity: Rarity.PREMIUM },
  [FishType.EEL]: { baseValue: 300, weightRange: [4, 10], rarity: Rarity.EXOTIC },
  [FishType.LEVIATHAN]: { baseValue: 1000, weightRange: [50, 100], rarity: Rarity.MYTHICAL },
};

export const SHOP_CATALOG: ShopItem[] = [
  { id: 'rod_2', name: 'Carbon Fiber Rod', type: 'ROD', tier: 2, cost: 250, desc: 'Catches premium fish more often.' },
  { id: 'rod_3', name: 'Neptune\'s Trident', type: 'ROD', tier: 3, cost: 1000, desc: 'Attracts mythical beasts.' },
  { id: 'bait_2', name: 'Grubs', type: 'BAIT', tier: 2, cost: 50, desc: 'Fish bite slightly faster.' },
  { id: 'bait_3', name: 'Sparkle Lure', type: 'BAIT', tier: 3, cost: 200, desc: 'Fish bite instantly.' },
  { id: 'boat_2', name: 'Reinforced Hull', type: 'BOAT', tier: 2, cost: 500, desc: 'Row faster against the current.' },
];

// --- Asset Generator ---
const pixelToDataUrl = (map: string[], palette: Record<string, string>, scale: number = 1): string => {
  const h = map.length;
  const w = map[0].length;
  const c = document.createElement('canvas');
  c.width = w * scale;
  c.height = h * scale;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  
  ctx.imageSmoothingEnabled = false;
  
  for(let y=0; y<h; y++) {
    for(let x=0; x<w; x++) {
      const char = map[y][x];
      if(char !== ' ' && palette[char]) {
        ctx.fillStyle = palette[char];
        ctx.fillRect(x*scale, y*scale, scale, scale);
      }
    }
  }
  return c.toDataURL();
};

// --- Palettes ---
const P = {
  // Wood/Boat
  br1: '#3E2723', br2: '#5D4037', br3: '#8D6E63',
  // Skin
  sk1: '#FFCCBC', sk2: '#D7CCC8',
  // Clothes
  bl1: '#1A237E', bl2: '#3949AB', 
  // Nature
  gr1: '#1B5E20', gr2: '#2E7D32', gr3: '#4CAF50',
  // Shop
  gry: '#616161', red: '#B71C1C',
  // Special
  gld: '#FFD700', wht: '#FFFFFF'
};

// --- Sprite Maps ---

const BOAT_MAP = [
  "            hhh      ",
  "           hhshh     ",
  "           sssss     ",
  "          bbsssbb    ",
  "          bbbbbbb    ",
  "   1      bbbbbbb    ",
  "  111     2222222    ",
  " 11111    2222222    ",
  "1111111   2222222    ",
  "111111111111111111   ",
  " 1111111111111111    ",
];

const SHOP_MAP = [
  "        rrrrrr        ",
  "      rrrrrrrrrr      ",
  "    rrrrrrrrrrrrrr    ",
  "   1111111111111111   ",
  "   1  w  1  1  w  1   ",
  "   1  w  1  1  w  1   ",
  "   1     1  1     1   ",
  "   1111111111111111   ",
];

const TREE_MAP = [
  "      3      ",
  "     333     ",
  "    33333    ",
  "    22222    ",
  "   2222222   ",
  "  222222222  ",
  "  111111111  ",
  " 11111111111 ",
  "1111111111111",
  "     bbb     ",
  "     bbb     ",
];

const CLOUD_MAP = [
  "      ww      ",
  "    wwwwww    ",
  "  wwwwwwwwww  ",
  " wwwwwwwwwwww ",
  "  wwwwwwwwww  ",
];

export const ASSETS = {
  BOAT: pixelToDataUrl(BOAT_MAP, { 
    '1': P.br2, '2': P.bl2, 'h': P.gld, 's': P.sk1, 'b': P.bl1 
  }, 4),
  SHOP: pixelToDataUrl(SHOP_MAP, {
    'r': P.red, '1': P.br1, 'w': P.wht
  }, 6),
  TREE: pixelToDataUrl(TREE_MAP, {
    '1': P.gr1, '2': P.gr2, '3': P.gr3, 'b': P.br1
  }, 6),
  CLOUD: pixelToDataUrl(CLOUD_MAP, {
    'w': '#FFFFFF88' // Semi transparent
  }, 4),
};