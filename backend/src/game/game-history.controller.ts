import { Controller, Get, Param, Query } from '@nestjs/common';
import { GameHistoryService } from './game-history.service';

@Controller('game-history')
export class GameHistoryController {
  constructor(private gameHistoryService: GameHistoryService) {}

  @Get()
  async getHistory(@Query('limit') limit?: string, @Query('gameType') gameType?: string) {
    const limitNum = limit ? parseInt(limit) : 10;
    return this.gameHistoryService.getGameHistory(limitNum, gameType);
  }

  @Get(':id')
  async getGameById(@Param('id') id: string) {
    return this.gameHistoryService.getGameById(parseInt(id));
  }

  @Get('player/:name')
  async getGamesByPlayer(@Param('name') name: string) {
    return this.gameHistoryService.getGamesByPlayer(name);
  }
}
