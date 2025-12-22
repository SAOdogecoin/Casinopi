
import React, { useEffect } from 'react';
import { formatNumber } from '../constants';

interface LevelUpToastProps {
    level: number;
    reward: number;
    maxBetIncreased: boolean;
    newMaxBet: number;
    onClose: () => void;
}

export const LevelUpToast: React.FC<LevelUpToastProps> = ({ level, reward, maxBetIncreased, newMaxBet, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 2000); 
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-[40px] md:top-[70px] right-2 md:right-4 z-[200] w-full max-w-xs origin-top-right transform scale-75 md:scale-110 pointer-events-none">
            <div 
                onClick={onClose}
                className="animate-pop-in cursor-pointer pointer-events-auto bg-zinc-900 rounded-xl p-6 shadow-2xl flex flex-col items-center text-center"
            >
                <h2 className="text-gold-400 font-black text-4xl uppercase italic tracking-tighter mb-2 animate-pulse drop-shadow-md">
                    LEVEL UP!
                </h2>
                <h3 className="text-2xl font-display font-bold text-white mb-4 tracking-widest text-shadow-md opacity-90">
                    LEVEL {level}
                </h3>
                
                {reward > 0 && (
                    <div className="bg-green-800 px-4 py-1.5 rounded-lg mb-3">
                        <span className="text-green-200 font-mono font-bold text-xl">
                            +{formatNumber(reward)} Coins
                        </span>
                    </div>
                )}
                
                {maxBetIncreased && (
                    <div className="flex flex-col items-center mt-2 animate-pulse">
                        <div className="text-gold-300 text-xs font-bold uppercase tracking-wider mb-1">
                            MAX BET INCREASED
                        </div>
                        <div className="bg-gold-900 px-4 py-1 rounded text-gold-100 font-mono font-bold text-lg shadow-lg">
                            MAX: {formatNumber(newMaxBet)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
