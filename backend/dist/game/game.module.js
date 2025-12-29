"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const game_gateway_1 = require("./game.gateway");
const game_service_1 = require("./game.service");
const bondi_service_1 = require("./bondi.service");
const digu_service_1 = require("./digu.service");
const digu_game_service_1 = require("./digu-game.service");
const game_history_service_1 = require("./game-history.service");
const game_history_entity_1 = require("./game-history.entity");
const game_history_controller_1 = require("./game-history.controller");
const digu_entities_1 = require("./digu-entities");
const digu_history_service_1 = require("./digu-history.service");
let GameModule = class GameModule {
};
exports.GameModule = GameModule;
exports.GameModule = GameModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([game_history_entity_1.GameHistory, digu_entities_1.DiguGame, digu_entities_1.DiguGamePlayer, digu_entities_1.DiguRound])],
        controllers: [game_history_controller_1.GameHistoryController],
        providers: [
            game_gateway_1.GameGateway,
            game_service_1.GameService,
            bondi_service_1.BondiService,
            digu_service_1.DiguService,
            digu_game_service_1.DiguGameService,
            game_history_service_1.GameHistoryService,
            digu_history_service_1.DiguHistoryService,
        ],
        exports: [game_history_service_1.GameHistoryService, digu_history_service_1.DiguHistoryService],
    })
], GameModule);
//# sourceMappingURL=game.module.js.map