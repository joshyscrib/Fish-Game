import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { GameState, Fish, PlayerStats, ShopItem, Rarity } from './types';
import { generateLore } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    money: 0,
    inventory: [],
    rodTier: 1,
    baitTier: 1,
    boatTier: 1,
  });
  const [lastCatch, setLastCatch] = useState<Fish | null>(null);
  const [fishLore, setFishLore] = useState<string | null>(null);

  const handleCatch = async (fish: Fish) => {
    setLastCatch(fish);
    setPlayerStats(prev => ({
      ...prev,
      inventory: [...prev.inventory, fish]
    }));
    
    // Only fetch lore for rare stuff to save tokens/latency
    if (fish.rarity !== Rarity.COMMON) {
      setFishLore("The wind whispers...");
      const lore = await generateLore(fish);
      setFishLore(lore);
    } else {
      setFishLore(null);
    }
    
    setGameState(GameState.SHOW_CATCH);
  };

  const handleBuy = (item: ShopItem) => {
    if (playerStats.money < item.cost) return;

    setPlayerStats(prev => {
      const next = { ...prev, money: prev.money - item.cost };
      if (item.type === 'ROD') next.rodTier = Math.max(next.rodTier, item.tier);
      if (item.type === 'BAIT') next.baitTier = Math.max(next.baitTier, item.tier);
      if (item.type === 'BOAT') next.boatTier = Math.max(next.boatTier, item.tier);
      return next;
    });
  };

  const handleSell = (fish: Fish) => {
    setPlayerStats(prev => ({
      ...prev,
      money: prev.money + fish.value,
      inventory: prev.inventory.filter(f => f.id !== fish.id)
    }));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 select-none">
       <div className="mb-4 text-center">
         <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 pixel-font tracking-widest">
            RIVER LEGENDS
         </h1>
         <p className="text-slate-500 font-mono text-xs mt-1">A PIXEL FISHING EXPERIENCE</p>
       </div>

       <div className="relative shadow-2xl rounded-xl overflow-hidden border-4 border-slate-700 bg-black">
          <GameCanvas 
            gameState={gameState}
            setGameState={setGameState}
            playerStats={playerStats}
            onCatch={handleCatch}
            onOpenShop={() => setGameState(GameState.SHOP_OPEN)}
          />
          <UIOverlay 
            gameState={gameState}
            lastCatch={lastCatch}
            fishLore={fishLore}
            playerStats={playerStats}
            onCloseShop={() => setGameState(GameState.IDLE)}
            onBuy={handleBuy}
            onSell={handleSell}
            onResume={() => setGameState(GameState.IDLE)}
          />
       </div>

       <div className="mt-6 flex gap-8 text-slate-500 font-mono text-sm">
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-slate-800 rounded border border-slate-700">A / D</div>
            <span>ROW</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-slate-800 rounded border border-slate-700">SPACE</div>
            <span>FISH</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-slate-800 rounded border border-slate-700">S</div>
            <span>SHOP</span>
          </div>
       </div>
    </div>
  );
};

export default App;
