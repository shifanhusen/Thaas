import { Injectable } from '@nestjs/common';
import { Card, GameState, Player, Rank, Suit } from './types';

@Injectable()
export class BondiService {
  private readonly rankValues: Record<Rank, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  };

  private addLog(gameState: GameState, message: string): void {
    if (!gameState.gameLog) {
      gameState.gameLog = [];
    }
    gameState.gameLog.push(message);
    // Keep only last 50 log entries
    if (gameState.gameLog.length > 50) {
      gameState.gameLog = gameState.gameLog.slice(-50);
    }
  }

  private getCardName(card: Card): string {
    const suitNames = { 'S': '♠', 'H': '♥', 'D': '♦', 'C': '♣' };
    return `${card.rank}${suitNames[card.suit]}`;
  }

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

    // Log the play
    this.addLog(gameState, `${player.name} played ${this.getCardName(card)}`);

    if (!gameState.leadingSuit) {
      gameState.leadingSuit = card.suit;
      const suitNames = { 'S': 'Spades', 'H': 'Hearts', 'D': 'Diamonds', 'C': 'Clubs' };
      this.addLog(gameState, `Leading suit: ${suitNames[card.suit]}`);
    }

    const isInterrupted = card.suit !== gameState.leadingSuit;

    if (isInterrupted) {
      this.addLog(gameState, `⚠️ Suit interrupted! ${player.name} played off-suit`);
      return this.resolveInterruptedTrick(gameState);
    }

    const activePlayers = gameState.players.filter(p => !p.isSpectator);
    if (gameState.currentTrick.length === activePlayers.length) {
      return this.resolveCompleteTrick(gameState);
    }

    gameState.currentPlayerIndex = this.getNextPlayerIndex(gameState);
    return gameState;
  }

  private checkWinCondition(gameState: GameState) {
    // Check for new finishers
    gameState.players.forEach(p => {
      if (p.hand.length === 0 && !p.isSpectator) {
        if (!gameState.winners.some(w => w.id === p.id)) {
             gameState.winners.push(p);
             p.isSpectator = true;
             const position = gameState.winners.length;
             const suffix = position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th';
             this.addLog(gameState, `🏆 ${p.name} finished ${position}${suffix}!`);
        }
      }
    });

    // Check if game over (1 or 0 active players left)
    const activePlayers = gameState.players.filter(p => !p.isSpectator);
    if (activePlayers.length <= 1) {
      if (activePlayers.length === 1) {
        gameState.winners.push(activePlayers[0]); // Last player
        this.addLog(gameState, `💀 ${activePlayers[0].name} is the loser`);
      }
      gameState.gameStatus = 'finished';
      this.addLog(gameState, `🎮 Game Over!`);
    }
  }

  private resolveInterruptedTrick(gameState: GameState): GameState {
    const winnerId = this.getTrickWinner(gameState.currentTrick, gameState.leadingSuit!);
    const winnerIndex = gameState.players.findIndex(p => p.id === winnerId);
    const winner = gameState.players[winnerIndex];

    const cards = gameState.currentTrick.map(m => m.card);
    winner.hand.push(...cards);

    this.addLog(gameState, `${winner.name} won trick (+${cards.length} cards)`);

    gameState.currentTrick = [];
    gameState.leadingSuit = null;
    gameState.currentPlayerIndex = winnerIndex;

    this.checkWinCondition(gameState);

    return gameState;
  }

  private resolveCompleteTrick(gameState: GameState): GameState {
    const trick = [...gameState.currentTrick];
    const winnerId = this.getTrickWinner(trick, gameState.leadingSuit!);
    const winnerIndex = gameState.players.findIndex(p => p.id === winnerId);
    const winner = gameState.players[winnerIndex];

    this.addLog(gameState, `${winner.name} won trick (cards discarded)`);

    gameState.currentTrick = [];
    gameState.leadingSuit = null;

    // Check for finishers
    this.checkWinCondition(gameState);

    if (gameState.gameStatus === 'finished') return gameState;

    if (winner.isSpectator) {
        // Winner finished, pass lead to next active player
        // We temporarily set index to winner to find the next person from them
        gameState.currentPlayerIndex = winnerIndex;
        gameState.currentPlayerIndex = this.getNextPlayerIndex(gameState);
    } else {
        gameState.currentPlayerIndex = winnerIndex;
    }

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
      while (gameState.players[nextIndex].isSpectator && count < gameState.players.length) {
          nextIndex = (nextIndex + 1) % gameState.players.length;
          count++;
      }
      return nextIndex;
  }
}
