import React, { useEffect, useState } from 'react';
import { generateOracleFortune } from '../services/geminiService';

interface OracleModalProps {
  isOpen: boolean;
  onClose: () => void;
  bonusWin: number;
  currentBalance: number;
}

export const OracleModal: React.FC<OracleModalProps> = ({ isOpen, onClose, bonusWin, currentBalance }) => {
  const [fortune, setFortune] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      generateOracleFortune(currentBalance, bonusWin).then((text) => {
        setFortune(text);
        setLoading(false);
      });
    } else {
      setFortune("");
    }
  }, [isOpen, bonusWin, currentBalance]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-pop-in">
      {/* Background Rays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0deg,#4f46e5_20deg,transparent_40deg)] animate-[spin_10s_linear_infinite] opacity-20"></div>
      </div>

      <div className="relative bg-gradient-to-b from-indigo-900 to-black border-2 border-gold-500 rounded-3xl max-w-lg w-full shadow-[0_0_50px_rgba(79,70,229,0.6)] overflow-hidden flex flex-col p-1">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-800 to-purple-900 p-6 text-center rounded-t-2xl border-b border-white/10 relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
          <h2 className="relative z-10 text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-gold-300 to-gold-600 drop-shadow-sm tracking-widest">
            ORACLE BONUS
          </h2>
        </div>

        {/* Body */}
        <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-center space-y-8 relative">
          {/* Floating Orbs */}
          <div className="absolute top-10 left-10 w-4 h-4 bg-cyan-400 rounded-full blur-md animate-ping"></div>
          <div className="absolute bottom-20 right-10 w-6 h-6 bg-fuchsia-500 rounded-full blur-md animate-pulse"></div>

          {loading ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="text-8xl animate-bounce">🔮</div>
              <p className="text-indigo-200 text-xl font-body tracking-wide animate-pulse">Consulting the spirits...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center">
                  <span className="text-gold-200 text-sm uppercase tracking-[0.3em] mb-2">Total Win</span>
                  <div className="text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-t from-yellow-400 to-white drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] animate-pulse">
                    {bonusWin.toLocaleString()}
                  </div>
              </div>
              
              <div className="bg-black/40 p-6 rounded-xl border border-indigo-500/30 w-full backdrop-blur-sm">
                <p className="text-cyan-100 italic font-serif text-xl leading-relaxed drop-shadow-md">
                  "{fortune}"
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-black/50 flex justify-center">
          <button 
            onClick={onClose}
            disabled={loading}
            className="px-12 py-4 bg-gradient-to-b from-gold-400 to-gold-700 text-black font-display font-bold text-xl rounded-full shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:scale-105 hover:shadow-[0_0_30px_rgba(255,215,0,0.6)] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
          >
            {loading ? 'WAITING...' : 'COLLECT'}
          </button>
        </div>
      </div>
    </div>
  );
};
