import { Repository } from 'typeorm';
import { GameHistory } from './game-history.entity';
import { GameState } from './types';
export declare class GameHistoryService {
    private gameHistoryRepository;
    constructor(gameHistoryRepository: Repository<GameHistory>);
    saveGame(gameState: GameState, startTime: Date): Promise<GameHistory>;
    getGameHistory(limit?: number): Promise<GameHistory[]>;
    getGameById(id: number): Promise<GameHistory | null>;
    getGamesByPlayer(playerName: string): Promise<GameHistory[]>;
}
