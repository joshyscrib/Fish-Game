import React, { useRef, useEffect } from 'react';
import { GameState, Fish, FishType, Rarity, PlayerStats, ShopItem } from '../types';
import { ASSETS, GAME_CONFIG, FISH_DATA } from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (s: GameState) => void;
  playerStats: PlayerStats;
  onCatch: (f: Fish) => void;
  onOpenShop: () => void;
}

// Particle System Types
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  setGameState,
  playerStats,
  onCatch,
  onOpenShop,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // -- Game State Refs (Mutable for loop performance) --
  const physics = useRef({
    playerX: 200,
    playerVel: 0,
    cameraX: 0,
    bobber: { x: 0, y: 0, active: false },
    bobberVel: { x: 0, y: 0 },
    waterOffset: 0, // For sine wave animation
    fishTimer: 0,
  });

  const particles = useRef<Particle[]>([]);
  const input = useRef<Record<string, boolean>>({});
  const images = useRef<Record<string, HTMLImageElement>>({});

  // -- Asset Loading --
  useEffect(() => {
    Object.entries(ASSETS).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      images.current[key] = img;
    });

    const handleKey = (e: KeyboardEvent, down: boolean) => {
      input.current[e.key.toLowerCase()] = down;
    };
    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));
    return () => {
      window.removeEventListener('keydown', (e) => handleKey(e, true));
      window.removeEventListener('keyup', (e) => handleKey(e, false));
    };
  }, []);

  // -- Helper: Spawn Particles --
  const spawnSplash = (x: number, y: number, count = 5) => {
    for (let i = 0; i < count; i++) {
      particles.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3 - 1,
        life: 1.0,
        color: Math.random() > 0.5 ? '#E0F7FA' : '#4FC3F7',
        size: Math.random() * 3 + 1
      });
    }
  };

  // -- Helper: Determine Catch --
  const determineFish = (): Fish => {
    // Basic weight distribution
    let pool = Object.values(FishType);
    
    // Filtering by rod tier (higher tier = access to better fish)
    if (playerStats.rodTier === 1) pool = pool.filter(t => FISH_DATA[t].rarity === Rarity.COMMON);
    else if (playerStats.rodTier === 2) pool = pool.filter(t => FISH_DATA[t].rarity !== Rarity.MYTHICAL);
    
    // Luck roll
    const roll = Math.random();
    let selectedType = FishType.MINNOW;

    // Simplified weighted random
    // In a real app, this would be more robust
    const candidates = pool.map(t => ({ type: t, data: FISH_DATA[t] }));
    
    // Sort by rarity value roughly
    const common = candidates.filter(c => c.data.rarity === Rarity.COMMON);
    const premium = candidates.filter(c => c.data.rarity === Rarity.PREMIUM);
    const exotic = candidates.filter(c => c.data.rarity === Rarity.EXOTIC);
    const mythical = candidates.filter(c => c.data.rarity === Rarity.MYTHICAL);

    if (playerStats.rodTier >= 3 && Math.random() < 0.05) selectedType = FishType.LEVIATHAN;
    else if (exotic.length && Math.random() < 0.15) selectedType = exotic[Math.floor(Math.random() * exotic.length)].type;
    else if (premium.length && Math.random() < 0.4) selectedType = premium[Math.floor(Math.random() * premium.length)].type;
    else selectedType = common[Math.floor(Math.random() * common.length)].type;

    const data = FISH_DATA[selectedType];
    const weight = data.weightRange[0] + Math.random() * (data.weightRange[1] - data.weightRange[0]);
    
    return {
      id: Date.now().toString(),
      type: selectedType,
      rarity: data.rarity,
      weight,
      value: Math.floor(data.baseValue * weight),
      caughtAt: Date.now()
    };
  };

  // -- Main Loop --
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;

    const loop = () => {
      const { CANVAS_W, CANVAS_H, WATER_Y, GRAVITY } = GAME_CONFIG;
      const st = physics.current;

      // 1. Logic Update
      st.waterOffset += 0.05;

      // Movement
      if (gameState === GameState.IDLE || gameState === GameState.ROWING) {
        let moving = false;
        const speed = 0.5 + (playerStats.boatTier * 0.2);
        
        if (input.current['a'] || input.current['arrowleft']) { st.playerVel -= 0.2; moving = true; }
        if (input.current['d'] || input.current['arrowright']) { st.playerVel += 0.2; moving = true; }
        
        if (moving) {
           if (gameState !== GameState.ROWING) setGameState(GameState.ROWING);
           // Random splash while rowing
           if (Math.random() < 0.1) spawnSplash(st.playerX - st.cameraX + 40, WATER_Y);
        } else {
           if (gameState === GameState.ROWING && Math.abs(st.playerVel) < 0.1) setGameState(GameState.IDLE);
        }

        // Shop Trigger
        if (st.playerX < 150 && (input.current['s'] || input.current['arrowdown'])) {
            onOpenShop();
        }
      }

      // Physics Friction
      st.playerVel *= 0.95;
      st.playerX += st.playerVel * (1 + playerStats.boatTier * 0.1);
      
      // Bounds
      if (st.playerX < 50) { st.playerX = 50; st.playerVel = 0; }
      if (st.playerX > 10000) { st.playerX = 10000; st.playerVel = 0; }

      // Camera
      const targetCam = st.playerX - CANVAS_W / 2;
      st.cameraX += (targetCam - st.cameraX) * 0.1;
      if (st.cameraX < 0) st.cameraX = 0;

      // Bobber Logic
      if (gameState === GameState.CASTING_ANIMATION) {
          st.bobber.active = true;
          st.bobber.x += st.bobberVel.x;
          st.bobber.y += st.bobberVel.y;
          st.bobberVel.y += 0.2; // Gravity

          if (st.bobber.y >= WATER_Y) {
              st.bobber.y = WATER_Y;
              st.bobberVel = { x: 0, y: 0 };
              spawnSplash(st.bobber.x - st.cameraX, WATER_Y, 8);
              setGameState(GameState.FISHING_WAIT);
              
              // Set timer for bite (faster with better bait)
              st.fishTimer = 100 + Math.random() * 200 - (playerStats.baitTier * 30);
          }
      } 
      else if (gameState === GameState.FISHING_WAIT) {
          st.fishTimer--;
          if (st.fishTimer <= 0) {
              setGameState(GameState.FISHING_BITE);
              st.fishTimer = 60; // Bite window
          }
      }
      else if (gameState === GameState.FISHING_BITE) {
          st.fishTimer--;
          if (st.fishTimer <= 0) {
              setGameState(GameState.IDLE); // Lost it
              st.bobber.active = false;
          }
      }

      // Input: Casting / Reeling
      if (input.current[' '] && !input.current.handled) {
          input.current.handled = true; // Prevent rapid fire logic
          
          if (gameState === GameState.IDLE || gameState === GameState.ROWING) {
              // Start Cast
              setGameState(GameState.CASTING_ANIMATION);
              st.bobber.x = st.playerX + 50;
              st.bobber.y = WATER_Y - 60;
              // Adjusted velocity to keep bobber on screen (Reduced X, adjusted Y)
              st.bobberVel = { x: 2 + Math.random() * 1.5, y: -4 - Math.random() * 1.5 };
          } else if (gameState === GameState.FISHING_BITE) {
              // Reel In Success
              const fish = determineFish();
              onCatch(fish);
              st.bobber.active = false;
          } else if (gameState === GameState.FISHING_WAIT) {
              // Reeled in too early
              setGameState(GameState.IDLE);
              st.bobber.active = false;
          }
      }
      if (!input.current[' ']) input.current.handled = false;


      // 2. Rendering
      
      // Gradient Sky (Lighter)
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, '#7DD3FC'); // sky-300
      grad.addColorStop(1, '#E0F2FE'); // sky-100
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, WATER_Y);

      // --- Layer 0: Clouds (Parallax 0.1) ---
      if (images.current.CLOUD) {
          const px = st.cameraX * 0.1;
          for(let i=0; i<3; i++) {
             ctx.drawImage(images.current.CLOUD, (i * 400) - (px % 400), 50);
          }
      }

      // --- Layer 1: Far Trees (Parallax 0.3) ---
      if (images.current.TREE) {
          const px = st.cameraX * 0.3;
          // No more darkness filter for lighter vibe
          for(let i=0; i<8; i++) {
              ctx.drawImage(images.current.TREE, (i * 200) - (px % 200), WATER_Y - 90, 60, 90);
          }
      }

      // --- Layer 2: Shop (World Space) ---
      const shopScreenX = 50 - st.cameraX;
      if (images.current.SHOP) {
          ctx.drawImage(images.current.SHOP, shopScreenX, WATER_Y - 90);
          if (st.playerX < 150 && gameState !== GameState.SHOP_OPEN) {
               ctx.fillStyle = '#1e293b'; // Darker text for light sky
               ctx.font = 'bold 12px "Courier New"';
               ctx.fillText("[S] SHOP", shopScreenX + 10, WATER_Y - 100);
          }
      }

      // --- Layer 3: Water ---
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, WATER_Y, CANVAS_W, CANVAS_H - WATER_Y);
      // Water Surface with Sine Wave
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.moveTo(0, WATER_Y);
      for(let x=0; x<=CANVAS_W; x+=10) {
          ctx.lineTo(x, WATER_Y + Math.sin((x + st.cameraX) * 0.02 + st.waterOffset) * 5);
      }
      ctx.lineTo(CANVAS_W, CANVAS_H);
      ctx.lineTo(0, CANVAS_H);
      ctx.fill();

      // --- Layer 4: Player ---
      const boatY = WATER_Y - 45 + Math.sin(st.waterOffset) * 3;
      const playerScreenX = st.playerX - st.cameraX;
      const rodTipX = playerScreenX + 50;
      const rodTipY = boatY + 10;

      // Fishing Line
      if (st.bobber.active) {
          ctx.strokeStyle = '#334155'; // Darker line visibility
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(rodTipX, rodTipY); // Rod tip
          
          let bx = st.bobber.x - st.cameraX;
          let by = st.bobber.y;
          
          // Bobber shake if bite
          if (gameState === GameState.FISHING_BITE) {
              bx += (Math.random() - 0.5) * 4;
              by += (Math.random() - 0.5) * 4;
              
              // Exclamation mark
              ctx.fillStyle = '#ef4444';
              ctx.font = 'bold 24px monospace';
              ctx.fillText("!", bx - 5, by - 20);
          } else if (gameState === GameState.FISHING_WAIT) {
               by += Math.sin(st.waterOffset * 2) * 2;
          }

          // Quadratic Bezier Curve for the line
          // Calculate control point
          const cpX = (rodTipX + bx) / 2;
          let cpY = (rodTipY + by) / 2;

          if (gameState === GameState.CASTING_ANIMATION) {
              // Curve slightly up during casting (air resistance / momentum)
              cpY -= 40;
          } else {
              // Sag down due to gravity (slack) when waiting
              cpY += 30;
          }

          ctx.quadraticCurveTo(cpX, cpY, bx, by);
          ctx.stroke();

          // Bobber
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(bx - 3, by - 3, 6, 6);
          ctx.fillStyle = 'white';
          ctx.fillRect(bx - 3, by, 6, 3);
      }

      if (images.current.BOAT) {
          ctx.drawImage(images.current.BOAT, playerScreenX, boatY);
      }

      // --- Particles ---
      particles.current.forEach((p, i) => {
         p.x += p.vx;
         p.y += p.vy;
         p.vy += 0.2; // Gravity for particles
         p.life -= 0.02;
         
         if (p.life > 0) {
             ctx.fillStyle = p.color;
             ctx.globalAlpha = p.life;
             ctx.fillRect(p.x, p.y, p.size, p.size);
             ctx.globalAlpha = 1;
         } else {
             particles.current.splice(i, 1);
         }
      });

      // --- Layer 5: Foreground (Parallax 1.2 - Moves faster) ---
      const fgX = st.cameraX * 1.2;
      ctx.fillStyle = '#15803d'; // Green grass
      for(let i=0; i<6; i++) {
          const x = (i * 300) - (fgX % 300);
          ctx.fillRect(x, WATER_Y + 50, 40, 20); // Simple grass clumps
      }


      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [gameState, playerStats]);

  return (
    <div className="relative group cursor-none">
      <canvas 
        ref={canvasRef} 
        width={GAME_CONFIG.CANVAS_W} 
        height={GAME_CONFIG.CANVAS_H} 
        className="rounded-xl" 
      />
      <div className="absolute top-4 left-4 font-mono text-white text-shadow-md">
        <div className="flex items-center gap-4">
            <span className="text-yellow-400 text-xl font-bold">${playerStats.money}</span>
            <span className="text-slate-600 font-bold text-sm">TIER {playerStats.rodTier} ROD</span>
        </div>
      </div>
    </div>
  );
};

export default GameCanvas;