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
exports.GameHistoryController = void 0;
const common_1 = require("@nestjs/common");
const game_history_service_1 = require("./game-history.service");
let GameHistoryController = class GameHistoryController {
    gameHistoryService;
    constructor(gameHistoryService) {
        this.gameHistoryService = gameHistoryService;
    }
    async getHistory(limit) {
        const limitNum = limit ? parseInt(limit) : 10;
        return this.gameHistoryService.getGameHistory(limitNum);
    }
    async getGameById(id) {
        return this.gameHistoryService.getGameById(parseInt(id));
    }
    async getGamesByPlayer(name) {
        return this.gameHistoryService.getGamesByPlayer(name);
    }
};
exports.GameHistoryController = GameHistoryController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameHistoryController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameHistoryController.prototype, "getGameById", null);
__decorate([
    (0, common_1.Get)('player/:name'),
    __param(0, (0, common_1.Param)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameHistoryController.prototype, "getGamesByPlayer", null);
exports.GameHistoryController = GameHistoryController = __decorate([
    (0, common_1.Controller)('game-history'),
    __metadata("design:paramtypes", [game_history_service_1.GameHistoryService])
], GameHistoryController);
//# sourceMappingURL=game-history.controller.js.map