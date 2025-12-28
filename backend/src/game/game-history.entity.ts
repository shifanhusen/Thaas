import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class GameHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roomId: string;

  @Column()
  gameType: string; // 'bondi', etc.

  @Column('simple-json')
  players: { id: string; name: string; position: number }[]; // position: 1 = winner, last = loser

  @Column('simple-json', { nullable: true })
  gameLog: string[];

  @Column()
  totalRounds: number;

  @Column()
  duration: number; // in seconds

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  gameStatus: string; // 'completed', 'abandoned'
}
