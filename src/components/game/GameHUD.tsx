'use client';

import { useGameStore } from "@/store/game-store";
import { cn } from "@/lib/utils";

export const GameHUD = () => {
    const players = useGameStore(state => state.players);
    const activePlayerId = useGameStore(state => state.activePlayerId);
    const phase = useGameStore(state => state.currentPhase);
    const nextPhase = useGameStore(state => state.nextPhase);

    // Safety check
    if (!players['p1'] || !players['p2']) return null;

    const p1 = players['p1'];
    const p2 = players['p2'];

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
            {/* Top Bar (Opponent) */}
            <div className="flex justify-between items-start">
                <div className="bg-slate-900/80 p-4 rounded-b-xl border border-red-900/50 text-white w-64">
                    <div className="flex justify-between mb-2">
                        <span className="font-bold text-red-400">{p2.name}</span>
                        <span className="text-xs text-gray-400">Mana: {p2.mana}/{p2.maxMana}</span>
                    </div>
                    {/* HP Bar */}
                    <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden">
                        <div
                            className="bg-red-600 h-full transition-all duration-500"
                            style={{ width: `${(p2.hp / p2.maxHp) * 100}%` }}
                        />
                    </div>
                    <div className="text-center text-xs mt-1">{p2.hp} / {p2.maxHp}</div>
                </div>
            </div>

            {/* Middle Areas (Phase Indicator) */}
            <div className="absolute top-1/2 left-4 -translate-y-1/2">
                <div className="flex flex-col gap-2 bg-black/50 p-2 rounded-lg backdrop-blur-sm">
                    {['draw', 'main', 'battle', 'end'].map(p => (
                        <div
                            key={p}
                            className={cn(
                                "px-3 py-1 rounded text-xs font-mono uppercase transition-colors",
                                phase === p ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50" : "text-gray-500 bg-black/20"
                            )}
                        >
                            {p}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Bar (Player) */}
            <div className="flex justify-between items-end">
                <div className="bg-slate-900/90 p-4 rounded-t-xl border border-blue-900/50 text-white w-80 pointer-events-auto">
                    <div className="flex justify-between mb-2">
                        <span className="font-bold text-blue-400">{p1.name} (You)</span>
                        <span className="text-sm font-mono text-blue-200">Mana: {p1.mana}/{p1.maxMana}</span>
                    </div>
                    {/* HP Bar */}
                    <div className="w-full bg-slate-800 h-6 rounded-full overflow-hidden relative border border-slate-700">
                        <div
                            className="bg-blue-600 h-full transition-all duration-500"
                            style={{ width: `${(p1.hp / p1.maxHp) * 100}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold shadow-black drop-shadow-md">
                            {p1.hp} / {p1.maxHp}
                        </span>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => nextPhase()}
                            disabled={activePlayerId !== 'p1'}
                            className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded border-b-4 border-amber-800 active:border-b-0 active:translate-y-1 transition-all"
                        >
                            {activePlayerId === 'p1' ? 'Next Phase' : 'Opponent Turn'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
