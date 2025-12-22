
import React, { useEffect, useRef } from 'react';

interface FreeSpinsWonPopupProps {
    isOpen: boolean;
    count: number;
    onComplete: () => void;
}

export const FreeSpinsWonPopup: React.FC<FreeSpinsWonPopupProps> = ({ isOpen, count, onComplete }) => {
    // Fixed: Explicitly allow null in the generic type to make .current mutable
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                onComplete();
            }, 2000); // 2 Seconds
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isOpen, onComplete]);

    const handleStartNow = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        onComplete();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-pop-in">
            <div className="relative bg-gradient-to-b from-yellow-300 to-orange-500 p-1.5 rounded-3xl shadow-[0_0_60px_rgba(255,165,0,0.8)] transform scale-110">
                 <div className="bg-gradient-to-b from-yellow-500 to-orange-600 border-4 border-white/50 rounded-2xl p-10 md:p-16 flex flex-col items-center text-center min-w-[350px] md:min-w-[500px] shadow-inner relative overflow-hidden">
                    
                    {/* Background Rays */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.3)_20deg,transparent_40deg)] animate-[spin_10s_linear_infinite]"></div>

                    <div className="relative z-10 flex flex-col items-center gap-2">
                        
                        {/* Row 1: YOU WON FREE */}
                        <h2 className="text-3xl md:text-5xl font-black font-display text-white uppercase tracking-widest drop-shadow-[0_4px_0_rgba(0,0,0,0.3)] mb-2">
                            YOU WON FREE
                        </h2>

                        {/* Row 2: Amount */}
                        <div className="text-8xl md:text-9xl font-black font-display text-white drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)] stroke-black scale-125 my-4 animate-bounce">
                            {count}
                        </div>

                        {/* Row 3: SPINS */}
                        <div className="text-3xl md:text-5xl font-black font-display text-white uppercase tracking-[0.5em] drop-shadow-[0_4px_0_rgba(0,0,0,0.3)]">
                            SPINS
                        </div>

                        <button 
                            onClick={handleStartNow}
                            className="mt-8 px-10 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-black uppercase tracking-widest rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform border-4 border-red-400 z-20"
                        >
                            Start Now
                        </button>
                    </div>
                 </div>
            </div>
        </div>
    );
};
