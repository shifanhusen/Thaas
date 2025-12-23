import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { BondiService } from './bondi.service';

@Module({
  providers: [GameGateway, GameService, BondiService],
})
export class GameModule {}
