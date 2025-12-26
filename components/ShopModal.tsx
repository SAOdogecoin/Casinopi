
import React, { useState, useEffect } from 'react';
import { CustomAssetMap } from '../types';

interface ShopModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBuy: (type: 'COIN' | 'BOOST' | 'DIAMOND' | 'PASS_XP' | 'PACK_CREDIT', amount: number, duration?: number, cost?: number) => void;
    level: number;
    isFreeStashClaimed?: boolean;
    initialTab?: 'COINS' | 'BOOSTS' | 'DIAMONDS';
    customAssets?: CustomAssetMap;
}

export const ShopModal: React.FC<ShopModalProps> = ({ isOpen, onClose, onBuy, level, isFreeStashClaimed, initialTab = 'COINS', customAssets }) => {
    const [activeTab, setActiveTab] = useState<'COINS' | 'BOOSTS' | 'DIAMONDS'>(initialTab);
    const [dynamicPacks, setDynamicPacks] = useState<any[]>([]);

    // Helper to format numbers fully with commas
    const formatFullNumber = (num: number) => {
        return num.toLocaleString('en-US');
    };

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            // Increased to 1 Trillion base per level (1000x previous 1 Billion)
            const BASE_PER_LEVEL = 1000000000000; 
            
            setDynamicPacks([
                { 
                    amount: level * BASE_PER_LEVEL * 1, 
                    price: "₱ 49", 
                    color: "bg-gradient-to-b from-cyan-600 to-cyan-800",
                    label: "Pile",
                },
                { 
                    amount: level * BASE_PER_LEVEL * 2.5, 
                    price: "₱ 99", 
                    color: "bg-gradient-to-b from-green-600 to-green-800",
                    label: "Double",
                },
                { 
                    amount: level * BASE_PER_LEVEL * 5, 
                    price: "₱ 199", 
                    color: "bg-gradient-to-b from-emerald-600 to-emerald-800",
                    label: "Big Bag",
                },
                { 
                    amount: level * BASE_PER_LEVEL * 10, 
                    price: "₱ 499", 
                    color: "bg-gradient-to-b from-purple-600 to-purple-800",
                    label: "Roller",
                },
                { 
                    amount: level * BASE_PER_LEVEL * 50, 
                    price: "₱ 2,490", 
                    color: "bg-gradient-to-b from-yellow-600 to-yellow-800",
                    label: "Jackpot",
                },
            ]);
        }
    }, [isOpen, level, isFreeStashClaimed, initialTab]);

    if (!isOpen) return null;

    // Use Custom Icons if available - HUGE (3x bigger/fill container)
    const getIcon = (key: string, fallback: string) => {
        if (customAssets?.global?.[key]) {
            return (
                <div className="w-full h-32 md:h-48 flex items-center justify-center p-2">
                    <img src={customAssets.global[key]} alt={key} className="w-full h-full object-contain drop-shadow-md hover:scale-110 transition-transform duration-500" />
                </div>
            );
        }
        return <div className="text-6xl md:text-8xl drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-500 leading-none py-2">{fallback}</div>;
    };

    // Removed 1 Pack Credit option
    const itemsPacks = [
        // Pack Credits - Use BOX icon
        { label: "10 Pack Credits", type: 'PACK_CREDIT', val: 10, duration: 0, cost: 45, priceLabel: "45 💎", color: "bg-gradient-to-b from-orange-700 to-red-900", iconKey: 'BOX', fallback: '📦' },
        { label: "100 Pack Credits", type: 'PACK_CREDIT', val: 100, duration: 0, cost: 400, priceLabel: "400 💎", color: "bg-gradient-to-b from-orange-800 to-red-950", iconKey: 'BOX', fallback: '📦' },
        
        // Existing Boosts
        { label: "2x Player XP (30m)", type: 'BOOST', val: 2, duration: 1800000, cost: 200, priceLabel: "200 💎", color: "bg-gradient-to-b from-fuchsia-700 to-fuchsia-900", iconKey: 'BOOST', fallback: '🚀' },
        { label: "2x Player XP (12H)", type: 'BOOST', val: 2, duration: 43200000, cost: 500, priceLabel: "500 💎", color: "bg-gradient-to-b from-fuchsia-800 to-purple-950", iconKey: 'BOOST', fallback: '🚀' },
        { label: "2x Mission XP (30m)", type: 'PASS_XP', val: 2, duration: 1800000, cost: 300, priceLabel: "300 💎", color: "bg-gradient-to-b from-indigo-600 to-indigo-900", iconKey: 'BOOST', fallback: '📜' },
    ];

    const diamondPacks = [
        { amount: 50, price: "₱ 49", color: "bg-gradient-to-b from-cyan-500 to-cyan-700" },
        { amount: 150, price: "₱ 99", color: "bg-gradient-to-b from-cyan-600 to-blue-800" },
        { amount: 500, price: "₱ 249", color: "bg-gradient-to-b from-blue-600 to-indigo-800" },
        { amount: 1500, price: "₱ 499", color: "bg-gradient-to-b from-indigo-600 to-purple-800" },
        { amount: 5000, price: "₱ 1,250", color: "bg-gradient-to-b from-purple-600 to-fuchsia-800" },
    ];

    const handleBuy = (type: any, val: number, duration?: number, cost?: number) => {
        onBuy(type, val, duration, cost);
    };

    const TabButton = ({ tab, label, icon }: { tab: 'COINS' | 'BOOSTS' | 'DIAMONDS', label: string, icon?: string }) => (
        <button 
            onClick={() => setActiveTab(tab)} 
            className={`
                px-6 py-2 rounded-full font-bold uppercase tracking-wider transition-all text-xs md:text-sm flex items-center gap-2
                ${activeTab === tab 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 scale-105' 
                    : 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600'}
            `}
        >
            {icon && <span>{icon}</span>}
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 top-[35px] md:top-[64px] z-[90] flex flex-col bg-black/95 animate-pop-in">
            <div className="bg-gray-900 w-full h-full flex flex-col shadow-2xl">
                
                {/* Header with Centered Tabs */}
                <div className="bg-gray-800 p-3 md:p-4 flex items-center justify-between shrink-0 z-10 shadow-md border-b border-white/10 gap-4 relative">
                    
                    <div className="hidden md:block text-lg md:text-2xl font-display font-bold text-white whitespace-nowrap w-1/4">Store</div>
                    
                    {/* Centered Tabs */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
                        <TabButton tab="COINS" label="Coins" icon="🪙" />
                        <TabButton tab="DIAMONDS" label="Gems" icon="💎" />
                        <TabButton tab="BOOSTS" label="Items" icon="🎒" />
                    </div>
                    
                    {/* Right Side Actions */}
                    <div className="flex items-center gap-4 shrink-0 ml-auto">
                         <div className="flex items-center bg-black/40 rounded-full pl-3 pr-1 py-1 border border-gold-500/30">
                             <span className="text-xl mr-2">🪙</span>
                             <div className="flex flex-col leading-none mr-3">
                                 <span className="text-[8px] text-gray-400 uppercase font-bold">Free</span>
                                 <span className="text-white font-bold">300,000</span>
                             </div>
                             <button 
                                onClick={() => !isFreeStashClaimed && handleBuy('COIN', 300000, 0, 0)}
                                disabled={isFreeStashClaimed}
                                className={`px-4 py-1.5 rounded-full font-black uppercase text-[10px] transition-all ${isFreeStashClaimed ? 'bg-gray-600 text-gray-400' : 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_10px_rgba(21,128,61,0.6)] animate-pulse'}`}
                             >
                                 {isFreeStashClaimed ? 'Claimed' : 'Claim'}
                             </button>
                         </div>

                         <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition">✕</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-900 pb-20 md:pb-8">
                    {/* Card Container */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {activeTab === 'COINS' ? dynamicPacks.map((pack, i) => (
                            <button 
                                key={i}
                                onClick={() => handleBuy('COIN', pack.amount, 0, pack.cost)}
                                disabled={pack.disabled}
                                className={`aspect-[3/4] relative group overflow-hidden rounded-2xl p-3 flex flex-col items-center justify-between ${pack.disabled ? 'bg-gray-700 grayscale opacity-50 cursor-not-allowed' : pack.color} hover:brightness-110 transition-all shadow-2xl border-2 border-white/10 hover:scale-105 active:scale-95`}
                            >
                                <div className="w-full flex justify-center">
                                    <div className="text-sm md:text-xl font-black uppercase bg-black/40 px-4 py-1 rounded-full text-white whitespace-nowrap border border-white/20 shadow-lg tracking-wide">{pack.label}</div>
                                </div>
                                
                                {getIcon('COIN', '🪙')}
                                
                                <div className="w-full text-center flex flex-col gap-1">
                                    <div className="text-xl md:text-3xl font-black text-white drop-shadow-md font-display leading-none break-all">
                                        {formatFullNumber(pack.amount)}
                                    </div>
                                    <div className={`w-full py-2 rounded-lg text-lg md:text-2xl font-black text-white uppercase whitespace-nowrap border border-white/10 transition-colors shadow-lg ${pack.disabled ? 'bg-gray-600' : 'bg-green-600 group-hover:bg-green-500 border-green-400'}`}>
                                        {pack.disabled ? 'CLAIMED' : pack.price}
                                    </div>
                                </div>
                            </button>
                        )) : activeTab === 'DIAMONDS' ? diamondPacks.map((pack, i) => (
                            <button 
                                key={i}
                                onClick={() => handleBuy('DIAMOND', pack.amount)}
                                className={`aspect-[3/4] relative group overflow-hidden rounded-2xl p-3 flex flex-col items-center justify-between ${pack.color} hover:brightness-110 transition-all shadow-2xl border-2 border-white/10 hover:scale-105 active:scale-95`}
                            >
                                <div className="w-full flex justify-center opacity-0">
                                     <span className="text-sm">.</span>
                                </div>
                                {getIcon('GEM', '💎')}
                                
                                <div className="w-full text-center flex flex-col gap-1">
                                    <div className="text-xl md:text-3xl font-black text-white drop-shadow-md font-display leading-none">
                                        {formatFullNumber(pack.amount)}
                                    </div>
                                    <div className="w-full py-2 bg-cyan-600 rounded-lg text-lg md:text-2xl font-black text-white uppercase whitespace-nowrap border border-cyan-400 group-hover:bg-cyan-500 transition-colors shadow-lg">
                                        {pack.price}
                                    </div>
                                </div>
                            </button>
                        )) : itemsPacks.map((pack, i) => (
                            <button 
                                key={i}
                                onClick={() => handleBuy(pack.type as any, pack.val, pack.duration, pack.cost)}
                                className={`aspect-[3/4] relative group overflow-hidden rounded-2xl p-3 flex flex-col items-center justify-between ${pack.color} hover:brightness-110 transition-all shadow-2xl border-2 border-white/10 hover:scale-105 active:scale-95`}
                            >
                                <div className="w-full flex justify-center">
                                     <div className="text-xs md:text-base font-black uppercase bg-black/40 px-3 py-1 rounded-full text-white whitespace-nowrap border border-white/20 tracking-wider">ITEM</div>
                                </div>

                                {getIcon(pack.iconKey, pack.fallback)}
                                
                                <div className="w-full text-center flex flex-col gap-2">
                                    <div className="text-sm md:text-lg font-black text-white drop-shadow-md font-display leading-tight break-words w-full px-1">
                                        {pack.label}
                                    </div>
                                    <div className="w-full py-2 bg-indigo-600 rounded-lg text-lg md:text-xl font-black text-white uppercase whitespace-nowrap border border-indigo-400 group-hover:bg-indigo-500 transition-colors shadow-lg">
                                        {pack.priceLabel}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
