import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameHistory } from './game-history.entity';
import { GameState } from './types';

@Injectable()
export class GameHistoryService {
  constructor(
    @InjectRepository(GameHistory)
    private gameHistoryRepository: Repository<GameHistory>,
  ) {}

  async saveGame(gameState: GameState, startTime: Date): Promise<GameHistory> {
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    const players = gameState.winners.map((winner, index) => ({
      id: winner.id,
      name: winner.name,
      position: index + 1,
    }));

    const gameHistory = this.gameHistoryRepository.create({
      roomId: gameState.roomId,
      gameType: 'bondi',
      players,
      gameLog: gameState.gameLog || [],
      totalRounds: gameState.gameLog?.length || 0,
      duration,
      gameStatus: 'completed',
    });

    return this.gameHistoryRepository.save(gameHistory);
  }

  async getGameHistory(limit: number = 10): Promise<GameHistory[]> {
    return this.gameHistoryRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getGameById(id: number): Promise<GameHistory | null> {
    return this.gameHistoryRepository.findOne({ where: { id } });
  }

  async getGamesByPlayer(playerName: string): Promise<GameHistory[]> {
    const games = await this.gameHistoryRepository.find({
      order: { createdAt: 'DESC' },
    });

    return games.filter(game => 
      game.players.some(p => p.name.toLowerCase().includes(playerName.toLowerCase()))
    );
  }
}
