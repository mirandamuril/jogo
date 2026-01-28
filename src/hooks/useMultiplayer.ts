import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useGameStore } from '@/store/game-store';

export const useMultiplayer = (roomId: string | null) => {
    const players = useGameStore(state => state.players);
    // We can access actions via hook or store api
    const playCard = useGameStore(state => state.playCard);
    const nextPhase = useGameStore(state => state.nextPhase);
    const drawCard = useGameStore(state => state.drawCard);
    const setBroadcaster = useGameStore(state => state.setBroadcaster);

    useEffect(() => {
        if (!roomId || !supabase) return;

        const channel = supabase.channel(`room:${roomId}`, {
            config: {
                broadcast: { self: false } // Don't receive my own messages
            }
        });

        const broadcastAction = async (type: string, payload: any) => {
            if (!roomId || !supabase) return;
            await channel.send({
                type: 'broadcast',
                event: 'game_action',
                payload: { type, ...payload }
            });
        };

        // Inject broadcaster into store
        setBroadcaster(broadcastAction);

        channel
            .on('broadcast', { event: 'game_action' }, ({ payload }) => {
                console.log('Received Remote Action:', payload);

                switch (payload.type) {
                    case 'playCard':
                        playCard(payload.playerId, payload.cardInstanceId, payload.slotIndex, { isRemote: true });
                        break;
                    case 'nextPhase':
                        nextPhase({ isRemote: true });
                        break;
                    case 'drawCard':
                        drawCard(payload.playerId);
                        break;
                    case 'resolveAttack':
                        useGameStore.getState().resolveAttack(payload.attackerInstanceId, payload.targetInstanceId, { isRemote: true });
                        break;
                    // Add other actions
                }
            })
            .subscribe((status) => {
                console.log('Supabase Channel Status:', status);
            });

        return () => {
            supabase!.removeChannel(channel);
            setBroadcaster(() => { }); // clear
        };
    }, [roomId]);

    return {};
};
