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
exports.DiguRound = exports.DiguGamePlayer = exports.DiguGame = void 0;
const typeorm_1 = require("typeorm");
let DiguGame = class DiguGame {
    id;
    roomId;
    startTime;
    endTime;
    winnerId;
    winnerName;
    totalRounds;
    status;
    players;
    rounds;
};
exports.DiguGame = DiguGame;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DiguGame.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'room_id' }),
    __metadata("design:type", String)
], DiguGame.prototype, "roomId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'start_time' }),
    __metadata("design:type", Date)
], DiguGame.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'end_time', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], DiguGame.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'winner_id', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], DiguGame.prototype, "winnerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'winner_name', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], DiguGame.prototype, "winnerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_rounds', default: 0 }),
    __metadata("design:type", Number)
], DiguGame.prototype, "totalRounds", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'finished' }),
    __metadata("design:type", String)
], DiguGame.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => DiguGamePlayer, player => player.game, { cascade: true }),
    __metadata("design:type", Array)
], DiguGame.prototype, "players", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => DiguRound, round => round.game, { cascade: true }),
    __metadata("design:type", Array)
], DiguGame.prototype, "rounds", void 0);
exports.DiguGame = DiguGame = __decorate([
    (0, typeorm_1.Entity)('digu_games')
], DiguGame);
let DiguGamePlayer = class DiguGamePlayer {
    id;
    game;
    playerId;
    playerName;
    isBot;
    finalTotalScore;
    isWinner;
};
exports.DiguGamePlayer = DiguGamePlayer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DiguGamePlayer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => DiguGame, game => game.players, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'game_id' }),
    __metadata("design:type", DiguGame)
], DiguGamePlayer.prototype, "game", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'player_id' }),
    __metadata("design:type", String)
], DiguGamePlayer.prototype, "playerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'player_name' }),
    __metadata("design:type", String)
], DiguGamePlayer.prototype, "playerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_bot', default: false }),
    __metadata("design:type", Boolean)
], DiguGamePlayer.prototype, "isBot", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'final_total_score', default: 0 }),
    __metadata("design:type", Number)
], DiguGamePlayer.prototype, "finalTotalScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_winner', default: false }),
    __metadata("design:type", Boolean)
], DiguGamePlayer.prototype, "isWinner", void 0);
exports.DiguGamePlayer = DiguGamePlayer = __decorate([
    (0, typeorm_1.Entity)('digu_game_players')
], DiguGamePlayer);
let DiguRound = class DiguRound {
    id;
    game;
    roundNumber;
    winnerId;
    winnerName;
    scores;
    endTime;
};
exports.DiguRound = DiguRound;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DiguRound.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => DiguGame, game => game.rounds, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'game_id' }),
    __metadata("design:type", DiguGame)
], DiguRound.prototype, "game", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'round_number' }),
    __metadata("design:type", Number)
], DiguRound.prototype, "roundNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'winner_id', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], DiguRound.prototype, "winnerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'winner_name', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], DiguRound.prototype, "winnerName", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-json'),
    __metadata("design:type", Object)
], DiguRound.prototype, "scores", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'end_time' }),
    __metadata("design:type", Date)
], DiguRound.prototype, "endTime", void 0);
exports.DiguRound = DiguRound = __decorate([
    (0, typeorm_1.Entity)('digu_rounds')
], DiguRound);
//# sourceMappingURL=digu-entities.js.map