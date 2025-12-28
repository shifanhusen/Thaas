export type Suit = 'S' | 'H' | 'D' | 'C';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface DiguPlayer {
  id: string;
  name: string;
  hand: Card[];
  isBot: boolean;
  socketId: string;
  melds: Meld[];
  roundScore: number;
  totalScore: number;
  hasKnocked: boolean;
  hasDropped: boolean;
}

export interface Meld {
  type: 'set' | 'run';
  cards: Card[];
}

export interface DiguGameState {
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
  endGameVotes: { [playerId: string]: boolean }; // true = end, false = continue
  endGameVoteTimer: number | null;
  targetScore: number; // 100 points to win
}

export interface MeldValidation {
  isValid: boolean;
  type?: 'set' | 'run';
  message?: string;
}

export interface RoundResult {
  winnerId: string;
  scores: { [playerId: string]: number };
  melds: { [playerId: string]: Meld[] };
  deadwood: { [playerId: string]: number };
  bonuses: { [playerId: string]: string[] };
}
