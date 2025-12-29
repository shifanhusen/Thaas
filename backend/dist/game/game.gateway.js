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
const digu_game_service_1 = require("./digu-game.service");
let GameGateway = class GameGateway {
    gameService;
    diguGameService;
    server;
    constructor(gameService, diguGameService) {
        this.gameService = gameService;
        this.diguGameService = diguGameService;
    }
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
    }
    createRoom(data, client) {
        console.log(`createRoom received from ${client.id}:`, data);
        if (data.gameType === 'digu') {
            const player = {
                id: client.id,
                name: data.name,
                hand: [],
                melds: [],
                roundScore: 0,
                totalScore: 0,
                hasKnocked: false,
                hasDropped: false,
                isBot: false,
                socketId: client.id
            };
            const gameState = this.diguGameService.createRoom(player);
            client.join(gameState.roomId);
            console.log(`Digu room created: ${gameState.roomId}`);
            return { event: 'roomCreated', data: gameState };
        }
        else {
            const player = { id: client.id, name: data.name, hand: [], isSpectator: false, socketId: client.id };
            const gameState = this.gameService.createRoom(player, data.gameType);
            client.join(gameState.roomId);
            console.log(`Room created: ${gameState.roomId}`);
            return { event: 'roomCreated', data: gameState };
        }
    }
    joinRoom(data, client) {
        let bondiRoom = this.gameService.getRoom(data.roomId);
        let diguRoom = this.diguGameService.getRoom(data.roomId);
        if (diguRoom) {
            const player = {
                id: client.id,
                name: data.name,
                hand: [],
                melds: [],
                roundScore: 0,
                totalScore: 0,
                hasKnocked: false,
                hasDropped: false,
                isBot: false,
                socketId: client.id
            };
            const room = this.diguGameService.joinRoom(data.roomId, player);
            if (room) {
                client.join(data.roomId);
                this.server.to(data.roomId).emit('playerJoined', room);
                return { event: 'joined', data: room };
            }
        }
        else if (bondiRoom) {
            const player = { id: client.id, name: data.name, hand: [], isSpectator: false, socketId: client.id };
            const room = this.gameService.joinRoom(data.roomId, player);
            if (room) {
                client.join(data.roomId);
                this.server.to(data.roomId).emit('playerJoined', room);
                return { event: 'joined', data: room };
            }
        }
        return { event: 'error', data: 'Room not found or full' };
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
        const diguRoom = this.diguGameService.getRoom(data.roomId);
        const bondiRoom = this.gameService.getRoom(data.roomId);
        if (diguRoom) {
            const room = this.diguGameService.startGame(data.roomId);
            if (room) {
                this.server.to(data.roomId).emit('gameStarted', room);
                this.handleBotTurns(data.roomId);
            }
        }
        else if (bondiRoom) {
            const room = this.gameService.startGame(data.roomId);
            if (room) {
                this.server.to(data.roomId).emit('gameStarted', room);
            }
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
    async handleBotTurns(roomId) {
        let room = this.diguGameService.getRoom(roomId);
        while (room && this.diguGameService.isBotTurn(roomId) && room.gameStatus === 'playing') {
            await new Promise(resolve => setTimeout(resolve, 1500));
            if (!this.diguGameService.isBotTurn(roomId))
                break;
            room = this.diguGameService.playBotTurn(roomId);
            if (room) {
                if (room.gameStatus === 'roundEnd' || room.gameStatus === 'finished') {
                    this.server.to(roomId).emit('roundEnded', room);
                    break;
                }
                else {
                    this.server.to(roomId).emit('gameStateUpdate', room);
                }
            }
            else {
                break;
            }
        }
    }
    diguDrawCard(data, client) {
        const room = this.diguGameService.drawCard(data.roomId, client.id, data.fromDiscard);
        if (room) {
            this.server.to(data.roomId).emit('gameStateUpdate', room);
        }
    }
    diguDiscardCard(data, client) {
        const room = this.diguGameService.discardCard(data.roomId, client.id, data.card);
        if (room) {
            this.server.to(data.roomId).emit('gameStateUpdate', room);
            this.handleBotTurns(data.roomId);
        }
    }
    diguDeclareMelds(data, client) {
        const room = this.diguGameService.declareMelds(data.roomId, client.id, data.melds);
        if (room) {
            this.server.to(data.roomId).emit('gameStateUpdate', room);
        }
    }
    diguKnock(data, client) {
        const room = this.diguGameService.knock(data.roomId, client.id);
        if (room) {
            this.server.to(data.roomId).emit('roundEnded', room);
        }
    }
    diguDrop(data, client) {
        const room = this.diguGameService.dropPlayer(data.roomId, client.id);
        if (room) {
            this.server.to(data.roomId).emit('playerDropped', room);
        }
    }
    diguVoteEndGame(data, client) {
        const room = this.diguGameService.voteEndGame(data.roomId, client.id, data.voteEnd);
        if (room) {
            this.server.to(data.roomId).emit('voteUpdate', room);
        }
    }
    diguStartNewRound(data) {
        const room = this.diguGameService.startNewRound(data.roomId);
        if (room) {
            this.server.to(data.roomId).emit('newRoundStarted', room);
            this.handleBotTurns(data.roomId);
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
__decorate([
    (0, websockets_1.SubscribeMessage)('diguDrawCard'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "diguDrawCard", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('diguDiscardCard'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "diguDiscardCard", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('diguDeclareMelds'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "diguDeclareMelds", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('diguKnock'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "diguKnock", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('diguDrop'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "diguDrop", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('diguVoteEndGame'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "diguVoteEndGame", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('diguStartNewRound'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "diguStartNewRound", null);
exports.GameGateway = GameGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    }),
    __metadata("design:paramtypes", [game_service_1.GameService,
        digu_game_service_1.DiguGameService])
], GameGateway);
//# sourceMappingURL=game.gateway.js.map