
import React, { useEffect, useState } from 'react';
import { audioService } from '../services/audioService';
import { formatCommaNumber } from '../constants';
import { CustomAssetMap } from '../types';

interface WinPopupProps {
    amount: number;
    type: string;
    onComplete: () => void;
    customAssets?: CustomAssetMap;
}

export const WinPopup: React.FC<WinPopupProps> = ({ amount, type, onComplete, customAssets }) => {
    const [displayAmount, setDisplayAmount] = useState(0);
    
    useEffect(() => {
        audioService.playWinCheer();

        let duration = 3000; 
        if (type === 'BIG WIN') duration = 3500;
        else if (type === 'GREAT WIN') duration = 4000;
        else if (type === 'EPIC WIN') duration = 5000;
        else if (type === 'MEGA WIN') duration = 6000;
        else if (type === 'ULTIMATE WIN') duration = 7000;
        
        // Counting Animation
        const startTime = Date.now();
        const countDuration = Math.min(2000, duration - 500); // Count faster than total popup time
        
        const timerInterval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - startTime;
            if (elapsed >= countDuration) {
                setDisplayAmount(amount);
                clearInterval(timerInterval);
            } else {
                const progress = elapsed / countDuration;
                // Ease out cubic
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                setDisplayAmount(Math.floor(amount * easedProgress));
            }
        }, 16);

        const completeTimer = setTimeout(() => {
            onComplete();
        }, duration); 
        return () => {
            clearTimeout(completeTimer);
            clearInterval(timerInterval);
        };
    }, [onComplete, type, amount]);

    const getCoinCount = (tier: string) => {
        switch(tier) {
            case 'ULTIMATE WIN': return 500;
            case 'MEGA WIN': return 250;
            case 'EPIC WIN': return 150;
            case 'GREAT WIN': return 100;
            case 'BIG WIN': return 50;
            default: return 20;
        }
    };

    const getTheme = (tier: string) => {
        switch(tier) {
            case 'ULTIMATE WIN': return { color: 'text-yellow-400', title: tier, key: 'WIN_ULTIMATE' };
            case 'MEGA WIN': return { color: 'text-red-500', title: tier, key: 'WIN_MEGA' };
            case 'EPIC WIN': return { color: 'text-purple-500', title: tier, key: 'WIN_EPIC' };
            case 'GREAT WIN': return { color: 'text-blue-500', title: tier, key: 'WIN_BIG' };
            case 'BIG WIN': return { color: 'text-green-400', title: tier, key: 'WIN_BIG' };
            default: return { color: 'text-white', title: tier, key: 'WIN_BIG' };
        }
    };

    const theme = getTheme(type);
    const particleCount = getCoinCount(type);
    const customImage = customAssets?.global?.[theme.key];

    return (
        <div 
            onClick={onComplete}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md cursor-pointer overflow-hidden"
        >
            <style>{`
                @keyframes coinFall {
                    0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
                    10% { opacity: 1; }
                    100% { transform: translateY(110vh) rotate(360deg); opacity: 1; }
                }
            `}</style>

            <div className="relative flex flex-col items-center justify-center z-20 w-full h-full">
                
                {/* Title / Banner - MASSIVE SCALE for Uploaded Assets */}
                <div className="flex justify-center items-end w-full animate-pop-in relative z-10 p-4 shrink-0">
                    {customImage ? (
                        <img 
                            src={customImage} 
                            alt={theme.title} 
                            // Scale 2.5 to make it huge as requested (5x logic application)
                            className="w-full h-auto max-h-[70vh] object-contain drop-shadow-[0_10px_50px_rgba(0,0,0,0.8)] transform scale-[2.5]"
                        />
                    ) : (
                        <h2 className={`text-[12vw] font-display font-black uppercase text-center tracking-tighter ${theme.color} drop-shadow-[0_10px_0_rgba(0,0,0,1)] leading-[0.8]`}
                            style={{ 
                                textShadow: '0 10px 0 #000, 0 10px 30px rgba(0,0,0,0.8)',
                                WebkitTextStroke: '3px black'
                            }}
                        >
                            {theme.title}
                        </h2>
                    )}
                </div>
                
                {/* Amount - Adjusted to be just below the image with less extreme overlap to avoid hiding it */}
                <div className="flex items-start justify-center w-full z-30 -mt-8 md:-mt-16 relative">
                    <div className="text-[10vw] md:text-[8vw] font-mono font-black text-white text-center leading-none animate-bounce drop-shadow-[0_0_30px_rgba(0,0,0,1)]"
                         style={{ 
                             textShadow: '0 0 15px #000, 0 5px 0 #000, 0 0 10px black',
                             WebkitTextStroke: '3px black',
                             paintOrder: 'stroke fill'
                         }}>
                        {formatCommaNumber(displayAmount)}
                    </div>
                </div>
            </div>

            {/* 2D Particles */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-10">
                {[...Array(particleCount)].map((_, i) => (
                    <div key={i} 
                            className="absolute text-3xl md:text-5xl opacity-80"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-10%`, 
                                animation: `coinFall ${2 + Math.random() * 2}s linear infinite`,
                                animationDelay: `${Math.random() * 5}s`,
                            }}
                    >🪙</div>
                ))}
            </div>
        </div>
    );
};
