'use client';

import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';

// Types (should be shared but defining here for speed)
interface Card {
  suit: 'S' | 'H' | 'D' | 'C';
  rank: string;
}

interface Player {
  id: string;
  name: string;
  hand: Card[]; // Only visible for self usually, but simplified
  isSpectator: boolean;
}

interface GameState {
  roomId: string;
  players: Player[];
  currentPlayerIndex: number;
  currentTrick: { playerId: string; card: Card }[];
  leadingSuit: string | null;
  gameStatus: 'waiting' | 'playing' | 'finished';
  winner: Player | null;
}

export default function BondiGamePage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080', {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server, socket ID:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('roomCreated', (data) => {
      console.log('Room created:', data);
      setGameState(data);
      setRoomId(data.roomId);
      setJoined(true);
    });

    newSocket.on('joined', (data) => {
      setGameState(data);
      setJoined(true);
    });

    newSocket.on('playerJoined', (data) => {
      setGameState(data);
    });

    newSocket.on('gameStarted', (data) => {
      setGameState(data);
    });

    newSocket.on('gameStateUpdate', (data) => {
      setGameState(data);
    });

    newSocket.on('error', (msg) => {
      alert(msg);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const createRoom = () => {
    if (!socket || !playerName) {
      console.error('Socket or playerName missing');
      return;
    }
    if (!socket.connected) {
      console.error('Socket not connected');
      alert('Not connected to server. Please wait and try again.');
      return;
    }
    console.log('Emitting createRoom:', { name: playerName, gameType: 'bondi' });
    socket.emit('createRoom', { name: playerName, gameType: 'bondi' });
  };

  const joinRoom = () => {
    if (!socket || !playerName || !roomId) return;
    socket.emit('joinRoom', { roomId, name: playerName });
  };

  const startGame = () => {
    if (!socket || !gameState) return;
    socket.emit('startGame', { roomId: gameState.roomId });
  };

  const playCard = (card: Card) => {
    if (!socket || !gameState) return;
    socket.emit('playCard', { roomId: gameState.roomId, card });
  };

  if (!joined) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
          <h1 className="text-2xl font-bold mb-6 text-center">Play Bondi</h1>
          <div className="mb-4 text-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm">{isConnected ? 'Connected' : 'Connecting...'}</span>
          </div>
          <input
            type="text"
            placeholder="Your Name"
            className="w-full bg-gray-700 p-2 rounded mb-4 text-white"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <div className="flex gap-4 mb-4">
            <button 
              onClick={createRoom} 
              disabled={!isConnected || !playerName}
              className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Create Room
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Room Code (e.g. ABC123)"
              className="flex-1 bg-gray-700 p-2 rounded text-white uppercase placeholder:normal-case"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button 
              onClick={joinRoom} 
              disabled={!isConnected || !playerName || roomId.length !== 6}
              className="bg-green-600 hover:bg-green-500 px-4 rounded disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) return <div className="text-white">Loading...</div>;

  const myPlayer = gameState.players.find(p => p.id === socket?.id);
  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === socket?.id;

  return (
    <div className="min-h-screen bg-green-900 text-white p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Bondi Card Game</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300">Room Code:</span>
            <span className="text-2xl font-mono font-bold tracking-widest bg-gray-800 px-4 py-2 rounded">{gameState.roomId}</span>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(gameState.roomId);
                alert('Room code copied!');
              }}
              className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded text-sm"
            >
              Copy
            </button>
          </div>
          <p className="text-sm mt-2">Status: <span className="font-semibold">{gameState.gameStatus}</span></p>
        </div>
        {gameState.gameStatus === 'waiting' && (
          <button onClick={startGame} className="bg-yellow-600 hover:bg-yellow-500 px-6 py-3 rounded font-semibold">Start Game</button>
        )}
      </div>

      {/* Game Table */}
      <div className="flex-1 relative bg-green-800 rounded-xl border-8 border-green-950 shadow-inner flex items-center justify-center">
        
        {/* Opponents (Simplified positioning) */}
        <div className="absolute top-4 flex gap-4">
          {gameState.players.filter(p => p.id !== socket?.id).map(p => (
            <div key={p.id} className={`bg-gray-800 p-2 rounded ${gameState.players[gameState.currentPlayerIndex]?.id === p.id ? 'border-2 border-yellow-400' : ''}`}>
              <div className="text-center">{p.name}</div>
              <div className="text-xs text-gray-400">{p.hand.length} cards</div>
            </div>
          ))}
        </div>

        {/* Center Trick */}
        <div className="flex gap-2">
          {gameState.currentTrick.map((move, i) => (
            <div key={i} className="bg-white text-black w-16 h-24 rounded flex items-center justify-center shadow-lg border border-gray-300">
              {move.card.rank}{move.card.suit}
            </div>
          ))}
          {gameState.currentTrick.length === 0 && gameState.gameStatus === 'playing' && (
            <div className="text-green-200 opacity-50">Waiting for lead...</div>
          )}
        </div>
      </div>

      {/* My Hand */}
      <div className="mt-4">
        <div className={`text-center mb-2 ${isMyTurn ? 'text-yellow-400 font-bold' : 'text-gray-400'}`}>
          {isMyTurn ? "YOUR TURN" : `Waiting for ${gameState.players[gameState.currentPlayerIndex]?.name}...`}
        </div>
        <div className="flex justify-center gap-[-2rem] overflow-x-auto py-4">
          {myPlayer?.hand.map((card, i) => (
            <button
              key={i}
              onClick={() => isMyTurn && playCard(card)}
              className={`
                w-20 h-32 bg-white text-black rounded-lg shadow-xl border border-gray-300 
                transform hover:-translate-y-4 transition-transform -ml-8 first:ml-0
                flex flex-col items-center justify-center
                ${['H', 'D'].includes(card.suit) ? 'text-red-600' : 'text-black'}
              `}
            >
              <span className="text-xl font-bold">{card.rank}</span>
              <span className="text-2xl">{getSuitSymbol(card.suit)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function getSuitSymbol(suit: string) {
  switch (suit) {
    case 'S': return '♠';
    case 'H': return '♥';
    case 'D': return '♦';
    case 'C': return '♣';
    default: return suit;
  }
}
