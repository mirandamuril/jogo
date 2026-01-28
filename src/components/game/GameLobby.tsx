'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import Link from 'next/link';

import { useDeckStore } from '@/store/deck-store';

export const GameLobby = () => {
    const initializeGame = useGameStore(state => state.initializeGame);
    const setRoomId = useGameStore(state => state.setRoomId);
    const setClientPlayerId = useGameStore(state => state.setClientPlayerId);

    // Read user deck
    const customDeck = useDeckStore(state => state.deck);

    // Local state for form
    const [name, setName] = useState('Player');
    const [room, setRoom] = useState('arena-1');
    const [joined, setJoined] = useState(false);

    const handleJoin = (asPlayer: 'p1' | 'p2') => {
        if (!name || !room) return;

        setRoomId(room);
        setClientPlayerId(asPlayer); // Set who I am

        // In P2P sync, only the host (p1 usually) should init, or we rely on sync.
        // For MVP, we re-init.
        // Pass custom deck ONLY if we are P1 (Host) or if we want local override.
        // For MVP: Both players init local state. P1 uses their deck. P2 uses default (since P2 sends their state remote).
        // Actually, if I am P1, I use my deck. If I am P2, I use my deck?
        // Limitation: Currently only ONE deck array is in store for initialization logic.
        // We will pass customDeck. The store logic assigns it to P1.
        // If I am P2, and I play "as P2", the store logic currently assigns P1 deck to P1 and P2 deck to P2.
        // Wait, store init code: "const p1 = ... deck: p1Deck".
        // We need to know WHICH player I am to assign MY deck to MY player slot.
        // But initializeGame resets BOTH players.

        initializeGame(name, 'Opponent', customDeck, asPlayer);

        setJoined(true);
    };

    if (joined) return null; // Unmount lobby when joined

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-xl shadow-2xl max-w-md w-full">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-6 text-center">
                    Mystic Ether Lobby
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Your Name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Room ID</label>
                        <input
                            value={room}
                            onChange={(e) => setRoom(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <button
                            onClick={() => handleJoin('p1')}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition-all"
                        >
                            Join as Player 1
                        </button>
                        <button
                            onClick={() => handleJoin('p2')}
                            className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded transition-all"
                        >
                            Join as Player 2
                        </button>
                    </div>

                    <Link href="/deck" className="block w-full text-center mt-3 bg-slate-800 hover:bg-slate-700 text-purple-300 py-2 rounded transition-colors text-sm font-bold">
                        🎴 Edit Deck
                    </Link>

                    <p className="text-xs text-center text-slate-500 mt-4">
                        Ensure you pick different slots!
                    </p>
                </div>
            </div>
        </div>
    );
};
