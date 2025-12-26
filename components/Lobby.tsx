
import React, { useState, useEffect, useRef } from 'react';
import { GAMES_CONFIG, formatCommaNumber, formatTime } from '../constants';
import { GameConfig, QuestState, MissionState, CustomAssetMap } from '../types';

interface LobbyProps {
    onSelectGame: (game: GameConfig, isHighLimit: boolean) => void;
    onOpenQuest: () => void;
    onOpenMissions: () => void;
    onOpenBattlePass: () => void;
    onClaimBonus: () => void;
    onOpenCollection: () => void;
    onOpenPiggyBank: () => void;
    onToggleVIP: () => void;
    questState: QuestState;
    missionState: MissionState;
    nextTimeBonus: number; 
    bonusAmount: number;
    isHighLimit: boolean;
    playerLevel: number; 
    customAssets?: CustomAssetMap;
}

export const Lobby: React.FC<LobbyProps> = ({ 
    onSelectGame, 
    onOpenQuest, 
    onOpenMissions, 
    onOpenBattlePass,
    onClaimBonus, 
    onOpenCollection,
    onOpenPiggyBank,
    onToggleVIP,
    questState, 
    missionState, 
    nextTimeBonus,
    bonusAmount,
    isHighLimit,
    playerLevel,
    customAssets = {} as CustomAssetMap
}) => {
    
    const [timeLeft, setTimeLeft] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const diff = Math.max(0, nextTimeBonus - now);
            setTimeLeft(diff);
        }, 1000);
        return () => clearInterval(interval);
    }, [nextTimeBonus]);

    const isReadyToCollect = timeLeft === 0;
    const missionsReady = missionState.activeMissions.filter(m => m.completed && !m.claimed).length;
    const passRewardsReady = missionState.passRewards.filter(r => r.level <= missionState.passLevel && !r.claimed).length;
    const totalMissionNotifs = missionsReady + passRewardsReady;
    const questReady = questState.credits >= questState.max;

    // Use Custom Icons if available - Bigger Size
    const getIcon = (key: string, fallback: string) => {
        if (customAssets.global?.[key]) {
            return <img src={customAssets.global[key]} alt={key} className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-md" />;
        }
        return <span className="text-6xl md:text-8xl">{fallback}</span>;
    };

    const getQuestIcon = () => {
        if (customAssets.global?.['QUEST']) {
             return <img src={customAssets.global['QUEST']} alt="Quest" className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-md" />;
        }
        if (questState.activeGame === 'DICE') return <span className="text-6xl md:text-8xl">🎲</span>;
        if (questState.activeGame === 'WILD') return <span className="text-6xl md:text-8xl">🗿</span>;
        return <span className="text-6xl md:text-8xl">🗺️</span>;
    };

    const getFontClass = (theme: string) => {
         switch(theme) {
             case 'NEON': return 'font-display';
             case 'CANDY': return 'font-cartoon';
             case 'PIRATE': return 'font-heavy';
             case 'DRAGON': return 'font-heavy';
             case 'SPACE': return 'font-display';
             case 'JUNGLE': return 'font-cartoon';
             case 'WESTERN': return 'font-heavy';
             case 'SAMURAI': return 'font-heavy';
             case 'PIGGY': return 'font-cartoon';
             default: return 'font-clean';
         }
    };

    const startScroll = (direction: 'LEFT' | 'RIGHT') => {
        if (scrollInterval.current) return;
        const amount = direction === 'LEFT' ? -20 : 20;
        
        const scrollAction = () => {
             if (scrollRef.current) {
                scrollRef.current.scrollBy({ left: amount, behavior: 'auto' });
             }
        };
        
        scrollAction(); 
        scrollInterval.current = setInterval(scrollAction, 16); 
    };

    const stopScroll = () => {
        if (scrollInterval.current) {
            clearInterval(scrollInterval.current);
            scrollInterval.current = null;
        }
    };

    const getUnlockLevel = (index: number) => {
        // Game 0 (Piggy), 1 (Neon), 2 (Pharaoh) -> Unlocked
        if (index < 3) return 0;
        return 32 + (index - 3) * 10;
    };

    // Feature Locks
    const isPiggyLocked = playerLevel < 5;
    const isQuestLocked = playerLevel < 20;
    const isMissionsLocked = playerLevel < 10;
    const isCardsLocked = playerLevel < 30;
    const isVipLocked = playerLevel < 40;

    const timeBonusIcon = customAssets.global?.['TIME_BONUS'];

    return (
        <div className="w-full h-full flex flex-col relative overflow-hidden">
            
            {/* Game List Container - Flex Grow to take available space */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden py-4">
                <button 
                    onMouseDown={() => startScroll('LEFT')}
                    onMouseUp={stopScroll}
                    onMouseLeave={stopScroll}
                    onTouchStart={() => startScroll('LEFT')}
                    onTouchEnd={stopScroll}
                    className="absolute left-2 md:left-4 z-30 w-10 h-10 md:w-14 md:h-14 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center shadow-lg border border-white/20 transition-all active:scale-95 select-none"
                >
                    ◀
                </button>

                <div 
                    ref={scrollRef}
                    className="grid gap-4 auto-cols-max px-16 overflow-x-auto no-scrollbar snap-x items-center h-full max-h-[60vh]"
                    style={{
                        gridTemplateRows: 'repeat(2, 1fr)',
                        gridAutoFlow: 'column'
                    }}
                >
                    {GAMES_CONFIG.slice(0, 4).map((game, idx) => {
                         const titleStyle = game.theme === 'NEON' ? 'text-fuchsia-300 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]' :
                                            game.theme === 'EGYPT' ? 'text-amber-400 drop-shadow-[0_2px_0_rgba(0,0,0,1)]' :
                                            game.theme === 'DRAGON' ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' :
                                            game.theme === 'PIRATE' ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]' :
                                            game.theme === 'SPACE' ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]' :
                                            game.theme === 'PIGGY' ? 'text-pink-300 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]' :
                                            'text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]';
                        
                        const unlockLevel = getUnlockLevel(idx);
                        const isLocked = playerLevel < unlockLevel;
                        const customThumb = customAssets[game.id]?.thumbnail;

                        return (
                            <button 
                                key={game.id}
                                onClick={() => onSelectGame(game, isHighLimit)}
                                className={`
                                    row-span-2
                                    relative group 
                                    w-[200px] md:w-[260px] h-full
                                    rounded-xl md:rounded-2xl overflow-hidden 
                                    border-2 md:border-4 ${isHighLimit ? 'border-red-900/50 hover:border-red-500' : 'border-transparent hover:border-gold-500'} 
                                    transition-all duration-300 hover:brightness-110 shadow-xl
                                    flex flex-col
                                    snap-center
                                    ${isLocked ? 'cursor-not-allowed' : ''}
                                `}
                            >
                                {/* Only render colored gradient if NO custom thumbnail exists to prevent 'multiply' look */}
                                {!customThumb && <div className={`absolute inset-0 bg-gradient-to-br ${isHighLimit ? 'from-red-950 via-black to-red-900' : game.color} transition-opacity`}></div>}
                                
                                {customThumb && (
                                    <img src={customThumb} alt={game.name} className="absolute inset-0 w-full h-full object-cover z-0" />
                                )}

                                <div className="relative z-10 h-full flex flex-col p-4 items-center text-center justify-between">
                                    <div className="mt-4 bg-black/60 px-3 py-1 rounded-full border border-white/10 shadow-lg backdrop-blur-sm">
                                        <span className="text-xs md:text-sm font-bold text-white uppercase tracking-widest">{isHighLimit ? 'High Limit' : (idx < 3 ? 'Featured' : 'Classic')}</span>
                                    </div>

                                    {!customThumb && (
                                        <div className="flex-1 flex items-center justify-center">
                                            <span className="text-7xl md:text-9xl drop-shadow-2xl group-hover:scale-110 transition-transform duration-500 filter">
                                                {game.theme === 'NEON' ? '🎰' : 
                                                    game.theme === 'EGYPT' ? '🦂' : 
                                                    game.theme === 'DRAGON' ? '🐉' :
                                                    game.theme === 'PIRATE' ? '🏴‍☠️' :
                                                    game.theme === 'SPACE' ? '👽' :
                                                    game.theme === 'PIGGY' ? '🐷' : '🍭'}
                                            </span>
                                        </div>
                                    )}
                                    {customThumb && <div className="flex-1"></div>}
                                    
                                    <div className={`backdrop-blur-md p-3 rounded-xl w-full bg-black/80 border border-white/20 shadow-2xl`}>
                                        <h3 className={`text-xl md:text-2xl font-black mb-1 leading-none uppercase tracking-wide ${getFontClass(game.theme)} ${titleStyle}`}>{game.name}</h3>
                                        <p className="text-xs text-gray-300 font-bold uppercase tracking-wider font-body">{game.description.split('.')[0]}</p>
                                    </div>
                                </div>
                                
                                {isLocked && (
                                    <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-4 text-center border-4 border-white/10 rounded-xl">
                                        <span className="text-6xl mb-2 drop-shadow-lg">🔒</span>
                                        <div className="bg-red-600 px-4 py-1 rounded-full shadow-lg mb-1">
                                            <span className="text-white font-black uppercase text-sm tracking-wider">LOCKED</span>
                                        </div>
                                        <span className="text-white font-bold uppercase text-xs drop-shadow-md">Unlocks at Level {unlockLevel}</span>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none"></div>
                            </button>
                        );
                    })}

                    {GAMES_CONFIG.slice(4).map((game, idx) => {
                         const realIdx = idx + 4;
                         const titleStyle = game.theme === 'NEON' ? 'text-fuchsia-300' :
                                            game.theme === 'EGYPT' ? 'text-amber-400' :
                                            game.theme === 'DRAGON' ? 'text-red-500' :
                                            game.theme === 'PIRATE' ? 'text-sky-400' :
                                            game.theme === 'SPACE' ? 'text-indigo-400' :
                                            'text-pink-400';
                        let icon = '🍭';
                        if (game.theme === 'JUNGLE') icon = '🌴';
                        if (game.theme === 'UNDERWATER') icon = '🔱';
                        if (game.theme === 'WESTERN') icon = '🤠';
                        if (game.theme === 'SAMURAI') icon = '👹';
                        if (game.theme === 'SPACE') icon = '👽';
                        if (game.theme === 'PIRATE') icon = '🏴‍☠️';

                        const unlockLevel = getUnlockLevel(realIdx);
                        const isLocked = playerLevel < unlockLevel;
                        const customThumb = customAssets[game.id]?.thumbnail;

                        return (
                            <button 
                                key={game.id}
                                onClick={() => onSelectGame(game, isHighLimit)}
                                className={`
                                    row-span-1
                                    relative group 
                                    w-[200px] md:w-[260px] h-full
                                    rounded-xl overflow-hidden 
                                    border-2 ${isHighLimit ? 'border-red-900/30 hover:border-red-500' : 'border-white/10 hover:border-gold-500'} 
                                    transition-all duration-300 hover:brightness-110 shadow-lg
                                    flex flex-col items-center justify-end
                                    snap-center
                                    ${isLocked ? 'cursor-not-allowed' : ''}
                                `}
                            >
                                {/* Only render colored gradient if NO custom thumbnail exists */}
                                {!customThumb && <div className={`absolute inset-0 bg-gradient-to-r ${isHighLimit ? 'from-red-950 to-black' : game.color} opacity-80 group-hover:opacity-100 transition-opacity`}></div>}
                                
                                {customThumb && (
                                    <img src={customThumb} alt={game.name} className="absolute inset-0 w-full h-full object-cover z-0" />
                                )}

                                {!customThumb && (
                                    <div className="absolute inset-0 flex items-center justify-center pb-6">
                                         <div className="text-7xl md:text-8xl drop-shadow-2xl group-hover:scale-110 transition-transform duration-300">
                                             {icon}
                                         </div>
                                    </div>
                                )}

                                <div className="relative z-10 w-full bg-black/60 backdrop-blur-sm py-2 px-2 border-t border-white/10 flex flex-col items-center">
                                     <h3 className={`text-base md:text-lg font-black uppercase tracking-tight leading-none text-center ${getFontClass(game.theme)} ${titleStyle}`}>{game.name}</h3>
                                </div>

                                {isLocked && (
                                    <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-2 text-center border-2 border-white/10 rounded-xl">
                                        <span className="text-4xl mb-1 drop-shadow-lg">🔒</span>
                                        <span className="text-white font-black uppercase text-sm bg-red-600 px-2 rounded-full">Lvl {unlockLevel}</span>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                    <div className="w-8"></div>
                </div>

                <button 
                    onMouseDown={() => startScroll('RIGHT')}
                    onMouseUp={stopScroll}
                    onMouseLeave={stopScroll}
                    onTouchStart={() => startScroll('RIGHT')}
                    onTouchEnd={stopScroll}
                    className="absolute right-2 md:right-4 z-30 w-10 h-10 md:w-14 md:h-14 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center shadow-lg border border-white/20 transition-all active:scale-95 select-none"
                >
                    ▶
                </button>
            </div>

            {/* Bottom Bar - Fixed at bottom of container, no longer absolute to avoid being cut off */}
            <div className="w-full h-[100px] md:h-[120px] shrink-0 z-50 flex items-end justify-center relative">
                <div className="absolute bottom-0 w-full h-[80px] md:h-[90px] bg-gradient-to-b from-[#6b21a8] to-[#3b0764] shadow-[0_-10px_30px_rgba(107,33,168,0.6)] flex items-center justify-center">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                </div>

                <div className="relative z-10 flex items-end justify-center gap-4 md:gap-10 pb-4 w-full max-w-6xl">
                    
                    {/* Piggy Bank */}
                     <button 
                        onClick={!isPiggyLocked ? onOpenPiggyBank : undefined}
                        className={`flex flex-col items-center group relative active:scale-95 transition-transform ${isPiggyLocked ? 'grayscale opacity-50' : ''}`}
                    >
                        <div className="group-hover:-translate-y-4 transition-transform duration-300 filter drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
                             {getIcon('PIGGY', '🐷')}
                        </div>
                        <span className="text-xs md:text-sm font-black text-purple-200 uppercase tracking-wider group-hover:text-white drop-shadow-md font-heavy">Piggy</span>
                        {isPiggyLocked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg">
                                <span className="text-2xl mb-1 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">🔒</span>
                                <span className="text-white text-[10px] px-1 rounded font-bold bg-red-600 shadow-md">Lvl 5</span>
                            </div>
                        )}
                    </button>

                    {/* Quest */}
                    <button 
                        onClick={!isQuestLocked ? onOpenQuest : undefined}
                        className={`flex flex-col items-center group relative active:scale-95 transition-transform ${isQuestLocked ? 'grayscale opacity-50' : ''}`}
                    >
                        <div className="group-hover:-translate-y-4 transition-transform duration-300 filter drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
                             {getQuestIcon()}
                             {questReady && !isQuestLocked && <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-bounce"></div>}
                        </div>
                        <span className="text-xs md:text-sm font-black text-purple-200 uppercase tracking-wider group-hover:text-white drop-shadow-md font-heavy">Quest</span>
                        {isQuestLocked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg">
                                <span className="text-2xl mb-1 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">🔒</span>
                                <span className="text-white text-[10px] px-1 rounded font-bold bg-red-600 shadow-md">Lvl 20</span>
                            </div>
                        )}
                    </button>

                    {/* Season Pass */}
                    <button 
                        onClick={!isMissionsLocked ? onOpenBattlePass : undefined}
                        className={`flex flex-col items-center group relative active:scale-95 transition-transform ${isMissionsLocked ? 'grayscale opacity-50' : ''}`}
                    >
                         <div className="group-hover:-translate-y-4 transition-transform duration-300 filter drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
                             {getIcon('PASS', '🎫')}
                             {totalMissionNotifs > 0 && !isMissionsLocked && (
                                 <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold animate-pulse">
                                     {totalMissionNotifs}
                                 </div>
                             )}
                         </div>
                         <span className="text-xs md:text-sm font-black text-purple-200 uppercase tracking-wider group-hover:text-white drop-shadow-md font-heavy">Season Pass</span>
                         {isMissionsLocked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg">
                                <span className="text-2xl mb-1 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">🔒</span>
                                <span className="text-white text-[10px] px-1 rounded font-bold bg-red-600 shadow-md">Lvl 10</span>
                            </div>
                        )}
                    </button>

                    {/* Time Bonus (Center) - No Background, Bigger Icon */}
                    <button 
                        onClick={onClaimBonus}
                        className="flex flex-col items-center group relative active:scale-95 transition-transform mb-4 mx-4"
                    >
                         <div className={`
                             relative w-28 h-28 md:w-36 md:h-36 
                             flex flex-col items-center justify-center group-hover:scale-110 transition-transform z-10 
                         `}>
                             {timeBonusIcon ? (
                                <img src={timeBonusIcon} alt="Free Coins" className="w-full h-full object-contain drop-shadow-2xl" />
                             ) : (
                                <div className="text-7xl md:text-9xl drop-shadow-2xl filter brightness-110">
                                    🎁
                                </div>
                             )}
                             
                             {/* Text overlay for timer if not ready */}
                             {!isReadyToCollect && !timeBonusIcon && (
                                 <div className="absolute bottom-4 flex flex-col items-center z-10 bg-black/60 px-2 rounded-lg">
                                     <span className="text-xs font-bold text-gray-200 uppercase">Next</span>
                                     <span className="text-sm font-black text-white font-mono">{formatTime(timeLeft)}</span>
                                 </div>
                             )}
                             
                             {/* Timer Overlay for Custom Icon */}
                             {!isReadyToCollect && timeBonusIcon && (
                                 <div className="absolute bottom-0 flex flex-col items-center z-10 bg-black/70 px-3 py-1 rounded-full border border-white/20">
                                     <span className="text-xs font-black text-white font-mono">{formatTime(timeLeft)}</span>
                                 </div>
                             )}

                             {isReadyToCollect && <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full border-2 border-white animate-ping opacity-75 z-20"></div>}
                             {isReadyToCollect && <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white z-20">!</div>}
                         </div>
                         
                         {isReadyToCollect && <div className="absolute -bottom-4 w-28 h-6 bg-yellow-500/40 blur-xl rounded-full animate-pulse"></div>}
                         <span className="text-sm md:text-xl font-black text-purple-200 uppercase mt-1 tracking-wider group-hover:text-white drop-shadow-md font-heavy">Free Coins</span>
                    </button>

                    {/* Missions */}
                    <button 
                        onClick={!isMissionsLocked ? onOpenMissions : undefined}
                        className={`flex flex-col items-center group relative active:scale-95 transition-transform ${isMissionsLocked ? 'grayscale opacity-50' : ''}`}
                    >
                         <div className="group-hover:-translate-y-4 transition-transform duration-300 filter drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
                             {getIcon('MISSIONS', '📜')}
                         </div>
                         <span className="text-xs md:text-sm font-black text-purple-200 uppercase tracking-wider group-hover:text-white drop-shadow-md font-heavy">Missions</span>
                         {isMissionsLocked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg">
                                <span className="text-2xl mb-1 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">🔒</span>
                                <span className="text-white text-[10px] px-1 rounded font-bold bg-red-600 shadow-md">Lvl 10</span>
                            </div>
                        )}
                    </button>

                    {/* Cards */}
                    <button 
                        onClick={!isCardsLocked ? onOpenCollection : undefined}
                        className={`flex flex-col items-center group relative active:scale-95 transition-transform ${isCardsLocked ? 'grayscale opacity-50' : ''}`}
                    >
                        <div className="group-hover:-translate-y-4 transition-transform duration-300 filter drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
                            {getIcon('CARDS', '🃏')}
                        </div>
                        <span className="text-xs md:text-sm font-black text-purple-200 uppercase tracking-wider group-hover:text-white drop-shadow-md font-heavy">Cards</span>
                        {isCardsLocked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg">
                                <span className="text-2xl mb-1 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">🔒</span>
                                <span className="text-white text-[10px] px-1 rounded font-bold bg-red-600 shadow-md">Lvl 30</span>
                            </div>
                        )}
                    </button>

                    {/* VIP Limit Toggle */}
                    <button 
                        onClick={!isVipLocked ? onToggleVIP : undefined}
                        className={`flex flex-col items-center group relative active:scale-95 transition-transform ${isVipLocked ? 'grayscale opacity-50' : ''}`}
                    >
                        <div className="group-hover:-translate-y-4 transition-transform duration-300 filter drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
                            {getIcon('VIP', isHighLimit ? '👑' : '🧢')}
                             {isHighLimit && <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full border-2 border-white animate-pulse"></div>}
                        </div>
                        <span className="text-xs md:text-sm font-black text-purple-200 uppercase tracking-wider group-hover:text-white drop-shadow-md font-heavy">{isHighLimit ? 'High Roll' : 'High Roll'}</span>
                        {isVipLocked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg">
                                <span className="text-2xl mb-1 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">🔒</span>
                                <span className="text-white text-[10px] px-1 rounded font-bold bg-red-600 shadow-md">Lvl 40</span>
                            </div>
                        )}
                    </button>

                </div>
            </div>
        </div>
    );
};
