
import React, { useState } from 'react';
import { formatCommaNumber, formatNumber } from '../constants';
import { audioService } from '../services/audioService';
import { CustomAssetMap } from '../types';

interface PiggyBankModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    diamonds: number;
    onBreak: () => void;
    level: number;
    customAssets?: CustomAssetMap;
}

export const PiggyBankModal: React.FC<PiggyBankModalProps> = ({ isOpen, onClose, amount, diamonds, onBreak, level, customAssets }) => {
    const [isBreaking, setIsBreaking] = useState(false);
    const [shake, setShake] = useState(false);
    
    if (!isOpen) return null;
    
    // Dynamic Cost: Base 50 Gems, +1 Gem per 20,000 Coins saved
    // Cap at 1000 Gems
    const rawCost = Math.max(50, Math.floor(amount / 20000));
    const breakCost = Math.min(rawCost, 1000);
    
    // Cap: Level * 2,500,000
    const cap = level * 2500000;
    const isFull = amount >= cap;

    const handleBreakClick = () => {
        if (diamonds < breakCost || amount <= 0) {
             setShake(true);
             audioService.playStoneBreak();
             setTimeout(() => setShake(false), 500);
             onBreak(); // Trigger parent toast/validation
             return;
        }

        setIsBreaking(true);
        audioService.playClick();
        
        setTimeout(() => {
            audioService.playStoneBreak();
            onBreak();
            setTimeout(() => {
                setIsBreaking(false);
                onClose();
            }, 1500);
        }, 500);
    };

    const customIcon = customAssets?.global?.['PIGGY'];

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md animate-pop-in">
            {/* Wider Container */}
            <div className="relative w-full max-w-2xl p-4">
                <div className="bg-gradient-to-b from-pink-500 to-rose-800 border-4 border-pink-300 rounded-3xl p-8 flex flex-col items-center text-center shadow-[0_0_60px_rgba(244,114,182,0.6)] overflow-hidden relative">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                     <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-black/20 hover:bg-black/40 rounded-full text-white font-bold flex items-center justify-center z-50 border border-white/20">✕</button>
                     
                     <h2 className="text-3xl md:text-5xl font-black font-cartoon text-white uppercase tracking-wider drop-shadow-md mb-2">Piggy Bank</h2>
                     <p className="text-pink-100 text-sm md:text-lg font-bold mb-4">Saves 1% of every bet!</p>
                     
                     {/* Increased size, removed bounce */}
                     <div className={`relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-6 transition-transform duration-300 ${isBreaking ? 'scale-110 shake' : shake ? 'shake' : ''}`}>
                         {customIcon ? (
                             <img src={customIcon} className="w-full h-full object-contain filter drop-shadow-2xl" />
                         ) : (
                             <div className="text-[10rem] md:text-[12rem] filter drop-shadow-2xl">🐷</div>
                         )}
                         {isBreaking && <div className="absolute text-8xl animate-ping">💥</div>}
                         {isFull && !isBreaking && <div className="absolute -top-4 -right-4 bg-red-600 text-white font-black text-xs px-3 py-1 rounded-full animate-pulse shadow-lg border-2 border-white">FULL!</div>}
                     </div>
                     
                     <div className="bg-black/40 rounded-2xl p-4 md:p-6 border border-pink-400/50 mb-6 w-full backdrop-blur-sm">
                         <div className="flex justify-between items-end mb-1 px-1">
                             <div className="text-pink-200 text-xs font-bold uppercase tracking-widest">Saved Amount</div>
                             <div className="text-pink-300 text-[10px] font-bold uppercase">Cap: {formatNumber(cap)}</div>
                         </div>
                         <div className="text-4xl md:text-6xl font-mono font-black text-white drop-shadow-md truncate leading-none mb-3">
                             {formatCommaNumber(Math.floor(amount))}
                         </div>
                         
                         {/* Capacity Bar */}
                         <div className="w-full h-4 bg-black/60 rounded-full overflow-hidden shadow-inner border border-white/10">
                             <div 
                                className={`h-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-gradient-to-r from-green-400 to-emerald-500'}`} 
                                style={{ width: `${Math.min(100, (amount / cap) * 100)}%` }}
                             ></div>
                         </div>
                         {isFull && <div className="text-red-300 text-[10px] font-bold mt-1 uppercase animate-pulse">Bank is Full! Break it to save more.</div>}
                     </div>
                     
                     <button 
                        onClick={handleBreakClick}
                        disabled={isBreaking}
                        className={`w-full py-4 font-black text-xl uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(16,185,129,0.6)] active:scale-95 transition-all border-2 border-green-300 flex items-center justify-center gap-2
                            ${diamonds >= breakCost && amount > 0 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:brightness-110 text-white cursor-pointer' 
                                : 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed'}
                        `}
                     >
                         <span>Break Bank</span>
                         <span className="bg-black/30 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                            {breakCost} 💎
                         </span>
                     </button>
                </div>
            </div>
        </div>
    );
};
