import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DeckState {
    deck: string[]; // List of Card IDs
    addToDeck: (cardId: string) => void;
    removeFromDeck: (index: number) => void; // Remove by slot index, not ID (allow duplicates?)
    clearDeck: () => void;
}

export const useDeckStore = create<DeckState>()(
    persist(
        (set) => ({
            deck: [],
            addToDeck: (cardId) => set((state) => {
                if (state.deck.length >= 20) return state; // Max 20
                return { deck: [...state.deck, cardId] };
            }),
            removeFromDeck: (index) => set((state) => ({
                deck: state.deck.filter((_, i) => i !== index)
            })),
            clearDeck: () => set({ deck: [] }),
        }),
        {
            name: 'mystic-ether-deck',
        }
    )
);
