'use client';

import { Card } from '@/lib/game-engine/types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface Props {
    card: Card;
    count?: number;
    onClick: () => void;
    actionLabel?: string;
}

export const CardLibraryItem = ({ card, count, onClick, actionLabel = '+' }: Props) => {

    // Elemental Colors
    const elementColors: Record<string, string> = {
        fire: 'border-red-500 bg-red-900/20 text-red-100',
        air: 'border-blue-400 bg-blue-900/20 text-blue-100',
        light: 'border-yellow-400 bg-yellow-900/20 text-yellow-100',
        dark: 'border-slate-600 bg-slate-900/20 text-slate-200',
        ether: 'border-purple-500 bg-purple-900/20 text-purple-100',
    };

    const style = elementColors[card.element] || 'border-gray-500 bg-gray-800';

    return (
        <div
            onClick={onClick}
            className={twMerge(
                "relative group cursor-pointer border-l-4 rounded bg-slate-800 p-2 hover:brightness-125 transition-all mb-2 flex justify-between items-center",
                style
            )}
        >
            <div className="flex flex-col">
                <span className="font-bold text-sm">{card.name}</span>
                <span className="text-xs opacity-70 italic capitalize">{card.type} - {card.element}</span>
                {card.type === 'monster' && (
                    <span className="text-xs mt-1 font-mono">
                        ⚔️ {card.attack} / 🛡️ {card.defense}
                    </span>
                )}
                {card.type !== 'monster' && <span className="text-xs mt-1 font-mono">{card.cost} Mana</span>}
            </div>

            <div className="flex items-center gap-3">
                {count !== undefined && <span className="text-xs font-bold text-gray-400">x{count}</span>}

                <button className="bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center font-bold text-white">
                    {actionLabel}
                </button>
            </div>
        </div>
    );
};
