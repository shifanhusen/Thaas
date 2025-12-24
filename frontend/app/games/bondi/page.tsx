'use client';

import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import Link from 'next/link';

// Types
interface Card {
  suit: 'S' | 'H' | 'D' | 'C';
  rank: string;
}

interface Player {
  id: string;
  name: string;
  hand: Card[];
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
  const [activeTab, setActiveTab] = useState('Objective');

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
    if (!socket || !playerName) return;
    if (!socket.connected) {
      alert('Not connected to server. Please wait.');
      return;
    }
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

  // --- RENDER: ENTRY SCREEN ---
  if (!joined) {
    return (
      <div className="min-h-screen bg-[#020617] text-white font-sans flex flex-col">
        <div className="p-6">
          <Link href="/" className="text-gray-400 hover:text-white flex items-center text-sm font-bold tracking-wider">
            ← BACK TO HOME
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 gap-16">
          {/* Left: Game Entry Card */}
          <div className="bg-[#0f172a] p-8 rounded-3xl border border-gray-800 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
            
            <div className="text-center mb-8">
              <h1 className="text-5xl font-black tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">BONDI</h1>
              <p className="text-gray-500 text-xs font-bold tracking-[0.2em]">MALDIVIAN TRICK-TAKING</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter Your Name"
                  className="w-full bg-[#1e293b] border border-gray-700 p-4 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-center font-medium"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={createRoom}
                  disabled={!isConnected || !playerName}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                >
                  <span className="text-lg">▶</span> CREATE ROOM
                </button>
                
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="ROOM CODE"
                    maxLength={6}
                    className="flex-1 bg-[#1e293b] border border-gray-700 p-4 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-center font-mono uppercase tracking-widest"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  />
                  <button 
                    onClick={joinRoom}
                    disabled={!isConnected || !playerName || roomId.length !== 6}
                    className="bg-[#1e293b] hover:bg-[#283548] text-white font-bold px-6 rounded-xl border border-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    JOIN
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">Loading...</div>;

  const myPlayer = gameState.players.find(p => p.id === socket?.id);
  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === socket?.id;

  // --- RENDER: LOBBY SCREEN ---
  if (gameState.gameStatus === 'waiting') {
    return (
      <div className="min-h-screen bg-[#020617] text-white font-sans flex flex-col items-center justify-center p-4">
        <div className="absolute top-6 left-6">
          <div className="bg-[#1e293b] px-4 py-2 rounded-lg border border-gray-700">
            <span className="text-xs text-gray-500 block mb-1">ROOM CODE</span>
            <span className="font-mono font-bold text-xl tracking-widest">{gameState.roomId}</span>
          </div>
        </div>

        <div className="bg-[#0f172a] p-12 rounded-[2rem] border border-gray-800 w-full max-w-md text-center shadow-2xl">
          <div className="bg-white p-4 rounded-xl w-48 h-48 mx-auto mb-8 flex items-center justify-center">
            {/* Placeholder QR Code */}
            <div className="w-full h-full bg-black pattern-grid-lg opacity-90"></div> 
          </div>
          
          <div className="mb-8">
            <p className="text-gray-500 text-xs font-bold tracking-widest mb-2">ROOM CODE</p>
            <h2 className="text-5xl font-mono font-bold tracking-wider">{gameState.roomId}</h2>
          </div>

          <div className="space-y-3">
            <button 
              onClick={startGame}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-xl">▶</span> Start Game
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400 text-sm font-bold">PLAYERS ({gameState.players.length})</span>
            </div>
            <div className="space-y-2">
              {gameState.players.map(p => (
                <div key={p.id} className="bg-[#1e293b] p-3 rounded-lg flex items-center gap-3 border border-gray-700">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-medium">{p.name}</span>
                  {p.id === gameState.players[0].id && <span className="ml-auto text-xs text-yellow-500">HOST</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: GAME SCREEN ---
  return (
    <div className="min-h-screen bg-[#0f172a] text-white overflow-hidden relative perspective-1000">
      {/* Background Stars/Grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <div className="bg-[#1e293b] px-3 py-1 rounded border border-gray-700">
            <span className="text-xs text-gray-400">ROOM:</span> <span className="font-mono font-bold">{gameState.roomId}</span>
          </div>
        </div>
      </div>

      {/* 3D Game Table Container */}
      <div className="w-full h-screen flex items-center justify-center perspective-[1200px]">
        <div className="relative w-[800px] h-[500px] transform-style-3d rotate-x-20">
          
          {/* The Table Surface */}
          <div className="absolute inset-0 bg-[#1e293b]/80 rounded-[3rem] border-4 border-gray-600 shadow-2xl backdrop-blur-sm transform rotateX(40deg) scale-90">
            <div className="absolute inset-4 border-2 border-white/10 rounded-[2.5rem]"></div>
          </div>

          {/* Opponents */}
          {gameState.players.filter(p => p.id !== socket?.id).map((p, i) => {
            // Simple positioning logic for up to 3 opponents
            const positions = [
              'top-0 left-1/2 -translate-x-1/2 -translate-y-16', // Top Center
              'top-1/2 left-0 -translate-x-16 -translate-y-1/2', // Left
              'top-1/2 right-0 translate-x-16 -translate-y-1/2', // Right
            ];
            const pos = positions[i % 3]; // Fallback for more players needed

            return (
              <div key={p.id} className={`absolute ${pos} flex flex-col items-center transition-all duration-500`}>
                <div className="w-16 h-16 bg-gradient-to-b from-gray-700 to-gray-900 rounded-full border-2 border-gray-500 shadow-lg flex items-center justify-center relative">
                  <div className="w-10 h-4 bg-black rounded-full opacity-50 mb-2"></div> {/* Visor */}
                  <div className="absolute -right-2 -top-2 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full border border-white">
                    {p.hand.length}
                  </div>
                </div>
                <div className="mt-2 bg-black/50 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/10">
                  {p.name}
                </div>
              </div>
            );
          })}

          {/* Center Trick Area */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-32 h-48">
              {gameState.currentTrick.map((move, i) => (
                <PlayingCard
                  key={i}
                  card={move.card}
                  className="absolute left-0 top-0 w-24 h-36 md:w-32 md:h-48 transform transition-all duration-500"
                  style={{ 
                    transform: `rotate(${i * 15 - (gameState.currentTrick.length * 7)}deg) translateY(${i * -2}px)`,
                    zIndex: i 
                  }}
                />
              ))}
            </div>
          </div>

          {/* My Player (Bottom) */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center z-20">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-b from-blue-600 to-blue-900 rounded-full border-4 border-blue-400 shadow-xl mb-4 relative transform translate-y-8 md:translate-y-0">
              {isMyTurn && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-yellow-400 text-black font-bold px-3 py-1 rounded-full animate-bounce text-sm whitespace-nowrap">
                  YOUR TURN
                </div>
              )}
            </div>
            
            {/* My Hand - Responsive Layout */}
            {/* Mobile: Overlapped Row */}
            <div className="md:hidden w-full flex justify-center items-end h-32 px-2 pb-4 relative">
              {sortHand(myPlayer?.hand || []).map((card, i, arr) => {
                // Calculate overlap for mobile
                const totalWidth = Math.min(window.innerWidth - 40, arr.length * 40); // Max width or spread
                const startX = -(totalWidth / 2);
                const step = totalWidth / (arr.length || 1);
                const x = startX + (i * step) + (step / 2);
                
                return (
                  <PlayingCard
                    key={i}
                    card={card}
                    onClick={() => isMyTurn && playCard(card)}
                    className={`
                      w-20 h-28 absolute bottom-0
                      transform transition-all duration-300
                      shadow-lg
                    `}
                    style={{ 
                      zIndex: i,
                      left: '50%',
                      marginLeft: `${x}px`,
                      transform: isMyTurn ? `translateY(${i === arr.length - 1 ? -10 : 0}px)` : 'none' // Simple pop for last card or active
                    }}
                  />
                );
              })}
            </div>

            {/* Desktop: Fanned Hand */}
            <div className="hidden md:flex justify-center items-end h-40 perspective-500 w-full px-4 mb-8">
              {sortHand(myPlayer?.hand || []).map((card, i, arr) => {
                const offset = i - (arr.length - 1) / 2;
                const rotation = offset * 3; // Reduced rotation
                const translateY = Math.abs(offset) * 2; // Reduced arc

                return (
                  <PlayingCard
                    key={i}
                    card={card}
                    onClick={() => isMyTurn && playCard(card)}
                    className={`
                      w-28 h-40 
                      transform transition-all duration-300 hover:-translate-y-16 hover:scale-110 hover:z-50
                      -ml-16 first:ml-0 cursor-pointer shadow-2xl
                    `}
                    style={{
                      transform: `rotate(${rotation}deg) translateY(${translateY}px)`,
                      zIndex: i
                    }}
                  />
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- HELPERS ---

function sortHand(hand: Card[]) {
  const suitOrder = { 'D': 0, 'C': 1, 'H': 2, 'S': 3 }; // Diamonds, Clubs, Hearts, Spades
  const rankOrder: { [key: string]: number } = { 
    'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 
  };

  return [...hand].sort((a, b) => {
    if (a.suit !== b.suit) return suitOrder[a.suit] - suitOrder[b.suit];
    return rankOrder[b.rank] - rankOrder[a.rank]; // Descending rank
  });
}

function PlayingCard({ card, onClick, style, className }: { card: Card, onClick?: () => void, style?: React.CSSProperties, className?: string }) {
  // Map our types to DeckOfCardsAPI format
  const getCardCode = (c: Card) => {
    let r = c.rank;
    if (r === '10') r = '0';
    return `${r}${c.suit}`;
  };

  const imageUrl = `https://deckofcardsapi.com/static/img/${getCardCode(card)}.png`;

  return (
    <div 
      onClick={onClick}
      className={`
        relative rounded-lg shadow-xl
        transform transition-all duration-300 select-none
        ${className}
      `}
      style={{
        ...style,
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: 'white' // Fallback
      }}
    >
      {/* No internal content needed as we use the image */}
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
