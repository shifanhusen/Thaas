"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const game_module_1 = require("./game/game.module");
const user_entity_1 = require("./users/user.entity");
const game_history_entity_1 = require("./game/game-history.entity");
const digu_entities_1 = require("./game/digu-entities");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    console.log('Current Directory:', process.cwd());
                    const host = configService.get('DATABASE_HOST');
                    console.log('----------------------------------------');
                    console.log('Connecting to DB Host:', host);
                    console.log('----------------------------------------');
                    return {
                        type: 'postgres',
                        host: configService.get('DATABASE_HOST'),
                        port: configService.get('DATABASE_PORT'),
                        username: configService.get('DATABASE_USER'),
                        password: configService.get('DATABASE_PASSWORD'),
                        database: configService.get('DATABASE_NAME'),
                        entities: [user_entity_1.User, game_history_entity_1.GameHistory, digu_entities_1.DiguGame, digu_entities_1.DiguGamePlayer, digu_entities_1.DiguRound],
                        synchronize: false,
                        logging: true,
                    };
                },
                inject: [config_1.ConfigService],
            }),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            game_module_1.GameModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map