import { Injectable } from '@nestjs/common';
import { Card, GameState, Player, Rank, Suit } from './types';

@Injectable()
export class BondiService {
  private readonly rankValues: Record<Rank, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  };

  createDeck(): Card[] {
    const suits: Suit[] = ['S', 'H', 'D', 'C'];
    const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: Card[] = [];
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ suit, rank });
      }
    }
    return this.shuffle(deck);
  }

  private shuffle(deck: Card[]): Card[] {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  dealCards(players: Player[], deck: Card[]): Player[] {
    let playerIndex = 0;
    while (deck.length > 0) {
      players[playerIndex].hand.push(deck.pop()!);
      playerIndex = (playerIndex + 1) % players.length;
    }
    return players;
  }

  isValidMove(gameState: GameState, player: Player, card: Card): boolean {
    if (gameState.players[gameState.currentPlayerIndex].id !== player.id) return false;
    if (!player.hand.some(c => c.suit === card.suit && c.rank === card.rank)) return false;

    if (gameState.leadingSuit) {
      const hasLeadingSuit = player.hand.some(c => c.suit === gameState.leadingSuit);
      if (hasLeadingSuit && card.suit !== gameState.leadingSuit) {
        return false;
      }
    }
    return true;
  }

  processTurn(gameState: GameState, player: Player, card: Card): GameState {
    player.hand = player.hand.filter(c => !(c.suit === card.suit && c.rank === card.rank));
    gameState.currentTrick.push({ playerId: player.id, card });

    if (!gameState.leadingSuit) {
      gameState.leadingSuit = card.suit;
    }

    const isInterrupted = card.suit !== gameState.leadingSuit;

    if (isInterrupted) {
      return this.resolveInterruptedTrick(gameState);
    }

    const activePlayers = gameState.players.filter(p => !p.isSpectator && p.hand.length > 0);
    if (gameState.currentTrick.length === activePlayers.length) {
      return this.resolveCompleteTrick(gameState);
    }

    gameState.currentPlayerIndex = this.getNextPlayerIndex(gameState);
    return gameState;
  }

  private resolveInterruptedTrick(gameState: GameState): GameState {
    const winnerId = this.getTrickWinner(gameState.currentTrick, gameState.leadingSuit!);
    const winnerIndex = gameState.players.findIndex(p => p.id === winnerId);
    const winner = gameState.players[winnerIndex];

    const cards = gameState.currentTrick.map(m => m.card);
    winner.hand.push(...cards);

    gameState.currentTrick = [];
    gameState.leadingSuit = null;
    gameState.currentPlayerIndex = winnerIndex;

    // Check if anyone (who didn't pick up) has 0 cards
    const finishedPlayer = gameState.players.find(p => p.hand.length === 0);
    if (finishedPlayer) {
      gameState.winner = finishedPlayer;
      gameState.gameStatus = 'finished';
    }

    return gameState;
  }

  private resolveCompleteTrick(gameState: GameState): GameState {
    const trick = [...gameState.currentTrick];
    const winnerId = this.getTrickWinner(trick, gameState.leadingSuit!);
    const winnerIndex = gameState.players.findIndex(p => p.id === winnerId);
    const winner = gameState.players[winnerIndex];

    gameState.currentTrick = [];
    gameState.leadingSuit = null;

    // Check if anyone has 0 cards (including the winner of this trick)
    const finishedPlayer = gameState.players.find(p => p.hand.length === 0);
    if (finishedPlayer) {
      gameState.winner = finishedPlayer;
      gameState.gameStatus = 'finished';
      return gameState;
    }

    gameState.currentPlayerIndex = winnerIndex;
    return gameState;
  }
  
  private getTrickWinner(trick: { playerId: string; card: Card }[], leadingSuit: Suit): string {
      let highestRank = -1;
      let winnerId = '';
      
      for (const move of trick) {
          if (move.card.suit === leadingSuit) {
              const val = this.rankValues[move.card.rank];
              if (val > highestRank) {
                  highestRank = val;
                  winnerId = move.playerId;
              }
          }
      }
      return winnerId;
  }

  private getNextPlayerIndex(gameState: GameState): number {
      let nextIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
      let count = 0;
      while ((gameState.players[nextIndex].isSpectator || gameState.players[nextIndex].hand.length === 0) && count < gameState.players.length) {
          nextIndex = (nextIndex + 1) % gameState.players.length;
          count++;
      }
      return nextIndex;
  }
}
