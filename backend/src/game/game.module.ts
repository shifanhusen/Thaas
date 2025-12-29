import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { BondiService } from './bondi.service';
import { DiguService } from './digu.service';
import { DiguGameService } from './digu-game.service';
import { GameHistoryService } from './game-history.service';
import { GameHistory } from './game-history.entity';
import { GameHistoryController } from './game-history.controller';
import { DiguGame, DiguGamePlayer, DiguRound } from './digu-entities';
import { DiguHistoryService } from './digu-history.service';

@Module({
  imports: [TypeOrmModule.forFeature([GameHistory, DiguGame, DiguGamePlayer, DiguRound])],
  controllers: [GameHistoryController],
  providers: [
    GameGateway,
    GameService,
    BondiService,
    DiguService,
    DiguGameService,
    GameHistoryService,
    DiguHistoryService,
  ],
  exports: [GameHistoryService, DiguHistoryService],
})
export class GameModule {}
