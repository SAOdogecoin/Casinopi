

import React, { useState, useEffect, useRef } from 'react';
import { Mission, MissionState, PassReward, MissionFrequency } from '../types';
import { formatNumber, formatCommaNumber, SCALE_COIN_REWARD } from '../constants';

interface MissionPassModalProps {
    isOpen: boolean;
    initialView: 'MISSIONS' | 'PASS';
    onClose: () => void;
    missionState: MissionState;
    diamonds: number;
    onClaimReward: (reward: PassReward) => void;
    onFinishMission: (mission: Mission) => void;
    onClaimMissionReward: (mission: Mission) => void; 
    onBuyPass: () => void;
    onBuyLevel: () => void;
    onClaimAll: () => void;
    playerLevel: number;
}

export const MissionPassModal: React.FC<MissionPassModalProps> = ({ 
    isOpen, 
    initialView,
    onClose, 
    missionState, 
    diamonds, 
    onClaimReward, 
    onFinishMission,
    onClaimMissionReward,
    onBuyPass,
    onBuyLevel,
    onClaimAll,
    playerLevel
}) => {
    const [view, setView] = useState<'MISSIONS' | 'PASS'>('MISSIONS');
    const [activeTab, setActiveTab] = useState<MissionFrequency>('DAILY');
    const [showPremiumInfo, setShowPremiumInfo] = useState(false);
    const rewardsContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setView(initialView);
            setShowPremiumInfo(false);
        }
    }, [isOpen, initialView]);

    if (!isOpen) return null;

    const currentMissions = missionState.activeMissions
        .filter(m => m.frequency === activeTab && !m.claimed)
        .slice(0, 4);

    const levels = Array.from(new Set(missionState.passRewards.map(r => r.level))).sort((a: number, b: number) => a - b);
    const rewardsToClaimCount = missionState.passRewards.filter(r => 
        r.level <= missionState.passLevel && 
        !r.claimed && 
        (r.tier === 'FREE' || (r.tier === 'PREMIUM' && missionState.isPremium))
    ).length;
    
    const diamondCostToSkip = (xp: number) => Math.ceil(xp / 50) * 10;
    const isXpBoosted = missionState.passBoostMultiplier > 1;

    const handleScroll = (direction: 'LEFT' | 'RIGHT') => {
        if (rewardsContainerRef.current) {
            const amount = 300;
            rewardsContainerRef.current.scrollBy({ left: direction === 'LEFT' ? -amount : amount, behavior: 'smooth' });
        }
    };
    
    const jumpToCurrentLevel = () => {
         if (rewardsContainerRef.current) {
             // Roughly 240px per item (w-56 + gap)
             // Scroll to level - 2 to show some context
             const targetIndex = Math.max(0, missionState.passLevel - 2);
             const targetScroll = targetIndex * 240; 
             rewardsContainerRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
         }
    };

    const handlePremiumPurchase = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent bubbling issues
        onBuyPass();
        setShowPremiumInfo(false);
    };

    const getDisplayValue = (reward: PassReward) => {
        if (reward.type === 'COINS') {
            return formatNumber(SCALE_COIN_REWARD(reward.value, playerLevel));
        }
        return reward.label;
    };

    return (
        <div className="fixed inset-0 top-[35px] md:top-[64px] z-[90] bg-black/95 backdrop-blur-lg animate-pop-in flex flex-col">
            {showPremiumInfo && (
                <div className="absolute inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 animate-pop-in">
                    <div className="relative bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-3xl p-1 w-full max-w-lg shadow-[0_0_50px_rgba(255,215,0,0.5)]">
                        <div className="bg-gradient-to-b from-black/90 to-black/80 rounded-2xl p-8 border-2 border-yellow-400/50 flex flex-col items-center text-center relative overflow-hidden">
                             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                             <button onClick={() => setShowPremiumInfo(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition z-50">✕</button>
                             <h2 className="text-4xl font-black font-display text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500 uppercase tracking-widest mb-4 drop-shadow-sm">Premium Pass</h2>
                             <div className="text-7xl mb-4 animate-bounce">👑</div>
                             <ul className="space-y-4 mb-8 text-left w-full max-w-xs relative z-10">
                                 <li className="flex items-center gap-3"><span className="text-2xl">🚀</span><span className="text-white font-bold text-lg">Unlock Premium Rewards</span></li>
                                 <li className="flex items-center gap-3"><span className="text-2xl">⚡</span><span className="text-white font-bold text-lg">+20 Instant Levels</span></li>
                                 <li className="flex items-center gap-3"><span className="text-2xl">💎</span><span className="text-white font-bold text-lg">Exclusive Gem Packs</span></li>
                                 <li className="flex items-center gap-3"><span className="text-2xl">⛏️</span><span className="text-white font-bold text-lg">Extra Quest Picks</span></li>
                             </ul>
                             <div className="bg-yellow-900/30 rounded-lg p-4 mb-6 border border-yellow-500/30 w-full">
                                 <div className="text-yellow-400 font-black text-2xl">₱ 0.00</div>
                                 <div className="text-yellow-200 text-sm uppercase">Free for you!</div>
                             </div>
                             <button 
                                onClick={handlePremiumPurchase} 
                                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black text-xl uppercase tracking-widest rounded-full shadow-[0_0_30px_rgba(255,215,0,0.4)] hover:scale-105 active:scale-95 transition-transform border-2 border-yellow-200 relative z-20"
                             >
                                Purchase Pass
                             </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full h-full bg-[#0d0814] flex flex-col shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-3 md:p-4 flex justify-between items-center shrink-0 z-10 shadow-lg relative">
                    <div className="flex items-center gap-2">
                        {view === 'PASS' && (
                            <button onClick={() => setView('MISSIONS')} className="text-white hover:text-fuchsia-300 text-2xl font-bold px-2 transition-colors">⬅</button>
                        )}
                        <h2 className="text-xl md:text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-200 uppercase tracking-widest drop-shadow-md">
                            {view === 'MISSIONS' ? 'Missions' : 'Season Pass'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                         <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition shadow-inner">✕</button>
                    </div>
                </div>

                {view === 'MISSIONS' && (
                    <div className="flex-1 flex flex-col relative overflow-hidden">
                        <div className="p-4 bg-gradient-to-b from-[#1e142b] to-[#120b1c] flex justify-between items-center shadow-2xl z-10">
                            <div className="flex items-center gap-4">
                                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                                    <span className="font-black text-2xl text-white drop-shadow-sm">{missionState.passLevel}</span>
                                </div>
                                <div>
                                    <div className="text-purple-300 text-sm font-bold uppercase tracking-widest">Current Level</div>
                                    <div className="w-32 h-3 bg-black rounded-full mt-1 shadow-inner overflow-hidden">
                                        <div className="h-full bg-purple-600" style={{ width: `${(missionState.passXP / missionState.passXpToNext) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setView('PASS')} className="bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 text-white font-black uppercase text-sm px-6 py-2 rounded-full shadow-lg relative active:scale-95 transition-transform">
                                View Rewards
                                {rewardsToClaimCount > 0 && <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs shadow-md animate-pulse">{rewardsToClaimCount}</div>}
                            </button>
                        </div>

                        <div className="flex justify-center my-6">
                            <div className="bg-black/40 p-1 rounded-full flex shadow-inner">
                                <button onClick={() => setActiveTab('DAILY')} className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-sm md:text-base transition-all ${activeTab === 'DAILY' ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Daily</button>
                                <button onClick={() => setActiveTab('WEEKLY')} className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-sm md:text-base transition-all ${activeTab === 'WEEKLY' ? 'bg-gradient-to-r from-gold-500 to-yellow-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Weekly</button>
                                <button onClick={() => setActiveTab('MONTHLY')} className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-sm md:text-base transition-all ${activeTab === 'MONTHLY' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Monthly</button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                                {currentMissions.map((mission, index) => (
                                    <div key={mission.id} className={`aspect-[3/4] rounded-2xl ${mission.completed ? 'bg-gradient-to-b from-green-900/80 to-green-950 shadow-[0_0_30px_rgba(21,128,61,0.3)]' : 'bg-gradient-to-b from-[#2a233e] to-[#1e172e]'} flex flex-col relative overflow-hidden shadow-2xl group hover:-translate-y-1 transition-all duration-300 border-2 border-white/5`}>
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
                                        {mission.completed && <div className="absolute inset-0 bg-gradient-to-tr from-green-500/10 to-transparent pointer-events-none"></div>}
                                        <div className="flex-1 flex items-center justify-center relative">
                                             <div className="text-7xl md:text-8xl drop-shadow-lg group-hover:scale-110 transition-transform duration-500">
                                                 {mission.type === 'SPIN_COUNT' ? '🎰' : mission.type === 'WIN_COINS' ? '💰' : '⭐'}
                                             </div>
                                        </div>
                                        <div className="p-5 flex flex-col justify-end relative z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12">
                                            <div className="text-fuchsia-400 text-xs font-bold uppercase tracking-widest mb-1 shadow-black drop-shadow-sm">Mission</div>
                                            <div className="text-white font-black text-xl leading-tight mb-3 min-h-[3rem] drop-shadow-md">{mission.description}</div>
                                            <div className="w-full mb-3">
                                                <div className="flex justify-between items-end mb-1">
                                                     <span className="text-gray-400 text-base font-bold">{mission.completed ? '100%' : Math.floor((mission.current / mission.target) * 100) + '%'}</span>
                                                     <div className="flex flex-col items-end leading-none">
                                                        <div className="flex items-center gap-1">
                                                            <span className={`font-mono text-sm font-black mb-0.5 ${isXpBoosted ? 'text-yellow-400' : 'text-fuchsia-300'}`}>
                                                                +{isXpBoosted ? mission.xpReward * missionState.passBoostMultiplier : mission.xpReward} XP
                                                            </span>
                                                            {isXpBoosted && <span className="text-[10px] bg-yellow-500 text-black px-1 rounded font-bold shadow-sm">2x</span>}
                                                        </div>
                                                        <span className="text-gold-300 font-mono text-sm font-black">+{formatNumber(mission.coinReward)} Coins</span>
                                                     </div>
                                                </div>
                                                <div className="w-full h-3 bg-black rounded-full overflow-hidden shadow-inner">
                                                    <div className={`h-full bg-gradient-to-r ${mission.completed ? 'from-green-500 to-emerald-500' : 'from-fuchsia-500 to-purple-500'}`} style={{ width: `${Math.min(100, (mission.current / mission.target) * 100)}%` }}></div>
                                                </div>
                                            </div>
                                            {mission.completed ? (
                                                <button onClick={() => onClaimMissionReward(mission)} className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 hover:to-green-400 rounded-xl text-white text-base font-black uppercase flex items-center justify-center gap-2 transition-colors shadow-lg animate-pulse tracking-widest active:scale-95">CLAIM</button>
                                            ) : (
                                                <button onClick={() => onFinishMission(mission)} className="w-full py-3 bg-[#362147] hover:bg-[#452a5a] rounded-xl text-cyan-200 text-sm font-bold uppercase flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-cyan-500/20">
                                                    <span>Skip</span><span className="bg-black/30 px-2 py-0.5 rounded text-xs text-cyan-300">💎 {diamondCostToSkip(mission.xpReward)}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {currentMissions.length === 0 && <div className="col-span-full flex items-center justify-center bg-white/5 rounded-2xl h-64 text-gray-500 font-bold uppercase tracking-widest text-center shadow-inner text-xl">All missions completed</div>}
                            </div>
                        </div>
                    </div>
                )}

                {view === 'PASS' && (
                    <div className="flex-1 flex flex-col bg-black relative">
                        <div className="absolute top-1/2 left-0 right-0 z-20 pointer-events-none flex justify-between px-2 md:px-4">
                            <button onClick={() => handleScroll('LEFT')} className="w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center shadow-lg border border-white/20 pointer-events-auto hover:bg-black/80 active:scale-95 text-xl">◀</button>
                            <button onClick={() => handleScroll('RIGHT')} className="w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center shadow-lg border border-white/20 pointer-events-auto hover:bg-black/80 active:scale-95 text-xl">▶</button>
                        </div>

                        <div className="p-4 bg-gradient-to-b from-[#1e142b] to-[#0f0816] shrink-0 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl z-10">
                             <div className="flex items-center gap-4 md:gap-8">
                                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-gold-400 to-orange-600 flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.4)] z-10 ring-4 ring-black">
                                    <span className="font-black text-4xl md:text-5xl text-white drop-shadow-md">{missionState.passLevel}</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-black uppercase text-xl md:text-2xl tracking-widest italic drop-shadow-sm">Season Pass</h3>
                                    <div className="text-gray-400 text-sm md:text-base font-bold mb-2">Earn XP to unlock exclusive rewards</div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-48 h-4 bg-black rounded-full shadow-inner overflow-hidden">
                                            <div className="h-full bg-purple-600" style={{ width: `${(missionState.passXP / missionState.passXpToNext) * 100}%` }}></div>
                                        </div>
                                        <span className="text-gold-400 font-mono text-xs md:text-sm font-bold">{missionState.passXP}/{missionState.passXpToNext} XP</span>
                                    </div>
                                </div>
                             </div>

                             <div className="flex items-center gap-4">
                                 {/* Jump to Current Button */}
                                 <button onClick={jumpToCurrentLevel} className="bg-black/40 border border-white/20 hover:bg-white/10 text-white text-xs font-bold px-4 py-3 rounded-xl uppercase transition-colors flex flex-col items-center">
                                     <span>Jump To</span>
                                     <span>Current</span>
                                 </button>
                                 
                                 {rewardsToClaimCount > 0 && (
                                     <button onClick={onClaimAll} className="bg-gradient-to-r from-green-600 to-green-500 hover:to-green-400 text-white text-base font-black px-6 py-3 rounded-xl uppercase shadow-[0_0_20px_rgba(34,197,94,0.6)] animate-pulse tracking-wider active:scale-95 transition-transform">Claim All ({rewardsToClaimCount})</button>
                                 )}
                                 <button onClick={onBuyLevel} className="flex flex-col items-center justify-center px-4 py-2 bg-gradient-to-br from-indigo-900 to-indigo-800 hover:brightness-110 rounded-xl shadow-lg active:scale-95 transition-all h-14">
                                     <span className="text-xs font-bold text-indigo-200 uppercase">Buy Level</span>
                                     <span className="text-white font-bold text-sm">100 💎</span>
                                 </button>
                                 
                                 {!missionState.isPremium ? (
                                     <button onClick={() => setShowPremiumInfo(true)} className="flex flex-col items-center justify-center px-6 py-2 bg-gradient-to-r from-gold-500 to-yellow-600 hover:scale-105 active:scale-95 transition-all rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.4)] h-14">
                                         <span className="font-black text-white text-sm md:text-base uppercase italic tracking-widest drop-shadow-md">GET PREMIUM</span>
                                         <span className="text-[10px] font-bold text-yellow-900 bg-white/40 px-2 rounded-full mt-0.5">Perks + 20 Levels</span>
                                     </button>
                                 ) : (
                                     <div className="px-6 py-2 bg-gold-900/40 rounded-xl flex items-center gap-2 h-14 shadow-inner">
                                         <span className="text-2xl">👑</span>
                                         <div className="flex flex-col leading-none">
                                             <span className="text-gold-300 font-black uppercase tracking-widest text-sm">Premium</span>
                                             <span className="text-gold-500 text-xs">Active</span>
                                         </div>
                                     </div>
                                 )}
                             </div>
                        </div>

                        <div ref={rewardsContainerRef} className="flex-1 overflow-x-auto flex items-center p-4 md:p-8 gap-4 md:gap-6 no-scrollbar bg-gradient-to-b from-[#1a1025] to-black snap-x">
                            {levels.map((lvl) => {
                                const rewards = missionState.passRewards.filter(r => r.level === lvl);
                                const freeReward = rewards.find(r => r.tier === 'FREE');
                                const premReward = rewards.find(r => r.tier === 'PREMIUM');
                                const isUnlocked = missionState.passLevel >= lvl;
                                
                                return (
                                    <div key={lvl} className="flex-none w-48 md:w-64 flex flex-col gap-4 relative snap-center">
                                        <div className={`text-center font-black text-3xl md:text-4xl ${isUnlocked ? 'text-white drop-shadow-md' : 'text-gray-600'}`}>LEVEL {lvl}</div>
                                        <div className={`aspect-[3/4] bg-gradient-to-b from-[#382952] to-[#231833] rounded-xl p-2 flex flex-col items-center justify-between relative group overflow-hidden shadow-xl transition-opacity duration-300 ${freeReward?.claimed ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                                            <div className="flex-1 flex flex-col items-center justify-center w-full">
                                                <div className="text-6xl md:text-8xl mb-4 group-hover:scale-110 transition-transform drop-shadow-lg filter">{freeReward?.type === 'COINS' ? '🪙' : freeReward?.type === 'DIAMONDS' ? '💎' : '📦'}</div>
                                                <span className="font-black text-white text-lg text-center leading-tight mb-2 px-2 drop-shadow-md">{freeReward ? getDisplayValue(freeReward) : ''}</span>
                                                <span className="text-xs text-gray-300 uppercase font-bold bg-black/50 px-3 py-1 rounded-full shadow-sm">Free</span>
                                            </div>
                                            <button onClick={() => freeReward && onClaimReward(freeReward)} disabled={!isUnlocked || freeReward?.claimed} className={`w-full py-4 text-base font-black uppercase rounded-lg mt-2 transition-all shadow-md ${isUnlocked && !freeReward?.claimed ? 'bg-gradient-to-r from-green-600 to-green-500 hover:brightness-110 text-white animate-pulse' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>{freeReward?.claimed ? 'Claimed' : isUnlocked ? 'Claim' : 'Locked'}</button>
                                        </div>
                                        <div className={`aspect-[3/4] bg-gradient-to-b from-gray-800 to-black rounded-xl p-2 flex flex-col items-center justify-between relative group overflow-hidden shadow-xl transition-opacity duration-300 ${missionState.isPremium ? 'from-[#451a03] to-[#2e1065] shadow-[0_0_20px_rgba(234,179,8,0.2)]' : ''} ${premReward?.claimed ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                                            <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                                                 {!missionState.isPremium && <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40 backdrop-blur-[1px]"><span className="text-7xl md:text-8xl text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">🔒</span></div>}
                                                <div className="text-6xl md:text-8xl mb-4 group-hover:scale-110 transition-transform drop-shadow-lg filter">{premReward?.type === 'COINS' ? '💰' : premReward?.type === 'DIAMONDS' ? '💎' : premReward?.type === 'PICKS' ? '⛏️' : '👑'}</div>
                                                <span className={`font-black text-lg text-center leading-tight mb-2 px-2 drop-shadow-md ${missionState.isPremium ? 'text-gold-100' : 'text-gray-500'}`}>{premReward ? getDisplayValue(premReward) : ''}</span>
                                                <span className={`text-xs uppercase font-bold px-3 py-1 rounded-full shadow-sm ${missionState.isPremium ? 'text-gold-400 bg-black/50' : 'text-gray-600 bg-black/20'}`}>Premium</span>
                                            </div>
                                            <button onClick={() => premReward && onClaimReward(premReward)} disabled={!isUnlocked || premReward?.claimed || !missionState.isPremium} className={`w-full py-4 text-base font-black uppercase rounded-lg mt-2 transition-all shadow-md ${isUnlocked && !premReward?.claimed && missionState.isPremium ? 'bg-gradient-to-r from-gold-500 to-yellow-500 hover:brightness-110 text-black animate-pulse' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}>{premReward?.claimed ? 'Claimed' : (isUnlocked && missionState.isPremium) ? 'Claim' : 'Locked'}</button>
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="w-8 shrink-0"></div> 
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};