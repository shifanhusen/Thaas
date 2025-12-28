'use client';

import { useEffect, useState, useRef } from 'react';
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
  gameLog?: string[];
  lastCompletedTrick?: { playerId: string; card: Card }[];
  leadingPlayerId?: string;
  chatMessages?: ChatMessage[];
}

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  type: 'text' | 'emoji';
  timestamp: number;
}

export default function BondiGamePage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [displayTrick, setDisplayTrick] = useState<{ playerId: string; card: Card }[]>([]);
  const displayTrickRef = useRef<{ playerId: string; card: Card }[]>([]);
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTrickLengthRef = useRef<number>(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isChatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState?.chatMessages, isChatOpen]);

  // Trick visibility effect
  useEffect(() => {
    if (!gameState) return;

    const currentTrick = gameState.currentTrick;
    const lastCompleted = gameState.lastCompletedTrick;
    const currentLength = currentTrick.length;

    // If there's a completed trick to show, display it
    if (lastCompleted && lastCompleted.length > 0) {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
      
      setDisplayTrick([...lastCompleted]);
      displayTrickRef.current = [...lastCompleted];
      lastTrickLengthRef.current = lastCompleted.length;
      
      // Start timer to clear after 1.5 seconds
      clearTimerRef.current = setTimeout(() => {
        setDisplayTrick([]);
        displayTrickRef.current = [];
        clearTimerRef.current = null;
      }, 1500);
    }
    // Track if trick is growing (cards being added)
    else if (currentLength > lastTrickLengthRef.current) {
      // Cards being added to trick
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
      
      const newTrick = [...currentTrick];
      setDisplayTrick(newTrick);
      displayTrickRef.current = newTrick;
      lastTrickLengthRef.current = currentLength;
    } 
    // First card of new trick after display cleared
    else if (currentLength > 0 && displayTrickRef.current.length === 0 && !lastCompleted) {
      const newTrick = [...currentTrick];
      setDisplayTrick(newTrick);
      displayTrickRef.current = newTrick;
      lastTrickLengthRef.current = currentLength;
    }

    return () => {
      // Don't clear timer on unmount, let it complete
    };
  }, [gameState?.currentTrick, gameState?.lastCompletedTrick]);


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

    newSocket.on('joinedAsSpectator', (data) => {
      setGameState(data);
      setJoined(true);
    });

    newSocket.on('spectatorJoined', (data) => {
      setGameState(data);
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

    newSocket.on('rematchStarted', (data) => {
      setGameState(data);
    });

    newSocket.on('newMessage', (message) => {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          chatMessages: [...(prev.chatMessages || []), message]
        };
      });
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

  const joinAsSpectator = () => {
    if (!socket || !playerName || !roomId) return;
    socket.emit('joinAsSpectator', { roomId, name: playerName });
  };

  const startGame = () => {
    if (!socket || !gameState) return;
    socket.emit('startGame', { roomId: gameState.roomId });
  };

  const playCard = (card: Card) => {
    if (!socket || !gameState) return;
    socket.emit('playCard', { roomId: gameState.roomId, card });
  };

  const requestRematch = () => {
    if (!socket || !gameState) return;
    socket.emit('rematch', { roomId: gameState.roomId });
  };

  const sendMessage = (message: string, type: 'text' | 'emoji' = 'text') => {
    if (!socket || !gameState || !message.trim()) return;
    socket.emit('sendMessage', { roomId: gameState.roomId, message: message.trim(), type });
    setChatInput('');
  };

  const sendEmoji = (emoji: string) => {
    sendMessage(emoji, 'emoji');
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
                
                <button 
                  onClick={joinAsSpectator}
                  disabled={!isConnected || !playerName || roomId.length !== 6}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  <span>🍿</span> WATCH AS SPECTATOR
                </button>
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
        <div className="bg-[#0f172a] p-8 md:p-12 rounded-[2rem] border border-gray-800 text-center shadow-2xl max-w-2xl w-full relative overflow-hidden fade-in-up">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 shimmer"></div>
           
           <div className="mb-8">
             <div className="text-6xl mb-4 float-animation">{isWinner ? '🏆' : '💀'}</div>
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
                <div key={winner.id} className="flex items-center justify-between bg-gradient-to-r from-yellow-500/10 to-transparent p-4 rounded-xl border-l-4 border-yellow-400 fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-black text-yellow-400">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</span>
                    <div className="text-left">
                      <div className="text-xl font-bold text-white">{winner.name}</div>
                      <div className="text-xs text-yellow-500/60 font-bold tracking-wider">FINISHED</div>
                    </div>
                  </div>
                  {winner.id === myId && (
                    <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded animate-pulse">YOU</span>
                  )}
                </div>
              ))}
              
              {/* The Loser */}
              {loser && (
                 <div className="flex items-center justify-between bg-gradient-to-r from-red-500/10 to-transparent p-4 rounded-xl border-l-4 border-red-500 fade-in-up" style={{ animationDelay: `${gameState.winners.length * 0.1}s` }}>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-black text-red-500">💩</span>
                    <div className="text-left">
                      <div className="text-xl font-bold text-white">{loser.name}</div>
                      <div className="text-xs text-red-500/60 font-bold tracking-wider">LAST MAN STANDING</div>
                    </div>
                  </div>
                  {loser.id === myId && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">YOU</span>
                  )}
                </div>
              )}
           </div>

           <div className="flex gap-3 fade-in-up" style={{ animationDelay: `${(gameState.winners.length + 1) * 0.1}s` }}>
             <button 
               onClick={requestRematch}
               className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-4 rounded-xl transition-all shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2"
             >
               <span>🔄</span> REMATCH
             </button>
             <button 
               onClick={() => window.location.href = '/'}
               className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-xl transition-all"
             >
               EXIT TO LOBBY
             </button>
           </div>
        </div>
      </div>
    );
  }

  // --- RENDER: GAME SCREEN ---
  return (
    <div className="min-h-screen bg-[#0f172a] text-white overflow-hidden relative perspective-1000 flex">
      {/* Main Game Area */}
      <div className="flex-1 relative min-w-0">
      {/* Spectator Indicator */}
      {myPlayer?.isSpectator && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 fade-in-up">
          <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex items-center gap-3 shadow-2xl pulse-glow">
            <span className="text-2xl animate-pulse float-animation">🍿</span>
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
        <div className="flex items-center overflow-x-auto px-3 py-2 gap-2 no-scrollbar">
          {gameState.players.map((p, i) => {
            const isCurrent = i === gameState.currentPlayerIndex;
            const isMe = p.id === socket?.id;
            const isWinner = gameState.winners.some(w => w.id === p.id);
            const isLeading = gameState.leadingPlayerId === p.id;
            
            return (
              <div 
                key={p.id} 
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 flex-shrink-0
                  ${isCurrent 
                    ? 'bg-yellow-500/20 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)] scale-105' 
                    : 'bg-white/5 border-white/10 opacity-70'}
                  ${isWinner ? 'opacity-50 grayscale' : ''}
                  ${isLeading ? 'ring-2 ring-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : ''}
                `}
              >
                <div className="relative">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border
                    ${isCurrent ? 'bg-yellow-500 text-black border-yellow-300' : 'bg-gray-700 text-gray-300 border-gray-600'}
                  `}>
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  {isWinner && (
                    <div className="absolute -top-0.5 -right-0.5 bg-green-500 text-white text-[8px] w-3 h-3 flex items-center justify-center rounded-full border border-black">✓</div>
                  )}
                  {isLeading && !isWinner && (
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border border-black animate-pulse">👑</div>
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-bold ${isCurrent ? 'text-yellow-400' : 'text-white'}`}>
                      {p.name} {isMe && '(YOU)'}
                    </span>
                  </div>
                  <div className="text-[9px] text-gray-400 font-mono font-bold">
                    {p.hand.length} {p.hand.length === 1 ? 'CARD' : 'CARDS'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3D Game Table Container */}
      <div className="w-full h-screen flex items-center justify-center perspective-[1200px]">
        <div className="relative w-full max-w-[90vw] md:max-w-[800px] h-[300px] md:h-[500px] transform-style-3d rotate-x-20">
          
          {/* Center Trick Area */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            {/* Leading Player Indicator */}
            {gameState.leadingPlayerId && displayTrick.length > 0 && (
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 z-50 fade-in-up">
                <div className="bg-green-500/20 backdrop-blur-md px-4 py-2 rounded-full border-2 border-green-500 flex items-center gap-2 shadow-lg shadow-green-500/50 pulse-glow">
                  <span className="text-xl float-animation">👑</span>
                  <span className="font-bold text-green-400 text-sm">
                    {gameState.players.find(p => p.id === gameState.leadingPlayerId)?.name} LEADING
                  </span>
                </div>
              </div>
            )}
            
            <div className="relative">
              {displayTrick.map((move, i) => {
                const totalCards = displayTrick.length;
                const centerOffset = (totalCards - 1) / 2;
                const positionOffset = i - centerOffset;
                const isLeadingCard = move.playerId === gameState.leadingPlayerId;
                
                return (
                  <div key={i} className="absolute fade-in-up" style={{ 
                    transform: `translate(-50%, -50%) translateX(${positionOffset * 25}px) translateY(${i * -4}px) rotate(${positionOffset * 8}deg)`,
                    zIndex: i,
                    left: '50%',
                    top: '50%',
                    animationDelay: `${i * 0.1}s`
                  }}>
                    {isLeadingCard && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 text-xl animate-bounce float-animation">
                        👑
                      </div>
                    )}
                    <PlayingCard
                      card={move.card}
                      className={`w-20 h-28 md:w-32 md:h-48 transform transition-all duration-500 shadow-2xl rounded-lg ${
                        isLeadingCard ? 'ring-2 ring-green-500 border-green-500 pulse-glow' : 'border border-white/20'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>


        </div>
      </div>

      {/* My Player (Bottom) - Moved outside 3D container */}
      <div className="fixed bottom-0 left-0 right-0 flex flex-col items-center z-50 pointer-events-none">
        <div className="pointer-events-auto flex flex-col items-center w-full">
            {/* Turn indicator without the blue dot */}
            {isMyTurn && (
              <div className="mb-4 bg-yellow-400 text-black font-bold px-3 py-1 rounded-full animate-bounce text-sm whitespace-nowrap">
                YOUR TURN
              </div>
            )}
            {myPlayer?.isSpectator && (
              <div className="mb-4 bg-green-500 text-white font-bold px-3 py-1 rounded-full text-sm whitespace-nowrap shadow-lg">
                FINISHED! 🏆
              </div>
            )}
            
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
                      w-24 h-36 flex-shrink-0 card-deal-animation
                      transform transition-all duration-200 card-hover
                      shadow-lg rounded-xl border border-gray-200
                      ${isMyTurn ? 'active:translate-y-[-20px] cursor-pointer' : 'cursor-not-allowed opacity-80'}
                    `}
                    style={{ 
                      zIndex: i,
                      animationDelay: `${i * 0.05}s`,
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
                    className={`group relative w-40 h-56 -ml-20 first:ml-0 transition-all duration-300 hover:z-[100] card-deal-animation ${isMyTurn ? 'hover:-translate-y-24 hover:scale-110 cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
                    style={{
                      transform: `rotate(${rotation}deg) translateY(${translateY}px)`,
                      zIndex: i,
                      animationDelay: `${i * 0.05}s`
                    }}
                  >
                    <PlayingCard
                      card={card}
                      onClick={() => isMyTurn && playCard(card)}
                      className="w-full h-full shadow-2xl rounded-xl"
                      style={{ backgroundSize: '100% 100%' }}
                    />
                  </div>
                );
              })}
            </div>
        </div>
      </div>
      </div>

      {/* Game Log Panel - Right Side (Hidden on mobile) */}
      <div className="hidden lg:flex w-80 bg-black/60 backdrop-blur-md border-l border-white/10 flex-col max-h-screen">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Game Log</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {(gameState.gameLog && gameState.gameLog.length > 0) ? (
            gameState.gameLog.map((log, i) => (
              <div key={i} className="text-xs bg-white/5 rounded px-3 py-2 border border-white/10">
                <span className="text-gray-400 font-mono mr-2">#{i + 1}</span>
                <span className="text-gray-200">{log}</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500 text-center mt-8">
              Game actions will appear here...
            </div>
          )}
        </div>
      </div>

      {/* Expandable Chat Bar - Bottom */}
      <div className={`fixed bottom-0 left-0 right-0 z-[100] transition-all duration-300 ${isChatOpen ? 'h-96' : 'h-14'}`}>
        {/* Chat Header/Toggle Bar */}
        <div 
          className="bg-gradient-to-r from-purple-600 to-blue-600 h-14 flex items-center justify-between px-4 cursor-pointer hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg border-t-2 border-white/20"
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <div className="font-bold text-white text-sm">Chat & Reactions</div>
              <div className="text-xs text-white/70">
                {isChatOpen ? 'Click to minimize' : `${gameState.chatMessages?.length || 0} messages`}
              </div>
            </div>
          </div>
          <div className="text-white text-xl transition-transform duration-300" style={{ transform: isChatOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </div>
        </div>

        {/* Chat Content */}
        {isChatOpen && (
          <div className="bg-[#0f172a]/95 backdrop-blur-md h-[calc(100%-3.5rem)] flex flex-col border-t border-white/10">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {gameState.chatMessages && gameState.chatMessages.length > 0 ? (
                gameState.chatMessages.map((msg) => {
                  const isMe = msg.playerId === socket?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${msg.type === 'emoji' ? 'bg-transparent' : isMe ? 'bg-blue-600' : 'bg-gray-700'} rounded-lg px-3 py-2`}>
                        {msg.type === 'emoji' ? (
                          <div className="text-4xl">{msg.message}</div>
                        ) : (
                          <>
                            <div className="text-xs text-white/60 mb-1">{msg.playerName}</div>
                            <div className="text-sm text-white">{msg.message}</div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 text-sm mt-8">
                  No messages yet. Say hello! 👋
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Emoji Bar */}
            <div className="border-t border-white/10 bg-black/40 p-2">
              <div className="flex gap-2 overflow-x-auto no-scrollbar justify-center">
                {['👍', '❤️', '😂', '🎉', '🔥', '👏', '😮', '😎', '🤔', '👑'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => sendEmoji(emoji)}
                    className="text-2xl hover:scale-125 transition-transform bg-white/5 hover:bg-white/10 rounded-lg px-3 py-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-white/10 bg-black/60 p-3 flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage(chatInput)}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => sendMessage(chatInput)}
                disabled={!chatInput.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold px-6 rounded-lg transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        )}
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
