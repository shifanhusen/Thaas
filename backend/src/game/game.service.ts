import { Injectable } from '@nestjs/common';
import { BondiService } from './bondi.service';
import { GameState, Player } from './types';

@Injectable()
export class GameService {
  private rooms: Map<string, GameState> = new Map();

  constructor(private bondiService: BondiService) {}

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

  startGame(roomId: string): GameState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.players.length < 2) return null;

    room.gameStatus = 'playing';
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

    return this.bondiService.processTurn(room, player, card);
  }
}
