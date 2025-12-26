
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
    customAssets?: any; 
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
    isOpen, credits, picks, wildStage, diceStage, dicePosition = 0, activeGame, savedGrid, onSelectMode, onBuyPicks, onPickTile, onBatchPick, onStageComplete, onGridUpdate, onDiceRoll, onClose, playerLevel, customAssets
}) => {
    
    // --- Wild Quest State ---
    const currentGridSize = GRID_SIZES[Math.min(wildStage - 1, GRID_SIZES.length - 1)];
    const totalCells = currentGridSize * currentGridSize;
    
    // Grid now derives primarily from props
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
    
    // 3D Dice Ref
    const diceRef = useRef<HTMLDivElement>(null);
    
    const boardLength = 10 + ((diceStage - 1) * 5); // Stage 1: 10, Stage 2: 15, etc.
    
    // Ref for scrolling the board
    const boardContainerRef = useRef<HTMLDivElement>(null);

    // Init Wild Grid
    const initGrid = useCallback(() => {
        const cells: WildGridCell[] = Array(totalCells).fill({ revealed: false, content: 'BLANK' });
        const gemIdx = Math.floor(Math.random() * totalCells);
        cells[gemIdx] = { revealed: false, content: 'GEM' };

        // Scaled base coin: 25 Million * Stage * Level
        const baseCoin = 25000000 * wildStage * playerLevel;

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
        // Scaled base coin: 10 Million * Stage * Level
        const baseCoin = 10000000 * diceStage * playerLevel; 

        for(let i=0; i<=boardLength; i++) {
            let reward: MiniGameReward | undefined = undefined;
            // Rewards on steps (Reduced probability to 35% from 70%)
            if (i > 0 && i < boardLength && Math.random() < 0.35) {
                 const r = Math.random();
                 if (r < 0.6) reward = { type: 'COINS', value: baseCoin, label: formatNumber(baseCoin) };
                 else if (r < 0.8) reward = { type: 'COINS', value: baseCoin * 2.5, label: formatNumber(baseCoin * 2.5) };
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
            }, 1500); // Slower auto roll to allow animations
            return () => clearTimeout(timer);
        } else if (autoRoll && picks <= 0) {
            setAutoRoll(false);
        }
    }, [autoRoll, isRolling, isMoving, picks]);

    // --- Asset Helpers ---
    const getGlobalAsset = (key: string, fallback: string) => {
        if (customAssets?.global?.[key]) {
            return <img src={customAssets.global[key]} alt={key} className="w-full h-full object-contain" />;
        }
        return <div className="text-4xl md:text-6xl">{fallback}</div>;
    };

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

        const rollResult = Math.floor(Math.random() * 6) + 1;
        setDiceValue(rollResult);

        // Simple wait for CSS transition
        setTimeout(() => {
            setIsRolling(false);
            const collectedRewards: MiniGameReward[] = [];
            movePlayerStepByStep(visualPosition, visualPosition + rollResult, collectedRewards);
        }, 1200);
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

    const getIcon = (key: string, fallback: string) => {
        if (customAssets?.global?.[key]) {
            return <img src={customAssets.global[key]} alt={key} className="w-24 h-24 object-contain drop-shadow-md" />;
        }
        return <div className="text-9xl group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl">{fallback}</div>;
    };

    // --- 3D Dice Component ---
    const Dice3D = ({ value, rolling }: { value: number, rolling: boolean }) => {
        const getTransform = () => {
            if (rolling) return `rotateX(${Math.random() * 720}deg) rotateY(${Math.random() * 720}deg)`;
            switch(value) {
                case 1: return 'rotateX(0deg) rotateY(0deg)';
                case 2: return 'rotateX(-90deg) rotateY(0deg)';
                case 3: return 'rotateX(0deg) rotateY(-90deg)';
                case 4: return 'rotateX(0deg) rotateY(90deg)';
                case 5: return 'rotateX(90deg) rotateY(0deg)';
                case 6: return 'rotateX(180deg) rotateY(0deg)';
                default: return 'rotateX(0deg) rotateY(0deg)';
            }
        };

        const Dot = () => <div className="w-2 h-2 md:w-3 md:h-3 bg-black rounded-full shadow-inner" />;

        return (
            <div className="relative w-16 h-16 md:w-24 md:h-24 perspective-[400px]">
                <div 
                    className="w-full h-full relative preserve-3d transition-transform duration-[1s] ease-out"
                    style={{ transformStyle: 'preserve-3d', transform: getTransform() }}
                >
                    {/* Face 1 */}
                    <div className="absolute inset-0 bg-white border border-gray-300 rounded-lg flex items-center justify-center backface-hidden shadow-[inset_0_0_15px_rgba(0,0,0,0.1)]" style={{ transform: 'translateZ(3rem) md:translateZ(4.5rem)' }}>
                        <Dot />
                    </div>
                    {/* Face 6 */}
                    <div className="absolute inset-0 bg-white border border-gray-300 rounded-lg flex flex-col justify-between p-2 backface-hidden shadow-[inset_0_0_15px_rgba(0,0,0,0.1)]" style={{ transform: 'rotateX(180deg) translateZ(3rem) md:translateZ(4.5rem)' }}>
                        <div className="flex justify-between"><Dot/><Dot/></div>
                        <div className="flex justify-between"><Dot/><Dot/></div>
                        <div className="flex justify-between"><Dot/><Dot/></div>
                    </div>
                    {/* Face 2 */}
                    <div className="absolute inset-0 bg-white border border-gray-300 rounded-lg flex flex-col justify-between p-3 backface-hidden shadow-[inset_0_0_15px_rgba(0,0,0,0.1)]" style={{ transform: 'rotateX(90deg) translateZ(3rem) md:translateZ(4.5rem)' }}>
                        <div className="flex justify-end"><Dot/></div>
                        <div className="flex justify-start"><Dot/></div>
                    </div>
                    {/* Face 5 */}
                    <div className="absolute inset-0 bg-white border border-gray-300 rounded-lg flex flex-col justify-between p-3 backface-hidden shadow-[inset_0_0_15px_rgba(0,0,0,0.1)]" style={{ transform: 'rotateX(-90deg) translateZ(3rem) md:translateZ(4.5rem)' }}>
                        <div className="flex justify-between"><Dot/><Dot/></div>
                        <div className="flex justify-center"><Dot/></div>
                        <div className="flex justify-between"><Dot/><Dot/></div>
                    </div>
                    {/* Face 3 */}
                    <div className="absolute inset-0 bg-white border border-gray-300 rounded-lg flex flex-col justify-between p-3 backface-hidden shadow-[inset_0_0_15px_rgba(0,0,0,0.1)]" style={{ transform: 'rotateY(90deg) translateZ(3rem) md:translateZ(4.5rem)' }}>
                        <div className="flex justify-end"><Dot/></div>
                        <div className="flex justify-center"><Dot/></div>
                        <div className="flex justify-start"><Dot/></div>
                    </div>
                    {/* Face 4 */}
                    <div className="absolute inset-0 bg-white border border-gray-300 rounded-lg flex flex-col justify-between p-3 backface-hidden shadow-[inset_0_0_15px_rgba(0,0,0,0.1)]" style={{ transform: 'rotateY(-90deg) translateZ(3rem) md:translateZ(4.5rem)' }}>
                        <div className="flex justify-between"><Dot/><Dot/></div>
                        <div className="flex justify-between"><Dot/><Dot/></div>
                    </div>
                </div>
            </div>
        )
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
                                 {getIcon('QUEST_WILD', '🗿')}
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
                                 {getIcon('QUEST_DICE', '🎲')}
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
                                         <div className="text-8xl animate-bounce mb-4">
                                             {customAssets?.global?.['QUEST_WILD_GEM'] ? <img src={customAssets.global['QUEST_WILD_GEM']} className="w-32 h-32 object-contain mx-auto" /> : '💎'}
                                         </div>
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
                                             <span className="animate-pop-in w-full h-full flex items-center justify-center p-2">
                                                 {cell.content === 'GEM' 
                                                    ? getGlobalAsset('QUEST_WILD_GEM', '💎')
                                                    : cell.content === 'REWARD' && cell.reward ? (
                                                     cell.reward.type === 'COINS' ? getGlobalAsset('COIN', '💰') : 
                                                     cell.reward.type === 'PICKS' ? getGlobalAsset('BOX', '⛏️') : 
                                                     cell.reward.type === 'XP_BOOST' ? getGlobalAsset('BOOST', '🚀') : 
                                                     getGlobalAsset('GEM', '💎')
                                                 ) : ''}
                                             </span>
                                         ) : (
                                             <span className="opacity-20 text-4xl">?</span>
                                         )}
                                         {cell.revealed && cell.content === 'REWARD' && (
                                             <span className="absolute bottom-0 text-[8px] md:text-[10px] font-bold text-white leading-none bg-black/70 w-full py-0.5">{cell.reward?.label}</span>
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
                                         <div key={step.index} className={`relative shrink-0 w-28 h-28 md:w-36 md:h-36 rounded-2xl flex flex-col items-center justify-center border-4 shadow-2xl transition-all duration-500 snap-center overflow-visible ${step.isFinish ? 'bg-yellow-500 border-yellow-300' : step.isStart ? 'bg-green-600 border-green-400' : 'bg-[#283593] border-[#3949ab]'}`}>
                                             <div className="absolute top-2 left-2 text-[10px] font-black opacity-50 text-white">#{step.index}</div>
                                             
                                             {step.isFinish && <div className="text-4xl mb-1">🏆</div>}
                                             {step.isStart && <div className="text-2xl font-black uppercase text-white">Start</div>}
                                             
                                             {step.reward && !step.isFinish && (
                                                 <div className="flex flex-col items-center w-full h-full p-4">
                                                     <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
                                                         {step.reward.type === 'COINS' ? getGlobalAsset('COIN', '💰') : 
                                                          step.reward.type === 'DIAMONDS' ? getGlobalAsset('GEM', '💎') : 
                                                          getGlobalAsset('BOX', '⛏️')}
                                                     </div>
                                                     <span className="text-[10px] font-bold text-white bg-black/40 px-2 rounded mt-1 shadow-md whitespace-nowrap">{step.reward.label}</span>
                                                 </div>
                                             )}

                                             {/* Player Avatar - Centered inside block at top */}
                                             {isPlayerHere && (
                                                 <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 animate-bounce flex flex-col items-center pointer-events-none w-24 h-24">
                                                     {getGlobalAsset('DICE_PLAYER_ICON', '🤠')}
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
                         <div className="flex items-center gap-12">
                             {/* 3D Dice Display */}
                             <div className="w-24 h-24 flex items-center justify-center">
                                 <Dice3D value={diceValue} rolling={isRolling} />
                             </div>

                             {/* 3D Roll Button - Hemisphere */}
                             <button 
                                onMouseDown={handleRollMouseDown}
                                onMouseUp={handleRollMouseUp}
                                onMouseLeave={handleRollMouseUp}
                                onTouchStart={handleRollMouseDown}
                                onTouchEnd={handleRollMouseUp}
                                disabled={picks <= 0 || isRolling || isMoving}
                                className={`
                                    w-32 h-32 rounded-full font-black text-2xl uppercase tracking-widest transition-transform active:scale-95 flex flex-col items-center justify-center relative overflow-hidden
                                    ${picks > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                                    ${autoRoll ? 'animate-pulse ring-4 ring-yellow-400' : ''}
                                `}
                                style={{
                                    background: 'radial-gradient(circle at 30% 30%, #ef4444, #991b1b, #450a0a)',
                                    boxShadow: 'inset 0 5px 10px rgba(255,255,255,0.3), inset 0 -5px 10px rgba(0,0,0,0.5), 0 10px 20px rgba(0,0,0,0.5)'
                                }}
                             >
                                 <span className="text-white drop-shadow-md z-10">{autoRoll ? 'STOP' : 'ROLL'}</span>
                                 <span className="text-[10px] text-red-200 z-10 opacity-80 mt-1">{autoRoll ? 'Auto' : 'Hold Auto'}</span>
                                 
                                 {/* Glossy Reflection */}
                                 <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-10 bg-white/10 rounded-full blur-md"></div>
                             </button>
                         </div>
                    </div>
                </div>
            )}

        </div>
    );
};
