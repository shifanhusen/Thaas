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
  winners: Player[];
}

export default function BondiGamePage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [displayTrick, setDisplayTrick] = useState<{ playerId: string; card: Card }[]>([]);

  // Trick visibility effect
  useEffect(() => {
    if (!gameState) return;

    if (gameState.currentTrick.length > 0) {
      setDisplayTrick(gameState.currentTrick);
    } else if (displayTrick.length > 0 && gameState.currentTrick.length === 0) {
      // Trick just cleared. Keep showing the last state for a bit.
      const timer = setTimeout(() => {
        setDisplayTrick([]);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState?.currentTrick, displayTrick.length]);

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

  // --- RENDER: GAME OVER SCREEN ---
  if (gameState.gameStatus === 'finished') {
    const myId = socket?.id;
    const isWinner = gameState.winners.some(w => w.id === myId);
    
    // Identify the loser (the one player not in the winners list)
    const loser = gameState.players.find(p => !gameState.winners.some(w => w.id === p.id));

    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white p-4">
        <div className="bg-[#0f172a] p-8 md:p-12 rounded-[2rem] border border-gray-800 text-center shadow-2xl max-w-2xl w-full relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500"></div>
           
           <div className="mb-8">
             <div className="text-6xl mb-4 animate-bounce">{isWinner ? '🏆' : '💀'}</div>
             <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-2">
               GAME OVER
             </h1>
             <p className="text-gray-400 font-bold tracking-widest uppercase">
               Final Standings
             </p>
           </div>

           <div className="space-y-4 mb-8">
              {/* Winners List */}
              {gameState.winners.map((winner, index) => (
                <div key={winner.id} className="flex items-center justify-between bg-gradient-to-r from-yellow-500/10 to-transparent p-4 rounded-xl border-l-4 border-yellow-400">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-black text-yellow-400">#{index + 1}</span>
                    <div className="text-left">
                      <div className="text-xl font-bold text-white">{winner.name}</div>
                      <div className="text-xs text-yellow-500/60 font-bold tracking-wider">FINISHED</div>
                    </div>
                  </div>
                  {winner.id === myId && (
                    <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded">YOU</span>
                  )}
                </div>
              ))}
              
              {/* The Loser */}
              {loser && (
                 <div className="flex items-center justify-between bg-gradient-to-r from-red-500/10 to-transparent p-4 rounded-xl border-l-4 border-red-500">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-black text-red-500">💩</span>
                    <div className="text-left">
                      <div className="text-xl font-bold text-white">{loser.name}</div>
                      <div className="text-xs text-red-500/60 font-bold tracking-wider">LAST MAN STANDING</div>
                    </div>
                  </div>
                  {loser.id === myId && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">YOU</span>
                  )}
                </div>
              )}
           </div>

           <button 
             onClick={() => window.location.reload()}
             className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20"
           >
             PLAY AGAIN
           </button>
        </div>
      </div>
    );
  }

  // --- RENDER: GAME SCREEN ---
  return (
    <div className="min-h-screen bg-[#0f172a] text-white overflow-hidden relative perspective-1000">
      {/* Spectator Indicator */}
      {myPlayer?.isSpectator && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex items-center gap-3 shadow-2xl">
            <span className="text-2xl animate-pulse">🍿</span>
            <div>
              <div className="font-bold text-white text-sm">SPECTATOR MODE</div>
              <div className="text-xs text-white/50">Waiting for others to finish...</div>
            </div>
          </div>
        </div>
      )}

      {/* Background Stars/Grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>

      {/* Top Bar with Player List */}
      <div className="absolute top-0 left-0 right-0 z-30 flex flex-col bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="flex justify-between items-center px-4 py-2 border-b border-white/5">
           <div className="flex items-center gap-4">
             <Link href="/" className="text-xs font-bold text-gray-400 hover:text-white">← EXIT</Link>
             <div className="bg-[#1e293b] px-3 py-1 rounded border border-gray-700">
               <span className="text-xs text-gray-400">ROOM:</span> <span className="font-mono font-bold">{gameState.roomId}</span>
             </div>
           </div>
        </div>

        {/* Player Order Bar */}
        <div className="flex items-center overflow-x-auto px-4 py-3 gap-4 no-scrollbar">
          {gameState.players.map((p, i) => {
            const isCurrent = i === gameState.currentPlayerIndex;
            const isMe = p.id === socket?.id;
            const isWinner = gameState.winners.some(w => w.id === p.id);
            
            return (
              <div 
                key={p.id} 
                className={`
                  flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-300 flex-shrink-0
                  ${isCurrent 
                    ? 'bg-yellow-500/20 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)] scale-105' 
                    : 'bg-white/5 border-white/10 opacity-70'}
                  ${isWinner ? 'opacity-50 grayscale' : ''}
                `}
              >
                <div className="relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border
                    ${isCurrent ? 'bg-yellow-500 text-black border-yellow-300' : 'bg-gray-700 text-gray-300 border-gray-600'}
                  `}>
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  {isWinner && (
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border border-black">✓</div>
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isCurrent ? 'text-yellow-400' : 'text-white'}`}>
                      {p.name} {isMe && '(YOU)'}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    {p.hand.length} CARDS
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3D Game Table Container */}
      <div className="w-full h-screen flex items-center justify-center perspective-[1200px]">
        <div className="relative w-[800px] h-[500px] transform-style-3d rotate-x-20">
          
          {/* The Table Surface */}
          <div className="absolute inset-0 bg-[#1e293b]/80 rounded-[3rem] border-4 border-gray-600 shadow-2xl backdrop-blur-sm transform rotateX(40deg) scale-90">
            <div className="absolute inset-4 border-2 border-white/10 rounded-[2.5rem]"></div>
          </div>

          {/* Center Trick Area */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="relative w-32 h-48">
              {displayTrick.map((move, i) => (
                <PlayingCard
                  key={i}
                  card={move.card}
                  className="absolute left-0 top-0 w-24 h-36 md:w-32 md:h-48 transform transition-all duration-500"
                  style={{ 
                    transform: `rotate(${i * 15 - (displayTrick.length * 7)}deg) translateY(${i * -2}px)`,
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
              {myPlayer?.isSpectator && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-green-500 text-white font-bold px-3 py-1 rounded-full text-sm whitespace-nowrap shadow-lg">
                  FINISHED! 🏆
                </div>
              )}
            </div>
            
            {/* My Hand - Responsive Layout */}
            {/* Mobile: Scrollable Row (Like Screenshot) */}
            <div className="md:hidden w-full overflow-x-auto px-4 pb-4 flex items-end gap-2 no-scrollbar snap-x">
              <div className="flex space-x-[-30px] px-4 min-w-min"> {/* Negative margin for overlap */}
                {sortHand(myPlayer?.hand || []).map((card, i) => (
                  <PlayingCard
                    key={i}
                    card={card}
                    onClick={() => isMyTurn && playCard(card)}
                    className={`
                      w-24 h-36 flex-shrink-0
                      transform transition-all duration-200
                      shadow-lg rounded-xl border border-gray-200
                      ${isMyTurn ? 'active:translate-y-[-20px]' : ''}
                    `}
                    style={{ 
                      zIndex: i,
                      // Ensure full visibility of the card image
                      backgroundSize: '100% 100%' 
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Desktop: Fanned Hand */}
            <div className="hidden md:flex justify-center items-end h-56 perspective-500 w-full px-4 -mb-12">
              {sortHand(myPlayer?.hand || []).map((card, i, arr) => {
                const offset = i - (arr.length - 1) / 2;
                const rotation = offset * 3; 
                const translateY = Math.abs(offset) * 5;

                return (
                  <div
                    key={i}
                    className="group relative w-40 h-56 -ml-20 first:ml-0 transition-all duration-300 hover:z-[100] hover:-translate-y-24 hover:scale-110"
                    style={{
                      transform: `rotate(${rotation}deg) translateY(${translateY}px)`,
                      zIndex: i
                    }}
                  >
                    <PlayingCard
                      card={card}
                      onClick={() => isMyTurn && playCard(card)}
                      className="w-full h-full shadow-2xl cursor-pointer rounded-xl"
                      style={{ backgroundSize: '100% 100%' }}
                    />
                  </div>
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
        backgroundSize: '100% 100%', // Ensure full card is visible
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
