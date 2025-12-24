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
            ← BACK TO GALLERY
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

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={createRoom}
                  disabled={!isConnected || !playerName}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span className="text-lg">▶</span> Create
                </button>
                
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="CODE"
                    maxLength={6}
                    className="absolute inset-0 w-full h-full bg-[#1e293b] border border-gray-700 rounded-xl text-center text-white font-mono uppercase opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity z-10"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  />
                  <button 
                    onClick={joinRoom}
                    disabled={!isConnected || !playerName || (roomId.length !== 6 && !roomId)} // Allow clicking if input is hidden to show it? No, input covers button
                    className="w-full h-full bg-[#1e293b] hover:bg-[#283548] text-white font-bold py-4 rounded-xl border border-gray-700 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">👤</span> Join
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Info Panel */}
          <div className="hidden lg:flex gap-12 h-[500px]">
            {/* Menu */}
            <div className="flex flex-col gap-6 text-gray-500 font-bold text-sm tracking-wide pt-8">
              {['Objective', 'Card Values', 'The Flow', 'The Trap'].map((item) => (
                <button 
                  key={item}
                  onClick={() => setActiveTab(item)}
                  className={`text-left transition-colors flex items-center gap-3 ${activeTab === item ? 'text-white' : 'hover:text-gray-300'}`}
                >
                  {activeTab === item && <span className="text-blue-500">👑</span>}
                  {item}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="w-80 flex flex-col justify-center">
              <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                <span className="text-2xl">👑</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">{activeTab}</h2>
              <p className="text-gray-400 leading-relaxed">
                {activeTab === 'Objective' && "Be the first player to empty your hand."}
                {activeTab === 'Card Values' && "A > K > Q > J > 10... Spades are trump."}
                {activeTab === 'The Flow' && "Follow suit if possible. Highest card wins."}
                {activeTab === 'The Trap' && "If you can't follow suit, you interrupt!"}
              </p>
              <div className="mt-8 bg-[#1e293b] p-4 rounded-xl border border-gray-700 text-xs text-gray-400">
                The game is played in tricks. Strategy is key to shedding cards effectively while avoiding picking up piles.
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
            <button className="w-full bg-[#1e293b] hover:bg-[#283548] text-yellow-500 font-bold py-4 rounded-xl border border-gray-700 transition-colors text-sm tracking-wide">
              SWITCH TO SPECTATOR
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400 text-sm font-bold">PLAYERS ({gameState.players.length})</span>
              <div className="flex gap-1">
                {['EASY', 'MEDIUM', 'HARD'].map(d => (
                  <span key={d} className="text-[10px] bg-[#1e293b] px-2 py-1 rounded text-gray-500 border border-gray-700">{d}</span>
                ))}
              </div>
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
        <button className="bg-[#1e293b] px-4 py-2 rounded border border-gray-700 text-sm font-bold hover:bg-red-900/50 hover:border-red-500/50 transition-colors">
          EXIT
        </button>
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
                <div 
                  key={i} 
                  className="absolute left-0 top-0 w-24 h-36 bg-white rounded-lg shadow-xl border border-gray-200 flex items-center justify-center transform transition-all duration-500"
                  style={{ 
                    transform: `rotate(${i * 15 - (gameState.currentTrick.length * 7)}deg) translateY(${i * -2}px)`,
                    zIndex: i 
                  }}
                >
                  <div className={`text-2xl font-bold ${['H', 'D'].includes(move.card.suit) ? 'text-red-600' : 'text-black'}`}>
                    {move.card.rank}{getSuitSymbol(move.card.suit)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Player (Bottom) */}
          <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
            <div className="w-20 h-20 bg-gradient-to-b from-blue-600 to-blue-900 rounded-full border-4 border-blue-400 shadow-xl mb-4 relative">
              {isMyTurn && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-yellow-400 text-black font-bold px-3 py-1 rounded-full animate-bounce text-sm whitespace-nowrap">
                  YOUR TURN
                </div>
              )}
            </div>
            
            {/* My Hand */}
            <div className="flex justify-center items-end h-40 perspective-500">
              {myPlayer?.hand.map((card, i) => {
                const offset = i - (myPlayer.hand.length - 1) / 2;
                const rotation = offset * 5;
                const translateY = Math.abs(offset) * 5;

                return (
                  <button
                    key={i}
                    onClick={() => isMyTurn && playCard(card)}
                    className={`
                      w-24 h-36 bg-white rounded-xl shadow-2xl border border-gray-300 
                      transform transition-all duration-300 hover:-translate-y-12 hover:scale-110 hover:z-50
                      flex flex-col items-center justify-center -ml-12 first:ml-0
                      ${['H', 'D'].includes(card.suit) ? 'text-red-600' : 'text-black'}
                    `}
                    style={{
                      transform: `rotate(${rotation}deg) translateY(${translateY}px)`,
                      zIndex: i
                    }}
                  >
                    <div className="absolute top-2 left-2 text-lg font-bold leading-none">{card.rank}<br/>{getSuitSymbol(card.suit)}</div>
                    <div className="text-4xl">{getSuitSymbol(card.suit)}</div>
                    <div className="absolute bottom-2 right-2 text-lg font-bold leading-none rotate-180">{card.rank}<br/>{getSuitSymbol(card.suit)}</div>
                  </button>
                );
              })}
            </div>
          </div>

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
