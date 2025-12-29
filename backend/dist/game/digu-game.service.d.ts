import { DiguService } from './digu.service';
import { DiguGameState, DiguPlayer } from './digu.types';
export declare class DiguGameService {
    private diguService;
    private rooms;
    private voteTimers;
    constructor(diguService: DiguService);
    private generateRoomCode;
    createRoom(host: DiguPlayer): DiguGameState;
    joinRoom(roomId: string, player: DiguPlayer): DiguGameState | null;
    startGame(roomId: string): DiguGameState | null;
    startNewRound(roomId: string): DiguGameState | null;
    getRoom(roomId: string): DiguGameState | null;
    drawCard(roomId: string, playerId: string, fromDiscard: boolean): DiguGameState | null;
    discardCard(roomId: string, playerId: string, card: any): DiguGameState | null;
    declareMelds(roomId: string, playerId: string, melds: any[]): DiguGameState | null;
    knock(roomId: string, playerId: string): DiguGameState | null;
    dropPlayer(roomId: string, playerId: string): DiguGameState | null;
    initiateEndGameVote(roomId: string): DiguGameState | null;
    voteEndGame(roomId: string, playerId: string, voteEnd: boolean): DiguGameState | null;
    private processEndGameVote;
    isBotTurn(roomId: string): boolean;
    playBotTurn(roomId: string): DiguGameState | null;
    deleteRoom(roomId: string): void;
}
