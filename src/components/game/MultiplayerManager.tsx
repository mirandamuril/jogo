'use client';

import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useGameStore } from '@/store/game-store';

export const MultiplayerManager = () => {
    const roomId = useGameStore(state => state.roomId);

    // This hook manages the connection side effects
    useMultiplayer(roomId);

    return null; // Logic only component
};
