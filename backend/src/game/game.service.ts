import { Injectable } from '@nestjs/common';
import { BondiService } from './bondi.service';
import { GameState, Player } from './types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GameService {
  private rooms: Map<string, GameState> = new Map();

  constructor(private bondiService: BondiService) {}

  createRoom(host: Player, gameType: string): string {
    const roomId = uuidv4();
    const gameState: GameState = {
      roomId,
      players: [host],
      currentPlayerIndex: 0,
      currentTrick: [],
      leadingSuit: null,
      gameStatus: 'waiting',
      winner: null,
    };
    this.rooms.set(roomId, gameState);
    return roomId;
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
