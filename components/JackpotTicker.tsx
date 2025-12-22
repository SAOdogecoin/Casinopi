
import React, { useState, useEffect } from 'react';
import { formatCommaNumber } from '../constants';

interface JackpotTickerProps {
    currentBet: number;
}

const JACKPOT_CONFIG = [
    { name: 'MINI', multiplier: 20, colorClass: 'from-green-600 to-green-800', textColor: 'text-green-300' },
    { name: 'MINOR', multiplier: 40, colorClass: 'from-blue-600 to-blue-800', textColor: 'text-blue-300' },
    { name: 'MAJOR', multiplier: 60, colorClass: 'from-purple-600 to-purple-800', textColor: 'text-purple-300' },
    { name: 'MEGA', multiplier: 80, colorClass: 'from-red-600 to-red-800', textColor: 'text-red-300' },
    { name: 'GRAND', multiplier: 100, colorClass: 'from-yellow-600 to-yellow-800', textColor: 'text-yellow-300' }
];

export const JackpotTicker: React.FC<JackpotTickerProps> = ({ currentBet }) => {
    const [fluctuation, setFluctuation] = useState<number[]>([0, 0, 0, 0, 0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setFluctuation(prev => prev.map(() => Math.floor(Math.random() * 500)));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const renderJackpotItem = (jp: typeof JACKPOT_CONFIG[0], idx: number) => {
        const baseAmount = currentBet * jp.multiplier;
        const displayAmount = baseAmount + fluctuation[idx];
        
        return (
            <div key={jp.name} className="flex flex-col items-center group relative flex-1">
                {/* Text on top of container */}
                <div className={`absolute -top-2 z-10 bg-black/80 px-2 rounded-full border border-white/20 text-[8px] md:text-[10px] font-black uppercase ${jp.textColor} drop-shadow-md tracking-wider`}>
                    {jp.name}
                </div>
                
                {/* Solid 3D Gradient Container - Compact */}
                <div className={`
                    relative bg-gradient-to-b ${jp.colorClass}
                    rounded-lg px-2 pt-3 pb-1
                    shadow-[0_3px_0_rgba(0,0,0,0.3)] hover:translate-y-[-1px] hover:shadow-[0_4px_0_rgba(0,0,0,0.3)]
                    w-full flex justify-center items-center
                    transform transition-all duration-300
                `}>
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-white/30"></div>
                    <div className="text-xs md:text-lg font-mono font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] leading-none truncate">
                        {formatCommaNumber(displayAmount)}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full flex flex-col gap-3 items-center px-4 py-2 bg-black/20 rounded-xl">
            {/* Row 1: Mini, Minor, Major */}
            <div className="flex flex-row gap-2 w-full justify-center max-w-3xl">
                {JACKPOT_CONFIG.slice(0, 3).map((jp, idx) => renderJackpotItem(jp, idx))}
            </div>
            
            {/* Row 2: Mega, Grand */}
            <div className="flex flex-row gap-2 w-full justify-center max-w-2xl">
                {JACKPOT_CONFIG.slice(3).map((jp, idx) => renderJackpotItem(jp, idx + 3))}
            </div>
        </div>
    );
};
