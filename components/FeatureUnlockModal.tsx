
import React from 'react';

interface FeatureUnlockModalProps {
    isOpen: boolean;
    featureName: string;
    icon: string;
    description: string;
    onOpenFeature: () => void;
    onClose: () => void;
}

export const FeatureUnlockModal: React.FC<FeatureUnlockModalProps> = ({ isOpen, featureName, icon, description, onOpenFeature, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-lg animate-pop-in">
            {/* Removed Close Button */}

            <div className="relative w-full max-w-md p-6">
                {/* Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full blur-[100px] opacity-40 animate-pulse"></div>

                <div className="relative bg-gradient-to-b from-indigo-900 to-purple-900 border-4 border-indigo-400 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl overflow-hidden">
                    
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                    
                    <div className="absolute -top-20 left-0 right-0 h-40 bg-white/10 blur-3xl"></div>

                    <h2 className="text-3xl md:text-5xl font-black font-display text-white uppercase tracking-widest mb-2 drop-shadow-lg animate-bounce">
                        UNLOCKED!
                    </h2>
                    
                    <div className="my-8 relative">
                        <div className="text-9xl drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] scale-125 animate-pulse">{icon}</div>
                        <div className="absolute inset-0 bg-white/20 blur-2xl -z-10 rounded-full"></div>
                    </div>

                    <h3 className="text-2xl font-black text-indigo-200 uppercase tracking-wide mb-2">{featureName}</h3>
                    <p className="text-white text-base font-bold mb-8">{description}</p>

                    <div className="flex flex-col gap-3 w-full">
                        <button 
                            onClick={onOpenFeature}
                            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-xl uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(34,197,94,0.6)] hover:scale-105 active:scale-95 transition-transform border-2 border-green-300 animate-pulse"
                        >
                            GO TO {featureName}
                        </button>
                        <button 
                            onClick={onClose}
                            className="w-full py-3 bg-transparent text-indigo-300 font-bold uppercase tracking-widest rounded-full hover:bg-white/5 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
