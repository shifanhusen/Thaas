import { Injectable } from '@nestjs/common';
import { Card, DiguPlayer, DiguGameState, Meld, MeldValidation, RoundResult, Rank, Suit } from './digu.types';

@Injectable()
export class DiguService {
  private readonly cardValues: Record<Rank, number> = {
    'A': 15, // ACE = 15 points (special rule)
    'K': 10, 'Q': 10, 'J': 10,
    '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
  };

  private readonly rankOrder: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  private botNames = [
    'Bot Aisha 🤖',
    'Bot Ahmed 🤖',
    'Bot Hana 🤖',
    'Bot Zain 🤖',
  ];

  private addLog(gameState: DiguGameState, message: string): void {
    if (!gameState.gameLog) {
      gameState.gameLog = [];
    }
    gameState.gameLog.push(message);
    if (gameState.gameLog.length > 100) {
      gameState.gameLog = gameState.gameLog.slice(-100);
    }
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

  shuffle(deck: Card[]): Card[] {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  dealCards(gameState: DiguGameState): void {
    const deck = this.createDeck();
    
    // Deal 10 cards to each player
    gameState.players.forEach(player => {
      player.hand = deck.splice(0, 10);
      player.melds = [];
      player.hasKnocked = false;
      player.roundScore = 0;
    });

    // Remaining cards become the deck
    gameState.deck = deck.slice(0, -1); // Save last card for discard
    gameState.discardPile = [deck[deck.length - 1]]; // Last card starts discard pile

    this.addLog(gameState, `🎴 Round ${gameState.currentRound} started! Each player dealt 10 cards.`);
  }

  // Fill empty slots with bots
  fillWithBots(gameState: DiguGameState): void {
    const humanCount = gameState.players.filter(p => !p.isBot).length;
    const botsNeeded = 4 - gameState.players.length;

    for (let i = 0; i < botsNeeded; i++) {
      const botIndex = humanCount + i;
      const bot: DiguPlayer = {
        id: `bot-${Date.now()}-${i}`,
        name: this.botNames[botIndex % this.botNames.length],
        hand: [],
        isBot: true,
        socketId: '',
        melds: [],
        roundScore: 0,
        totalScore: 0,
        hasKnocked: false,
        hasDropped: false,
      };
      gameState.players.push(bot);
    }

    this.addLog(gameState, `🤖 ${botsNeeded} bot(s) joined the game`);
  }

  // Validate if cards form a valid meld
  validateMeld(cards: Card[]): MeldValidation {
    if (cards.length < 3) {
      return { isValid: false, message: 'Meld must have at least 3 cards' };
    }

    // Check for set (same rank)
    const allSameRank = cards.every(c => c.rank === cards[0].rank);
    if (allSameRank) {
      return { isValid: true, type: 'set' };
    }

    // Check for run (consecutive ranks, same suit)
    const allSameSuit = cards.every(c => c.suit === cards[0].suit);
    if (!allSameSuit) {
      return { isValid: false, message: 'Run must be same suit' };
    }

    // Sort cards by rank
    const sortedCards = [...cards].sort((a, b) => 
      this.rankOrder.indexOf(a.rank) - this.rankOrder.indexOf(b.rank)
    );

    // Check if consecutive (ACE cannot be in runs)
    for (let i = 0; i < sortedCards.length; i++) {
      if (sortedCards[i].rank === 'A') {
        return { isValid: false, message: 'Ace cannot be in runs (Ace = 15 points)' };
      }
      if (i > 0) {
        const prevIndex = this.rankOrder.indexOf(sortedCards[i - 1].rank);
        const currIndex = this.rankOrder.indexOf(sortedCards[i].rank);
        if (currIndex !== prevIndex + 1) {
          return { isValid: false, message: 'Run must be consecutive ranks' };
        }
      }
    }

    return { isValid: true, type: 'run' };
  }

  // Calculate deadwood (unmelded cards)
  calculateDeadwood(hand: Card[], melds: Meld[]): number {
    const meldedCards = new Set(melds.flatMap(m => m.cards.map(c => `${c.rank}${c.suit}`)));
    const deadwoodCards = hand.filter(c => !meldedCards.has(`${c.rank}${c.suit}`));
    return deadwoodCards.reduce((sum, card) => sum + this.cardValues[card.rank], 0);
  }

  // Check if player can knock (Strict Digu Rule: Deadwood must be 0)
  canKnock(player: DiguPlayer): boolean {
    const deadwood = this.calculateDeadwood(player.hand, player.melds);
    // User Requirement: "Once a player creates two sets of three-card sequences and one four-card sequence, they win."
    // This implies 0 deadwood.
    return deadwood === 0;
  }

  // Check for Big Digu (all cards melded at start)
  checkBigDigu(player: DiguPlayer): boolean {
    const totalMeldedCards = player.melds.reduce((sum, meld) => sum + meld.cards.length, 0);
    return totalMeldedCards === 10;
  }

  // Process knock
  processKnock(gameState: DiguGameState, playerId: string): RoundResult {
    const knocker = gameState.players.find(p => p.id === playerId);
    if (!knocker) throw new Error('Player not found');

    knocker.hasKnocked = true;
    gameState.knockedPlayerId = playerId;

    this.addLog(gameState, `🔔 ${knocker.name} knocked!`);

    // Calculate scores
    const scores: { [key: string]: number } = {};
    const deadwood: { [key: string]: number } = {};
    const melds: { [key: string]: Meld[] } = {};
    const bonuses: { [key: string]: string[] } = {};

    const knockerDeadwood = this.calculateDeadwood(knocker.hand, knocker.melds);
    deadwood[knocker.id] = knockerDeadwood;
    melds[knocker.id] = knocker.melds;
    bonuses[knocker.id] = [];

    // Check for Gin or Big Digu
    const isBigDigu = this.checkBigDigu(knocker);
    const isGin = knockerDeadwood === 0;

    if (isBigDigu) {
      scores[knocker.id] = 50; // +25 Gin + +25 Big Digu
      bonuses[knocker.id].push('Big Digu! (+50)');
      this.addLog(gameState, `🌟 ${knocker.name} has BIG DIGU! (+50 bonus)`);
    } else if (isGin) {
      scores[knocker.id] = 25;
      bonuses[knocker.id].push('Gin! (+25)');
      this.addLog(gameState, `✨ ${knocker.name} has Gin! (+25 bonus)`);
    }

    // Calculate other players' deadwood
    let winnerId = knocker.id;
    let knockerScore = scores[knocker.id] || 0;

    gameState.players.forEach(p => {
      if (p.id !== knocker.id && !p.hasDropped) {
        const playerDeadwood = this.calculateDeadwood(p.hand, p.melds);
        deadwood[p.id] = playerDeadwood;
        melds[p.id] = p.melds;
        bonuses[p.id] = [];

        if (isGin || isBigDigu) {
          // Knocker gets opponent's deadwood
          knockerScore += playerDeadwood;
          // Opponent loses points equal to their deadwood (optional rule, usually they just get 0 points in this round, but let's deduct for clarity if needed)
          // Standard Gin Rummy: Loser gets 0 points for the round, winner gets points.
          // If you want to DEDUCT from total score:
          // p.totalScore -= playerDeadwood; 
        } else {
          // Check for undercut
          if (playerDeadwood <= knockerDeadwood) {
            scores[p.id] = 25 + (knockerDeadwood - playerDeadwood);
            bonuses[p.id].push(`Undercut! (+25)`);
            winnerId = p.id;
            this.addLog(gameState, `💥 ${p.name} undercut ${knocker.name}!`);
          } else {
            knockerScore += (playerDeadwood - knockerDeadwood);
          }
        }
        
        // Deduct deadwood from total score (House Rule: Deadwood Penalty)
        // This ensures players are penalized for holding high cards
        p.totalScore -= playerDeadwood;
      }
    });

    scores[knocker.id] = knockerScore;

    // Update round scores
    Object.entries(scores).forEach(([playerId, score]) => {
      const player = gameState.players.find(p => p.id === playerId);
      if (player) {
        player.roundScore = score;
        player.totalScore += score;
        
        // Also deduct knocker's deadwood if not Gin
        if (playerId === knocker.id && !isGin && !isBigDigu) {
             player.totalScore -= knockerDeadwood;
        }
      }
    });

    return { winnerId, scores, melds, deadwood, bonuses };
  }

  // Bot AI: Simple strategy
  botTurn(gameState: DiguGameState, botPlayer: DiguPlayer): void {
    // Draw from discard if useful, otherwise from deck
    const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];
    const wouldFormMeld = this.wouldCardHelpMeld(botPlayer.hand, topDiscard);

    if (wouldFormMeld && Math.random() > 0.3 && gameState.discardPile.length > 0) {
      botPlayer.hand.push(gameState.discardPile.pop()!);
      this.addLog(gameState, `${botPlayer.name} drew from discard pile`);
    } else {
      // Check if deck is empty
      if (gameState.deck.length === 0) {
        if (gameState.discardPile.length > 1) {
          const topCard = gameState.discardPile.pop()!;
          gameState.deck = this.shuffle([...gameState.discardPile]);
          gameState.discardPile = [topCard];
          this.addLog(gameState, `🔄 Deck reshuffled from discard pile`);
        } else {
           // Edge case: No cards to draw (should be very rare)
           this.addLog(gameState, `⚠️ Deck and discard empty, cannot draw.`);
           return; 
        }
      }
      
      if (gameState.deck.length > 0) {
        botPlayer.hand.push(gameState.deck.pop()!);
        this.addLog(gameState, `${botPlayer.name} drew from deck`);
      }
    }

    // Try to form melds
    botPlayer.melds = this.findBestMelds(botPlayer.hand);

    // Discard worst card
    const worstCard = this.findWorstCard(botPlayer.hand, botPlayer.melds);
    botPlayer.hand = botPlayer.hand.filter(c => c !== worstCard);
    gameState.discardPile.push(worstCard);

    // Check if bot should knock
    if (this.canKnock(botPlayer) && Math.random() > 0.4) {
      this.addLog(gameState, `🤖 ${botPlayer.name} is ready to knock!`);
      botPlayer.hasKnocked = true;
    }
  }

  private wouldCardHelpMeld(hand: Card[], card: Card): boolean {
    // Simple check: does this card match rank or form sequence with existing cards
    return hand.some(c => 
      c.rank === card.rank || 
      (c.suit === card.suit && Math.abs(this.rankOrder.indexOf(c.rank) - this.rankOrder.indexOf(card.rank)) <= 2)
    );
  }

  private findBestMelds(hand: Card[]): Meld[] {
    const melds: Meld[] = [];
    const used = new Set<string>();

    // Find sets first
    const rankGroups = new Map<Rank, Card[]>();
    hand.forEach(card => {
      if (!rankGroups.has(card.rank)) rankGroups.set(card.rank, []);
      rankGroups.get(card.rank)!.push(card);
    });

    rankGroups.forEach((cards, rank) => {
      if (cards.length >= 3) {
        melds.push({ type: 'set', cards: cards.slice(0, Math.min(4, cards.length)) });
        cards.forEach(c => used.add(`${c.rank}${c.suit}`));
      }
    });

    // Find runs
    const suits: Suit[] = ['S', 'H', 'D', 'C'];
    suits.forEach(suit => {
      const suitCards = hand
        .filter(c => c.suit === suit && !used.has(`${c.rank}${c.suit}`) && c.rank !== 'A')
        .sort((a, b) => this.rankOrder.indexOf(a.rank) - this.rankOrder.indexOf(b.rank));

      let run: Card[] = [];
      for (let i = 0; i < suitCards.length; i++) {
        if (run.length === 0 || 
            this.rankOrder.indexOf(suitCards[i].rank) === this.rankOrder.indexOf(run[run.length - 1].rank) + 1) {
          run.push(suitCards[i]);
        } else {
          if (run.length >= 3) {
            melds.push({ type: 'run', cards: [...run] });
            run.forEach(c => used.add(`${c.rank}${c.suit}`));
          }
          run = [suitCards[i]];
        }
      }
      if (run.length >= 3) {
        melds.push({ type: 'run', cards: run });
      }
    });

    return melds;
  }

  private findWorstCard(hand: Card[], melds: Meld[]): Card {
    const meldedCards = new Set(melds.flatMap(m => m.cards.map(c => `${c.rank}${c.suit}`)));
    const deadwood = hand.filter(c => !meldedCards.has(`${c.rank}${c.suit}`));
    
    if (deadwood.length > 0) {
      // Discard highest value deadwood
      return deadwood.reduce((worst, card) => 
        this.cardValues[card.rank] > this.cardValues[worst.rank] ? card : worst
      );
    }
    
    // If no deadwood, discard from smallest meld (shouldn't happen often)
    return hand[0];
  }

  // Handle player drop with penalty
  handleDrop(gameState: DiguGameState, playerId: string): void {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;

    player.hasDropped = true;
    const deadwood = this.calculateDeadwood(player.hand, player.melds);
    const penalty = 25 + deadwood;

    this.addLog(gameState, `❌ ${player.name} dropped! (-${penalty} points)`);

    // Distribute penalty to remaining players
    const activePlayers = gameState.players.filter(p => !p.hasDropped && p.id !== playerId);
    const bonusPerPlayer = Math.floor(penalty / activePlayers.length);
    
    activePlayers.forEach(p => {
      p.totalScore += bonusPerPlayer;
    });
  }
}
