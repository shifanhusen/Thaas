'use client';

import { useEffect, useState, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import Link from 'next/link';

// Types
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

const CARD_SUITS = {
  S: { symbol: '♠', color: 'text-gray-800' },
  H: { symbol: '♥', color: 'text-red-600' },
  D: { symbol: '♦', color: 'text-red-600' },
  C: { symbol: '♣', color: 'text-gray-800' },
};

export default function DiguGamePage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<DiguGameState | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [currentMelds, setCurrentMelds] = useState<Meld[]>([]);
  const [showMeldBuilder, setShowMeldBuilder] = useState(false);
  const [voteTimer, setVoteTimer] = useState<number | null>(null);

  // Initialize socket
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

    newSocket.on('roomCreated', (data: any) => {
      console.log('Room created:', data);
      // Handle both direct data and wrapped data format
      const roomData = data.data || data;
      setGameState(roomData);
      setRoomId(roomData.roomId);
      setJoined(true);
    });

    newSocket.on('joined', (data: any) => {
      console.log('Joined room:', data);
      // Handle both direct data and wrapped data format
      const roomData = data.data || data;
      setGameState(roomData);
      setRoomId(roomData.roomId); // Ensure roomId is set when joining
      setJoined(true);
    });

    newSocket.on('playerJoined', (data: any) => {
      console.log('Player joined:', data);
      const roomData = data.data || data;
      setGameState(roomData);
    });

    newSocket.on('gameStarted', (data: any) => {
      console.log('Game started:', data);
      const roomData = data.data || data;
      setGameState(roomData);
    });

    newSocket.on('gameStateUpdate', (data: any) => {
      console.log('Game state update:', data);
      const roomData = data.data || data;
      setGameState(roomData);
    });

    newSocket.on('roundEnded', (data: any) => {
      console.log('Round ended:', data);
      const roomData = data.data || data;
      setGameState(roomData);
    });

    newSocket.on('playerDropped', (data: any) => {
      console.log('Player dropped:', data);
      const roomData = data.data || data;
      setGameState(roomData);
    });

    newSocket.on('voteUpdate', (data: any) => {
      console.log('Vote update:', data);
      const roomData = data.data || data;
      setGameState(roomData);
    });

    newSocket.on('newRoundStarted', (data: any) => {
      console.log('New round started:', data);
      const roomData = data.data || data;
      setGameState(roomData);
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

  // Vote timer countdown
  useEffect(() => {
    if (gameState?.endGameVoteTimer) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, gameState.endGameVoteTimer! - Date.now());
        setVoteTimer(Math.ceil(remaining / 1000));
        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    } else {
      setVoteTimer(null);
    }
  }, [gameState?.endGameVoteTimer]);

  const createRoom = () => {
    if (!socket || !playerName.trim()) return;
    if (!socket.connected) {
      alert('Not connected to server. Please wait.');
      return;
    }
    socket.emit('createRoom', { name: playerName, gameType: 'digu' });
  };

  const joinRoom = () => {
    if (!socket || !playerName.trim() || !roomId.trim()) return;
    if (!socket.connected) {
      alert('Not connected to server. Please wait.');
      return;
    }
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

  const renderCard = (card: Card, onClick?: () => void, isSelected?: boolean) => {
    const suit = CARD_SUITS[card.suit];
    return (
      <div
        className={`relative w-16 h-24 bg-white border-2 rounded-lg shadow-md cursor-pointer transition-all ${
          isSelected ? 'border-blue-500 -translate-y-2' : 'border-gray-300 hover:border-gray-400'
        } ${onClick ? 'hover:shadow-lg' : ''}`}
        onClick={onClick}
      >
        <div className={`absolute top-1 left-1 text-sm font-bold ${suit.color}`}>
          {card.rank}
        </div>
        <div className={`absolute top-6 left-1/2 transform -translate-x-1/2 text-3xl ${suit.color}`}>
          {suit.symbol}
        </div>
        <div className={`absolute bottom-1 right-1 text-sm font-bold ${suit.color} rotate-180`}>
          {card.rank}
        </div>
      </div>
    );
  };

  const myPlayer = gameState?.players.find(p => p.id === socket?.id);
  const isMyTurn = gameState && gameState.players[gameState.currentPlayerIndex]?.id === socket?.id;

  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl max-w-md w-full">
          <h1 className="text-4xl font-bold text-white mb-6 text-center">🃏 Digu (Gin Rummy)</h1>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              onClick={createRoom}
              disabled={!isConnected || !playerName.trim()}
              className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-semibold rounded-lg transition-colors"
            >
              Create Room
            </button>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Room Code"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                onClick={joinRoom}
                disabled={!isConnected || !playerName.trim() || !roomId.trim()}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white font-semibold rounded-lg transition-colors"
              >
                Join
              </button>
            </div>
            <Link href="/" className="block text-center text-white/80 hover:text-white underline mt-4">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-lg flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">🃏 Digu (Gin Rummy)</h1>
            <p className="text-white/80">Room: {gameState?.roomId} | Round: {gameState?.currentRound}</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg">
            Leave
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Players Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">Players ({gameState?.players.length}/4)</h2>
            <div className="space-y-2">
              {gameState?.players.map((player, idx) => (
                <div
                  key={player.id}
                  className={`p-3 rounded-lg ${
                    idx === gameState.currentPlayerIndex
                      ? 'bg-yellow-500/30 border-2 border-yellow-400'
                      : 'bg-white/5'
                  } ${player.hasDropped ? 'opacity-50' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">
                      {player.name} {player.isBot && '🤖'}
                      {player.id === socket?.id && ' (You)'}
                    </span>
                    <span className="text-white/80 text-sm">{player.hand.length} cards</span>
                  </div>
                  <div className="text-sm text-white/70 mt-1">
                    Round: {player.roundScore} | Total: {player.totalScore}
                  </div>
                  {player.hasKnocked && <span className="text-yellow-300 text-xs">🔔 Knocked!</span>}
                  {player.hasDropped && <span className="text-red-300 text-xs">❌ Dropped</span>}
                </div>
              ))}
            </div>

            {gameState?.gameStatus === 'waiting' && (
              <button
                onClick={startGame}
                className="w-full mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg"
              >
                Start Game
              </button>
            )}

            {gameState?.gameStatus === 'playing' && (
              <button
                onClick={dropOut}
                className="w-full mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg"
              >
                Drop Out
              </button>
            )}
          </div>

          {/* Game Log */}
          <div className="mt-4 bg-white/10 backdrop-blur-md p-4 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-2">Game Log</h2>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {gameState?.gameLog.map((log, idx) => (
                <div key={idx} className="text-sm text-white/80">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="lg:col-span-3">
          {/* Discard Pile and Deck */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-lg mb-4">
            <div className="flex justify-center gap-8">
              <div>
                <p className="text-white text-center mb-2">Deck ({gameState?.deck.length})</p>
                <div
                  className="w-16 h-24 bg-blue-800 border-2 border-white rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => isMyTurn && myPlayer?.hand.length === 10 && drawCard(false)}
                >
                  <div className="flex items-center justify-center h-full text-white text-4xl">🂠</div>
                </div>
              </div>
              <div>
                <p className="text-white text-center mb-2">Discard Pile</p>
                {gameState?.discardPile && gameState.discardPile.length > 0 ? (
                  <div onClick={() => isMyTurn && myPlayer?.hand.length === 10 && drawCard(true)}>
                    {renderCard(gameState.discardPile[gameState.discardPile.length - 1], undefined, false)}
                  </div>
                ) : (
                  <div className="w-16 h-24 bg-gray-700 border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center text-white/50">
                    Empty
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* My Hand */}
          {myPlayer && (
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Your Hand ({myPlayer.hand.length} cards)</h2>
                <div className="flex gap-2">
                  {isMyTurn && myPlayer.hand.length === 11 && (
                    <span className="px-3 py-1 bg-yellow-500 text-white rounded-lg">
                      Discard a card!
                    </span>
                  )}
                  {isMyTurn && myPlayer.hand.length === 10 && (
                    <span className="px-3 py-1 bg-green-500 text-white rounded-lg">
                      Your Turn - Draw a card
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {myPlayer.hand.map((card, idx) => (
                  <div key={idx}>
                    {renderCard(
                      card,
                      () => {
                        if (showMeldBuilder) {
                          toggleCardSelection(card);
                        } else if (isMyTurn && myPlayer.hand.length === 11) {
                          discardCard(card);
                        }
                      },
                      selectedCards.some(c => c.suit === card.suit && c.rank === card.rank)
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowMeldBuilder(!showMeldBuilder)}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg"
                >
                  {showMeldBuilder ? 'Hide' : 'Build'} Melds
                </button>
                {myPlayer.hand.length === 10 && (
                  <button
                    onClick={knock}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"
                  >
                    🔔 Knock
                  </button>
                )}
              </div>

              {/* Meld Builder */}
              {showMeldBuilder && (
                <div className="mt-4 p-4 bg-black/30 rounded-lg">
                  <h3 className="text-white font-bold mb-2">Meld Builder</h3>
                  <p className="text-white/70 text-sm mb-4">
                    Select 3+ cards and create a Set (same rank) or Run (consecutive, same suit)
                  </p>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => createMeld('set')}
                      disabled={selectedCards.length < 3}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-lg"
                    >
                      Create Set
                    </button>
                    <button
                      onClick={() => createMeld('run')}
                      disabled={selectedCards.length < 3}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white rounded-lg"
                    >
                      Create Run
                    </button>
                    <button
                      onClick={declareMelds}
                      disabled={currentMelds.length === 0}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-500 text-white rounded-lg"
                    >
                      Declare Melds
                    </button>
                  </div>

                  {/* Current Melds */}
                  {currentMelds.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-white font-semibold">Your Melds:</h4>
                      {currentMelds.map((meld, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-white/10 p-2 rounded">
                          <span className="text-white text-sm">{meld.type}:</span>
                          <div className="flex gap-1">
                            {meld.cards.map((card, cidx) => (
                              <div key={cidx} className="scale-75">
                                {renderCard(card)}
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => removeMeld(idx)}
                            className="ml-auto px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Declared Melds */}
              {myPlayer.melds.length > 0 && (
                <div className="mt-4 p-4 bg-green-900/30 rounded-lg">
                  <h3 className="text-white font-bold mb-2">Your Declared Melds:</h3>
                  <div className="space-y-2">
                    {myPlayer.melds.map((meld, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-white text-sm">{meld.type}:</span>
                        <div className="flex gap-1">
                          {meld.cards.map((card, cidx) => (
                            <div key={cidx} className="scale-75">
                              {renderCard(card)}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Voting UI */}
          {gameState?.gameStatus === 'roundEnd' && gameState.endGameVoteTimer && (
            <div className="mt-4 bg-yellow-500/20 backdrop-blur-md p-6 rounded-lg border-2 border-yellow-400">
              <h2 className="text-2xl font-bold text-white mb-4 text-center">
                🗳️ End Game Vote
              </h2>
              <p className="text-white text-center mb-4">
                {voteTimer}s remaining - Do you want to end the game or continue?
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => voteEndGame(true)}
                  disabled={myPlayer?.id ? myPlayer.id in (gameState.endGameVotes || {}) : false}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 text-white font-bold rounded-lg"
                >
                  End Game
                </button>
                <button
                  onClick={() => voteEndGame(false)}
                  disabled={myPlayer?.id ? myPlayer.id in (gameState.endGameVotes || {}) : false}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-bold rounded-lg"
                >
                  Continue Playing
                </button>
              </div>
              <div className="mt-4 text-white/80 text-center text-sm">
                Votes: {Object.keys(gameState.endGameVotes || {}).length} /{' '}
                {gameState.players.filter(p => !p.hasDropped).length}
              </div>
            </div>
          )}

          {/* Round End / New Round */}
          {gameState?.gameStatus === 'roundEnd' && !gameState.endGameVoteTimer && (
            <div className="mt-4 bg-white/10 backdrop-blur-md p-6 rounded-lg text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Round {gameState.currentRound} Complete!</h2>
              <button
                onClick={startNewRound}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg"
              >
                Start Next Round
              </button>
            </div>
          )}

          {/* Game Finished */}
          {gameState?.gameStatus === 'finished' && (
            <div className="mt-4 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 backdrop-blur-md p-6 rounded-lg text-center border-2 border-yellow-400">
              <h2 className="text-3xl font-bold text-white mb-4">🏆 Game Finished!</h2>
              <div className="space-y-2">
                {gameState.players
                  .sort((a, b) => b.totalScore - a.totalScore)
                  .map((player, idx) => (
                    <div key={player.id} className="text-white text-lg">
                      {idx + 1}. {player.name} - {player.totalScore} points
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
