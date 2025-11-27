import React, { useState } from 'react';
import { GameState, Fish, ShopItem, Rarity, PlayerStats } from '../types';
import { SHOP_CATALOG } from '../constants';
import { shopkeeperChat } from '../services/geminiService';

interface UIOverlayProps {
  gameState: GameState;
  lastCatch: Fish | null;
  fishLore: string | null;
  playerStats: PlayerStats;
  onCloseShop: () => void;
  onBuy: (item: ShopItem) => void;
  onSell: (fish: Fish) => void;
  onResume: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({
  gameState,
  lastCatch,
  fishLore,
  playerStats,
  onCloseShop,
  onBuy,
  onSell,
  onResume
}) => {
    const [chatLog, setChatLog] = useState<string[]>([]);
    const [chatInput, setChatInput] = useState("");

    const handleChat = async () => {
        if (!chatInput.trim()) return;
        const newLog = [...chatLog, `You: ${chatInput}`];
        setChatLog(newLog);
        setChatInput("");
        const reply = await shopkeeperChat(newLog);
        setChatLog([...newLog, `Keep: ${reply}`]);
    };

    if (gameState === GameState.SHOW_CATCH && lastCatch) {
        const isRare = lastCatch.rarity === Rarity.EXOTIC || lastCatch.rarity === Rarity.MYTHICAL;
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 animate-fade-in">
                <div className={`
                    relative p-8 rounded-lg max-w-md w-full text-center border-4 
                    ${isRare ? 'border-yellow-500 bg-yellow-950' : 'border-slate-600 bg-slate-900'}
                `}>
                    <h2 className={`text-3xl font-bold mb-4 ${isRare ? 'text-yellow-400 animate-pulse' : 'text-white'}`}>
                        {lastCatch.type.toUpperCase()}
                    </h2>
                    <div className="text-6xl mb-4">
                        {lastCatch.rarity === Rarity.MYTHICAL ? '🐉' : '🐟'}
                    </div>
                    
                    <div className="space-y-2 mb-6 font-mono text-slate-300">
                        <p>{lastCatch.weight.toFixed(1)} lbs</p>
                        <p className={isRare ? 'text-yellow-200' : 'text-slate-400'}>{lastCatch.rarity}</p>
                        <p className="text-green-400 text-xl font-bold">+${lastCatch.value}</p>
                    </div>

                    {fishLore && (
                        <div className="mb-6 p-3 bg-black/30 rounded italic text-sm text-slate-400 border-l-2 border-slate-600">
                            "{fishLore}"
                        </div>
                    )}

                    <button 
                        onClick={onResume}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded border-2 border-slate-500"
                    >
                        KEEP IT
                    </button>
                </div>
            </div>
        );
    }

    if (gameState === GameState.SHOP_OPEN) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
                <div className="w-[90%] h-[90%] max-w-5xl bg-[#1e1e1e] border-4 border-[#3e2723] flex shadow-2xl">
                    
                    {/* LEFT: SHOPKEEPER */}
                    <div className="w-1/3 border-r border-[#3e2723] flex flex-col p-4 bg-[#281b18]">
                        <h2 className="text-2xl text-[#d7ccc8] font-bold mb-4 border-b border-[#5d4037] pb-2">THE SHACK</h2>
                        <div className="flex-1 overflow-y-auto mb-4 bg-black/20 p-2 rounded font-mono text-xs text-[#a1887f] space-y-2">
                             <p>Keep: Welcome back, angler.</p>
                             {chatLog.map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 bg-black/40 border border-[#5d4037] text-white px-2 py-1 text-sm outline-none"
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleChat()}
                                placeholder="Chat..."
                            />
                            <button onClick={handleChat} className="text-[#d7ccc8] hover:text-white">&gt;</button>
                        </div>
                        <button onClick={onCloseShop} className="mt-4 w-full py-3 bg-[#3e2723] hover:bg-[#4e342e] text-[#d7ccc8] font-bold">
                            LEAVE
                        </button>
                    </div>

                    {/* CENTER: BUY */}
                    <div className="w-1/3 border-r border-[#3e2723] p-4 bg-[#212121]">
                        <h3 className="text-[#ef5350] font-bold mb-4">BUY GEAR</h3>
                        <div className="space-y-4">
                            {SHOP_CATALOG.map(item => {
                                const owned = (item.type === 'ROD' && playerStats.rodTier >= item.tier) ||
                                              (item.type === 'BAIT' && playerStats.baitTier >= item.tier) ||
                                              (item.type === 'BOAT' && playerStats.boatTier >= item.tier);
                                const canAfford = playerStats.money >= item.cost;

                                return (
                                    <div key={item.id} className="bg-[#333] p-3 border border-[#444]">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-white font-bold">{item.name}</span>
                                            {owned ? <span className="text-green-500 text-xs">OWNED</span> : 
                                                <span className="text-yellow-400 text-sm">${item.cost}</span>}
                                        </div>
                                        <p className="text-xs text-gray-400 mb-2">{item.desc}</p>
                                        {!owned && (
                                            <button 
                                                disabled={!canAfford}
                                                onClick={() => onBuy(item)}
                                                className={`w-full py-1 text-xs font-bold ${canAfford ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-gray-700 text-gray-500'}`}
                                            >
                                                {canAfford ? 'PURCHASE' : 'NO FUNDS'}
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* RIGHT: SELL */}
                    <div className="w-1/3 p-4 bg-[#212121]">
                         <h3 className="text-[#66bb6a] font-bold mb-4 flex justify-between">
                            <span>SELL CATCH</span>
                            <span>${playerStats.money}</span>
                         </h3>
                         <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                             {playerStats.inventory.length === 0 && <p className="text-gray-600 italic text-center mt-10">No fish to sell.</p>}
                             {playerStats.inventory.map(fish => (
                                 <div key={fish.id} className="flex justify-between items-center bg-[#2a2a2a] p-2 border border-[#333] group hover:border-green-800">
                                     <div>
                                         <div className="text-sm text-gray-300">{fish.type}</div>
                                         <div className="text-xs text-gray-600">{fish.rarity}</div>
                                     </div>
                                     <button 
                                        onClick={() => onSell(fish)}
                                        className="px-3 py-1 bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-900 text-xs"
                                     >
                                         ${fish.value}
                                     </button>
                                 </div>
                             ))}
                         </div>
                    </div>

                </div>
            </div>
        )
    }

    return null;
}

export default UIOverlay;
