'use client';

import { useState } from 'react';
import { useDeckStore } from '@/store/deck-store';
import databaseCards from '@/data/cards.json';
import { CardLibraryItem } from '@/components/deck/CardLibraryItem';
import Link from 'next/link';

export default function DeckBuilder() {
    const deck = useDeckStore(state => state.deck);
    const addToDeck = useDeckStore(state => state.addToDeck);
    const removeFromDeck = useDeckStore(state => state.removeFromDeck);
    const clearDeck = useDeckStore(state => state.clearDeck);

    // Filter Logic
    const [filter, setFilter] = useState('all');

    const library = databaseCards.filter(c => filter === 'all' || c.element === filter || c.type === filter);

    // Map deck IDs back to card data
    const deckCards = deck.map(id => databaseCards.find(c => c.id === id)).filter(Boolean);

    return (
        <div className="bg-gray-900 min-h-screen text-white flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-gray-400 hover:text-white transition-colors">← Back to Menu</Link>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        Deck Builder
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <span className={`font-mono font-bold ${deck.length === 20 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {deck.length} / 20 Cards
                    </span>
                    <button onClick={clearDeck} className="text-xs text-red-400 hover:text-red-300 underline">
                        Clear Deck
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Library */}
                <div className="w-1/2 p-4 overflow-y-auto border-r border-gray-700">
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        {['all', 'monster', 'spell', 'fire', 'air', 'earth', 'light', 'dark', 'ether'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${filter === f ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        {library.map(card => (
                            <CardLibraryItem
                                key={card.id}
                                card={card as any}
                                onClick={() => addToDeck(card.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Right: Current Deck */}
                <div className="w-1/2 p-4 overflow-y-auto bg-gray-950/50">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Your Deck</h2>

                    {deckCards.length === 0 && (
                        <div className="flex h-full flex-col items-center justify-center text-gray-600">
                            <p>Your deck is empty.</p>
                            <p className="text-sm mt-2">Click cards on the left to add them.</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        {deckCards.map((card, idx) => (
                            <CardLibraryItem
                                key={`${card!.id}-${idx}`}
                                card={card as any}
                                onClick={() => removeFromDeck(idx)}
                                actionLabel="-"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
