
import React, { useState, useEffect } from 'react';
import { QuestSidebar } from './QuestSidebar';
import { QuestState, MissionState, CustomAssetMap } from '../types';
import { formatTime } from '../constants';

interface LeftSidebarProps {
    quest: QuestState;
    onQuestClaim: () => void;
    xpMultiplier: number;
    xpBoostEndTime: number;
    missionState: MissionState;
    onOpenMissions: () => void;
    onOpenBattlePass: () => void;
    picks?: number;
    playerLevel: number;
    customAssets?: CustomAssetMap;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
    quest, 
    onQuestClaim, 
    xpMultiplier, 
    xpBoostEndTime,
    missionState,
    onOpenMissions,
    onOpenBattlePass,
    picks = 0,
    playerLevel,
    customAssets
}) => {
    
    const missionsReady = missionState.activeMissions.filter(m => m.completed && !m.claimed).length;
    const isMissionXpBoosted = missionState.passBoostMultiplier > 1;
    
    // Only count premium rewards if user is premium
    const passRewardsReady = missionState.passRewards.filter(r => 
        r.level <= missionState.passLevel && 
        !r.claimed && 
        (r.tier === 'FREE' || (r.tier === 'PREMIUM' && missionState.isPremium))
    ).length;

    const isQuestUnlocked = playerLevel >= 20;
    const isMissionsUnlocked = playerLevel >= 10;

    // Helper to determine Quest Asset
    const getQuestAsset = () => {
        if (quest.activeGame === 'DICE' && customAssets?.global?.['QUEST_DICE']) return customAssets.global['QUEST_DICE'];
        if (quest.activeGame === 'WILD' && customAssets?.global?.['QUEST_WILD']) return customAssets.global['QUEST_WILD'];
        if (customAssets?.global?.['QUEST']) return customAssets.global['QUEST'];
        return null;
    };

    const getQuestFallback = () => {
        if (quest.activeGame === 'DICE') return '🎲';
        if (quest.activeGame === 'WILD') return '🗿';
        return '🗺️';
    };

    const getQuestLabel = () => {
        if (quest.activeGame === 'DICE') return 'DICE';
        if (quest.activeGame === 'WILD') return 'WILD';
        return 'QUEST';
    }

    // Helper for XP Asset
    const getXpAsset = () => {
        if (customAssets?.global?.['XP_ICON']) return <img src={customAssets.global['XP_ICON']} className="w-full h-full object-contain drop-shadow-md" />;
        return <div className="text-2xl font-black text-yellow-400 drop-shadow-md stroke-black stroke-2" style={{ textShadow: '0 2px 0 black' }}>2X XP</div>;
    }

    return (
        <div className="fixed left-2 md:left-4 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-30 pointer-events-none items-center pl-1">
            {/* Quest Widget - Only if Unlocked */}
            {isQuestUnlocked && (
                <div className="pointer-events-auto flex flex-col items-center animate-pop-in">
                    <div className="flex flex-col items-center gap-1 self-center pointer-events-auto relative">
                        {/* Quest Button - Bigger, No Container BG */}
                        <button 
                            onClick={onQuestClaim}
                            className="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
                        >
                            {/* Custom Icon Fills */}
                            {getQuestAsset() ? (
                                <img src={getQuestAsset()!} className="w-full h-full object-contain drop-shadow-2xl" />
                            ) : (
                                <div className="flex flex-col items-center justify-center">
                                    <div className="text-6xl md:text-7xl drop-shadow-2xl mb-1">{getQuestFallback()}</div>
                                </div>
                            )}

                            {/* Label Overlay */}
                            <div className="absolute bottom-0 inset-x-0 flex justify-center z-10">
                                <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-wider drop-shadow-[0_2px_0_rgba(0,0,0,1)] bg-black/60 px-2 rounded-full backdrop-blur-[2px]">
                                    {getQuestLabel()}
                                </span>
                            </div>
                        </button>

                        {/* Credits Counter Badge */}
                        {quest.credits >= quest.max ? (
                            <div className="absolute -top-1 -right-1 min-w-[28px] h-7 px-1 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg border-2 border-white z-50 animate-pulse pointer-events-none">
                                MAX
                            </div>
                        ) : quest.credits > 0 && (
                            <div className="absolute -top-1 -right-1 min-w-[28px] h-7 px-1 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg border-2 border-white z-50 pointer-events-none">
                                {Math.floor(quest.credits)}
                            </div>
                        )}
                        
                        {quest.credits >= quest.max && (
                            <span className="bg-green-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase drop-shadow-md animate-pulse shadow-lg border border-green-400 mt-1 z-50">
                                COLLECT
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Missions Widget Group - Only if Unlocked */}
            {isMissionsUnlocked && (
                <div className="pointer-events-auto flex flex-col gap-6 items-center animate-pop-in">
                    
                    {/* Mission Button - Bigger, No Container BG */}
                    <div className="relative flex flex-col items-center justify-center">
                        <button 
                            onClick={onOpenMissions}
                            className="group relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-10"
                        >
                            {customAssets?.global?.['MISSIONS'] ? (
                                <img src={customAssets.global['MISSIONS']} className="w-full h-full object-contain drop-shadow-2xl" />
                            ) : (
                                <div className="flex flex-col items-center justify-center">
                                     <div className="text-6xl md:text-7xl drop-shadow-2xl mb-1">📜</div>
                                </div>
                            )}

                            <div className="absolute bottom-0 inset-x-0 flex justify-center z-10">
                                <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-wider drop-shadow-[0_2px_0_rgba(0,0,0,1)] bg-black/60 px-2 rounded-full backdrop-blur-[2px]">
                                    MISSION
                                </span>
                            </div>
                        </button>

                        {/* Mission Badge */}
                        {missionsReady > 0 && (
                            <div className="absolute -top-1 -right-1 min-w-[28px] h-7 px-1 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-black animate-bounce shadow-lg border-2 border-white z-50 pointer-events-none">
                                {missionsReady}
                            </div>
                        )}
                        
                        {/* Conditional Collect Pill */}
                        {missionsReady > 0 && (
                            <span className={`
                                absolute -bottom-3 left-1/2 -translate-x-1/2 z-50
                                px-2 py-0.5 rounded-full text-[8px] font-black uppercase drop-shadow-md animate-pulse shadow-lg border whitespace-nowrap
                                ${isMissionXpBoosted 
                                    ? 'bg-yellow-500 text-black border-yellow-300' 
                                    : 'bg-green-600 text-white border-green-400'}
                            `}>
                                {isMissionXpBoosted ? 'COLLECT 2X' : 'COLLECT'}
                            </span>
                        )}
                    </div>

                    {/* Season Pass Button - Bigger, No Container BG */}
                    <div className="relative flex flex-col items-center justify-center">
                        <button 
                            onClick={onOpenBattlePass}
                            className="group relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-10"
                        >
                            {customAssets?.global?.['PASS'] ? (
                                <img src={customAssets.global['PASS']} className="w-full h-full object-contain drop-shadow-2xl" />
                            ) : (
                                <div className="flex flex-col items-center justify-center">
                                     <div className="text-6xl md:text-7xl drop-shadow-2xl mb-1">🎫</div>
                                </div>
                            )}

                            <div className="absolute bottom-0 inset-x-0 flex justify-center z-10">
                                 <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-wider drop-shadow-[0_2px_0_rgba(0,0,0,1)] bg-black/60 px-2 rounded-full backdrop-blur-[2px]">
                                    PASS
                                 </span>
                            </div>
                        </button>

                        {/* Pass Badge */}
                        {passRewardsReady > 0 && (
                            <div className="absolute -top-1 -right-1 min-w-[28px] h-7 px-1 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-black animate-bounce shadow-lg border-2 border-white z-50 pointer-events-none">
                                {passRewardsReady}
                            </div>
                        )}

                        {passRewardsReady > 0 && (
                            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase drop-shadow-md animate-pulse shadow-lg border border-green-400 whitespace-nowrap">
                                COLLECT
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* XP Boost Indicator - Replaced Container with Icon */}
            {xpMultiplier > 1 && (
                <div className="relative w-20 h-20 md:w-24 md:h-24 animate-pop-in z-30 flex flex-col items-center justify-center mt-2 pointer-events-auto group hover:scale-110 transition-transform">
                     {/* Asset or Text Icon */}
                     <div className="w-full h-full flex items-center justify-center drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]">
                         {getXpAsset()}
                     </div>
                     
                     {/* Timer Badge Overlay */}
                     <div className="absolute -bottom-2 bg-black/80 px-2 py-0.5 rounded-full border border-yellow-500/50">
                         <span className="text-[10px] font-mono font-black text-yellow-400 leading-none">
                             <XPTimer endTime={xpBoostEndTime} />
                         </span>
                     </div>
                </div>
            )}
        </div>
    );
};

// Helper for timer to avoid recreating intervals in main component too often for UI
const XPTimer: React.FC<{ endTime: number }> = ({ endTime }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(Math.max(0, endTime - Date.now()));
        }, 1000);
        return () => clearInterval(interval);
    }, [endTime]);
    return <>{formatTime(timeLeft)}</>;
};
