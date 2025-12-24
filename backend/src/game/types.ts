export type Suit = 'S' | 'H' | 'D' | 'C';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isSpectator: boolean;
  socketId: string;
}

export interface GameState {
  roomId: string;
  players: Player[];
  currentPlayerIndex: number;
  currentTrick: { playerId: string; card: Card }[];
  leadingSuit: Suit | null;
  gameStatus: 'waiting' | 'playing' | 'finished';
  winners: Player[]; // List of players in order of finishing
}
