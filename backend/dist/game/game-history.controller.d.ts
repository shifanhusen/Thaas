import { GameHistoryService } from './game-history.service';
export declare class GameHistoryController {
    private gameHistoryService;
    constructor(gameHistoryService: GameHistoryService);
    getHistory(limit?: string): Promise<import("./game-history.entity").GameHistory[]>;
    getGameById(id: string): Promise<import("./game-history.entity").GameHistory | null>;
    getGamesByPlayer(name: string): Promise<import("./game-history.entity").GameHistory[]>;
}
