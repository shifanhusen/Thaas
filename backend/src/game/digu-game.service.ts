import { Injectable } from '@nestjs/common';
import { DiguService } from './digu.service';
import { DiguGameState, DiguPlayer } from './digu.types';

@Injectable()
export class DiguGameService {
  private rooms: Map<string, DiguGameState> = new Map();
  private voteTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(private diguService: DiguService) {}

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }
    return code;
  }

  createRoom(host: DiguPlayer): DiguGameState {
    const roomId = this.generateRoomCode();
    const gameState: DiguGameState = {
      roomId,
      gameType: 'digu',
      players: [host],
      currentPlayerIndex: 0,
      deck: [],
      discardPile: [],
      gameStatus: 'waiting',
      currentRound: 0,
      knockedPlayerId: null,
      gameLog: [],
      endGameVotes: {},
      endGameVoteTimer: null,
      targetScore: 100,
    };
    this.rooms.set(roomId, gameState);
    return gameState;
  }

  joinRoom(roomId: string, player: DiguPlayer): DiguGameState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.gameStatus !== 'waiting') return null;
    if (room.players.length >= 4) return null;

    room.players.push(player);
    return room;
  }

  startGame(roomId: string): DiguGameState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.players.length < 1) return null;

    // Fill with bots to make 4 players
    this.diguService.fillWithBots(room);

    room.gameStatus = 'playing';
    room.currentRound = 1;
    room.gameLog = [`🎮 Game started with ${room.players.length} players`];

    // Deal cards for first round
    this.diguService.dealCards(room);

    return room;
  }

  startNewRound(roomId: string): DiguGameState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // Reset round state
    room.currentRound++;
    room.knockedPlayerId = null;
    room.gameStatus = 'playing';
    room.endGameVotes = {};
    room.endGameVoteTimer = null;

    // Clear round scores
    room.players.forEach(p => {
      p.roundScore = 0;
      p.hasKnocked = false;
    });

    // Deal new cards
    this.diguService.dealCards(room);

    return room;
  }

  getRoom(roomId: string): DiguGameState | null {
    return this.rooms.get(roomId) || null;
  }

  // Player draws card
  drawCard(roomId: string, playerId: string, fromDiscard: boolean): DiguGameState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    if (fromDiscard && room.discardPile.length > 0) {
      player.hand.push(room.discardPile.pop()!);
    } else if (room.deck.length > 0) {
      player.hand.push(room.deck.pop()!);
    } else {
      // Reshuffle discard pile if deck empty
      const topCard = room.discardPile.pop()!;
      room.deck = this.diguService.shuffle([...room.discardPile]);
      room.discardPile = [topCard];
      player.hand.push(room.deck.pop()!);
    }

    return room;
  }

  // Player discards card
  discardCard(roomId: string, playerId: string, card: any): DiguGameState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    // Remove card from hand
    player.hand = player.hand.filter(c => !(c.suit === card.suit && c.rank === card.rank));
    room.discardPile.push(card);

    // Move to next player
    room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;

    return room;
  }

  // Player declares melds
  declareMelds(roomId: string, playerId: string, melds: any[]): DiguGameState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    // Validate and save melds
    player.melds = melds.filter(meld => 
      this.diguService.validateMeld(meld.cards).isValid
    );

    return room;
  }

  // Player knocks
  knock(roomId: string, playerId: string): DiguGameState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player || !this.diguService.canKnock(player)) return null;

    // Process knock and calculate scores
    const result = this.diguService.processKnock(room, playerId);
    room.gameStatus = 'roundEnd';

    // Check if any player reached target score
    const winner = room.players.find(p => p.totalScore >= room.targetScore);
    if (winner) {
      room.gameStatus = 'finished';
      room.gameLog.push(`🏆 ${winner.name} wins the game with ${winner.totalScore} points!`);
    }

    return room;
  }

  // Player drops
  dropPlayer(roomId: string, playerId: string): DiguGameState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    this.diguService.handleDrop(room, playerId);

    // Check if only 1 player left
    const activePlayers = room.players.filter(p => !p.hasDropped);
    if (activePlayers.length === 1) {
      room.gameStatus = 'finished';
      room.gameLog.push(`🏆 ${activePlayers[0].name} wins by default!`);
    }

    return room;
  }

  // Initiate end game vote
  initiateEndGameVote(roomId: string): DiguGameState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.gameStatus !== 'roundEnd') return null;

    room.endGameVotes = {};
    room.endGameVoteTimer = Date.now() + 30000; // 30 seconds

    // Set timeout to auto-end if no votes
    const timer = setTimeout(() => {
      const currentRoom = this.rooms.get(roomId);
      if (currentRoom && currentRoom.endGameVoteTimer) {
        // Auto-vote "end" for non-voters
        currentRoom.players.forEach(p => {
          if (!(p.id in currentRoom.endGameVotes)) {
            currentRoom.endGameVotes[p.id] = true; // Default to end
          }
        });
        this.processEndGameVote(roomId);
      }
    }, 30000);

    this.voteTimers.set(roomId, timer);
    return room;
  }

  // Player votes to end/continue game
  voteEndGame(roomId: string, playerId: string, voteEnd: boolean): DiguGameState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.endGameVotes[playerId] = voteEnd;

    // Check if all voted
    const activePlayers = room.players.filter(p => !p.hasDropped);
    if (Object.keys(room.endGameVotes).length === activePlayers.length) {
      this.processEndGameVote(roomId);
    }

    return room;
  }

  private processEndGameVote(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Clear timer
    const timer = this.voteTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.voteTimers.delete(roomId);
    }

    // Count votes
    const votes = Object.values(room.endGameVotes);
    const endVotes = votes.filter(v => v === true).length;
    const continueVotes = votes.filter(v => v === false).length;

    if (endVotes > continueVotes) {
      room.gameStatus = 'finished';
      room.gameLog.push(`🏁 Game ended by majority vote (${endVotes}-${continueVotes})`);
    } else {
      room.gameLog.push(`▶️ Game continues (${continueVotes}-${endVotes})`);
      // Room stays in roundEnd, waiting for host to start next round
    }

    room.endGameVoteTimer = null;
    room.endGameVotes = {};
  }

  // Check if current player is a bot
  isBotTurn(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.gameStatus !== 'playing') return false;
    const player = room.players[room.currentPlayerIndex];
    return !!player && player.isBot;
  }

  // Execute a bot turn
  playBotTurn(roomId: string): DiguGameState | null {
    const room = this.rooms.get(roomId);
    if (!room || room.gameStatus !== 'playing') return null;

    const player = room.players[room.currentPlayerIndex];
    if (!player || !player.isBot) return null;

    // Execute bot logic
    this.diguService.botTurn(room, player);

    // Check if bot knocked
    if (player.hasKnocked) {
      return this.knock(roomId, player.id);
    }

    // Move to next player
    room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;

    return room;
  }

  deleteRoom(roomId: string): void {
    this.rooms.delete(roomId);
    const timer = this.voteTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.voteTimers.delete(roomId);
    }
  }
}
