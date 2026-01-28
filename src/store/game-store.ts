import { create } from 'zustand';
import { GameState, Player, Card, CardInstance, Phase } from '@/lib/game-engine/types';
import databaseCards from '@/data/cards.json';

// Helper to create a card instance
const createInstance = (cardId: string): CardInstance => {
    const def = (databaseCards as Card[]).find(c => c.id === cardId);
    if (!def) throw new Error(`Card definitions not found: ${cardId}`);

    return {
        ...def,
        instanceId: crypto.randomUUID(),
        canAttack: true,
        faceUp: true,
        currentAttack: def.attack,
        currentDefense: def.defense,
    };
};

interface GameActions {
    initializeGame: (p1Name: string, p2Name: string, customDeck?: string[], customDeckPlayerId?: string) => void;
    nextPhase: (options?: { isRemote?: boolean }) => void;
    drawCard: (playerId: string) => void;
    playCard: (playerId: string, cardInstanceId: string, slotIndex: number, options?: { isRemote?: boolean }) => void;
    setSelection: (instanceId: string | null) => void;
    resolveAttack: (attackerInstanceId: string, targetInstanceId: string | 'direct', options?: { isRemote?: boolean }) => void;
    setRoomId: (roomId: string) => void;
    setClientPlayerId: (id: string) => void;
    setBroadcaster: (fn: (type: string, payload: any) => void) => void;
    broadcaster: ((type: string, payload: any) => void) | null;
}

// Initial 40-card deck (4 copies of each of the 10 cards)
const STARTING_DECK = databaseCards.flatMap(c => [c.id, c.id, c.id, c.id]);

function shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
    roomId: null,
    turn: 1,
    currentPhase: 'draw',
    activePlayerId: 'p1',
    players: {},
    interactionState: null,
    lastEvent: null,
    winner: null,
    broadcaster: null,
    clientPlayerId: null,

    setClientPlayerId: (id) => set({ clientPlayerId: id }),
    setBroadcaster: (fn) => set({ broadcaster: fn }),

    initializeGame: (p1Name, p2Name, customDeck, customDeckPlayerId = 'p1') => {

        let p1Deck = shuffle(STARTING_DECK);
        let p2Deck = shuffle(STARTING_DECK); // Default MVP: Opponent uses random deck if not synced

        if (customDeck && customDeck.length > 0) {
            const playerDeck = shuffle(customDeck);
            if (customDeckPlayerId === 'p1') {
                p1Deck = playerDeck;
            } else {
                p2Deck = playerDeck;
            }
        }

        const p1: Player = {
            id: 'p1',
            name: p1Name,
            hp: 4000,
            maxHp: 4000,
            mana: 1,
            maxMana: 1,
            hand: [],
            deck: p1Deck,
            graveyard: [],
            field: { monsters: Array(5).fill(null), spells: Array(5).fill(null) }
        };

        const p2: Player = {
            id: 'p2',
            name: p2Name,
            hp: 4000,
            maxHp: 4000,
            mana: 1,
            maxMana: 1,
            hand: [],
            deck: p2Deck, // Uses custom if initialized as P2
            graveyard: [],
            field: { monsters: Array(5).fill(null), spells: Array(5).fill(null) }
        };

        const drawInitial = (p: Player) => {
            for (let i = 0; i < 5; i++) {
                const cardId = p.deck.pop();
                if (cardId) p.hand.push(createInstance(cardId));
            }
        };
        drawInitial(p1);
        drawInitial(p2);

        set({
            players: { p1, p2 },
            turn: 1,
            currentPhase: 'draw',
            activePlayerId: 'p1',
            winner: null,
            interactionState: null,
            lastEvent: null
        });
    },

    nextPhase: (options) => {
        const { currentPhase, activePlayerId, turn, players, broadcaster } = get();
        const isRemote = options?.isRemote;

        // Broadcast if local
        if (!isRemote && broadcaster) {
            broadcaster('nextPhase', {});
        }

        // Reset selection
        set({ interactionState: null });

        let next: Phase = 'draw';
        let nextPlayer = activePlayerId;
        let nextTurn = turn;

        // Simple Phase Loop
        switch (currentPhase) {
            case 'draw': next = 'main'; break;
            case 'main': next = 'battle'; break;
            case 'battle': next = 'end'; break;
            case 'end':
                next = 'draw';
                nextPlayer = activePlayerId === 'p1' ? 'p2' : 'p1';
                nextTurn = turn + 1;
                break;
        }

        // Logic for new turn
        if (nextPlayer !== activePlayerId) {
            // Reset Mana
            const p = players[nextPlayer];
            const newMaxMana = Math.min(p.maxMana + 1, 10);

            set(state => ({
                activePlayerId: nextPlayer,
                currentPhase: next,
                turn: nextTurn,
                players: {
                    ...state.players,
                    [nextPlayer]: {
                        ...state.players[nextPlayer],
                        maxMana: newMaxMana,
                        mana: newMaxMana,
                        // Reset monster attacks
                        field: {
                            ...state.players[nextPlayer].field,
                            monsters: state.players[nextPlayer].field.monsters.map(m => m ? ({ ...m, canAttack: true }) : null)
                        }
                    }
                }
            }));

            get().drawCard(nextPlayer);
        } else {
            set({ currentPhase: next });
        }
    },

    drawCard: (playerId) => {
        set(state => {
            const p = state.players[playerId];
            if (p.deck.length === 0) return state;

            const newDeck = [...p.deck];
            const cardId = newDeck.pop()!;
            const newCard = createInstance(cardId);

            return {
                players: {
                    ...state.players,
                    [playerId]: {
                        ...p,
                        deck: newDeck,
                        hand: [...p.hand, newCard]
                    }
                }
            };
        });
    },

    playCard: (playerId, cardInstanceId, slotIndex, options) => {
        set(state => {
            const isRemote = options?.isRemote;

            // Broadcast
            if (!isRemote && state.broadcaster) {
                state.broadcaster('playCard', { playerId, cardInstanceId, slotIndex });
            }

            // Can only play in Main Phase & Active Player (unless remote override)
            if (!isRemote && (state.currentPhase !== 'main' || state.activePlayerId !== playerId)) return state;

            const p = state.players[playerId];
            const cardIndex = p.hand.findIndex(c => c.instanceId === cardInstanceId);
            if (cardIndex === -1) return state;

            const card = p.hand[cardIndex];

            // Cost Check
            if (p.mana < card.cost) return state;

            // Logic based on Type
            if (card.type === 'monster') {
                if (p.field.monsters[slotIndex] !== null) return state;

                const newHand = [...p.hand];
                newHand.splice(cardIndex, 1);

                const newMonsters = [...p.field.monsters];
                newMonsters[slotIndex] = { ...card, canAttack: true }; // Enable "Haste" for better UX

                return {
                    players: {
                        ...state.players,
                        [playerId]: {
                            ...p,
                            mana: p.mana - card.cost,
                            hand: newHand,
                            field: { ...p.field, monsters: newMonsters }
                        }
                    }
                };
            } else {
                const newHand = [...p.hand];
                newHand.splice(cardIndex, 1);
                return {
                    players: {
                        ...state.players,
                        [playerId]: {
                            ...p,
                            mana: p.mana - card.cost,
                            hand: newHand,
                            graveyard: [...p.graveyard, card]
                        }
                    }
                };
            }
        });
    },

    setSelection: (instanceId) => {
        set({ interactionState: instanceId ? { type: 'selected_attacker', instanceId } : null });
    },

    resolveAttack: (attackerInstanceId, targetInstanceId, options) => {
        set(state => {
            const isRemote = options?.isRemote;

            if (!isRemote && state.broadcaster) {
                state.broadcaster('resolveAttack', { attackerInstanceId, targetInstanceId });
            }

            if (state.currentPhase !== 'battle') return state;

            const attackerPlayerId = state.activePlayerId;
            const defenderPlayerId = attackerPlayerId === 'p1' ? 'p2' : 'p1';

            const attackerPlayer = state.players[attackerPlayerId];
            const defenderPlayer = state.players[defenderPlayerId];

            // Find Attacker
            const attackerCardIndex = attackerPlayer.field.monsters.findIndex(m => m?.instanceId === attackerInstanceId);
            const attackerCard = attackerPlayer.field.monsters[attackerCardIndex];

            // Logic Checks
            if (!attackerCard || !attackerCard.canAttack || !attackerCard.currentAttack) return state;

            let newAttacker = { ...attackerCard, canAttack: false };
            let newDefenderMonsters = [...defenderPlayer.field.monsters];
            let newAttackerMonsters = [...attackerPlayer.field.monsters];
            let defenderHp = defenderPlayer.hp;
            let attackerHp = attackerPlayer.hp;
            let winnerId = null;

            if (targetInstanceId === 'direct') {
                const hasMonsters = defenderPlayer.field.monsters.some(m => m !== null);
                if (hasMonsters) return state;

                defenderHp -= attackerCard.currentAttack;
            } else {
                const targetIndex = defenderPlayer.field.monsters.findIndex(m => m?.instanceId === targetInstanceId);
                const targetCard = defenderPlayer.field.monsters[targetIndex];

                if (!targetCard || targetCard.currentAttack === undefined) return state;

                const damage = attackerCard.currentAttack - (targetCard.currentAttack || 0);

                if (damage > 0) {
                    newDefenderMonsters[targetIndex] = null;
                    defenderHp -= damage;
                } else if (damage < 0) {
                    newAttackerMonsters[attackerCardIndex] = null;
                    newAttacker = null as any;
                    attackerHp += damage;
                } else {
                    newDefenderMonsters[targetIndex] = null;
                    newAttackerMonsters[attackerCardIndex] = null;
                    newAttacker = null as any;
                }
            }

            if (newAttacker) newAttackerMonsters[attackerCardIndex] = newAttacker;

            if (defenderHp <= 0) winnerId = attackerPlayerId;
            if (attackerHp <= 0) winnerId = defenderPlayerId;

            return {
                interactionState: null,
                winner: winnerId,
                lastEvent: {
                    type: 'attack',
                    attackerId: attackerInstanceId,
                    targetId: targetInstanceId,
                    damage: attackerCard.currentAttack,
                    timestamp: Date.now()
                },
                players: {
                    ...state.players,
                    [attackerPlayerId]: {
                        ...attackerPlayer,
                        hp: attackerHp,
                        field: { ...attackerPlayer.field, monsters: newAttackerMonsters }
                    },
                    [defenderPlayerId]: {
                        ...defenderPlayer,
                        hp: defenderHp,
                        field: { ...defenderPlayer.field, monsters: newDefenderMonsters }
                    }
                }
            };
        });
    },

    setRoomId: (roomId) => set({ roomId })
}));
