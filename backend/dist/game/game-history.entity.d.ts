export declare class GameHistory {
    id: number;
    roomId: string;
    gameType: string;
    players: {
        id: string;
        name: string;
        position: number;
    }[];
    gameLog: string[];
    totalRounds: number;
    duration: number;
    createdAt: Date;
    gameStatus: string;
}
