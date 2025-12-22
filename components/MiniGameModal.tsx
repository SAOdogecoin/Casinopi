
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MiniGameReward, WildGridCell } from '../types';
import { formatNumber, formatCommaNumber } from '../constants';
import { audioService } from '../services/audioService';

interface MiniGameModalProps {
    isOpen: boolean;
    credits: number;
    picks: number; // Acts as "Rolls" in Dice Quest
    wildStage: number; // New Prop
    diceStage: number; // New Prop
    dicePosition: number; 
    activeGame: 'NONE' | 'WILD' | 'DICE';
    savedGrid?: WildGridCell[];
    onSelectMode: (mode: 'NONE' | 'WILD' | 'DICE') => void;
    onBuyPicks: (amount: number, cost: number, currency: 'CREDITS' | 'GEMS') => void;
    onPickTile: (isGem: boolean, reward: MiniGameReward | null) => void;
    onBatchPick: (picksUsed: number, rewards: MiniGameReward[]) => void;
    onStageComplete: (bonusCoins: number, bonusDiamonds: number) => void;
    onGridUpdate?: (grid: WildGridCell[]) => void;
    onDiceRoll: (roll: number, newPosition: number, rewards: MiniGameReward[], isFinish: boolean) => void;
    onClose: () => void;
    playerLevel: number;
}

const GRID_SIZES = [3, 4, 5, 5, 6]; 
const EXCHANGE_RATE = 5; // 5 Credits per 1 Dice Roll
const GEM_COST = 100; // 100 Gems per 1 Dice Roll

interface BoardStep {
    index: number;
    reward?: MiniGameReward;
    isFinish: boolean;
    isStart: boolean;
}

export const MiniGameModal: React.FC<MiniGameModalProps> = ({ 
    isOpen, credits, picks, wildStage, diceStage, dicePosition = 0, activeGame, savedGrid, onSelectMode, onBuyPicks, onPickTile, onBatchPick, onStageComplete, onGridUpdate, onDiceRoll, onClose, playerLevel 
}) => {
    
    // --- Wild Quest State ---
    const currentGridSize = GRID_SIZES[Math.min(wildStage - 1, GRID_SIZES.length - 1)];
    const totalCells = currentGridSize * currentGridSize;
    
    // Reward Calculation
    const wildStageReward = 500000 * wildStage * playerLevel;
    
    // Grid now derives primarily from props, fallback to local only if needed (shouldn't be needed with App lifting)
    const [grid, setGrid] = useState<WildGridCell[]>([]);
    const [stageWinning, setStageWinning] = useState(false);

    // --- Dice Quest State ---
    const [isRolling, setIsRolling] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [diceValue, setDiceValue] = useState(1);
    const [visualPosition, setVisualPosition] = useState(dicePosition);
    const [board, setBoard] = useState<BoardStep[]>([]);
    const [autoRoll, setAutoRoll] = useState(false);
    const rollButtonTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPressRef = useRef(false);
    
    const boardLength = 10 + ((diceStage - 1) * 5); // Stage 1: 10, Stage 2: 15, etc.
    const diceStageReward = 1000000 * diceStage * playerLevel; 
    
    // Ref for scrolling the board
    const boardContainerRef = useRef<HTMLDivElement>(null);

    // Init Wild Grid
    const initGrid = useCallback(() => {
        const cells: WildGridCell[] = Array(totalCells).fill({ revealed: false, content: 'BLANK' });
        const gemIdx = Math.floor(Math.random() * totalCells);
        cells[gemIdx] = { revealed: false, content: 'GEM' };

        const baseCoin = 25000 * wildStage * playerLevel;

        for(let i=0; i<totalCells; i++) {
            if (i === gemIdx) continue;
            if (Math.random() < 0.3) {
                const r = Math.random();
                let reward: MiniGameReward = { type: 'COINS', value: baseCoin, label: formatNumber(baseCoin) };
                if (r < 0.5) {
                    const highCoin = baseCoin * 2;
                    reward = { type: 'COINS', value: highCoin, label: formatNumber(highCoin) };
                }
                else if (r < 0.7) reward = { type: 'PICKS', value: 1, label: '+1 Pick' };
                // Removed XP Boost, replaced with extra Picks
                else if (r < 0.9) reward = { type: 'PICKS', value: 2, label: '+2 Picks' };
                else reward = { type: 'DIAMONDS', value: 5, label: '5 💎' };
                cells[i] = { revealed: false, content: 'REWARD', reward };
            }
        }
        setGrid(cells);
        if(onGridUpdate) onGridUpdate(cells);
    }, [wildStage, totalCells, playerLevel, onGridUpdate]);

    // Init Board
    const initBoard = useCallback(() => {
        const newBoard: BoardStep[] = [];
        const baseCoin = 10000 * diceStage * playerLevel; 

        for(let i=0; i<=boardLength; i++) {
            let reward: MiniGameReward | undefined = undefined;
            // Rewards on steps (Reduced probability to 35% from 70%)
            if (i > 0 && i < boardLength && Math.random() < 0.35) {
                 const r = Math.random();
                 if (r < 0.6) reward = { type: 'COINS', value: baseCoin, label: formatNumber(baseCoin) };
                 else if (r < 0.8) reward = { type: 'COINS', value: baseCoin * 2.5, label: formatNumber(baseCoin * 2.5) };
                 // Increased Gems to 50
                 else if (r < 0.9) reward = { type: 'DIAMONDS', value: 50, label: '50💎' };
                 else reward = { type: 'PICKS', value: 1, label: '+1 Roll' };
            }

            newBoard.push({
                index: i,
                isStart: i === 0,
                isFinish: i === boardLength,
                reward
            });
        }
        setBoard(newBoard);
        setVisualPosition(0); // Reset visual on new stage
    }, [boardLength, diceStage, playerLevel]);

    useEffect(() => {
        if (isOpen) {
            if (activeGame === 'WILD') {
                if (savedGrid && savedGrid.length > 0) {
                    setGrid(savedGrid);
                } else {
                    initGrid();
                }
            }
            if (activeGame === 'DICE') {
                if (board.length === 0 || board[board.length-1].index !== boardLength) {
                    initBoard();
                }
                if (!isMoving) setVisualPosition(dicePosition);
            }
            setStageWinning(false);
        } else {
            setIsRolling(false);
            setIsMoving(false);
            setAutoRoll(false);
        }
    }, [isOpen, initGrid, activeGame, initBoard, boardLength, dicePosition, board.length, isMoving, savedGrid]);

    // Scroll Effect for Dice Quest - Improved Centering
    useEffect(() => {
        if (activeGame === 'DICE' && boardContainerRef.current) {
            const container = boardContainerRef.current;
            const children = container.children;
            
            // Visual position corresponds to index, and children are mapped directly from board
            if (children && children[visualPosition]) {
                const stepElement = children[visualPosition] as HTMLElement;
                const containerCenter = container.clientWidth / 2;
                const stepCenter = stepElement.offsetWidth / 2;
                const stepLeft = stepElement.offsetLeft;

                container.scrollTo({
                    left: stepLeft - containerCenter + stepCenter,
                    behavior: 'smooth'
                });
            }
        }
    }, [visualPosition, activeGame]);

    // Auto Roll Effect
    useEffect(() => {
        if (autoRoll && !isRolling && !isMoving && picks > 0) {
            const timer = setTimeout(() => {
                handleRollDice();
            }, 1000);
            return () => clearTimeout(timer);
        } else if (autoRoll && picks <= 0) {
            setAutoRoll(false);
        }
    }, [autoRoll, isRolling, isMoving, picks]);

    // --- Wild Quest Handlers ---
    const handleTileClick = (index: number) => {
        if (picks <= 0 || grid[index].revealed || stageWinning) return;
        const cell = grid[index];
        const newGrid = [...grid];
        newGrid[index] = { ...cell, revealed: true };
        setGrid(newGrid);
        if (onGridUpdate) onGridUpdate(newGrid);

        if (cell.content === 'GEM') {
            audioService.playGemFound();
            setStageWinning(true);
            setTimeout(() => {
                onStageComplete(50000 * wildStage, 10 * wildStage);
                setStageWinning(false);
                // Grid reset happens via Parent resetting 'savedGrid' via init
            }, 2000);
        } else if (cell.content === 'REWARD') {
            audioService.playWinSmall();
            onPickTile(false, cell.reward!);
        } else {
            audioService.playStoneBreak();
            onPickTile(false, null);
        }
    };

    const handleAutoPick = () => {
        if (picks <= 0 || stageWinning) return;
        const unrevealedIndices = grid.map((cell, index) => !cell.revealed ? index : -1).filter(index => index !== -1);
        for (let i = unrevealedIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [unrevealedIndices[i], unrevealedIndices[j]] = [unrevealedIndices[j], unrevealedIndices[i]];
        }
        const countToPick = Math.min(picks, unrevealedIndices.length);
        const indicesToPick = unrevealedIndices.slice(0, countToPick);
        
        const newGrid = [...grid];
        const collectedRewards: MiniGameReward[] = [];
        let gemFound = false;
        let picksUsed = 0;

        for (const idx of indicesToPick) {
            picksUsed++;
            newGrid[idx] = { ...newGrid[idx], revealed: true };
            if (newGrid[idx].content === 'GEM') { gemFound = true; break; }
            else if (newGrid[idx].content === 'REWARD' && newGrid[idx].reward) collectedRewards.push(newGrid[idx].reward!);
        }
        setGrid(newGrid);
        if (onGridUpdate) onGridUpdate(newGrid);
        
        if (picksUsed > 0) {
            onBatchPick(picksUsed, collectedRewards);
            audioService.playClick();
        }
        if (gemFound) {
            audioService.playGemFound();
            setStageWinning(true);
            setTimeout(() => {
                onStageComplete(50000 * wildStage, 10 * wildStage);
                setStageWinning(false);
            }, 2000);
        } else {
            if (collectedRewards.length > 0) audioService.playWinSmall();
            else audioService.playStoneBreak();
        }
    };

    // --- Dice Quest Handlers ---
    const movePlayerStepByStep = async (start: number, end: number, collectedRewards: MiniGameReward[]) => {
        setIsMoving(true);
        const finalPos = Math.min(end, boardLength);

        for (let i = start + 1; i <= finalPos; i++) {
            setVisualPosition(i);
            audioService.playClick(); 
            
            const step = board.find(s => s.index === i);
            if (step?.reward) {
                collectedRewards.push(step.reward);
            }
            await new Promise(resolve => setTimeout(resolve, 400));
        }

        setIsMoving(false);
        const isFinish = finalPos >= boardLength;
        onDiceRoll(0, finalPos, collectedRewards, isFinish); 
        
        if (isFinish) {
             audioService.playWinBig();
             setAutoRoll(false);
        }
    };

    const handleRollDice = () => {
        if (picks <= 0 || isRolling || isMoving) {
            if (picks <= 0) setAutoRoll(false);
            return;
        }

        setIsRolling(true);
        audioService.playClick();

        let rolls = 0;
        const interval = setInterval(() => {
            setDiceValue(Math.floor(Math.random() * 6) + 1);
            rolls++;
            if (rolls > 12) {
                clearInterval(interval);
                const finalRoll = Math.floor(Math.random() * 6) + 1;
                setDiceValue(finalRoll);
                setIsRolling(false);
                
                const collectedRewards: MiniGameReward[] = [];
                movePlayerStepByStep(visualPosition, visualPosition + finalRoll, collectedRewards);
            }
        }, 80);
    };

    // Roll Button Interaction
    const handleRollMouseDown = () => {
        if (picks <= 0 || isRolling || isMoving) return;
        isLongPressRef.current = false;
        rollButtonTimeoutRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            if (!autoRoll) {
                setAutoRoll(true);
                audioService.playClick();
            }
        }, 800);
    };

    const handleRollMouseUp = () => {
        if (rollButtonTimeoutRef.current) {
            clearTimeout(rollButtonTimeoutRef.current);
            rollButtonTimeoutRef.current = null;
        }

        if (!isLongPressRef.current) {
            if (autoRoll) {
                setAutoRoll(false);
                audioService.playClick();
            } else {
                handleRollDice();
            }
        }
    };

    const handleExchangeCredits = () => {
        if (credits >= EXCHANGE_RATE) { onBuyPicks(1, EXCHANGE_RATE, 'CREDITS'); audioService.playClick(); }
    };
    const handleBuyGems = () => {
        if (credits >= 0) { 
            onBuyPicks(1, GEM_COST, 'GEMS'); audioService.playClick();
        }
    };

    const handleBackToSelection = () => {
        onSelectMode('NONE');
    };

    const handleBoardScroll = (direction: 'LEFT' | 'RIGHT') => {
        if (boardContainerRef.current) {
            const amount = 200;
            boardContainerRef.current.scrollBy({ left: direction === 'LEFT' ? -amount : amount, behavior: 'smooth' });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 top-[35px] md:top-[64px] z-[90] bg-black/95 backdrop-blur-xl animate-pop-in">
            {/* Close Button - High Z-Index to prevent overlap */}
            <button onClick={onClose} className="absolute top-2 md:top-6 right-2 md:right-6 z-[200] w-12 h-12 bg-black/80 hover:bg-red-900/80 text-white rounded-full flex items-center justify-center transition-all border border-white/30 shadow-2xl text-xl">✕</button>

            {/* GAME SELECTION SCREEN */}
            {activeGame === 'NONE' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20"></div>
                     
                     <h2 className="text-4xl md:text-6xl font-black font-heavy text-[#e6c288] uppercase mb-8 md:mb-16 drop-shadow-lg text-center z-10">Choose Your Quest</h2>
                     
                     <div className="flex flex-col md:flex-row gap-8 md:gap-16 z-10 items-center">
                         {/* Wild Quest Card */}
                         <button onClick={() => onSelectMode('WILD')} className="group relative w-64 h-80 md:w-80 md:h-96 bg-[#2a1b12] rounded-3xl border-4 border-[#5d4037] hover:border-[#e6c288] transition-all hover:scale-105 shadow-2xl flex flex-col items-center overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/80 z-10"></div>
                             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aztec.png')] opacity-30"></div>
                             <div className="relative z-20 flex-1 flex items-center justify-center">
                                 <div className="text-9xl group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl">🗿</div>
                             </div>
                             <div className="relative z-20 w-full bg-black/60 p-6 text-center backdrop-blur-sm border-t border-[#5d4037]">
                                 <h3 className="text-2xl md:text-3xl font-black text-[#e6c288] uppercase tracking-wider">Wild Quest</h3>
                                 <p className="text-[#a1887f] text-sm font-bold mt-2">Find the hidden gems!</p>
                             </div>
                         </button>

                         {/* Dice Quest Card */}
                         <button onClick={() => onSelectMode('DICE')} className="group relative w-64 h-80 md:w-80 md:h-96 bg-[#1a237e] rounded-3xl border-4 border-[#3949ab] hover:border-[#ffeb3b] transition-all hover:scale-105 shadow-2xl flex flex-col items-center overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/80 z-10"></div>
                             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/checkered-pattern.png')] opacity-20"></div>
                             <div className="relative z-20 flex-1 flex items-center justify-center">
                                 <div className="text-9xl group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl">🎲</div>
                             </div>
                             <div className="relative z-20 w-full bg-black/60 p-6 text-center backdrop-blur-sm border-t border-[#3949ab]">
                                 <h3 className="text-2xl md:text-3xl font-black text-[#ffeb3b] uppercase tracking-wider">Dice Quest</h3>
                                 <p className="text-[#c5cae9] text-sm font-bold mt-2">Roll your way to victory!</p>
                             </div>
                         </button>
                     </div>
                </div>
            )}

            {/* WILD QUEST GAMEPLAY */}
            {activeGame === 'WILD' && (
                <div className="w-full h-full flex flex-col bg-[#2a1b12] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aztec.png')] opacity-10 pointer-events-none"></div>
                    
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 md:p-8 bg-[#1b0e07] border-b-4 border-[#5d4037] shadow-xl z-20">
                        <button onClick={handleBackToSelection} className="bg-[#3e2723] text-[#e6c288] font-bold px-4 py-2 rounded-lg border border-[#5d4037] hover:bg-[#4e342e]">⬅ BACK</button>
                        
                        <div className="flex items-center gap-6 md:gap-12">
                            <div className="flex flex-col items-center">
                                <span className="text-[#a1887f] text-xs font-bold uppercase">Stage</span>
                                <span className="text-2xl font-black text-[#e6c288]">{wildStage}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[#a1887f] text-xs font-bold uppercase">Credits</span>
                                <span className="text-2xl font-black text-green-400 font-mono">{credits}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[#a1887f] text-xs font-bold uppercase">Picks</span>
                                <span className="text-3xl font-black text-white drop-shadow-md">{picks}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                             <button onClick={handleExchangeCredits} className="bg-green-700 text-white px-4 py-2 rounded-lg font-bold border border-green-500 shadow-lg active:scale-95 transition-transform text-sm flex flex-col items-center leading-none">
                                 <span>Buy Pick</span>
                                 <span className="text-[10px] opacity-80">{EXCHANGE_RATE} Credits</span>
                             </button>
                             <button onClick={handleBuyGems} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold border border-blue-400 shadow-lg active:scale-95 transition-transform text-sm flex flex-col items-center leading-none">
                                 <span>Buy Pick</span>
                                 <span className="text-[10px] opacity-80">{GEM_COST} 💎</span>
                             </button>
                        </div>
                    </div>

                    {/* Main Area */}
                    <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative">
                         <div className="bg-[#3e2723] p-4 rounded-2xl shadow-2xl border-4 border-[#5d4037] relative">
                             {stageWinning && (
                                 <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-xl animate-pop-in">
                                     <div className="text-center">
                                         <div className="text-8xl animate-bounce mb-4">💎</div>
                                         <h2 className="text-4xl font-black text-[#e6c288] uppercase tracking-widest">Stage Clear!</h2>
                                         <p className="text-white font-bold mt-2">Next Stage Loading...</p>
                                     </div>
                                 </div>
                             )}

                             <div 
                                className="grid gap-2 md:gap-3"
                                style={{ 
                                    gridTemplateColumns: `repeat(${currentGridSize}, minmax(0, 1fr))` 
                                }}
                             >
                                 {grid.map((cell, i) => (
                                     <button 
                                        key={i}
                                        onClick={() => handleTileClick(i)}
                                        disabled={cell.revealed || picks <= 0}
                                        className={`
                                            w-16 h-16 md:w-24 md:h-24 rounded-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all relative overflow-hidden flex items-center justify-center text-2xl md:text-4xl shadow-lg
                                            ${cell.revealed 
                                                ? 'bg-[#2a1b12] border-transparent cursor-default' 
                                                : 'bg-[#6d4c41] border-[#3e2723] hover:bg-[#795548] cursor-pointer'}
                                        `}
                                     >
                                         {cell.revealed ? (
                                             <span className="animate-pop-in">
                                                 {cell.content === 'GEM' ? '💎' : cell.content === 'REWARD' && cell.reward ? (
                                                     cell.reward.type === 'COINS' ? '💰' : cell.reward.type === 'PICKS' ? '⛏️' : cell.reward.type === 'XP_BOOST' ? '🚀' : '💎'
                                                 ) : ''}
                                             </span>
                                         ) : (
                                             <span className="opacity-20 text-4xl">?</span>
                                         )}
                                         {cell.revealed && cell.content === 'REWARD' && (
                                             <span className="absolute bottom-1 text-[8px] md:text-[10px] font-bold text-white leading-none bg-black/50 px-1 rounded">{cell.reward?.label}</span>
                                         )}
                                     </button>
                                 ))}
                             </div>
                         </div>
                    </div>

                    <div className="p-4 flex justify-center">
                        <button 
                            onClick={handleAutoPick}
                            disabled={picks <= 0 || stageWinning}
                            className={`px-12 py-4 rounded-full font-black uppercase text-xl tracking-widest shadow-xl transition-all border-b-4 active:border-b-0 active:translate-y-1 ${picks > 0 ? 'bg-[#e6c288] text-[#3e2723] border-[#a1887f] hover:bg-white' : 'bg-gray-700 text-gray-500 border-gray-900 cursor-not-allowed'}`}
                        >
                            Auto Pick
                        </button>
                    </div>
                </div>
            )}

            {/* DICE QUEST GAMEPLAY */}
            {activeGame === 'DICE' && (
                <div className="w-full h-full flex flex-col bg-[#1a237e] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>

                    {/* Header */}
                    <div className="flex justify-between items-center p-4 md:p-8 bg-[#0d47a1] border-b-4 border-[#1565c0] shadow-xl z-20">
                         <button onClick={handleBackToSelection} className="bg-[#1976d2] text-white font-bold px-4 py-2 rounded-lg border border-blue-300 hover:bg-[#2196f3]">⬅ BACK</button>
                         
                         <div className="flex items-center gap-6 md:gap-12">
                            <div className="flex flex-col items-center">
                                <span className="text-blue-200 text-xs font-bold uppercase">Stage</span>
                                <span className="text-2xl font-black text-yellow-400">{diceStage}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-blue-200 text-xs font-bold uppercase">Credits</span>
                                <span className="text-2xl font-black text-green-400 font-mono">{credits}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-blue-200 text-xs font-bold uppercase">Rolls</span>
                                <span className="text-3xl font-black text-white drop-shadow-md">{picks}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                             <button onClick={handleExchangeCredits} className="bg-green-700 text-white px-4 py-2 rounded-lg font-bold border border-green-500 shadow-lg active:scale-95 transition-transform text-sm flex flex-col items-center leading-none">
                                 <span>Buy Roll</span>
                                 <span className="text-[10px] opacity-80">{EXCHANGE_RATE} Credits</span>
                             </button>
                             <button onClick={handleBuyGems} className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold border border-blue-300 shadow-lg active:scale-95 transition-transform text-sm flex flex-col items-center leading-none">
                                 <span>Buy Roll</span>
                                 <span className="text-[10px] opacity-80">{GEM_COST} 💎</span>
                             </button>
                        </div>
                    </div>

                    {/* Board Area */}
                    <div className="flex-1 flex flex-col items-center justify-center relative w-full overflow-hidden">
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-32 bg-white/5 skew-y-3 pointer-events-none"></div>
                        
                        <div className="w-full max-w-6xl relative px-12">
                             <button onClick={() => handleBoardScroll('LEFT')} className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-black/50 text-white rounded-full text-2xl hover:bg-black/80 transition shadow-lg">◀</button>
                             <button onClick={() => handleBoardScroll('RIGHT')} className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-black/50 text-white rounded-full text-2xl hover:bg-black/80 transition shadow-lg">▶</button>

                             <div 
                                ref={boardContainerRef}
                                className="flex items-center gap-4 overflow-x-auto no-scrollbar px-[50%] py-12 snap-x snap-center"
                                style={{ scrollBehavior: 'smooth' }}
                             >
                                 {board.map((step) => {
                                     const isPlayerHere = step.index === visualPosition;
                                     const isPast = step.index < visualPosition;
                                     
                                     return (
                                         <div key={step.index} className={`relative shrink-0 w-28 h-28 md:w-36 md:h-36 rounded-2xl flex flex-col items-center justify-center border-4 shadow-2xl transition-all duration-500 snap-center ${step.isFinish ? 'bg-yellow-500 border-yellow-300' : step.isStart ? 'bg-green-600 border-green-400' : 'bg-[#283593] border-[#3949ab]'}`}>
                                             <div className="absolute top-2 left-2 text-[10px] font-black opacity-50 text-white">#{step.index}</div>
                                             
                                             {step.isFinish && <div className="text-4xl mb-1">🏆</div>}
                                             {step.isStart && <div className="text-2xl font-black uppercase text-white">Start</div>}
                                             
                                             {step.reward && !step.isFinish && (
                                                 <div className="flex flex-col items-center">
                                                     <span className="text-3xl drop-shadow-md">{step.reward.type === 'COINS' ? '💰' : step.reward.type === 'DIAMONDS' ? '💎' : '⛏️'}</span>
                                                     <span className="text-[10px] font-bold text-white bg-black/40 px-2 rounded mt-1">{step.reward.label}</span>
                                                 </div>
                                             )}

                                             {/* Player Avatar - Now Centered inside block at top */}
                                             {isPlayerHere && (
                                                 <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 animate-bounce flex flex-col items-center pointer-events-none">
                                                     <div className="text-5xl md:text-6xl drop-shadow-2xl filter shadow-black">🤠</div>
                                                 </div>
                                             )}

                                             {isPast && !step.isStart && (
                                                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                                                     <span className="text-green-400 text-4xl">✔</span>
                                                 </div>
                                             )}
                                         </div>
                                     );
                                 })}
                             </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="p-6 bg-[#0d47a1] flex flex-col items-center shadow-[0_-10px_30px_rgba(0,0,0,0.3)] relative z-20 border-t-4 border-[#1565c0]">
                         <div className="flex items-center gap-8">
                             <div className="bg-[#1565c0] p-4 rounded-2xl border-2 border-[#42a5f5] w-24 h-24 flex items-center justify-center shadow-inner">
                                 <div className={`text-5xl font-black text-white drop-shadow-lg ${isRolling ? 'animate-spin' : ''}`}>{diceValue}</div>
                             </div>

                             <button 
                                onMouseDown={handleRollMouseDown}
                                onMouseUp={handleRollMouseUp}
                                onMouseLeave={handleRollMouseUp}
                                onTouchStart={handleRollMouseDown}
                                onTouchEnd={handleRollMouseUp}
                                disabled={picks <= 0 || isRolling || isMoving}
                                className={`
                                    w-32 h-32 rounded-full font-black text-2xl uppercase tracking-widest shadow-[0_10px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-2 transition-all border-4 flex flex-col items-center justify-center
                                    ${autoRoll ? 'bg-red-600 border-red-400 animate-pulse' : picks > 0 ? 'bg-yellow-500 hover:bg-yellow-400 border-yellow-300 text-yellow-900' : 'bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed'}
                                `}
                             >
                                 {autoRoll ? 'STOP' : 'ROLL'}
                                 <span className="text-[10px] opacity-70 mt-1">{autoRoll ? 'Auto' : 'Hold Auto'}</span>
                             </button>
                         </div>
                    </div>
                </div>
            )}

        </div>
    );
};
