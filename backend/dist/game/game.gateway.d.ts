import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { DiguGameService } from './digu-game.service';
export declare class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private gameService;
    private diguGameService;
    server: Server;
    constructor(gameService: GameService, diguGameService: DiguGameService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    createRoom(data: {
        name: string;
        gameType: string;
    }, client: Socket): {
        event: string;
        data: import("./digu.types").DiguGameState;
    } | {
        event: string;
        data: import("./types").GameState;
    };
    joinRoom(data: {
        roomId: string;
        name: string;
    }, client: Socket): {
        event: string;
        data: import("./digu.types").DiguGameState;
    } | {
        event: string;
        data: import("./types").GameState;
    } | {
        event: string;
        data: string;
    };
    joinAsSpectator(data: {
        roomId: string;
        name: string;
    }, client: Socket): {
        event: string;
        data: import("./types").GameState;
    } | {
        event: string;
        data: string;
    };
    startGame(data: {
        roomId: string;
    }): void;
    playCard(data: {
        roomId: string;
        card: any;
    }, client: Socket): void;
    rematch(data: {
        roomId: string;
    }): void;
    sendMessage(data: {
        roomId: string;
        message: string;
        type: 'text' | 'emoji';
    }, client: Socket): void;
    private handleBotTurns;
    diguDrawCard(data: {
        roomId: string;
        fromDiscard: boolean;
    }, client: Socket): void;
    diguDiscardCard(data: {
        roomId: string;
        card: any;
    }, client: Socket): void;
    diguDeclareMelds(data: {
        roomId: string;
        melds: any[];
    }, client: Socket): void;
    diguKnock(data: {
        roomId: string;
        melds?: any[];
    }, client: Socket): void;
    diguDrop(data: {
        roomId: string;
    }, client: Socket): void;
    diguVoteEndGame(data: {
        roomId: string;
        voteEnd: boolean;
    }, client: Socket): void;
    diguStartNewRound(data: {
        roomId: string;
    }): void;
    sendEmote(data: {
        roomId: string;
        emoji: string;
    }, client: Socket): void;
}
