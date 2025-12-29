'use client';

import { useEffect, useState, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import Link from 'next/link';
import { Reorder, motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---
interface Card {
  suit: 'S' | 'H' | 'D' | 'C';
  rank: string;
}

interface Meld {
  type: 'set' | 'run';
  cards: Card[];
}

interface DiguPlayer {
  id: string;
  name: string;
  hand: Card[];
  melds: Meld[];
  roundScore: number;
  totalScore: number;
  hasKnocked: boolean;
  hasDropped: boolean;
  isBot: boolean;
  socketId?: string;
}

interface DiguGameState {
  roomId: string;
  gameType: 'digu';
  players: DiguPlayer[];
  currentPlayerIndex: number;
  deck: Card[];
  discardPile: Card[];
  gameStatus: 'waiting' | 'playing' | 'roundEnd' | 'finished';
  currentRound: number;
  knockedPlayerId: string | null;
  gameLog: string[];
  endGameVotes: { [playerId: string]: boolean };
  endGameVoteTimer: number | null;
  targetScore: number;
}

// --- HELPERS ---
const getCardId = (card: Card) => `${card.rank}-${card.suit}`;

function PlayingCard({ 
  card, 
  onClick, 
  style, 
  className, 
  isSelected,
  isDraggable = false
}: { 
  card: Card, 
  onClick?: () => void, 
  style?: React.CSSProperties, 
  className?: string, 
  isSelected?: boolean,
  isDraggable?: boolean
}) {
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
        relative rounded-lg shadow-xl bg-white
        transform transition-all duration-200 select-none
        ${className}
        ${isSelected ? 'ring-4 ring-yellow-400 -translate-y-6 z-50' : ''}
        ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}
      `}
      style={{
        ...style,
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay for selection visibility */}
      {isSelected && (
        <div className="absolute inset-0 bg-yellow-400/20 rounded-lg pointer-events-none" />
      )}
    </div>
  );
}

export default function DiguGamePage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<DiguGameState | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Local UI State
  const [localHand, setLocalHand] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [currentMelds, setCurrentMelds] = useState<Meld[]>([]);
  const [showMeldBuilder, setShowMeldBuilder] = useState(false);
  const [voteTimer, setVoteTimer] = useState<number | null>(null);

  // --- SOCKET SETUP ---
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
      console.log('Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    const handleGameUpdate = (data: any) => {
      const roomData = data.data || data;
      setGameState(roomData);
      if (roomData.roomId) setRoomId(roomData.roomId);
    };

    newSocket.on('roomCreated', (data) => {
      handleGameUpdate(data);
      setJoined(true);
    });
    newSocket.on('joined', (data) => {
      handleGameUpdate(data);
      setJoined(true);
    });
    newSocket.on('playerJoined', handleGameUpdate);
    newSocket.on('gameStarted', handleGameUpdate);
    newSocket.on('gameStateUpdate', handleGameUpdate);
    newSocket.on('roundEnded', handleGameUpdate);
    newSocket.on('playerDropped', handleGameUpdate);
    newSocket.on('voteUpdate', handleGameUpdate);
    newSocket.on('newRoundStarted', (data) => {
      handleGameUpdate(data);
      setCurrentMelds([]);
      setSelectedCards([]);
    });

    newSocket.on('error', (error: any) => {
      console.error('Socket error:', error);
      alert(`Error: ${error}`);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // --- SYNC LOCAL HAND ---
  const myPlayer = gameState?.players.find(p => p.id === socket?.id);
  
  useEffect(() => {
    if (myPlayer?.hand) {
      // Only update local hand if the cards have actually changed (added/removed)
      // This prevents overwriting the user's custom sort order
      const serverIds = myPlayer.hand.map(getCardId).sort().join(',');
      const localIds = localHand.map(getCardId).sort().join(',');
      
      if (serverIds !== localIds) {
        // If cards changed, try to preserve order of existing cards
        const newHand = [...myPlayer.hand];
        // Simple strategy: just set it for now to ensure sync, 
        // improving this would require complex diffing to keep order
        setLocalHand(newHand);
      }
    }
  }, [myPlayer?.hand, gameState?.currentRound]); // Sync on hand change or new round

  // --- GAME ACTIONS ---
  const createRoom = () => {
    if (!socket?.connected || !playerName.trim()) return;
    socket.emit('createRoom', { name: playerName, gameType: 'digu' });
  };

  const joinRoom = () => {
    if (!socket?.connected || !playerName.trim() || !roomId.trim()) return;
    socket.emit('joinRoom', { roomId: roomId.toUpperCase(), name: playerName });
  };

  const startGame = () => {
    if (!socket || !gameState) return;
    socket.emit('startGame', { roomId: gameState.roomId });
  };

  const drawCard = (fromDiscard: boolean) => {
    if (!socket || !gameState) return;
    socket.emit('diguDrawCard', { roomId: gameState.roomId, fromDiscard });
  };

  const discardCard = (card: Card) => {
    if (!socket || !gameState) return;
    socket.emit('diguDiscardCard', { roomId: gameState.roomId, card });
    setSelectedCards([]); // Clear selection after discard
  };

  const toggleCardSelection = (card: Card) => {
    const isSelected = selectedCards.some(c => c.suit === card.suit && c.rank === card.rank);
    if (isSelected) {
      setSelectedCards(selectedCards.filter(c => !(c.suit === card.suit && c.rank === card.rank)));
    } else {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const createMeld = (type: 'set' | 'run') => {
    if (selectedCards.length < 3) {
      alert('You need at least 3 cards to create a meld');
      return;
    }
    const newMeld: Meld = { type, cards: [...selectedCards] };
    setCurrentMelds([...currentMelds, newMeld]);
    setSelectedCards([]);
  };

  const removeMeld = (index: number) => {
    setCurrentMelds(currentMelds.filter((_, i) => i !== index));
  };

  const declareMelds = () => {
    if (!socket || !gameState) return;
    socket.emit('diguDeclareMelds', { roomId: gameState.roomId, melds: currentMelds });
    setShowMeldBuilder(false);
  };

  const knock = () => {
    if (!socket || !gameState) return;
    socket.emit('diguKnock', { roomId: gameState.roomId });
  };

  const dropOut = () => {
    if (!socket || !gameState) return;
    if (confirm('Are you sure you want to drop? You will receive a penalty.')) {
      socket.emit('diguDrop', { roomId: gameState.roomId });
    }
  };

  const voteEndGame = (voteEnd: boolean) => {
    if (!socket || !gameState) return;
    socket.emit('diguVoteEndGame', { roomId: gameState.roomId, voteEnd });
  };

  const startNewRound = () => {
    if (!socket || !gameState) return;
    socket.emit('diguStartNewRound', { roomId: gameState.roomId });
  };

  // --- RENDER HELPERS ---
  const isMyTurn = gameState && gameState.players[gameState.currentPlayerIndex]?.id === socket?.id;
  const canDraw = isMyTurn && myPlayer?.hand.length === 10;
  const canDiscard = isMyTurn && myPlayer?.hand.length === 11;

  // --- RENDER: LOBBY / ENTRY ---
  if (!joined) {
    return (
      <div className="min-h-screen bg-[#020617] text-white font-sans flex flex-col items-center justify-center p-4">
        <div className="bg-[#0f172a] p-8 rounded-3xl border border-gray-800 w-full max-w-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">DIGU</h1>
            <p className="text-gray-500 text-xs font-bold tracking-[0.2em]">GIN RUMMY</p>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter Your Name"
              className="w-full bg-[#1e293b] border border-gray-700 p-4 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-center font-medium"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <button 
              onClick={createRoom}
              disabled={!isConnected || !playerName}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20"
            >
              CREATE ROOM
            </button>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="CODE"
                maxLength={6}
                className="flex-1 bg-[#1e293b] border border-gray-700 p-4 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-center font-mono uppercase tracking-widest"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              />
              <button 
                onClick={joinRoom}
                disabled={!isConnected || !playerName || roomId.length < 4}
                className="bg-[#1e293b] hover:bg-[#283548] text-white font-bold px-6 rounded-xl border border-gray-700 transition-all disabled:opacity-50"
              >
                JOIN
              </button>
            </div>
            <Link href="/" className="block text-center text-gray-500 text-sm hover:text-white mt-4">← Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">Loading...</div>;

  // --- RENDER: WAITING ROOM ---
  if (gameState.gameStatus === 'waiting') {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-4">
        <div className="bg-[#0f172a] p-12 rounded-[2rem] border border-gray-800 w-full max-w-md text-center shadow-2xl">
          <p className="text-gray-500 text-xs font-bold tracking-widest mb-2">ROOM CODE</p>
          <h2 className="text-5xl font-mono font-bold tracking-wider mb-8">{gameState.roomId}</h2>
          
          <div className="space-y-3 mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm font-bold">PLAYERS ({gameState.players.length})</span>
            </div>
            {gameState.players.map(p => (
              <div key={p.id} className="bg-[#1e293b] p-3 rounded-lg flex items-center gap-3 border border-gray-700">
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">
                  {p.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="font-medium">{p.name}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={startGame}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            START GAME
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN GAME ---
  return (
    <div className="min-h-screen bg-[#0f172a] text-white overflow-hidden relative flex flex-col">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>

      {/* Top Bar: Opponents */}
      <div className="bg-black/40 backdrop-blur-md border-b border-white/10 p-4 flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs font-bold text-gray-400 hover:text-white">← EXIT</Link>
          <div className="bg-[#1e293b] px-3 py-1 rounded border border-gray-700">
            <span className="text-xs text-gray-400">ROOM:</span> <span className="font-mono font-bold">{gameState.roomId}</span>
          </div>
        </div>
        
        <div className="flex gap-4 overflow-x-auto">
          {gameState.players.filter(p => p.id !== socket?.id).map(p => {
            const isCurrent = gameState.players[gameState.currentPlayerIndex].id === p.id;
            return (
              <div key={p.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isCurrent ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/10 bg-white/5'}`}>
                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px]">{p.name.substring(0, 2)}</div>
                <div className="flex flex-col">
                  <span className={`text-xs font-bold ${isCurrent ? 'text-yellow-400' : 'text-white'}`}>{p.name}</span>
                  <span className="text-[9px] text-gray-400">{p.hand.length} Cards</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center Table: Deck & Discard */}
      <div className="flex-1 flex items-center justify-center relative perspective-[1000px]">
        <div className="relative flex gap-12 transform rotate-x-10">
          {/* Deck */}
          <div className="relative group">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-400 tracking-widest">DECK</div>
            <div 
              onClick={() => canDraw && drawCard(false)}
              className={`
                w-32 h-48 bg-blue-900 rounded-xl border-2 border-white/20 shadow-2xl relative
                ${canDraw ? 'cursor-pointer hover:-translate-y-2 hover:shadow-blue-500/20 ring-2 ring-green-400' : 'opacity-80'}
                transition-all duration-300
              `}
            >
              <div className="absolute inset-2 border border-white/10 rounded-lg bg-white/5 opacity-30"></div>
              <div className="absolute inset-0 flex items-center justify-center text-4xl">🂠</div>
            </div>
          </div>

          {/* Discard Pile */}
          <div className="relative group">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-400 tracking-widest">DISCARD</div>
            <div 
              onClick={() => canDraw && drawCard(true)}
              className={`
                w-32 h-48 rounded-xl border-2 border-white/10 shadow-2xl relative
                ${canDraw ? 'cursor-pointer hover:-translate-y-2 hover:shadow-yellow-500/20 ring-2 ring-green-400' : ''}
                ${!canDraw && canDiscard ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#0f172a]' : ''}
                transition-all duration-300
              `}
            >
              {gameState.discardPile.length > 0 ? (
                <PlayingCard 
                  card={gameState.discardPile[gameState.discardPile.length - 1]} 
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-white/5 rounded-xl flex items-center justify-center text-white/20 border-2 border-dashed border-white/20">
                  EMPTY
                </div>
              )}
            </div>
            
            {/* Discard Action Hint */}
            {canDiscard && (
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full animate-bounce">
                  DISCARD HERE
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Player Hand & Controls */}
      <div className="bg-gradient-to-t from-black/90 to-transparent pt-12 pb-6 px-4 z-30">
        <div className="max-w-5xl mx-auto">
          
          {/* Action Bar */}
          <div className="flex justify-between items-end mb-6">
            <div className="flex gap-2">
              <button 
                onClick={() => setShowMeldBuilder(!showMeldBuilder)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${showMeldBuilder ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
              >
                🛠️ MELD BUILDER
              </button>
              {myPlayer?.hand.length === 10 && isMyTurn && (
                <button 
                  onClick={knock}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-bold text-sm transition-all shadow-lg shadow-yellow-500/20"
                >
                  🔔 KNOCK
                </button>
              )}
            </div>

            {/* Turn Indicator */}
            <div className="text-center">
              {isMyTurn ? (
                <div className="bg-green-500 text-black font-bold px-6 py-2 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-pulse">
                  YOUR TURN
                </div>
              ) : (
                <div className="text-gray-400 font-bold text-sm bg-black/40 px-4 py-2 rounded-full">
                  WAITING FOR {gameState.players[gameState.currentPlayerIndex].name.toUpperCase()}...
                </div>
              )}
            </div>

            {/* Discard Button (Visible when card selected) */}
            <div className="h-10">
              {canDiscard && selectedCards.length === 1 && (
                <button 
                  onClick={() => discardCard(selectedCards[0])}
                  className="px-6 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg font-bold text-sm transition-all shadow-lg animate-bounce"
                >
                  🗑️ DISCARD SELECTED
                </button>
              )}
            </div>
          </div>

          {/* Meld Builder Panel */}
          <AnimatePresence>
            {showMeldBuilder && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-[#1e293b] border border-gray-700 rounded-xl p-4 mb-4 overflow-hidden"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-white">Create Melds</h3>
                  <div className="flex gap-2">
                    <button onClick={() => createMeld('set')} disabled={selectedCards.length < 3} className="px-3 py-1 bg-blue-600 rounded text-xs font-bold disabled:opacity-50">SET (3+ SAME RANK)</button>
                    <button onClick={() => createMeld('run')} disabled={selectedCards.length < 3} className="px-3 py-1 bg-green-600 rounded text-xs font-bold disabled:opacity-50">RUN (3+ SEQUENCE)</button>
                    <button onClick={declareMelds} disabled={currentMelds.length === 0} className="px-3 py-1 bg-yellow-500 text-black rounded text-xs font-bold disabled:opacity-50">DECLARE</button>
                  </div>
                </div>
                
                {/* Staged Melds */}
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {currentMelds.length === 0 && <div className="text-gray-500 text-sm italic">No melds created yet. Select cards to build.</div>}
                  {currentMelds.map((meld, i) => (
                    <div key={i} className="bg-black/40 p-2 rounded-lg flex items-center gap-2 min-w-max">
                      <span className="text-xs font-bold text-gray-400 uppercase">{meld.type}</span>
                      <div className="flex -space-x-4">
                        {meld.cards.map((c, ci) => (
                          <PlayingCard key={ci} card={c} className="w-10 h-14 shadow-sm" />
                        ))}
                      </div>
                      <button onClick={() => removeMeld(i)} className="text-red-400 hover:text-red-300 text-xs ml-2">✕</button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Draggable Hand */}
          <div className="relative min-h-[160px] flex justify-center">
            <Reorder.Group 
              axis="x" 
              values={localHand} 
              onReorder={setLocalHand}
              className="flex items-end justify-center gap-[-40px]"
            >
              {localHand.map((card, index) => {
                const isSelected = selectedCards.some(c => c.suit === card.suit && c.rank === card.rank);
                return (
                  <Reorder.Item 
                    key={getCardId(card)} 
                    value={card}
                    className="relative -ml-12 first:ml-0 transition-all hover:z-50 hover:-translate-y-4"
                    style={{ zIndex: index }}
                  >
                    <PlayingCard 
                      card={card} 
                      isSelected={isSelected}
                      isDraggable={true}
                      className="w-28 h-40 md:w-32 md:h-48 shadow-2xl"
                      onClick={() => toggleCardSelection(card)}
                    />
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </div>
          
          <div className="text-center mt-2 text-xs text-gray-500 font-bold tracking-widest">
            DRAG TO REORDER • CLICK TO SELECT
          </div>

        </div>
      </div>

      {/* Game Over / Round End Overlay */}
      {(gameState.gameStatus === 'roundEnd' || gameState.gameStatus === 'finished') && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] p-8 rounded-2xl border border-gray-700 max-w-lg w-full text-center shadow-2xl">
            <h2 className="text-3xl font-black text-white mb-2">
              {gameState.gameStatus === 'finished' ? 'GAME OVER' : 'ROUND COMPLETE'}
            </h2>
            
            {gameState.gameStatus === 'roundEnd' && (
              <div className="space-y-6">
                <div className="bg-black/30 p-4 rounded-xl">
                  <h3 className="text-gray-400 text-xs font-bold tracking-widest mb-4">SCORES</h3>
                  {gameState.players.map(p => (
                    <div key={p.id} className="flex justify-between items-center mb-2 text-sm">
                      <span className="text-white">{p.name}</span>
                      <span className="font-mono font-bold text-yellow-400">{p.totalScore} pts</span>
                    </div>
                  ))}
                </div>

                {gameState.endGameVoteTimer ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/50 p-4 rounded-xl">
                    <p className="text-yellow-200 font-bold mb-4">Vote to End Game? ({voteTimer}s)</p>
                    <div className="flex gap-3">
                      <button onClick={() => voteEndGame(true)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg">END GAME</button>
                      <button onClick={() => voteEndGame(false)} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg">CONTINUE</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={startNewRound} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl">
                    START NEXT ROUND
                  </button>
                )}
              </div>
            )}

            {gameState.gameStatus === 'finished' && (
               <div className="space-y-4">
                 <div className="text-6xl mb-4">🏆</div>
                 <div className="space-y-2">
                    {gameState.players
                      .sort((a, b) => b.totalScore - a.totalScore)
                      .map((player, idx) => (
                        <div key={player.id} className={`p-4 rounded-xl flex items-center justify-between ${idx === 0 ? 'bg-yellow-500/20 border border-yellow-500' : 'bg-white/5'}`}>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-xl w-8">{idx + 1}</span>
                            <span className="font-bold text-white">{player.name}</span>
                          </div>
                          <span className="font-mono font-bold text-xl">{player.totalScore}</span>
                        </div>
                      ))}
                 </div>
                 <button onClick={() => window.location.reload()} className="w-full mt-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-xl">
                   EXIT TO LOBBY
                 </button>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
