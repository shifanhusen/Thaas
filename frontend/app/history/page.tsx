'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface GameHistoryItem {
  id: number;
  roomId: string;
  gameType: string;
  players: { id: string; name: string; position: number }[];
  gameLog: string[];
  totalRounds: number;
  duration: number;
  createdAt: string;
  gameStatus: string;
}

export default function GameHistoryPage() {
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<GameHistoryItem | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/game-history?limit=20`);
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
        <div className="text-xl">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-md border-b border-white/10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Game History</h1>
            <p className="text-gray-400 text-sm mt-1">View past games and statistics</p>
          </div>
          <Link href="/" className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-bold transition">
            ← Back to Home
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {history.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-2xl font-bold mb-2">No games played yet</h2>
            <p className="text-gray-400">Start playing to build your history!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {history.map((game) => (
              <div
                key={game.id}
                className="bg-[#0f172a] rounded-xl border border-gray-800 p-6 hover:border-blue-500 transition cursor-pointer"
                onClick={() => setSelectedGame(game)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">BONDI - Room {game.roomId}</h3>
                    <p className="text-sm text-gray-400">{formatDate(game.createdAt)}</p>
                  </div>
                  <div className="bg-blue-600 px-3 py-1 rounded text-xs font-bold">
                    {formatDuration(game.duration)}
                  </div>
                </div>

                <div className="space-y-2">
                  {game.players.map((player, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        player.position === 1 ? 'bg-yellow-500 text-black' : 
                        player.position === game.players.length ? 'bg-red-600' : 'bg-gray-700'
                      }`}>
                        {player.position === 1 ? '🏆' : player.position === game.players.length ? '💀' : player.position}
                      </div>
                      <span className="font-medium">{player.name}</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {player.position === 1 ? 'Winner' : player.position === game.players.length ? 'Loser' : `${player.position}${player.position === 2 ? 'nd' : player.position === 3 ? 'rd' : 'th'} place`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-400">
                  {game.totalRounds} actions logged
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Game Details Modal */}
      {selectedGame && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedGame(null)}>
          <div className="bg-[#0f172a] rounded-xl border border-gray-800 max-w-3xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold">Game Details - {selectedGame.roomId}</h2>
              <p className="text-sm text-gray-400 mt-1">{formatDate(selectedGame.createdAt)}</p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <h3 className="font-bold mb-3">Players</h3>
              <div className="space-y-2 mb-6">
                {selectedGame.players.map((player, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      player.position === 1 ? 'bg-yellow-500 text-black' : 
                      player.position === selectedGame.players.length ? 'bg-red-600' : 'bg-gray-700'
                    }`}>
                      {player.position === 1 ? '🏆' : player.position === selectedGame.players.length ? '💀' : player.position}
                    </div>
                    <div>
                      <div className="font-bold">{player.name}</div>
                      <div className="text-xs text-gray-400">
                        {player.position === 1 ? 'Winner' : player.position === selectedGame.players.length ? 'Loser' : `${player.position}${player.position === 2 ? 'nd' : player.position === 3 ? 'rd' : 'th'} place`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="font-bold mb-3">Game Log</h3>
              <div className="space-y-1 bg-black/40 rounded-lg p-4 max-h-80 overflow-y-auto">
                {selectedGame.gameLog.map((log, i) => (
                  <div key={i} className="text-sm font-mono">
                    <span className="text-gray-500">#{i + 1}</span> {log}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-800">
              <button
                onClick={() => setSelectedGame(null)}
                className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
