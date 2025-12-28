import { Injectable } from '@nestjs/common';
import { BondiService } from './bondi.service';
import { GameState, Player, ChatMessage } from './types';
// import { GameHistoryService } from './game-history.service';

@Injectable()
export class GameService {
  private rooms: Map<string, GameState> = new Map();
  private gameStartTimes: Map<string, Date> = new Map();

  constructor(
    private bondiService: BondiService,
    // private gameHistoryService: GameHistoryService,
  ) {}

  private generateRoomCode(): string {
    // Generate 6-character alphanumeric code (e.g., ABC123)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded similar-looking chars
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Check if code already exists, regenerate if it does
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }
    return code;
  }

  createRoom(host: Player, gameType: string): GameState {
    const roomId = this.generateRoomCode();
    const gameState: GameState = {
      roomId,
      players: [host],
      currentPlayerIndex: 0,
      currentTrick: [],
      leadingSuit: null,
      gameStatus: 'waiting',
      winners: [],
      gameLog: [],
      chatMessages: [],
    };
    this.rooms.set(roomId, gameState);
    return gameState;
  }

  joinRoom(roomId: string, player: Player): GameState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.gameStatus !== 'waiting') return null;
    if (room.players.length >= 8) return null; // Max 8 for Bondi

    room.players.push(player);
    return room;
  }

  joinAsSpectator(roomId: string, player: Player): GameState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    // Allow spectators to join even if game is playing
    
    player.isSpectator = true;
    room.players.push(player);
    return room;
  }

  startGame(roomId: string): GameState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.players.length < 2) return null;

    room.gameStatus = 'playing';
    room.gameLog = [];
    room.gameLog.push(`🎮 Game started with ${room.players.length} players`);
    
    // Track start time
    this.gameStartTimes.set(roomId, new Date());
    
    const deck = this.bondiService.createDeck();
    this.bondiService.dealCards(room.players, deck);

    // Find who has A of Spades to start
    let starterIndex = 0;
    room.players.forEach((p, index) => {
        if (p.hand.some(c => c.suit === 'S' && c.rank === 'A')) {
            starterIndex = index;
        }
    });
    room.currentPlayerIndex = starterIndex;
    room.gameLog.push(`${room.players[starterIndex].name} starts (has A♠)`);

    return room;
  }

  getRoom(roomId: string): GameState | null {
    return this.rooms.get(roomId) || null;
  }

  makeMove(roomId: string, playerId: string, card: any): GameState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    if (!this.bondiService.isValidMove(room, player, card)) {
        throw new Error('Invalid move');
    }

    this.bondiService.processTurn(room, player, card);

    // Check if game finished and save to history
    // TODO: Uncomment after running database migrations
    // if (room.gameStatus === 'finished') {
    //   const startTime = this.gameStartTimes.get(roomId);
    //   if (startTime) {
    //     this.gameHistoryService.saveGame(room, startTime).catch(err => {
    //       console.error('Failed to save game history:', err);
    //     });
    //     this.gameStartTimes.delete(roomId);
    //   }
    // }

    return room;
  }

  addChatMessage(roomId: string, playerId: string, message: string, type: 'text' | 'emoji'): ChatMessage | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    if (!room.chatMessages) {
      room.chatMessages = [];
    }

    const chatMessage: ChatMessage = {
      id: `${Date.now()}-${playerId}`,
      playerId,
      playerName: player.name,
      message,
      type,
      timestamp: Date.now(),
    };

    room.chatMessages.push(chatMessage);
    
    // Keep only last 50 messages
    if (room.chatMessages.length > 50) {
      room.chatMessages = room.chatMessages.slice(-50);
    }

    return chatMessage;
  }

  rematchGame(roomId: string): GameState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // Reset game state for rematch
    room.gameStatus = 'waiting';
    room.currentPlayerIndex = 0;
    room.currentTrick = [];
    room.leadingSuit = null;
    room.winners = [];
    room.gameLog = ['🔄 Rematch initiated! Waiting for all players...'];
    room.lastCompletedTrick = undefined;

    // Reset all players
    room.players.forEach(p => {
      p.hand = [];
      p.isSpectator = false;
    });

    return room;
  }
}
