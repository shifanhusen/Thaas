import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { BondiService } from './bondi.service';
// import { GameHistoryService } from './game-history.service';
// import { GameHistory } from './game-history.entity';
// import { GameHistoryController } from './game-history.controller';

@Module({
  imports: [/* TypeOrmModule.forFeature([GameHistory]) */],
  controllers: [/* GameHistoryController */],
  providers: [GameGateway, GameService, BondiService /* , GameHistoryService */],
  exports: [/* GameHistoryService */],
})
export class GameModule {}
