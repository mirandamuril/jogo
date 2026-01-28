export type CardType = 'monster' | 'spell' | 'trap';
export type CardElement = 'fire' | 'air' | 'light' | 'dark' | 'ether';
export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Card {
    id: string;
    name: string;
    type: CardType;
    element: CardElement;
    cost: number;
    attack?: number; // Only for monsters
    defense?: number; // Only for monsters
    description: string;
    image: string; // Path to asset
    rarity: CardRarity;
    subType?: string; // e.g., "Fairy", "Ethereal Entity"
}

export interface CardInstance extends Card {
    instanceId: string; // Unique ID for this specific card in the game
    currentAttack?: number;
    currentDefense?: number;
    canAttack: boolean;
    faceUp: boolean;
}

export type Phase = 'draw' | 'standby' | 'main' | 'battle' | 'end';

export interface Player {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    hand: CardInstance[];
    deck: string[]; // Card IDs
    graveyard: CardInstance[];
    field: {
        monsters: (CardInstance | null)[]; // 5 Slots
        spells: (CardInstance | null)[];   // 5 Slots
    };
}

export interface GameState {
    roomId: string | null;
    turn: number;
    currentPhase: Phase;
    activePlayerId: string;
    clientPlayerId: string | null; // 'p1' or 'p2' (Local view)
    interactionState: {
        type: 'selected_attacker' | 'summon';
        instanceId: string;
    } | null;
    lastEvent: {
        type: 'attack' | 'damage';
        attackerId?: string;
        targetId?: string;
        damage?: number;
        timestamp: number;
    } | null;
    players: {
        [id: string]: Player;
    };
    winner: string | null;
}
