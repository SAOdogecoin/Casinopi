
import React, { useState, useRef } from 'react';
import { GameConfig, SymbolType, CustomAssetMap } from '../types';
import { GAMES_CONFIG, GET_SYMBOLS } from '../constants';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isMuted: boolean;
    onToggleMute: () => void;
    disableLevelUp: boolean;
    onToggleLevelUp: () => void;
    customAssets: CustomAssetMap;
    onUploadAsset: (scope: string, key: string, file: File | null) => void;
    onResetAssets: (gameId: string) => void;
    onImportAssets: (assets: CustomAssetMap) => void;
    onUpdateAssetValue?: (scope: string, key: string, value: string) => void;
}

// Utility to resize images
const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<File> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, { type: file.type }));
                        } else {
                            resolve(file); 
                        }
                    }, file.type, 0.9);
                } else {
                    resolve(file);
                }
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    isMuted,
    onToggleMute,
    disableLevelUp,
    onToggleLevelUp,
    customAssets,
    onUploadAsset,
    onResetAssets,
    onImportAssets,
    onUpdateAssetValue
}) => {
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'GLOBAL' | 'GAME'>('GENERAL');
    const [selectedGameId, setSelectedGameId] = useState<string>(GAMES_CONFIG[0].id);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const importInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const selectedGame = GAMES_CONFIG.find(g => g.id === selectedGameId) || GAMES_CONFIG[0];
    const defaultSymbols = GET_SYMBOLS(selectedGame.theme);

    const triggerInput = (id: string) => {
        fileInputRefs.current[id]?.click();
    };

    const handleFileChange = async (scope: string, key: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsProcessing(true);
            const originalFile = e.target.files[0];
            
            if (key === 'WIN_SOUND') {
                onUploadAsset(scope, key, originalFile);
                setIsProcessing(false);
                return;
            }

            // Optimization for Game Background & Reel Background
            let maxWidth = 1920;
            let maxHeight = 1080;
            
            if (scope === selectedGameId && key !== 'thumbnail' && key !== 'gameBackground' && key !== 'background' && key !== 'reelBackground') {
                maxWidth = 256;
                maxHeight = 256;
            } else if (scope === 'global' && key !== 'lobbyBackground') {
                if (key.startsWith('WIN_')) {
                    maxWidth = 800; 
                    maxHeight = 400;
                } else {
                    maxWidth = 256;
                    maxHeight = 256;
                }
            }

            try {
                const resizedFile = await resizeImage(originalFile, maxWidth, maxHeight);
                onUploadAsset(scope, key, resizedFile);
            } catch (err) {
                console.error("Resize failed", err);
                onUploadAsset(scope, key, originalFile);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (onUpdateAssetValue) {
            onUpdateAssetValue(selectedGameId, 'reelBackgroundMode', e.target.value);
        }
    };

    // ... (Export/Import logic same) ...
    const handleExport = () => {
        const json = JSON.stringify(customAssets);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jackpot-world-theme.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target?.result as string);
                    onImportAssets(json);
                } catch (err) {
                    alert('Invalid configuration file');
                }
            };
            reader.readAsText(file);
        }
    };

    const GLOBAL_UI_ITEMS = [
        { key: 'COIN', label: 'Coin Icon', default: '🪙' },
        { key: 'GEM', label: 'Gem Icon', default: '💎' },
        { key: 'PIGGY', label: 'Piggy Bank', default: '🐷' },
        { key: 'TIME_BONUS', label: 'Free Coins', default: '🎁' },
        { key: 'QUEST', label: 'Quest Icon', default: '🗺️' },
        { key: 'QUEST_DICE', label: 'Dice Quest Icon', default: '🎲' },
        { key: 'QUEST_WILD', label: 'Wild Quest Icon', default: '🗿' },
        { key: 'QUEST_WILD_GEM', label: 'Hidden Gem', default: '💠' },
        { key: 'DICE_PLAYER_ICON', label: 'Dice Player', default: '🤠' },
        { key: 'MISSIONS', label: 'Missions Icon', default: '📜' },
        { key: 'PASS', label: 'Pass Icon', default: '🎫' },
        { key: 'BAG', label: 'Money Bag', default: '💰' },
        { key: 'BOX', label: 'Package Box', default: '📦' },
        { key: 'CARDS', label: 'Cards Icon', default: '🃏' },
        { key: 'VIP', label: 'High Roll Icon', default: '👑' },
        { key: 'BOOST', label: 'Boost Icon', default: '🚀' },
        { key: 'XP_ICON', label: 'XP Icon', default: '⚡' },
    ];

    const WIN_TEXT_ITEMS = [
        { key: 'WIN_BIG', label: 'Big/Great Win', default: 'BIG WIN' },
        { key: 'WIN_EPIC', label: 'Epic Win', default: 'EPIC WIN' },
        { key: 'WIN_MEGA', label: 'Mega Win', default: 'MEGA WIN' },
        { key: 'WIN_ULTIMATE', label: 'Ultimate Win', default: 'ULTIMATE' },
    ];

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-md animate-pop-in p-4">
            <div className="bg-gray-900 w-full max-w-5xl h-[90vh] md:h-[85vh] rounded-3xl border-2 border-purple-500/30 flex flex-col overflow-hidden shadow-2xl relative">
                
                {isProcessing && (
                    <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
                        <div className="text-4xl animate-spin mb-4">⚙️</div>
                        <div className="text-white font-bold">Optimizing Asset...</div>
                    </div>
                )}

                {/* Header */}
                <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-4 flex justify-between items-center border-b border-white/10 shrink-0">
                    <h2 className="text-xl md:text-2xl font-display font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <span>🛠️</span> Asset Manager
                    </h2>
                    <div className="flex gap-2">
                         <button onClick={handleExport} className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded text-xs font-bold uppercase">Export</button>
                         <button onClick={handleImportClick} className="bg-fuchsia-600 hover:bg-fuchsia-500 px-3 py-1.5 rounded text-xs font-bold uppercase">Import</button>
                         <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImportFile} />
                         <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/40 hover:bg-white/10 flex items-center justify-center text-white transition">✕</button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-black/40 p-2 gap-2 shrink-0 overflow-x-auto">
                    <button onClick={() => setActiveTab('GENERAL')} className={`flex-1 py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all min-w-[100px] ${activeTab === 'GENERAL' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}>Settings</button>
                    <button onClick={() => setActiveTab('GLOBAL')} className={`flex-1 py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all min-w-[100px] ${activeTab === 'GLOBAL' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}>Global UI</button>
                    <button onClick={() => setActiveTab('GAME')} className={`flex-1 py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all min-w-[100px] ${activeTab === 'GAME' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}>Game Assets</button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#1a1025] relative">
                    
                    {activeTab === 'GENERAL' && (
                        <div className="flex flex-col gap-4 max-w-xl mx-auto">
                            {/* ... (Previous General Settings) ... */}
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Master Volume</h3>
                                    <p className="text-xs text-gray-400">Toggle game sounds.</p>
                                </div>
                                <button onClick={onToggleMute} className={`w-12 h-6 rounded-full p-1 relative transition-colors ${!isMuted ? 'bg-green-500' : 'bg-gray-600'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${!isMuted ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Level Up Popups</h3>
                                    <p className="text-xs text-gray-400">Show fullscreen notification.</p>
                                </div>
                                <button onClick={onToggleLevelUp} className={`w-12 h-6 rounded-full p-1 relative transition-colors ${!disableLevelUp ? 'bg-green-500' : 'bg-gray-600'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${!disableLevelUp ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                            {/* Sound Upload */}
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-white/5">
                                <h3 className="text-lg font-bold text-white mb-2">Win Celebration Sound</h3>
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl">🔊</div>
                                    <div className="flex-1">
                                        <div className="text-xs text-gray-400 mb-2">Upload custom audio for Big Wins. (MP3/WAV)</div>
                                        <div className="flex gap-2">
                                            <button onClick={() => triggerInput('global_WIN_SOUND')} className="bg-purple-600 text-white px-4 py-2 rounded font-bold text-xs uppercase hover:bg-purple-500">Upload Sound</button>
                                            {customAssets.global?.WIN_SOUND && (
                                                <button onClick={() => onUploadAsset('global', 'WIN_SOUND', null)} className="bg-red-600 text-white px-4 py-2 rounded font-bold text-xs uppercase hover:bg-red-500">Reset</button>
                                            )}
                                        </div>
                                        <input type="file" ref={el => fileInputRefs.current['global_WIN_SOUND'] = el} className="hidden" accept="audio/*" onChange={(e) => handleFileChange('global', 'WIN_SOUND', e)} />
                                    </div>
                                </div>
                            </div>

                            <div className="text-center text-xs text-gray-500 mt-8">Storage used: IndexedDB (Unlimited)</div>
                        </div>
                    )}

                    {activeTab === 'GLOBAL' && (
                        <div className="flex flex-col gap-6">
                            {/* ... (Global Icons same) ... */}
                            <h4 className="text-sm font-bold text-gray-300 uppercase">Global Icons</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                                {GLOBAL_UI_ITEMS.map(item => {
                                    const customSrc = customAssets.global?.[item.key];
                                    return (
                                        <div key={item.key} className="bg-gray-800/50 rounded-xl p-4 flex flex-col items-center gap-3 border border-white/5">
                                            <div className="text-xs font-bold text-gray-400 uppercase">{item.label}</div>
                                            <div onClick={() => triggerInput(`global_${item.key}`)} className="w-16 h-16 bg-black/40 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:border-purple-500 border border-transparent">
                                                {customSrc ? <img src={customSrc} className="w-full h-full object-contain" /> : <span className="text-3xl">{item.default}</span>}
                                            </div>
                                            <input type="file" ref={el => fileInputRefs.current[`global_${item.key}`] = el} className="hidden" accept="image/*" onChange={(e) => handleFileChange('global', item.key, e)} />
                                            <div className="flex gap-2 w-full">
                                                <button onClick={() => triggerInput(`global_${item.key}`)} className="flex-1 bg-purple-700 text-white text-[10px] font-bold py-1.5 rounded uppercase">Upload</button>
                                                {customSrc && <button onClick={() => onUploadAsset('global', item.key, null)} className="bg-red-600 w-6 rounded flex items-center justify-center text-white">✕</button>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <h4 className="text-sm font-bold text-gray-300 uppercase">Win Text Banners</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {WIN_TEXT_ITEMS.map(item => {
                                    const customSrc = customAssets.global?.[item.key];
                                    return (
                                        <div key={item.key} className="bg-gray-800/50 rounded-xl p-4 flex flex-col items-center gap-3 border border-white/5">
                                            <div className="text-xs font-bold text-gray-400 uppercase">{item.label}</div>
                                            <div onClick={() => triggerInput(`global_${item.key}`)} className="w-full h-24 bg-black/40 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:border-purple-500 border border-transparent">
                                                {customSrc ? <img src={customSrc} className="w-full h-full object-contain" /> : <span className="text-2xl font-black text-gray-600">{item.default}</span>}
                                            </div>
                                            <input type="file" ref={el => fileInputRefs.current[`global_${item.key}`] = el} className="hidden" accept="image/*" onChange={(e) => handleFileChange('global', item.key, e)} />
                                            <div className="flex gap-2 w-full">
                                                <button onClick={() => triggerInput(`global_${item.key}`)} className="flex-1 bg-purple-700 text-white text-[10px] font-bold py-1.5 rounded uppercase">Upload</button>
                                                {customSrc && <button onClick={() => onUploadAsset('global', item.key, null)} className="bg-red-600 w-6 rounded flex items-center justify-center text-white">✕</button>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'GAME' && (
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-black/20 p-4 rounded-xl">
                                <div className="flex flex-col w-full md:w-auto">
                                    <label className="text-gray-400 text-xs font-bold uppercase mb-1">Select Game</label>
                                    <select value={selectedGameId} onChange={(e) => setSelectedGameId(e.target.value)} className="bg-gray-800 text-white font-bold p-2 rounded-lg border border-gray-600 outline-none text-sm">
                                        {GAMES_CONFIG.map(game => <option key={game.id} value={game.id}>{game.name}</option>)}
                                    </select>
                                </div>
                                <button onClick={() => onResetAssets(selectedGameId)} className="px-4 py-2 bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-700 rounded-lg text-xs font-bold uppercase">Reset Game Assets</button>
                            </div>

                            {/* Game Backgrounds */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Lobby Thumbnail */}
                                <div className="bg-gray-800/30 p-4 rounded-xl border border-white/5">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-bold text-gray-300 uppercase">Lobby Thumbnail</h4>
                                        <span className="text-[10px] text-gray-500 font-mono">300x400</span>
                                    </div>
                                    <div className="aspect-video w-full bg-black/50 rounded-lg flex items-center justify-center overflow-hidden relative group">
                                        {customAssets[selectedGameId]?.thumbnail ? (
                                            <img src={customAssets[selectedGameId]?.thumbnail} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-gray-600 text-xs">Default Style</span>
                                        )}
                                        <button onClick={() => triggerInput(`thumb_${selectedGameId}`)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold uppercase">Change</button>
                                    </div>
                                    <input type="file" ref={el => fileInputRefs.current[`thumb_${selectedGameId}`] = el} className="hidden" accept="image/*" onChange={(e) => handleFileChange(selectedGameId, 'thumbnail', e)} />
                                    <div className="flex justify-end mt-2 gap-2">
                                        {customAssets[selectedGameId]?.thumbnail && <button onClick={() => onUploadAsset(selectedGameId, 'thumbnail', null)} className="text-red-400 text-xs uppercase font-bold">Remove</button>}
                                        <button onClick={() => triggerInput(`thumb_${selectedGameId}`)} className="text-purple-400 text-xs uppercase font-bold">Upload</button>
                                    </div>
                                </div>

                                {/* Game Background */}
                                <div className="bg-gray-800/30 p-4 rounded-xl border border-white/5">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-bold text-gray-300 uppercase">Game Background</h4>
                                        <span className="text-[10px] text-gray-500 font-mono">1920x1080</span>
                                    </div>
                                    <div className="aspect-video w-full bg-black/50 rounded-lg flex items-center justify-center overflow-hidden relative group">
                                        {customAssets[selectedGameId]?.gameBackground ? (
                                            <img src={customAssets[selectedGameId]?.gameBackground} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full" style={{ background: selectedGame.bgImage }}></div>
                                        )}
                                        <button onClick={() => triggerInput(`gamebg_${selectedGameId}`)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold uppercase">Change</button>
                                    </div>
                                    <input type="file" ref={el => fileInputRefs.current[`gamebg_${selectedGameId}`] = el} className="hidden" accept="image/*" onChange={(e) => handleFileChange(selectedGameId, 'gameBackground', e)} />
                                    <div className="flex justify-end mt-2 gap-2">
                                        {customAssets[selectedGameId]?.gameBackground && <button onClick={() => onUploadAsset(selectedGameId, 'gameBackground', null)} className="text-red-400 text-xs uppercase font-bold">Remove</button>}
                                        <button onClick={() => triggerInput(`gamebg_${selectedGameId}`)} className="text-purple-400 text-xs uppercase font-bold">Upload</button>
                                    </div>
                                </div>
                            </div>

                            {/* Reel Background Section */}
                            <div className="bg-gray-800/30 p-4 rounded-xl border border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-bold text-gray-300 uppercase">Reel Background</h4>
                                    <div className="flex items-center gap-2">
                                        <label className="text-[10px] text-gray-400 uppercase font-bold">Mode:</label>
                                        <select 
                                            value={customAssets[selectedGameId]?.reelBackgroundMode || 'COLUMN'} 
                                            onChange={handleModeChange}
                                            className="bg-black/40 text-white text-[10px] uppercase font-bold border border-white/20 rounded px-2 py-1 outline-none"
                                        >
                                            <option value="COLUMN">Column (Per Reel)</option>
                                            <option value="FULL">Full (One Image)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="aspect-video w-full bg-black/50 rounded-lg flex items-center justify-center overflow-hidden relative group">
                                    {customAssets[selectedGameId]?.reelBackground ? (
                                        <img src={customAssets[selectedGameId]?.reelBackground} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-gray-600 text-xs">Default Dark</span>
                                    )}
                                    <button onClick={() => triggerInput(`reelbg_${selectedGameId}`)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold uppercase">Change</button>
                                </div>
                                <input type="file" ref={el => fileInputRefs.current[`reelbg_${selectedGameId}`] = el} className="hidden" accept="image/*" onChange={(e) => handleFileChange(selectedGameId, 'reelBackground', e)} />
                                <div className="flex justify-end mt-2 gap-2">
                                    {customAssets[selectedGameId]?.reelBackground && <button onClick={() => onUploadAsset(selectedGameId, 'reelBackground', null)} className="text-red-400 text-xs uppercase font-bold">Remove</button>}
                                    <button onClick={() => triggerInput(`reelbg_${selectedGameId}`)} className="text-purple-400 text-xs uppercase font-bold">Upload</button>
                                </div>
                            </div>

                            <h4 className="text-sm font-bold text-gray-300 uppercase mt-2">Reel Symbols</h4>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pb-8">
                                {Object.values(SymbolType).map((symbol) => {
                                    const defaultIcon = defaultSymbols[symbol].icon;
                                    const customIcon = customAssets[selectedGameId]?.[symbol];
                                    return (
                                        <div key={symbol} className="bg-gray-800/50 rounded-lg p-2 flex flex-col items-center gap-2 border border-white/5">
                                            <div className="text-[10px] font-bold text-gray-500 uppercase">{symbol}</div>
                                            <div onClick={() => triggerInput(`${selectedGameId}_${symbol}`)} className="w-12 h-12 bg-black/40 rounded flex items-center justify-center overflow-hidden cursor-pointer relative group">
                                                {customIcon ? <img src={customIcon} className="w-full h-full object-contain" /> : <span className="text-2xl">{defaultIcon}</span>}
                                            </div>
                                            <input type="file" ref={el => fileInputRefs.current[`${selectedGameId}_${symbol}`] = el} className="hidden" accept="image/*" onChange={(e) => handleFileChange(selectedGameId, symbol, e)} />
                                            {customIcon ? (
                                                <button onClick={() => onUploadAsset(selectedGameId, symbol, null)} className="text-red-500 text-[10px] font-bold uppercase">Reset</button>
                                            ) : (
                                                <button onClick={() => triggerInput(`${selectedGameId}_${symbol}`)} className="text-purple-500 text-[10px] font-bold uppercase">Set</button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
