import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
export declare class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private gameService;
    server: Server;
    constructor(gameService: GameService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    createRoom(data: {
        name: string;
        gameType: string;
    }, client: Socket): {
        event: string;
        data: import("./types").GameState;
    };
    joinRoom(data: {
        roomId: string;
        name: string;
    }, client: Socket): {
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
}
