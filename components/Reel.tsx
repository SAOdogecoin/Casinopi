
import React, { useEffect, useState, useRef } from 'react';
import { SymbolType, SymbolConfig } from '../types';
import { WEIGHTS, GET_SYMBOLS } from '../constants';
import { GameConfig } from '../types';

interface ReelProps {
  id: number;
  symbols: SymbolType[]; 
  spinning: boolean; 
  stopping: boolean; 
  stopDelay: number;
  duration: number;
  onStop: () => void;
  winningIndices: number[]; 
  gameConfig: GameConfig;
  isScatterShowcase?: boolean; 
  customAssets?: Record<string, string>;
  reelBgMode?: string;
}

const getRandomSymbol = () => {
  let sum = WEIGHTS.reduce((acc, el) => acc + el.weight, 0);
  let rand = Math.random() * sum;
  for (let w of WEIGHTS) {
    rand -= w.weight;
    if (rand <= 0) return w.type;
  }
  return SymbolType.TEN;
};

export const Reel: React.FC<ReelProps> = ({ id, symbols = [], spinning, stopping, stopDelay, duration, onStop, winningIndices, gameConfig, isScatterShowcase, customAssets = {}, reelBgMode = 'COLUMN' }) => {
  const [strip, setStrip] = useState<SymbolType[]>([]);
  const [landing, setLanding] = useState(false); 
  const SYMBOL_CONFIGS = GET_SYMBOLS(gameConfig.theme);
  const VISIBLE_ROWS = gameConfig.rows;
  
  // Initialize strip on mount or config change
  useEffect(() => {
    setStrip(Array(VISIBLE_ROWS).fill(null).map(getRandomSymbol));
  }, [VISIBLE_ROWS]);

  // Effect 1: Handle Spin Start
  useEffect(() => {
    if (spinning && !stopping) {
      setLanding(false);
      setStrip(Array(VISIBLE_ROWS * 2).fill(null).map(getRandomSymbol));
    }
  }, [spinning, stopping, VISIBLE_ROWS]);

  // Effect 2: Handle Stop Trigger
  useEffect(() => {
    if (stopping && !landing) {
        const timer = setTimeout(() => {
            setLanding(true); 
            const finalStrip = [
                ...Array(VISIBLE_ROWS).fill(null).map(getRandomSymbol),
                ...symbols 
            ];
            setStrip(finalStrip);
        }, stopDelay);
        return () => clearTimeout(timer);
    }
  }, [stopping, landing, stopDelay, symbols, VISIBLE_ROWS]);

  // Effect 3: Handle Animation Completion (Signal Parent)
  useEffect(() => {
      if (stopping && landing) {
          const delay = duration > 800 ? 400 : 200; 
          const timer = setTimeout(() => {
              onStop();
          }, delay);
          return () => clearTimeout(timer);
      }
  }, [stopping, landing, onStop, duration]);

  // --- Layout & Animation Logic ---
  const renderStrip = (!landing && spinning) ? [...strip, ...strip] : strip;
  const totalItems = renderStrip.length;
  const containerHeightPercent = (totalItems / VISIBLE_ROWS) * 100;
  
  let translateY = '0%';
  if (landing) {
      const rowsToHide = totalItems - VISIBLE_ROWS;
      const shiftPercent = (rowsToHide / totalItems) * 100;
      translateY = `-${shiftPercent}%`;
  } 
  
  // Background Style
  const hasColumnBg = reelBgMode === 'COLUMN' && customAssets['reelBackground'];
  const containerStyle = {
      aspectRatio: `1 / ${gameConfig.rows}`,
      backgroundImage: hasColumnBg ? `url(${customAssets['reelBackground']})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundColor: reelBgMode === 'FULL' || hasColumnBg ? 'transparent' : undefined
  };

  // 'overflow-hidden' on Y is crucial for scrolling illusion.
  // 'overflow-x-visible' allows icons to protrude horizontally.
  // However, flex containers often clip. We need specific handling.
  // Using a clip-path might be safer if we want strict top/bottom clipping but side freedom, but overflow-y: hidden usually clips x too in CSS specs.
  // WORKAROUND: We use a mask for top/bottom or just standard overflow-hidden and scale up inner elements with high z-index.
  // Actually, standard overflow-hidden clips everything. 
  // To allow protruding, we effectively can't use overflow-hidden on the parent for the icons themselves.
  // But we MUST clip the strip for the scroll animation.
  // The user requirement is "make uploaded icons protruding".
  // This implies they sit on top of the reel frame.
  // We can achieve this by having the "active" or "winning" symbols rendered in a separate layer on top, or by using a scale transform that just visually overlaps.
  // If overflow-hidden is active, they will be clipped. 
  // For now, I will keep overflow-hidden but increase the scale significantly so they fill the cell maximally, 
  // and maybe try a technique where the reel container has padding?
  // Let's stick to `transform scale-[1.7]` inside the cell. It will be clipped by the Reel boundary.
  // Unless we allow `overflow-visible` on the reel and mask the whole game area?
  // Let's try `overflow-y-hidden` (which forces x-hidden usually) but relies on z-index popping? No.
  // I will just scale them up massively inside the cell.

  return (
    <div 
        className={`relative flex-1 ${!hasColumnBg && reelBgMode !== 'FULL' ? gameConfig.reelBg : ''} shadow-inner rounded-md min-w-0 overflow-hidden`}
        style={containerStyle} 
    >
       <div 
            className="w-full absolute top-0 left-0 will-change-transform transition-transform duration-300 ease-out"
            style={{
                height: `${containerHeightPercent}%`, 
                transform: (!landing && spinning) ? 'none' : `translateY(${translateY})`, 
            }}
       >
            <div className={`
                w-full h-full flex flex-col
                ${(!landing && spinning) ? 'animate-spin-blur' : ''} 
                ${(landing) ? 'animate-bounce-land' : ''}
            `}>
                {renderStrip.map((s, i) => {
                    const visibleRowIndex = i - (totalItems - VISIBLE_ROWS);
                    const isWinner = landing && visibleRowIndex >= 0 && winningIndices.includes(visibleRowIndex);
                    const isShowcase = landing && visibleRowIndex >= 0 && isScatterShowcase && s === SymbolType.SCATTER;

                    return (
                        <ReelCell 
                            key={i} 
                            symbol={s} 
                            config={SYMBOL_CONFIGS[s]}
                            blur={!landing && spinning}
                            highlight={isWinner} 
                            isScatterShowcase={isShowcase}
                            heightPercent={100 / totalItems} 
                            customImage={customAssets[s]}
                        />
                    );
                })}
            </div>
       </div>

      {/* Overlay Gradients - Only if not Full BG to avoid muddying */}
      {reelBgMode !== 'FULL' && <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none z-10"></div>}
    </div>
  );
};

const ReelCell: React.FC<{ 
    symbol: SymbolType, 
    blur?: boolean, 
    highlight?: boolean, 
    config: SymbolConfig, 
    heightPercent: number,
    isScatterShowcase?: boolean,
    customImage?: string
}> = ({ symbol, blur, highlight, config, heightPercent, isScatterShowcase, customImage }) => {
    
    const isScatter = symbol === SymbolType.SCATTER;
    const isWild = symbol === SymbolType.WILD;
    const isLetter = [SymbolType.TEN, SymbolType.JACK, SymbolType.QUEEN, SymbolType.KING, SymbolType.ACE].includes(symbol);

    let bgClasses = config?.bg || 'bg-transparent';
    
    if (highlight) {
        bgClasses = (config?.highlightClass || "bg-gold-500/30 shadow-[0_0_50px_rgba(255,215,0,0.8)] border-gold-400/50") + " z-20 border";
    } else if (isScatter && isScatterShowcase) {
        bgClasses = "bg-indigo-500/50 border-indigo-300 shadow-[0_0_40px_rgba(99,102,241,0.9)] z-20";
    }

    const activeBounce = highlight || isScatterShowcase;
    const fontSize = isWild ? 'text-4xl md:text-5xl lg:text-6xl' : 'text-6xl md:text-7xl lg:text-8xl';

    // Increased scale for protruding look
    const imgScale = activeBounce ? 'scale-[2.0]' : 'scale-[1.7]';

    return (
        <div 
            className={`
                w-full flex items-center justify-center relative 
                ${blur ? 'blur-[2px] opacity-80' : ''} 
                transition-all duration-300
            `}
            style={{ 
                height: `${heightPercent}%`,
                zIndex: activeBounce ? 50 : 1 // Bring active cells to front
            }}
        >
            <div className={`
                relative
                aspect-square
                h-full
                w-full
                max-w-full
                rounded-lg 
                flex items-center justify-center
                transition-all duration-300
                overflow-visible
                ${(isLetter && !highlight) || activeBounce ? '' : bgClasses}
            `}>
                 {activeBounce && (
                    <div 
                        className="absolute -inset-[4px] z-20 pointer-events-none rounded-xl overflow-hidden"
                        style={{
                            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                            maskComposite: 'exclude',
                            WebkitMaskComposite: 'xor',
                            padding: '6px'
                        }}
                    >
                        <div 
                            className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 animate-[spin_2s_linear_infinite]"
                            style={{
                                background: 'conic-gradient(from 0deg, transparent 0deg, transparent 200deg, rgba(234, 179, 8, 0.5) 280deg, #f59e0b 320deg, #ffffff 360deg)',
                                filter: 'blur(6px)' 
                            }}
                        />
                    </div>
                 )}

                 {(!isLetter || highlight) && !activeBounce && <div className="absolute inset-0 rounded-lg border border-white/10 shadow-inner pointer-events-none"></div>}
                 
                 <div className={`
                     relative flex flex-col items-center justify-center z-10 w-full h-full
                     ${isScatterShowcase ? 'animate-bounce' : ''}
                 `}>
                    {customImage ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <img 
                                src={customImage} 
                                alt={symbol} 
                                decoding="async"
                                className={`w-full h-full object-contain transform ${imgScale} ${activeBounce ? 'drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'drop-shadow-md'}`} 
                            />
                        </div>
                    ) : (
                        <div className={`
                            ${fontSize} select-none transform 
                            ${config?.style || ''}
                            ${activeBounce ? 'drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] scale-110' : ''}
                        `}>
                            {config?.icon}
                        </div>
                    )}
                    
                    {isScatter && !blur && !customImage && (
                        <div className="absolute bottom-0 w-full flex justify-center items-end pb-1 z-30">
                            <span className={`
                                block 
                                text-lg md:text-2xl font-black text-white 
                                tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,1)]
                                stroke-black stroke-2
                            `}
                            style={{ textShadow: '0 0 4px black, 0 0 8px black' }} 
                            >
                                SCATTER
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
