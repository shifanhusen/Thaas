export declare class DiguGame {
    id: string;
    roomId: string;
    startTime: Date;
    endTime: Date | null;
    winnerId: string | null;
    winnerName: string | null;
    totalRounds: number;
    status: string;
    players: DiguGamePlayer[];
    rounds: DiguRound[];
}
export declare class DiguGamePlayer {
    id: string;
    game: DiguGame;
    playerId: string;
    playerName: string;
    isBot: boolean;
    finalTotalScore: number;
    isWinner: boolean;
}
export declare class DiguRound {
    id: string;
    game: DiguGame;
    roundNumber: number;
    winnerId: string | null;
    winnerName: string | null;
    scores: Record<string, number>;
    endTime: Date;
}
