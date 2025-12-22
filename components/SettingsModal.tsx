
import React, { useState, useRef } from 'react';
import { GameConfig, SymbolType } from '../types';
import { GAMES_CONFIG, GET_SYMBOLS } from '../constants';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isMuted: boolean;
    onToggleMute: () => void;
    disableLevelUp: boolean;
    onToggleLevelUp: () => void;
    customAssets: Record<string, Record<string, string>>;
    onUploadAsset: (gameId: string, symbol: SymbolType, file: File) => void;
    onResetAssets: (gameId: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    isMuted,
    onToggleMute,
    disableLevelUp,
    onToggleLevelUp,
    customAssets,
    onUploadAsset,
    onResetAssets
}) => {
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'ASSETS'>('GENERAL');
    const [selectedGameId, setSelectedGameId] = useState<string>(GAMES_CONFIG[0].id);
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    if (!isOpen) return null;

    const selectedGame = GAMES_CONFIG.find(g => g.id === selectedGameId) || GAMES_CONFIG[0];
    const defaultSymbols = GET_SYMBOLS(selectedGame.theme);

    const handleFileChange = (symbol: SymbolType, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onUploadAsset(selectedGameId, symbol, e.target.files[0]);
        }
    };

    const triggerFileInput = (symbol: SymbolType) => {
        if (fileInputRefs.current[symbol]) {
            fileInputRefs.current[symbol]?.click();
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-md animate-pop-in p-4">
            <div className="bg-gray-900 w-full max-w-4xl h-[90vh] md:h-[80vh] rounded-3xl border-2 border-purple-500/30 flex flex-col overflow-hidden shadow-2xl">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-4 md:p-6 flex justify-between items-center border-b border-white/10 shrink-0">
                    <h2 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <span>⚙️</span> Settings
                    </h2>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/40 hover:bg-white/10 flex items-center justify-center text-white transition">✕</button>
                </div>

                {/* Tabs */}
                <div className="flex bg-black/40 p-2 gap-2 shrink-0">
                    <button 
                        onClick={() => setActiveTab('GENERAL')}
                        className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-all ${activeTab === 'GENERAL' ? 'bg-purple-600 text-white shadow-lg' : 'bg-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                    >
                        General
                    </button>
                    <button 
                        onClick={() => setActiveTab('ASSETS')}
                        className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-all ${activeTab === 'ASSETS' ? 'bg-purple-600 text-white shadow-lg' : 'bg-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                    >
                        Reel Icons
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#1a1025] relative">
                    
                    {activeTab === 'GENERAL' && (
                        <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                            <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/5 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <h3 className="text-xl font-bold text-white mb-1">Master Volume</h3>
                                    <p className="text-sm text-gray-400">Toggle game sounds and music.</p>
                                </div>
                                <button 
                                    onClick={onToggleMute}
                                    className={`w-16 h-8 rounded-full p-1 transition-colors relative ${!isMuted ? 'bg-green-500' : 'bg-gray-600'}`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${!isMuted ? 'translate-x-8' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                            <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/5 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <h3 className="text-xl font-bold text-white mb-1">Level Up Popups</h3>
                                    <p className="text-sm text-gray-400">Show fullscreen notification when leveling up.</p>
                                </div>
                                <button 
                                    onClick={onToggleLevelUp}
                                    className={`w-16 h-8 rounded-full p-1 transition-colors relative ${!disableLevelUp ? 'bg-green-500' : 'bg-gray-600'}`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${!disableLevelUp ? 'translate-x-8' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                             <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                                <p className="text-blue-200 text-sm text-center">
                                    Game version: 1.0.0 (Replica) <br/>
                                    Local save enabled.
                                </p>
                             </div>
                        </div>
                    )}

                    {activeTab === 'ASSETS' && (
                        <div className="flex flex-col h-full">
                            <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-black/20 p-4 rounded-2xl">
                                <div className="flex flex-col w-full md:w-auto">
                                    <label className="text-gray-400 text-xs font-bold uppercase mb-2">Select Game to Edit</label>
                                    <select 
                                        value={selectedGameId} 
                                        onChange={(e) => setSelectedGameId(e.target.value)}
                                        className="bg-gray-800 text-white font-bold p-3 rounded-xl border border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none"
                                    >
                                        {GAMES_CONFIG.map(game => (
                                            <option key={game.id} value={game.id}>{game.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <button 
                                    onClick={() => onResetAssets(selectedGameId)}
                                    className="px-6 py-2 bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-700 rounded-lg text-sm font-bold uppercase transition-colors"
                                >
                                    Reset {selectedGame.name}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-12">
                                {Object.values(SymbolType).map((symbol) => {
                                    const defaultIcon = defaultSymbols[symbol].icon;
                                    const customIcon = customAssets[selectedGameId]?.[symbol];

                                    return (
                                        <div key={symbol} className="bg-gray-800/50 rounded-xl p-4 flex flex-col items-center gap-3 border border-white/5 hover:border-purple-500/50 transition-colors">
                                            <div className="text-xs font-bold text-gray-500 uppercase">{symbol}</div>
                                            
                                            <div className="w-20 h-20 bg-black/40 rounded-lg flex items-center justify-center overflow-hidden relative group">
                                                {customIcon ? (
                                                    <img src={customIcon} alt={symbol} className="w-full h-full object-contain p-1" />
                                                ) : (
                                                    <span className="text-5xl">{defaultIcon}</span>
                                                )}
                                                
                                                {/* Overlay Edit Button */}
                                                <button 
                                                    onClick={() => triggerFileInput(symbol)}
                                                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <span className="text-white text-xs font-bold uppercase border border-white px-2 py-1 rounded">Upload</span>
                                                </button>
                                            </div>

                                            <input 
                                                type="file" 
                                                accept="image/png, image/jpeg" 
                                                className="hidden"
                                                ref={(el) => { fileInputRefs.current[symbol] = el; }}
                                                onChange={(e) => handleFileChange(symbol, e)}
                                            />

                                            <div className="flex gap-2 w-full">
                                                <button 
                                                    onClick={() => triggerFileInput(symbol)}
                                                    className="flex-1 bg-purple-700 hover:bg-purple-600 text-white text-[10px] font-bold py-2 rounded uppercase"
                                                >
                                                    Upload
                                                </button>
                                                {customIcon && (
                                                    <button 
                                                        onClick={() => onUploadAsset(selectedGameId, symbol, null as any)} // Passing null removes it
                                                        className="bg-red-600 hover:bg-red-500 text-white w-8 rounded flex items-center justify-center"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
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
