import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from './users/user.entity';
import { GameHistory } from './game/game-history.entity';

// Load environment variables
config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'shared-postgres',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'StrongPass123!',
  database: process.env.DATABASE_NAME || 'cardgame',
  entities: [User, GameHistory],
  migrations: ['src/migrations/*.ts'],
  synchronize: false, // NEVER use synchronize in production
  logging: true,
});
