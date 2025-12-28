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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const common_1 = require("@nestjs/common");
const bondi_service_1 = require("./bondi.service");
const game_history_service_1 = require("./game-history.service");
let GameService = class GameService {
    bondiService;
    gameHistoryService;
    rooms = new Map();
    gameStartTimes = new Map();
    constructor(bondiService, gameHistoryService) {
        this.bondiService = bondiService;
        this.gameHistoryService = gameHistoryService;
    }
    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (this.rooms.has(code)) {
            return this.generateRoomCode();
        }
        return code;
    }
    createRoom(host, gameType) {
        const roomId = this.generateRoomCode();
        const gameState = {
            roomId,
            players: [host],
            currentPlayerIndex: 0,
            currentTrick: [],
            leadingSuit: null,
            gameStatus: 'waiting',
            winners: [],
            gameLog: [],
            chatMessages: [],
        };
        this.rooms.set(roomId, gameState);
        return gameState;
    }
    joinRoom(roomId, player) {
        const room = this.rooms.get(roomId);
        if (!room)
            return null;
        if (room.gameStatus !== 'waiting')
            return null;
        if (room.players.length >= 8)
            return null;
        room.players.push(player);
        return room;
    }
    joinAsSpectator(roomId, player) {
        const room = this.rooms.get(roomId);
        if (!room)
            return null;
        player.isSpectator = true;
        room.players.push(player);
        return room;
    }
    startGame(roomId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return null;
        if (room.players.length < 2)
            return null;
        room.gameStatus = 'playing';
        room.gameLog = [];
        room.gameLog.push(`🎮 Game started with ${room.players.length} players`);
        this.gameStartTimes.set(roomId, new Date());
        const deck = this.bondiService.createDeck();
        this.bondiService.dealCards(room.players, deck);
        let starterIndex = 0;
        room.players.forEach((p, index) => {
            if (p.hand.some(c => c.suit === 'S' && c.rank === 'A')) {
                starterIndex = index;
            }
        });
        room.currentPlayerIndex = starterIndex;
        room.gameLog.push(`${room.players[starterIndex].name} starts (has A♠)`);
        return room;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId) || null;
    }
    makeMove(roomId, playerId, card) {
        const room = this.rooms.get(roomId);
        if (!room)
            return null;
        const player = room.players.find(p => p.id === playerId);
        if (!player)
            return null;
        if (!this.bondiService.isValidMove(room, player, card)) {
            throw new Error('Invalid move');
        }
        this.bondiService.processTurn(room, player, card);
        if (room.gameStatus === 'finished') {
            const startTime = this.gameStartTimes.get(roomId);
            if (startTime) {
                this.gameHistoryService.saveGame(room, startTime).catch(err => {
                    console.error('Failed to save game history:', err);
                });
                this.gameStartTimes.delete(roomId);
            }
        }
        return room;
    }
    addChatMessage(roomId, playerId, message, type) {
        const room = this.rooms.get(roomId);
        if (!room)
            return null;
        const player = room.players.find(p => p.id === playerId);
        if (!player)
            return null;
        if (!room.chatMessages) {
            room.chatMessages = [];
        }
        const chatMessage = {
            id: `${Date.now()}-${playerId}`,
            playerId,
            playerName: player.name,
            message,
            type,
            timestamp: Date.now(),
        };
        room.chatMessages.push(chatMessage);
        if (room.chatMessages.length > 50) {
            room.chatMessages = room.chatMessages.slice(-50);
        }
        return chatMessage;
    }
    rematchGame(roomId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return null;
        room.gameStatus = 'waiting';
        room.currentPlayerIndex = 0;
        room.currentTrick = [];
        room.leadingSuit = null;
        room.winners = [];
        room.gameLog = ['🔄 Rematch initiated! Waiting for all players...'];
        room.lastCompletedTrick = undefined;
        room.players.forEach(p => {
            p.hand = [];
            p.isSpectator = false;
        });
        return room;
    }
};
exports.GameService = GameService;
exports.GameService = GameService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bondi_service_1.BondiService,
        game_history_service_1.GameHistoryService])
], GameService);
//# sourceMappingURL=game.service.js.map