import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiguGame, DiguGamePlayer, DiguRound } from './digu-entities';
import { DiguPlayer } from './digu.types';

@Injectable()
export class DiguHistoryService {
  constructor(
    @InjectRepository(DiguGame)
    private gameRepo: Repository<DiguGame>,
    @InjectRepository(DiguGamePlayer)
    private playerRepo: Repository<DiguGamePlayer>,
    @InjectRepository(DiguRound)
    private roundRepo: Repository<DiguRound>,
  ) {}

  async createGame(roomId: string): Promise<string> {
    const game = this.gameRepo.create({
      roomId,
      startTime: new Date(),
      status: 'playing',
    });
    const savedGame = await this.gameRepo.save(game);
    return savedGame.id;
  }

  async saveRound(gameId: string, roundNumber: number, winnerId: string | null, winnerName: string | null, scores: Record<string, number>) {
    const round = this.roundRepo.create({
      game: { id: gameId },
      roundNumber,
      winnerId,
      winnerName,
      scores,
    });
    await this.roundRepo.save(round);
  }

  async finishGame(gameId: string, winnerId: string, winnerName: string, players: DiguPlayer[], totalRounds: number) {
    // Update game status
    await this.gameRepo.update(gameId, {
      endTime: new Date(),
      winnerId,
      winnerName,
      status: 'finished',
      totalRounds,
    });

    // Save player stats
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
}
