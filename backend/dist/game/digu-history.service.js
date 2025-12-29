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
exports.DiguHistoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const digu_entities_1 = require("./digu-entities");
let DiguHistoryService = class DiguHistoryService {
    gameRepo;
    playerRepo;
    roundRepo;
    constructor(gameRepo, playerRepo, roundRepo) {
        this.gameRepo = gameRepo;
        this.playerRepo = playerRepo;
        this.roundRepo = roundRepo;
    }
    async createGame(roomId) {
        const game = this.gameRepo.create({
            roomId,
            startTime: new Date(),
            status: 'playing',
        });
        const savedGame = await this.gameRepo.save(game);
        return savedGame.id;
    }
    async saveRound(gameId, roundNumber, winnerId, winnerName, scores) {
        const round = this.roundRepo.create({
            game: { id: gameId },
            roundNumber,
            winnerId,
            winnerName,
            scores,
        });
        await this.roundRepo.save(round);
    }
    async finishGame(gameId, winnerId, winnerName, players, totalRounds) {
        await this.gameRepo.update(gameId, {
            endTime: new Date(),
            winnerId,
            winnerName,
            status: 'finished',
            totalRounds,
        });
        const playerEntities = players.map(p => this.playerRepo.create({
            game: { id: gameId },
            playerId: p.id,
            playerName: p.name,
            isBot: p.isBot,
            finalTotalScore: p.totalScore,
            isWinner: p.id === winnerId,
        }));
        await this.playerRepo.save(playerEntities);
    }
};
exports.DiguHistoryService = DiguHistoryService;
exports.DiguHistoryService = DiguHistoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(digu_entities_1.DiguGame)),
    __param(1, (0, typeorm_1.InjectRepository)(digu_entities_1.DiguGamePlayer)),
    __param(2, (0, typeorm_1.InjectRepository)(digu_entities_1.DiguRound)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DiguHistoryService);
//# sourceMappingURL=digu-history.service.js.map