
import React from 'react';
import { formatNumber } from '../constants';

interface BankruptcyModalProps {
    isOpen: boolean;
    onCollect: () => void;
}

export const BankruptcyModal: React.FC<BankruptcyModalProps> = ({ isOpen, onCollect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md animate-pop-in">
            <div className="relative w-full max-w-md p-4">
                {/* Card Container */}
                <div className="relative bg-gradient-to-b from-red-800 to-red-950 border-4 border-red-500 rounded-3xl p-8 flex flex-col items-center text-center shadow-[0_0_50px_rgba(220,38,38,0.6)] overflow-hidden">
                    
                    {/* Background Effects */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                    <div className="absolute -top-20 -left-20 w-40 h-40 bg-red-500 rounded-full blur-3xl animate-pulse opacity-50"></div>
                    <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-yellow-500 rounded-full blur-3xl animate-pulse opacity-50"></div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="text-6xl mb-4 animate-bounce">💸</div>
                        
                        <h2 className="text-3xl md:text-4xl font-black font-display text-white uppercase tracking-widest mb-2 drop-shadow-lg">
                            Ran Out of Coins?
                        </h2>
                        
                        <p className="text-red-200 font-bold text-lg mb-6">
                            Don't worry! Here's a rescue bonus to keep you spinning.
                        </p>

                        {/* Reward Display */}
                        <div className="bg-black/40 rounded-2xl p-6 border border-red-400/30 mb-8 w-full backdrop-blur-sm shadow-inner">
                            <div className="text-5xl font-mono font-black text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                {formatNumber(100000)}
                            </div>
                            <div className="text-white text-xs uppercase mt-2 font-bold tracking-widest">Free Coins</div>
                        </div>

                        <button 
                            onClick={onCollect}
                            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black text-xl uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(34,197,94,0.6)] hover:shadow-[0_0_30px_rgba(34,197,94,0.8)] hover:scale-105 active:scale-95 transition-all border-2 border-green-300"
                        >
                            COLLECT
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
