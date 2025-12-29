import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GameModule } from './game/game.module';
import { User } from './users/user.entity';
import { GameHistory } from './game/game-history.entity';
import { DiguGame, DiguGamePlayer, DiguRound } from './game/digu-entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        console.log('Current Directory:', process.cwd());
        const host = configService.get<string>('DATABASE_HOST');
        console.log('----------------------------------------');
        console.log('Connecting to DB Host:', host);
        console.log('----------------------------------------');
        return {
          type: 'postgres',
          host: configService.get<string>('DATABASE_HOST'),
          port: configService.get<number>('DATABASE_PORT'),
          username: configService.get<string>('DATABASE_USER'),
          password: configService.get<string>('DATABASE_PASSWORD'),
          database: configService.get<string>('DATABASE_NAME'),
          entities: [User, GameHistory, DiguGame, DiguGamePlayer, DiguRound],
          synchronize: false,
          logging: true,
          // ssl: { rejectUnauthorized: false }, // Uncomment if using SSL
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    GameModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
