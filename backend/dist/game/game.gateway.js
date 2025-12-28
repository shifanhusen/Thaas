"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const game_service_1 = require("./game.service");
let GameGateway = class GameGateway {
    gameService;
    server;
    constructor(gameService) {
        this.gameService = gameService;
    }
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
    }
    createRoom(data, client) {
        console.log(`createRoom received from ${client.id}:`, data);
        const player = { id: client.id, name: data.name, hand: [], isSpectator: false, socketId: client.id };
        const gameState = this.gameService.createRoom(player, data.gameType);
        client.join(gameState.roomId);
        console.log(`Room created: ${gameState.roomId}`);
        return { event: 'roomCreated', data: gameState };
    }
    joinRoom(data, client) {
        const player = { id: client.id, name: data.name, hand: [], isSpectator: false, socketId: client.id };
        const room = this.gameService.joinRoom(data.roomId, player);
        if (room) {
            client.join(data.roomId);
            this.server.to(data.roomId).emit('playerJoined', room);
            return { event: 'joined', data: room };
        }
        else {
            return { event: 'error', data: 'Room not found or full' };
        }
    }
    joinAsSpectator(data, client) {
        const player = { id: client.id, name: data.name, hand: [], isSpectator: true, socketId: client.id };
        const room = this.gameService.joinAsSpectator(data.roomId, player);
        if (room) {
            client.join(data.roomId);
            this.server.to(data.roomId).emit('spectatorJoined', room);
            return { event: 'joinedAsSpectator', data: room };
        }
        else {
            return { event: 'error', data: 'Room not found' };
        }
    }
    startGame(data) {
        const room = this.gameService.startGame(data.roomId);
        if (room) {
            this.server.to(data.roomId).emit('gameStarted', room);
        }
    }
    playCard(data, client) {
        try {
            const room = this.gameService.makeMove(data.roomId, client.id, data.card);
            if (room) {
                this.server.to(data.roomId).emit('gameStateUpdate', room);
            }
        }
        catch (e) {
            client.emit('error', e.message);
        }
    }
    rematch(data) {
        const room = this.gameService.rematchGame(data.roomId);
        if (room) {
            this.server.to(data.roomId).emit('rematchStarted', room);
        }
    }
    sendMessage(data, client) {
        const chatMessage = this.gameService.addChatMessage(data.roomId, client.id, data.message, data.type);
        if (chatMessage) {
            this.server.to(data.roomId).emit('newMessage', chatMessage);
        }
    }
};
exports.GameGateway = GameGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], GameGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('createRoom'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "createRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "joinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinAsSpectator'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "joinAsSpectator", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('startGame'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "startGame", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('playCard'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "playCard", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('rematch'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "rematch", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "sendMessage", null);
exports.GameGateway = GameGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    }),
    __metadata("design:paramtypes", [game_service_1.GameService])
], GameGateway);
//# sourceMappingURL=game.gateway.js.map