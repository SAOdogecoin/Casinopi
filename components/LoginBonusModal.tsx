
import React from 'react';
import { DAILY_LOGIN_REWARDS, formatCommaNumber } from '../constants';

interface LoginBonusModalProps {
    isOpen: boolean;
    currentDay: number; // 1-7
    onClaim: () => void;
}

export const LoginBonusModal: React.FC<LoginBonusModalProps> = ({ isOpen, currentDay, onClaim }) => {
    if (!isOpen) return null;

    const row1 = DAILY_LOGIN_REWARDS.slice(0, 3);
    const row2 = DAILY_LOGIN_REWARDS.slice(3, 7);

    const renderDayCard = (reward: typeof DAILY_LOGIN_REWARDS[0]) => {
        const isToday = reward.day === currentDay;
        const isPast = reward.day < currentDay;
        const isFuture = reward.day > currentDay;
        const isGoldenDay = reward.day === 7;

        return (
            <div 
                key={reward.day}
                className={`
                    relative rounded-2xl p-2 flex flex-col items-center justify-between overflow-hidden shadow-xl transition-all border-4 h-40 md:h-48 w-full
                    ${isGoldenDay ? 'bg-gradient-to-b from-yellow-400 via-gold-500 to-yellow-700 border-yellow-200 shadow-[0_0_40px_rgba(255,215,0,0.6)] animate-pulse' : ''}
                    ${isToday && !isGoldenDay ? 'bg-gradient-to-b from-blue-500 to-blue-700 border-white z-10 shadow-[0_0_30px_rgba(59,130,246,0.8)] scale-105' : ''}
                    ${isPast ? 'bg-gray-800 border-gray-600 grayscale opacity-60' : ''}
                    ${isFuture && !isGoldenDay ? 'bg-[#2e2a5a] border-indigo-500/50' : ''}
                `}
            >
                <div className={`text-xs font-black uppercase px-2 rounded-full mb-1 shadow-sm ${isGoldenDay ? 'bg-black text-gold-400 border border-gold-500' : isToday ? 'bg-white text-black' : 'bg-black/40 text-white'}`}>
                    Day {reward.day}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center w-full">
                    <div className={`text-6xl md:text-7xl mb-1 drop-shadow-md ${isToday ? 'animate-bounce' : ''}`}>
                        {reward.day === 7 ? '👑' : reward.gems > 0 ? '💎' : '💰'}
                    </div>
                    <div className={`font-black text-lg md:text-2xl leading-tight ${isGoldenDay ? 'text-black' : isToday ? 'text-white' : 'text-indigo-100'}`}>
                        {formatCommaNumber(reward.coins)}
                    </div>
                    {reward.gems > 0 && (
                        <div className={`font-bold text-xs md:text-sm mt-1 ${isGoldenDay ? 'text-red-900' : isToday ? 'text-cyan-200' : 'text-cyan-400'}`}>
                            + {reward.gems} Gems
                        </div>
                    )}
                </div>
                
                {isToday && (
                    <button 
                        onClick={onClaim}
                        className="w-full py-2 bg-green-500 hover:bg-green-400 text-white font-black uppercase text-sm rounded-lg shadow-lg animate-pulse mt-1"
                    >
                        Claim
                    </button>
                )}

                {isPast && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-5xl">✅</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/90 backdrop-blur-md animate-pop-in">
            <div className="relative w-full max-w-5xl p-4">
                {/* Container */}
                <div className="bg-gradient-to-b from-indigo-900 to-[#1e1b4b] border-4 border-indigo-500 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(79,70,229,0.6)] flex flex-col items-center text-center relative overflow-hidden">
                    
                    {/* Background */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.1)_20deg,transparent_40deg)] animate-[spin_15s_linear_infinite] pointer-events-none"></div>

                    <h2 className="text-2xl md:text-3xl font-black font-display text-white uppercase tracking-widest mb-2 drop-shadow-lg opacity-80">
                        Daily Login Bonus
                    </h2>
                    <p className="text-indigo-300 text-sm font-bold uppercase tracking-wide mb-6 opacity-80">
                        Come back every day for bigger rewards!
                    </p>

                    {/* Row 1: 3 items */}
                    <div className="grid grid-cols-3 gap-4 w-full max-w-3xl mb-4">
                        {row1.map(reward => renderDayCard(reward))}
                    </div>

                    {/* Row 2: 4 items */}
                    <div className="grid grid-cols-4 gap-4 w-full max-w-4xl">
                        {row2.map(reward => renderDayCard(reward))}
                    </div>
                </div>
            </div>
        </div>
    );
};
