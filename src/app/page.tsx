'use client';

import dynamic from 'next/dynamic';

const Battlefield = dynamic(() => import('@/components/game/Battlefield'), {
  ssr: false,
  loading: () => <p className="text-white">Loading Game Engine...</p>
});

import { GameHUD } from '@/components/game/GameHUD';
import { GameLobby } from '@/components/game/GameLobby';
import { MultiplayerManager } from '@/components/game/MultiplayerManager';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900">
      <h1 className="text-2xl text-white mb-4 font-bold">Mystic Ether PvP</h1>
      <div className="border-4 border-slate-700 rounded-lg overflow-hidden shadow-2xl shadow-purple-500/20 relative">
        <MultiplayerManager />
        <GameLobby />
        <Battlefield />
        <GameHUD />
      </div>
      <div className="mt-4 text-gray-400 text-sm">
        <p>Alpha Build v0.2.0</p>
      </div>
    </main>
  );
}
