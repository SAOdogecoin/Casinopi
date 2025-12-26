
import React, { useEffect } from 'react';

interface SimpleCelebrationModalProps {
    isOpen: boolean;
    message: string;
    onClose: () => void;
}

export const SimpleCelebrationModal: React.FC<SimpleCelebrationModalProps> = ({ isOpen, message, onClose }) => {
    
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000); // Auto close after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose, message]); // Added message to dependencies to reset timer on update

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none">
            {/* No container background, purely text with heavy shadows for visibility */}
            <div className="animate-pop-in flex flex-col items-center">
                 <h2 className="text-6xl md:text-8xl font-black font-display text-white text-center mb-2 stroke-black stroke-2 drop-shadow-[0_4px_4px_rgba(0,0,0,1)]" style={{ textShadow: '0 0 10px black, 0 0 20px black, 0 0 30px black' }}>
                     {message}
                 </h2>
            </div>
        </div>
    );
};
