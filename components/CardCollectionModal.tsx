
import React, { useState, useEffect } from 'react';
import { Deck, Card, CardRarity, CustomAssetMap } from '../types';
import { formatNumber, PACK_COSTS, formatCommaNumber, GET_SYMBOLS, GAMES_CONFIG } from '../constants';
import { audioService } from '../services/audioService';

interface CardCollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenShop: (tab?: 'COINS' | 'BOOSTS' | 'DIAMONDS') => void;
    decks: Deck[];
    onClaimDeckReward: (deckId: string, reward: number) => void;
    onBuyPack: (packId: string, drawCount: number) => Card[];
    onBuyCredits: (cost: number, credits: number) => void;
    onBuyCreditsWithTokens?: (amount: number, cost: number) => void;
    diamonds: number;
    playerLevel: number;
    tokens: number; 
    packCredits: number;
    grandPrize?: number;
    getDeckReward?: (deckId: string) => number;
    customAssets?: CustomAssetMap;
}

export const CardCollectionModal: React.FC<CardCollectionModalProps> = ({
    isOpen,
    onClose,
    onOpenShop,
    decks,
    onClaimDeckReward,
    onBuyPack,
    onBuyCredits,
    onBuyCreditsWithTokens,
    diamonds,
    playerLevel,
    tokens,
    packCredits,
    grandPrize = 0,
    getDeckReward = (deckId: string) => 0,
    customAssets
}) => {
    const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'ALBUM' | 'PACKS'>('ALBUM');
    
    // Pack Opening State
    const [isOpeningPack, setIsOpeningPack] = useState(false);
    const [lastPackId, setLastPackId] = useState<string | null>(null);
    const [openedCards, setOpenedCards] = useState<Card[]>([]);
    const [packStage, setPackStage] = useState<'SHAKING' | 'BURST' | 'REVEAL' | 'DONE'>('DONE');
    const [skipAnimation, setSkipAnimation] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setSelectedDeckId(null);
            setIsOpeningPack(false);
            setPackStage('DONE');
        }
    }, [isOpen]);

    const closePack = () => {
        setIsOpeningPack(false);
        setPackStage('DONE');
        setOpenedCards([]);
        setLastPackId(null);
    };

    // Styles for Locked/Unlocked Cards
    const getCardStyle = (rarity: CardRarity, isLocked: boolean) => {
        if (isLocked) {
            switch(rarity) {
                case 'LEGENDARY': return 'border-yellow-900 bg-[#3a2d10]/80 text-yellow-800 shadow-none grayscale-[0.5]';
                case 'EPIC': return 'border-purple-900 bg-[#2d103a]/80 text-purple-800 shadow-none grayscale-[0.5]';
                case 'RARE': return 'border-blue-900 bg-[#101d3a]/80 text-blue-800 shadow-none grayscale-[0.5]';
                default: return 'border-gray-800 bg-[#1a1a1a]/80 text-gray-700 shadow-none grayscale-[0.8]';
            }
        }
        switch(rarity) {
            case 'LEGENDARY': return 'border-yellow-400 bg-yellow-950/90 text-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.8)] border-4';
            case 'EPIC': return 'border-purple-500 bg-purple-950/90 text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.6)]';
            case 'RARE': return 'border-blue-400 bg-blue-950/90 text-blue-300 shadow-[0_0_30px_rgba(59,130,246,0.6)]';
            default: return 'border-gray-500 bg-gray-900/90 text-gray-400 shadow-none';
        }
    };

    const rarityOrder: Record<CardRarity, number> = {
        'COMMON': 0, 'RARE': 1, 'EPIC': 2, 'LEGENDARY': 3
    };

    const handleDraw = (packId: string, count: number) => {
        const cards = onBuyPack(packId, count);
        if (cards.length > 0) {
            // Sort by Rarity (Common -> Legendary)
            cards.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
            
            setLastPackId(packId);
            setOpenedCards(cards);
            setIsOpeningPack(true);
            
            if (skipAnimation) {
                setPackStage('REVEAL');
                audioService.playWinBig();
            } else {
                setPackStage('SHAKING');
                audioService.playClick();

                setTimeout(() => {
                    setPackStage('BURST');
                    audioService.playWinSmall();
                    setTimeout(() => {
                        setPackStage('REVEAL');
                        audioService.playWinBig();
                    }, 600);
                }, 1000);
            }
        } else {
             // If draw failed (no credits), revert UI to avoid dark screen
             setIsOpeningPack(false);
        }
    };

    const packOptions = [
        { id: 'basic', name: 'Basic Pack', info: PACK_COSTS.BASIC, color: 'from-gray-700 to-gray-900', icon: '📦' },
        { id: 'super', name: 'Super Pack', info: PACK_COSTS.SUPER, color: 'from-blue-700 to-blue-900', icon: '💼' },
        { id: 'mega', name: 'Mega Pack', info: PACK_COSTS.MEGA, color: 'from-purple-700 to-purple-900', icon: '🦄' },
        { id: 'ultra', name: 'Ultra Pack', info: PACK_COSTS.ULTRA, color: 'from-yellow-600 to-yellow-800', icon: '👑' }
    ];

    // Updated Token Exchange Rates: 1 Pack Credit = 50 Tokens
    const tokenExchanges = [
        { credits: 1, cost: 50 },
        { credits: 10, cost: 500 },
        { credits: 100, cost: 5000 }
    ];

    const getIcon = (key: string, fallback: string) => {
        if (customAssets?.global?.[key]) {
            return <img src={customAssets.global[key]} alt={key} className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-md mb-2" />;
        }
        return <div className="text-7xl md:text-8xl animate-bounce drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] z-10">{fallback}</div>;
    };

    // Helper to render the specific game symbol for the card
    const renderCardSymbol = (card: Card) => {
        const deck = decks.find(d => card.id.startsWith(d.gameId));
        if (!deck) return <div className="text-6xl">❓</div>;

        const symbolConfig = GET_SYMBOLS(deck.theme)[card.symbolType];
        const customIcon = customAssets?.[deck.gameId]?.[card.symbolType];

        if (customIcon) {
            return <img src={customIcon} className="w-full h-full object-cover scale-110" />;
        }
        
        return (
            <div className={`text-[5rem] md:text-[6rem] ${symbolConfig.style}`}>
                {symbolConfig.icon}
            </div>
        );
    };

    // Helper to get deck banner
    const getDeckBanner = (deck: Deck) => {
        // Try Custom Asset Thumbnail
        const customThumb = customAssets?.[deck.gameId]?.thumbnail;
        if (customThumb) {
            return <img src={customThumb} alt={deck.gameName} className="w-full h-full object-cover" />;
        }
        
        // Try Game Config Background or Thumbnail logic fallback
        // Since we don't have access to the exact logic of Lobby here without importing, we will use a fallback or the icon logic
        // But we want the full banner. Let's try to simulate the lobby look.
        
        const gameConfig = GAMES_CONFIG.find(g => g.id === deck.gameId);
        
        return (
            <div className={`w-full h-full bg-gradient-to-b ${gameConfig ? gameConfig.color : 'from-gray-800 to-black'} flex items-center justify-center`}>
                 <div className="text-6xl md:text-8xl opacity-80 drop-shadow-2xl">
                    {deck.theme === 'NEON' ? '🎰' : deck.theme === 'EGYPT' ? '🦂' : deck.theme === 'DRAGON' ? '🐉' : '🃏'}
                 </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 top-[35px] md:top-[64px] z-[90] bg-black/95 animate-pop-in flex flex-col">
            {/* Pack Opening Overlay */}
            {isOpeningPack && (
                <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center">
                    {packStage === 'SHAKING' && (
                        getIcon('BOX', '📦')
                    )}
                    {packStage === 'BURST' && (
                        <div className="text-9xl scale-150 transition-transform duration-300 opacity-0 pointer-events-none">💥</div>
                    )}
                    {packStage === 'REVEAL' && (
                        <div className="w-full h-full flex flex-col items-center justify-center animate-pop-in relative py-8">
                             <div className="flex-1 w-full max-w-6xl px-4 overflow-y-auto grid grid-cols-3 md:grid-cols-5 gap-4 content-center justify-items-center">
                                 {openedCards.map((card, i) => (
                                     <div 
                                        key={i} 
                                        className={`
                                            relative aspect-[2/3] w-full max-w-[180px] rounded-lg border-2 ${getCardStyle(card.rarity, false)} 
                                            p-0 flex flex-col items-center justify-center animate-pop-in mt-6 overflow-hidden
                                            ${card.rarity === 'LEGENDARY' ? 'animate-pulse duration-700' : ''}
                                        `} 
                                        style={{ animationDelay: `${i * 50}ms` }}
                                     >
                                         <div className={`absolute top-0 left-0 right-0 z-20 flex justify-center`}>
                                             <div className={`px-3 py-0.5 rounded-b-lg text-xs font-black uppercase tracking-widest border-b border-x shadow-lg whitespace-nowrap ${card.rarity === 'LEGENDARY' ? 'bg-yellow-500 text-black border-yellow-200' : card.rarity === 'EPIC' ? 'bg-purple-600 text-white border-purple-400' : card.rarity === 'RARE' ? 'bg-blue-600 text-white border-blue-400' : 'bg-gray-600 text-white border-gray-400'}`}>
                                                 {card.rarity}
                                             </div>
                                         </div>

                                         {card.isNew && <div className="absolute top-8 right-1 bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded animate-pulse z-20 border border-white/20 shadow-lg">NEW</div>}
                                         
                                         {/* Full Card Image/Icon */}
                                         <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                             {renderCardSymbol(card)}
                                         </div>
                                         
                                         {/* Legendary Holographic Shine */}
                                         {card.rarity === 'LEGENDARY' && (
                                             <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-50 animate-shine pointer-events-none z-10"></div>
                                         )}

                                         <div className="absolute bottom-0 w-full bg-black/60 backdrop-blur-sm p-1 z-20 border-t border-white/10">
                                             <div className="text-[10px] md:text-sm font-black text-center text-white truncate">{card.name}</div>
                                         </div>

                                         {card.isDuplicate && (
                                             <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/40">
                                                 <div className="text-yellow-400 text-xs font-black uppercase tracking-widest bg-black/90 px-3 py-1 rounded border border-yellow-500/30 transform -rotate-12 shadow-xl">Duplicate</div>
                                             </div>
                                         )}
                                     </div>
                                 ))}
                             </div>
                             <div className="shrink-0 mt-8 flex flex-col md:flex-row gap-4 z-50 items-center bg-black/60 p-4 rounded-2xl border border-white/10">
                                 <button onClick={closePack} className="px-8 py-3 bg-gray-700 rounded-full text-white font-bold uppercase hover:bg-gray-600 border border-gray-500">Close</button>
                                 
                                 {lastPackId && (
                                     <div className="flex gap-2 items-center">
                                        <button 
                                            onClick={() => {
                                                setPackStage('DONE');
                                                setOpenedCards([]);
                                                setTimeout(() => handleDraw(lastPackId!, 1), 100);
                                            }} 
                                            className="px-6 py-3 bg-green-600 rounded-full text-white font-bold uppercase hover:bg-green-500 shadow-lg border-2 border-green-400 active:scale-95 transition-transform"
                                        >
                                            Draw 1x
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setPackStage('DONE');
                                                setOpenedCards([]);
                                                setTimeout(() => handleDraw(lastPackId!, 10), 100);
                                            }} 
                                            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full text-white font-bold uppercase hover:brightness-110 shadow-lg relative overflow-hidden border-2 border-yellow-400 active:scale-95 transition-transform"
                                        >
                                            Draw 10x
                                            <span className="absolute top-0 right-0 bg-red-600 text-[8px] px-1 font-black">-10%</span>
                                        </button>

                                        {/* Skip Animation Toggle Inside Result */}
                                        <label className="flex items-center gap-2 bg-black/50 px-3 py-2 rounded-lg border border-white/20 cursor-pointer ml-2 hover:bg-black/70 transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={skipAnimation} 
                                                onChange={(e) => setSkipAnimation(e.target.checked)}
                                                className="w-4 h-4 text-yellow-500 rounded focus:ring-0 bg-gray-800 border-gray-600" 
                                            />
                                            <span className="text-[10px] font-bold text-gray-300 uppercase leading-none">Skip<br/>Anim</span>
                                        </label>
                                     </div>
                                 )}
                             </div>
                        </div>
                    )}
                </div>
            )}

            <div className="w-full h-full bg-gradient-to-b from-[#2e1065] to-[#0f0518] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#4c1d95] to-[#3b0764] p-3 md:p-4 flex justify-between items-center shrink-0 z-10 shadow-lg border-b border-purple-500/30 relative">
                    <div className="flex items-center gap-4 md:gap-8 flex-1">
                        <div className="flex items-center gap-2">
                            {selectedDeckId && (
                                <button onClick={() => setSelectedDeckId(null)} className="text-white/80 hover:text-white text-xl md:text-2xl font-bold px-2">⬅</button>
                            )}
                            <h2 className="text-xl md:text-2xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-fuchsia-200 uppercase tracking-widest">
                                {selectedDeckId ? decks.find(d => d.gameId === selectedDeckId)?.gameName : 'Card Album'}
                            </h2>
                        </div>
                        
                        {!selectedDeckId && (
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center bg-black/30 p-1 rounded-full">
                                <button onClick={() => setActiveTab('ALBUM')} className={`px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ALBUM' ? 'bg-yellow-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>Decks</button>
                                <button onClick={() => setActiveTab('PACKS')} className={`px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'PACKS' ? 'bg-yellow-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>Draw</button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2 mr-8">
                        <div className="bg-black/40 px-3 py-1 rounded-full flex items-center gap-1 border border-purple-500/30">
                            <span className="text-sm">💎</span>
                            <span className="text-sm font-mono font-bold text-white">{formatNumber(diamonds)}</span>
                        </div>
                        <button onClick={() => { onClose(); onOpenShop('BOOSTS'); }} className="bg-black/40 px-3 py-1 rounded-full flex items-center gap-1 border border-orange-500/30 relative group hover:bg-orange-900/30 cursor-pointer transition-colors">
                             <span className="text-sm">📦</span>
                             <span className="text-sm font-mono font-bold text-orange-400">{packCredits}</span>
                             <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[8px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100">Get More</div>
                        </button>
                        <div className="bg-black/40 px-3 py-1 rounded-full flex items-center gap-1 border border-green-500/30">
                            <span className="text-sm">💳</span>
                            <span className="text-sm font-mono font-bold text-green-400">{formatNumber(tokens)}</span>
                        </div>
                    </div>

                    <button onClick={onClose} className="absolute top-1/2 -translate-y-1/2 right-2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition z-50">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-transparent">
                    
                    {/* Deck View */}
                    {!selectedDeckId && activeTab === 'ALBUM' && (
                        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-24">
                             {/* Grand Prize Banner */}
                             <div className="w-full bg-gradient-to-r from-yellow-600 via-gold-500 to-yellow-600 rounded-xl p-1 shadow-[0_0_30px_rgba(250,204,21,0.4)] animate-pulse">
                                 <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                     <div className="flex items-center gap-4">
                                         <div className="text-6xl drop-shadow-lg">👑</div>
                                         <div className="flex flex-col">
                                             <div className="text-gold-200 text-sm font-bold uppercase tracking-widest">Grand Album Reward</div>
                                             <div className="text-3xl md:text-5xl font-black text-white font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{formatCommaNumber(grandPrize)}</div>
                                         </div>
                                     </div>
                                     <div className="bg-black/40 px-6 py-2 rounded-full border border-gold-500/50">
                                         <div className="text-gold-300 text-xs font-bold uppercase">Complete All Decks to Claim</div>
                                     </div>
                                 </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                                 {decks.map(deck => {
                                     const collected = deck.cards.filter(c => c.count > 0).length;
                                     const total = deck.cards.length;
                                     const isComplete = collected === total;
                                     
                                     return (
                                         <button key={deck.gameId} onClick={() => setSelectedDeckId(deck.gameId)} className="flex flex-col items-center group">
                                             <div className={`relative w-full aspect-[3/4] bg-[#1e1b4b] rounded-xl border-4 ${isComplete ? 'border-gold-500 shadow-[0_0_30px_rgba(255,215,0,0.3)]' : 'border-gray-700 group-hover:border-purple-500'} transition-all duration-300 flex flex-col items-center justify-center shadow-2xl overflow-hidden`}>
                                                 
                                                 {/* Full Size Banner Image */}
                                                 <div className="absolute inset-0 z-0 group-hover:scale-110 transition-transform duration-500">
                                                     {getDeckBanner(deck)}
                                                 </div>
                                                 
                                                 {/* Dark overlay for text readability */}
                                                 <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors z-10"></div>

                                                 {isComplete && <div className="absolute top-2 right-2 z-20 text-3xl drop-shadow-md">✅</div>}
                                                 
                                                 {/* Reward Tag */}
                                                 <div className="absolute bottom-2 z-20 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20 shadow-lg">
                                                     <div className="text-[10px] text-gray-300 uppercase font-bold text-center">Reward</div>
                                                     <div className="text-gold-400 font-mono font-black text-sm">{formatNumber(getDeckReward(deck.gameId))}</div>
                                                 </div>
                                             </div>
                                             <div className="mt-4 text-center w-full">
                                                 <h3 className="text-white font-black font-display text-xl md:text-2xl tracking-wide drop-shadow-md truncate">{deck.gameName}</h3>
                                                 <div className="text-purple-300 font-black text-lg uppercase tracking-widest">{collected} / {total}</div>
                                             </div>
                                         </button>
                                     );
                                 })}
                             </div>
                        </div>
                    )}

                    {/* Pack Shop View */}
                    {!selectedDeckId && activeTab === 'PACKS' && (
                        <div className="flex flex-col items-center pt-4">
                             
                            {/* Exchange Section */}
                            <div className="w-full max-w-7xl mb-8">
                                <div className="bg-gray-900/60 rounded-2xl p-6 border border-green-500/30 shadow-xl">
                                    <h3 className="text-green-400 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span>💳</span> Exchange Duplicate Tokens
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {tokenExchanges.map((ex, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => onBuyCreditsWithTokens && onBuyCreditsWithTokens(ex.credits, ex.cost)}
                                                disabled={tokens < ex.cost}
                                                className={`
                                                    flex items-center justify-between p-4 rounded-xl border-2 transition-all
                                                    ${tokens >= ex.cost 
                                                        ? 'bg-gradient-to-r from-green-900 to-emerald-900 border-green-500 hover:brightness-110 active:scale-95' 
                                                        : 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed'}
                                                `}
                                            >
                                                <div className="flex flex-col items-start">
                                                    <span className="text-white font-bold">{ex.credits} Pack Credit{ex.credits > 1 ? 's' : ''}</span>
                                                    <span className="text-[10px] text-gray-400 uppercase">Get Item</span>
                                                </div>
                                                <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full">
                                                    <span className="text-green-400 font-bold">{ex.cost}</span>
                                                    <span className="text-xs">💳</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 w-full max-w-7xl">
                                {packOptions.map(pack => {
                                    const singleCost = pack.info.creditCost;
                                    const bulkCost = Math.ceil((singleCost * 10) * 0.9); // 10% off
                                    
                                    const canDrawOne = packCredits >= singleCost;
                                    const canDrawTen = packCredits >= bulkCost;

                                    return (
                                    <div key={pack.id} className={`relative aspect-[2/3] rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl flex flex-col bg-gradient-to-b ${pack.color} group hover:-translate-y-2 transition-transform duration-300`}>
                                        <div className="flex-1 flex flex-col items-center justify-center bg-black/20 relative py-8">
                                            {getIcon('BOX', pack.icon)}
                                        </div>
                                        <div className="p-4 flex flex-col items-center text-center bg-black/40 backdrop-blur-md border-t border-white/10 w-full">
                                            <h3 className="text-xl font-black font-display text-white uppercase mb-1 drop-shadow-md tracking-wide">{pack.name}</h3>
                                            
                                            <div className="flex flex-col gap-2 w-full mt-2">
                                                <button 
                                                    onClick={() => handleDraw(pack.id, 1)}
                                                    disabled={!canDrawOne}
                                                    className={`w-full py-2 rounded-lg font-bold text-white uppercase shadow-md transition-all text-xs md:text-sm ${canDrawOne ? 'bg-green-600 hover:bg-green-500 active:scale-95' : 'bg-gray-600 cursor-not-allowed'}`}
                                                >
                                                    Draw 1x ({singleCost} 📦)
                                                </button>
                                                <button 
                                                    onClick={() => handleDraw(pack.id, 10)}
                                                    disabled={!canDrawTen}
                                                    className={`w-full py-2 rounded-lg font-bold text-white uppercase shadow-md transition-all text-xs md:text-sm relative overflow-hidden ${canDrawTen ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:brightness-110 active:scale-95' : 'bg-gray-600 cursor-not-allowed'}`}
                                                >
                                                    Draw 10x ({bulkCost} 📦)
                                                    {canDrawTen && <div className="absolute top-0 right-0 bg-red-600 text-[8px] px-1 font-black text-white">-10%</div>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                            
                            <div className="mt-12 bg-black/40 p-6 rounded-2xl border border-white/10 text-center max-w-2xl">
                                <h3 className="text-white font-bold uppercase tracking-widest mb-2">Need more Pack Credits?</h3>
                                <button 
                                    onClick={() => { onClose(); onOpenShop('BOOSTS'); }} 
                                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full text-white font-black uppercase shadow-lg hover:scale-105 transition-transform"
                                >
                                    Go to Store
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Single Deck Card View */}
                    {selectedDeckId && (
                        <div className="pb-24 max-w-7xl mx-auto">
                            <div className="flex justify-center mb-6">
                                <div className="bg-gradient-to-r from-gold-500/20 to-yellow-600/20 border border-gold-500/50 rounded-xl p-4 flex items-center gap-4">
                                     <span className="text-4xl">🏆</span>
                                     <div className="flex flex-col">
                                         <div className="text-gold-200 text-xs font-bold uppercase">Deck Completion Reward</div>
                                         <div className="text-2xl font-black text-white font-mono">{formatCommaNumber(getDeckReward(selectedDeckId))}</div>
                                     </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {decks.find(d => d.gameId === selectedDeckId)?.cards.map((card, i) => (
                                    <div key={i} className={`aspect-[2/3] rounded-lg border-2 ${getCardStyle(card.rarity, card.count === 0)} p-0 flex flex-col items-center justify-center relative transition-all overflow-hidden ${card.count === 0 ? '' : 'shadow-lg hover:scale-105'} ${card.rarity === 'LEGENDARY' && card.count > 0 ? 'ring-2 ring-yellow-400' : ''}`}>
                                        
                                        <div className="absolute top-0 inset-x-0 z-20 flex justify-center pt-1">
                                            <span className={`text-[8px] md:text-[10px] font-black uppercase px-2 py-0.5 rounded-full border shadow-sm ${card.rarity === 'LEGENDARY' ? 'bg-yellow-500 text-black border-yellow-200' : card.rarity === 'EPIC' ? 'bg-purple-600 text-white border-purple-400' : card.rarity === 'RARE' ? 'bg-blue-600 text-white border-blue-400' : 'bg-gray-600 text-white border-gray-400'}`}>{card.rarity}</span>
                                        </div>
                                        {card.count > 0 && <span className="absolute top-1 right-1 z-30 text-[8px] font-bold bg-black/80 text-white px-1.5 rounded-full border border-white/20">x{card.count}</span>}
                                        
                                        {/* Full Card Icon */}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            {renderCardSymbol(card)}
                                        </div>
                                        
                                        {/* Legendary Shine */}
                                        {card.rarity === 'LEGENDARY' && card.count > 0 && (
                                             <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-50 animate-shine pointer-events-none z-10"></div>
                                        )}

                                        <div className="absolute bottom-0 w-full bg-black/60 backdrop-blur-sm p-1 z-20 border-t border-white/10">
                                            <div className="text-[10px] font-black text-center text-white truncate">{card.name}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Reward Section */}
                            <div className="mt-8 flex justify-center">
                                {decks.find(d => d.gameId === selectedDeckId)?.isCompleted ? (
                                    decks.find(d => d.gameId === selectedDeckId)?.rewardClaimed ? (
                                        <div className="bg-gray-700 px-8 py-2 rounded-full font-bold text-gray-400 uppercase">Reward Claimed</div>
                                    ) : (
                                        <button onClick={() => onClaimDeckReward(selectedDeckId!, getDeckReward(selectedDeckId))} className="bg-gradient-to-r from-gold-500 to-yellow-600 px-12 py-3 rounded-full font-black text-black uppercase shadow-lg animate-pulse hover:scale-105 transition-transform">Claim Reward</button>
                                    )
                                ) : (
                                    <div className="bg-black/40 px-6 py-2 rounded-full text-gray-400 text-xs font-bold uppercase border border-white/10">Collect all cards to claim reward</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
