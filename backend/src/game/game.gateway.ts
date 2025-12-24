import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { UseGuards } from '@nestjs/common';
// import { WsJwtGuard } from '../auth/ws-jwt.guard'; // Need to implement this

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private gameService: GameService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Handle player disconnect (reconnect logic needed)
  }

  @SubscribeMessage('createRoom')
  createRoom(@MessageBody() data: { name: string; gameType: string }, @ConnectedSocket() client: Socket) {
    const player = { id: client.id, name: data.name, hand: [], isSpectator: false, socketId: client.id };
    const roomId = this.gameService.createRoom(player, data.gameType);
    client.join(roomId);
    return { event: 'roomCreated', data: { roomId } };
  }

  @SubscribeMessage('joinRoom')
  joinRoom(@MessageBody() data: { roomId: string; name: string }, @ConnectedSocket() client: Socket) {
    const player = { id: client.id, name: data.name, hand: [], isSpectator: false, socketId: client.id };
    const room = this.gameService.joinRoom(data.roomId, player);
    if (room) {
      client.join(data.roomId);
      this.server.to(data.roomId).emit('playerJoined', room);
      return { event: 'joined', data: room };
    } else {
      return { event: 'error', data: 'Room not found or full' };
    }
  }

  @SubscribeMessage('startGame')
  startGame(@MessageBody() data: { roomId: string }) {
    const room = this.gameService.startGame(data.roomId);
    if (room) {
      this.server.to(data.roomId).emit('gameStarted', room);
    }
  }

  @SubscribeMessage('playCard')
  playCard(@MessageBody() data: { roomId: string; card: any }, @ConnectedSocket() client: Socket) {
    try {
      const room = this.gameService.makeMove(data.roomId, client.id, data.card);
      if (room) {
        this.server.to(data.roomId).emit('gameStateUpdate', room);
      }
    } catch (e) {
      client.emit('error', e.message);
    }
  }
}
