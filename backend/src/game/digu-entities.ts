import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

@Entity('digu_games')
export class DiguGame {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'room_id' })
  roomId: string;

  @CreateDateColumn({ name: 'start_time' })
  startTime: Date;

  @Column({ name: 'end_time', nullable: true })
  endTime: Date;

  @Column({ name: 'winner_id', nullable: true })
  winnerId: string;

  @Column({ name: 'winner_name', nullable: true })
  winnerName: string;

  @Column({ name: 'total_rounds', default: 0 })
  totalRounds: number;

  @Column({ default: 'finished' })
  status: string;

  @OneToMany(() => DiguGamePlayer, player => player.game, { cascade: true })
  players: DiguGamePlayer[];

  @OneToMany(() => DiguRound, round => round.game, { cascade: true })
  rounds: DiguRound[];
}

@Entity('digu_game_players')
export class DiguGamePlayer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DiguGame, game => game.players, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game: DiguGame;

  @Column({ name: 'player_id' })
  playerId: string;

  @Column({ name: 'player_name' })
  playerName: string;

  @Column({ name: 'is_bot', default: false })
  isBot: boolean;

  @Column({ name: 'final_total_score', default: 0 })
  finalTotalScore: number;

  @Column({ name: 'is_winner', default: false })
  isWinner: boolean;
}

@Entity('digu_rounds')
export class DiguRound {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DiguGame, game => game.rounds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game: DiguGame;

  @Column({ name: 'round_number' })
  roundNumber: number;

  @Column({ name: 'winner_id', nullable: true })
  winnerId: string;

  @Column({ name: 'winner_name', nullable: true })
  winnerName: string;

  @Column('simple-json')
  scores: Record<string, number>;

  @CreateDateColumn({ name: 'end_time' })
  endTime: Date;
}
