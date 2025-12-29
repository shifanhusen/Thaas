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
exports.DiguGameService = void 0;
const common_1 = require("@nestjs/common");
const digu_service_1 = require("./digu.service");
const digu_history_service_1 = require("./digu-history.service");
let DiguGameService = class DiguGameService {
    diguService;
    historyService;
    rooms = new Map();
    voteTimers = new Map();
    constructor(diguService, historyService) {
        this.diguService = diguService;
        this.historyService = historyService;
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
    createRoom(host) {
        const roomId = this.generateRoomCode();
        const gameState = {
            roomId,
            gameType: 'digu',
            players: [host],
            currentPlayerIndex: 0,
            deck: [],
            discardPile: [],
            gameStatus: 'waiting',
            currentRound: 0,
            knockedPlayerId: null,
            gameLog: [],
            endGameVotes: {},
            endGameVoteTimer: null,
            targetScore: 100,
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
        if (room.players.length >= 4)
            return null;
        room.players.push(player);
        return room;
    }
    startGame(roomId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return null;
        if (room.players.length < 1)
            return null;
        this.diguService.fillWithBots(room);
        room.gameStatus = 'playing';
        room.currentRound = 1;
        room.gameLog = [`🎮 Game started with ${room.players.length} players`];
        this.diguService.dealCards(room);
        this.historyService.createGame(roomId).then(id => {
            room.dbGameId = id;
        });
        return room;
    }
    startNewRound(roomId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return null;
        room.currentRound++;
        room.knockedPlayerId = null;
        room.gameStatus = 'playing';
        room.endGameVotes = {};
        room.endGameVoteTimer = null;
        room.players.forEach(p => {
            p.roundScore = 0;
            p.hasKnocked = false;
        });
        this.diguService.dealCards(room);
        return room;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId) || null;
    }
    drawCard(roomId, playerId, fromDiscard) {
        const room = this.rooms.get(roomId);
        if (!room)
            return null;
        const player = room.players.find(p => p.id === playerId);
        if (!player)
            return null;
        if (fromDiscard && room.discardPile.length > 0) {
            player.hand.push(room.discardPile.pop());
        }
        else if (room.deck.length > 0) {
            player.hand.push(room.deck.pop());
        }
        else {
            if (room.discardPile.length > 1) {
                const topCard = room.discardPile.pop();
                room.deck = this.diguService.shuffle([...room.discardPile]);
                room.discardPile = [topCard];
                player.hand.push(room.deck.pop());
            }
            else {
                return null;
            }
        }
        return room;
    }
    discardCard(roomId, playerId, card) {
        const room = this.rooms.get(roomId);
        if (!room)
            return null;
        const player = room.players.find(p => p.id === playerId);
        if (!player)
            return null;
        player.hand = player.hand.filter(c => !(c.suit === card.suit && c.rank === card.rank));
        room.discardPile.push(card);
        room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
        return room;
    }
    declareMelds(roomId, playerId, melds) {
        const room = this.rooms.get(roomId);
        if (!room)
            return null;
        const player = room.players.find(p => p.id === playerId);
        if (!player)
            return null;
        player.melds = melds.filter(meld => this.diguService.validateMeld(meld.cards).isValid);
        return room;
    }
    knock(roomId, playerId, melds) {
        const room = this.rooms.get(roomId);
        if (!room)
            return null;
        const player = room.players.find(p => p.id === playerId);
        if (!player)
            return null;
        if (melds && Array.isArray(melds)) {
            player.melds = melds.filter(meld => this.diguService.validateMeld(meld.cards).isValid);
        }
        if (!this.diguService.canKnock(player))
            return null;
        const result = this.diguService.processKnock(room, playerId);
        room.gameStatus = 'roundEnd';
        if (room.dbGameId) {
            const scores = {};
            room.players.forEach(p => scores[p.id] = p.roundScore);
            this.historyService.saveRound(room.dbGameId, room.currentRound, result.winnerId, room.players.find(p => p.id === result.winnerId)?.name || null, scores);
        }
        const winner = room.players.find(p => p.totalScore >= room.targetScore);
        if (winner) {
            room.gameStatus = 'finished';
            room.gameLog.push(`🏆 ${winner.name} wins the game with ${winner.totalScore} points!`);
            if (room.dbGameId) {
                this.historyService.finishGame(room.dbGameId, winner.id, winner.name, room.players, room.currentRound);
            }
        }
        return room;
    }
    dropPlayer(roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return null;
        this.diguService.handleDrop(room, playerId);
        const activePlayers = room.players.filter(p => !p.hasDropped);
        if (activePlayers.length === 1) {
            room.gameStatus = 'finished';
            room.gameLog.push(`🏆 ${activePlayers[0].name} wins by default!`);
            if (room.dbGameId) {
                this.historyService.finishGame(room.dbGameId, activePlayers[0].id, activePlayers[0].name, room.players, room.currentRound);
            }
        }
        return room;
    }
    initiateEndGameVote(roomId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return null;
        if (room.gameStatus !== 'roundEnd')
            return null;
        room.endGameVotes = {};
        room.endGameVoteTimer = Date.now() + 30000;
        const timer = setTimeout(() => {
            const currentRoom = this.rooms.get(roomId);
            if (currentRoom && currentRoom.endGameVoteTimer) {
                currentRoom.players.forEach(p => {
                    if (!(p.id in currentRoom.endGameVotes)) {
                        currentRoom.endGameVotes[p.id] = true;
                    }
                });
                this.processEndGameVote(roomId);
            }
        }, 30000);
        this.voteTimers.set(roomId, timer);
        return room;
    }
    voteEndGame(roomId, playerId, voteEnd) {
        const room = this.rooms.get(roomId);
        if (!room)
            return null;
        room.endGameVotes[playerId] = voteEnd;
        const humanPlayers = room.players.filter(p => !p.hasDropped && !p.isBot);
        const humanVotes = Object.keys(room.endGameVotes).filter(id => humanPlayers.some(p => p.id === id));
        if (humanVotes.length === humanPlayers.length) {
            this.processEndGameVote(roomId);
        }
        return room;
    }
    processEndGameVote(roomId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const timer = this.voteTimers.get(roomId);
        if (timer) {
            clearTimeout(timer);
            this.voteTimers.delete(roomId);
        }
        const botCount = room.players.filter(p => p.isBot && !p.hasDropped).length;
        const humanVotes = Object.values(room.endGameVotes);
        const endVotes = humanVotes.filter(v => v === true).length + botCount;
        const continueVotes = humanVotes.filter(v => v === false).length;
        if (endVotes > continueVotes) {
            room.gameStatus = 'finished';
            room.gameLog.push(`🏁 Game ended by majority vote (${endVotes}-${continueVotes})`);
            if (room.dbGameId) {
                const winner = room.players.reduce((prev, current) => (prev.totalScore > current.totalScore) ? prev : current);
                this.historyService.finishGame(room.dbGameId, winner.id, winner.name, room.players, room.currentRound);
            }
        }
        else {
            room.gameLog.push(`▶️ Game continues (${continueVotes}-${endVotes})`);
        }
        room.endGameVoteTimer = null;
        room.endGameVotes = {};
    }
    isBotTurn(roomId) {
        const room = this.rooms.get(roomId);
        if (!room || room.gameStatus !== 'playing')
            return false;
        const player = room.players[room.currentPlayerIndex];
        return !!player && player.isBot;
    }
    playBotTurn(roomId) {
        const room = this.rooms.get(roomId);
        if (!room || room.gameStatus !== 'playing')
            return null;
        const player = room.players[room.currentPlayerIndex];
        if (!player || !player.isBot)
            return null;
        this.diguService.botTurn(room, player);
        if (player.hasKnocked) {
            return this.knock(roomId, player.id);
        }
        room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
        return room;
    }
    deleteRoom(roomId) {
        this.rooms.delete(roomId);
        const timer = this.voteTimers.get(roomId);
        if (timer) {
            clearTimeout(timer);
            this.voteTimers.delete(roomId);
        }
    }
};
exports.DiguGameService = DiguGameService;
exports.DiguGameService = DiguGameService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [digu_service_1.DiguService,
        digu_history_service_1.DiguHistoryService])
], DiguGameService);
//# sourceMappingURL=digu-game.service.js.map