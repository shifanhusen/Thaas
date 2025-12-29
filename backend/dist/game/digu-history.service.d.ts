import { Repository } from 'typeorm';
import { DiguGame, DiguGamePlayer, DiguRound } from './digu-entities';
import { DiguPlayer } from './digu.types';
export declare class DiguHistoryService {
    private gameRepo;
    private playerRepo;
    private roundRepo;
    constructor(gameRepo: Repository<DiguGame>, playerRepo: Repository<DiguGamePlayer>, roundRepo: Repository<DiguRound>);
    createGame(roomId: string): Promise<string>;
    saveRound(gameId: string, roundNumber: number, winnerId: string | null, winnerName: string | null, scores: Record<string, number>): Promise<void>;
    finishGame(gameId: string, winnerId: string, winnerName: string, players: DiguPlayer[], totalRounds: number): Promise<void>;
}
