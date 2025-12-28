import { BondiService } from './bondi.service';
import { GameState, Player, ChatMessage } from './types';
import { GameHistoryService } from './game-history.service';
export declare class GameService {
    private bondiService;
    private gameHistoryService;
    private rooms;
    private gameStartTimes;
    constructor(bondiService: BondiService, gameHistoryService: GameHistoryService);
    private generateRoomCode;
    createRoom(host: Player, gameType: string): GameState;
    joinRoom(roomId: string, player: Player): GameState | null;
    joinAsSpectator(roomId: string, player: Player): GameState | null;
    startGame(roomId: string): GameState | null;
    getRoom(roomId: string): GameState | null;
    makeMove(roomId: string, playerId: string, card: any): GameState | null;
    addChatMessage(roomId: string, playerId: string, message: string, type: 'text' | 'emoji'): ChatMessage | null;
    rematchGame(roomId: string): GameState | null;
}
