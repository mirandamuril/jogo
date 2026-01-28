'use client';

import { Stage, Container, Text, Graphics, Sprite } from '@pixi/react';
import { useGameStore } from '@/store/game-store';
import { useEffect, useState } from 'react';
import { TextStyle } from 'pixi.js';
import { CardInstance } from '@/lib/game-engine/types';

// Screen Dimensions
const WIDTH = 1200;
const HEIGHT = 800;

const Battlefield = () => {
    const initializeGame = useGameStore(state => state.initializeGame);
    const players = useGameStore(state => state.players);
    const activePlayerId = useGameStore(state => state.activePlayerId);
    const phase = useGameStore(state => state.currentPhase);
    const interactionState = useGameStore(state => state.interactionState);
    const resolveAttack = useGameStore(state => state.resolveAttack);
    const clientPlayerId = useGameStore(state => state.clientPlayerId) || 'p1';
    const lastEvent = useGameStore(state => state.lastEvent);

    // View Logic: Rotate board
    const bottomPlayerId = clientPlayerId;
    const topPlayerId = clientPlayerId === 'p1' ? 'p2' : 'p1';

    // Visual Effects State
    const [effects, setEffects] = useState<{ id: number, text: string, x: number, y: number, color: string, alpha: number }[]>([]);

    useEffect(() => {
        initializeGame('Hero', 'Villain');
    }, []);

    // Effect Listener
    useEffect(() => {
        if (lastEvent?.type === 'attack') {
            const { damage } = lastEvent;

            // Simple generic centered explosion for MVP
            const newEffect = {
                id: Date.now(),
                text: `-${damage}`,
                x: WIDTH / 2 + (Math.random() * 200 - 100),
                y: HEIGHT / 2 + (Math.random() * 200 - 100),
                color: '#ff4757',
                alpha: 1
            };

            setEffects(prev => [...prev, newEffect]);

            // Animation Loop (local to this effect instance purely for simplicity in React)
            // Ideally we use a useTick from Pixi, but standard interval works key for simple floating text
        }
    }, [lastEvent]);

    // Global Animation Ticker for Effects
    useEffect(() => {
        const interval = setInterval(() => {
            setEffects(current => current.map(e => ({
                ...e,
                y: e.y - 1,
                alpha: e.alpha - 0.02
            })).filter(e => e.alpha > 0));
        }, 16); // ~60fps
        return () => clearInterval(interval);
    }, []);

    if (!players['p1'] || !players['p2']) return <div className="text-white">Loading Arena...</div>;

    const onFieldClick = (playerId: string) => {
        // Direct Attack Logic
        if (phase === 'battle' && activePlayerId !== playerId && interactionState?.type === 'selected_attacker') {
            resolveAttack(interactionState.instanceId, 'direct');
        }
    };

    return (
        <Stage width={WIDTH} height={HEIGHT} options={{ background: 0x1099bb }}>
            <Container>
                {/* HUD Info */}
                <Text
                    text={`Turn: ${players[activePlayerId]?.name} (${phase})`}
                    x={20}
                    y={20}
                    style={new TextStyle({ fill: 'white', fontWeight: 'bold', dropShadow: true })}
                />

                {/* Hand Zones */}
                <PlayerHand playerId={bottomPlayerId} y={600} isSelf={true} />
                <PlayerHand playerId={topPlayerId} y={50} isSelf={false} />

                {/* Field Zones */}
                <FieldZone playerId={bottomPlayerId} y={400} onClick={() => onFieldClick(bottomPlayerId)} />
                <FieldZone playerId={topPlayerId} y={200} onClick={() => onFieldClick(topPlayerId)} />

                {/* Selection Indicator */}
                {interactionState?.type === 'selected_attacker' && (
                    <Text
                        text="SELECT TARGET"
                        x={WIDTH / 2}
                        y={HEIGHT / 2}
                        anchor={0.5}
                        style={new TextStyle({ fill: '#ff4757', fontSize: 36, fontWeight: 'bold', dropShadow: true, dropShadowColor: 'black' })}
                    />
                )}

                {/* Visual Effects Layer */}
                {effects.map(effect => (
                    <Text
                        key={effect.id}
                        text={effect.text}
                        x={effect.x}
                        y={effect.y}
                        alpha={effect.alpha}
                        style={new TextStyle({
                            fill: effect.color,
                            fontSize: 50,
                            fontWeight: 'bold',
                            stroke: 'white',
                            strokeThickness: 4,
                            dropShadow: true,
                            dropShadowDistance: 2
                        })}
                        anchor={0.5}
                    />
                ))}
            </Container>
        </Stage>
    );
};

const PlayerHand = ({ playerId, y, isSelf }: { playerId: string, y: number, isSelf: boolean }) => {
    const hand = useGameStore(state => state.players[playerId].hand);
    const startX = (WIDTH - (hand.length * 110)) / 2;

    return (
        <Container y={y} x={startX}>
            {hand.map((card, i) => (
                <CardSprite
                    key={card.instanceId}
                    card={card}
                    x={i * 110}
                    y={0}
                    location="hand"
                    ownerId={playerId}
                    slotIndex={i}
                    isHidden={!isSelf}
                />
            ))}
        </Container>
    );
};

const FieldZone = ({ playerId, y, onClick }: { playerId: string, y: number, onClick: () => void }) => {
    const monsters = useGameStore(state => state.players[playerId].field.monsters);
    const startX = (WIDTH - (5 * 110)) / 2;

    return (
        <Container y={y} x={startX}>
            <Graphics
                draw={(g) => {
                    g.clear();
                    g.beginFill(0x000000, 0.05);
                    g.drawRoundedRect(-10, -10, (5 * 110) + 10, 160, 10);
                    g.endFill();
                }}
                interactive={true}
                onpointerdown={onClick}
            />

            {monsters.map((card, i) => (
                <Container key={i} x={i * 110}>
                    <Graphics
                        draw={(g) => {
                            g.clear();
                            g.lineStyle(2, 0xFFFFFF, 0.1);
                            g.drawRoundedRect(0, 0, 100, 140, 8);
                        }}
                    />
                    {card && <CardSprite card={card} x={0} y={0} location="field" ownerId={playerId} slotIndex={i} isHidden={false} />}
                </Container>
            ))}
        </Container>
    );
}

interface CardSpriteProps {
    card: CardInstance;
    x: number;
    y: number;
    location: 'hand' | 'field';
    ownerId: string;
    slotIndex: number;
    isHidden: boolean;
}

const CardSprite = ({ card, x, y, location, ownerId, slotIndex, isHidden }: CardSpriteProps) => {
    const playCard = useGameStore(state => state.playCard);
    const setSelection = useGameStore(state => state.setSelection);
    const resolveAttack = useGameStore(state => state.resolveAttack);
    const activePlayerId = useGameStore(state => state.activePlayerId);
    const phase = useGameStore(state => state.currentPhase);
    const interactionState = useGameStore(state => state.interactionState);

    const [hover, setHover] = useState(false);

    const isOwner = activePlayerId === ownerId;
    const isSelected = interactionState?.instanceId === card.instanceId;

    const onClick = (e: any) => {
        if (isHidden) return;

        e.stopPropagation();

        if (location === 'hand') {
            if (isOwner && phase === 'main') {
                const hasMonsters = useGameStore.getState().players[ownerId].field.monsters;
                const emptySlot = hasMonsters.findIndex(m => m === null);
                if (emptySlot !== -1) {
                    playCard(ownerId, card.instanceId, emptySlot);
                }
            }
        } else if (location === 'field') {
            if (isOwner) {
                if (phase === 'battle' && card.canAttack) {
                    setSelection(card.instanceId);
                }
            } else {
                if (phase === 'battle' && interactionState?.type === 'selected_attacker') {
                    resolveAttack(interactionState.instanceId, card.instanceId);
                }
            }
        }
    };

    let borderColor = 0xFFFFFF;
    let borderWidth = 0;

    if (isSelected) {
        borderColor = 0xfffa65;
        borderWidth = 4;
    } else if (location === 'field' && isOwner && phase === 'battle' && card.canAttack) {
        borderColor = 0x55efc4;
        borderWidth = 3;
    } else if (location === 'field' && !isOwner && interactionState?.type === 'selected_attacker') {
        borderColor = 0xff7675;
        borderWidth = 3;
    }

    const width = 100;
    const height = 140;

    if (isHidden) {
        return (
            <Container x={x} y={y}>
                <Graphics
                    draw={(g) => {
                        g.clear();
                        g.lineStyle(2, 0x1a1a2e);
                        g.beginFill(0x2d3436);
                        g.drawRoundedRect(0, 0, width, height, 8);
                        g.endFill();

                        g.lineStyle(2, 0x636e72, 0.3);
                        g.drawCircle(width / 2, height / 2, 20);
                        g.drawCircle(width / 2, height / 2, 35);
                        g.moveTo(0, 0); g.lineTo(width, height);
                        g.moveTo(width, 0); g.lineTo(0, height);
                    }}
                />
            </Container>
        );
    }

    return (
        <Container
            x={x}
            y={y - (hover ? 10 : 0)}
            interactive={true}
            onpointerdown={onClick}
            onpointerenter={() => setHover(true)}
            onpointerleave={() => setHover(false)}
            cursor="pointer"
        >
            <Graphics
                draw={(g) => {
                    g.clear();

                    if (borderWidth > 0) {
                        g.lineStyle(borderWidth, borderColor, 0.8);
                        g.beginFill(0xFFFFFF, 0.0);
                        g.drawRoundedRect(-2, -2, width + 4, height + 4, 10);
                        g.endFill();
                    }

                    g.lineStyle(2, 0xb2bec3);
                    g.beginFill(0x1e272e);
                    g.drawRoundedRect(0, 0, width, height, 8);
                    g.endFill();

                    g.beginFill(getColor(card.element));
                    g.drawRoundedRect(2, 2, width - 4, 24, 6);
                    g.endFill();

                    g.beginFill(0x000000, 0.3);
                    g.drawRect(8, 30, width - 16, 60);
                    g.endFill();

                    g.beginFill(0x000000, 0.6);
                    g.drawRoundedRect(5, 110, width - 10, 25, 4);
                    g.endFill();
                }}
            />

            <Sprite
                image={card.image}
                x={8}
                y={30}
                width={width - 16}
                height={60}
            />

            <Text
                text={card.name}
                style={new TextStyle({
                    fill: 'white',
                    fontSize: 11,
                    fontWeight: 'bold',
                    dropShadow: true,
                    dropShadowBlur: 2,
                    dropShadowColor: '#000000',
                    dropShadowDistance: 1
                })}
                x={width / 2}
                y={14}
                anchor={0.5}
            />

            {card.type === 'monster' && (
                <Text
                    text={`ATK ${card.attack}\nDEF ${card.defense}`}
                    style={new TextStyle({
                        fill: '#fab1a0',
                        fontSize: 10,
                        fontWeight: 'bold',
                        align: 'center',
                        lineHeight: 12
                    })}
                    x={width / 2}
                    y={122}
                    anchor={0.5}
                />
            )}

            {card.type !== 'monster' && (
                <Text
                    text={`${card.type.toUpperCase()}`}
                    style={new TextStyle({
                        fill: '#a29bfe',
                        fontSize: 10,
                        fontWeight: 'bold',
                        align: 'center'
                    })}
                    x={width / 2}
                    y={122}
                    anchor={0.5}
                />
            )}

            <Text
                text={`${card.cost}`}
                style={new TextStyle({
                    fill: '#74b9ff',
                    fontSize: 14,
                    fontWeight: 'bold',
                    stroke: '#000000',
                    strokeThickness: 2
                })}
                x={width - 5}
                y={height - 5}
                anchor={{ x: 1, y: 1 }}
            />
        </Container>
    );
};

const getColor = (el: string) => {
    switch (el) {
        case 'fire': return 0xd63031;
        case 'air': return 0x74b9ff;
        case 'light': return 0xf1c40f;
        case 'dark': return 0x2d3436;
        case 'ether': return 0xa29bfe;
        default: return 0x636e72;
    }
};

export default Battlefield;
