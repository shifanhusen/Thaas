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
import { DiguGameService } from './digu-game.service';
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

  constructor(
    private gameService: GameService,
    private diguGameService: DiguGameService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Handle player disconnect (reconnect logic needed)
  }

  @SubscribeMessage('createRoom')
  createRoom(@MessageBody() data: { name: string; gameType: string }, @ConnectedSocket() client: Socket) {
    console.log(`createRoom received from ${client.id}:`, data);
    
    if (data.gameType === 'digu') {
      const player = { 
        id: client.id, 
        name: data.name, 
        hand: [], 
        melds: [], 
        roundScore: 0, 
        totalScore: 0, 
        hasKnocked: false, 
        hasDropped: false, 
        isBot: false,
        socketId: client.id 
      };
      const gameState = this.diguGameService.createRoom(player);
      client.join(gameState.roomId);
      console.log(`Digu room created: ${gameState.roomId}`);
      return { event: 'roomCreated', data: gameState };
    } else {
      const player = { id: client.id, name: data.name, hand: [], isSpectator: false, socketId: client.id };
      const gameState = this.gameService.createRoom(player, data.gameType);
      client.join(gameState.roomId);
      console.log(`Room created: ${gameState.roomId}`);
      return { event: 'roomCreated', data: gameState };
    }
  }

  @SubscribeMessage('joinRoom')
  joinRoom(@MessageBody() data: { roomId: string; name: string }, @ConnectedSocket() client: Socket) {
    // Try Bondi room first
    let bondiRoom = this.gameService.getRoom(data.roomId);
    let diguRoom = this.diguGameService.getRoom(data.roomId);
    
    if (diguRoom) {
      const player = { 
        id: client.id, 
        name: data.name, 
        hand: [], 
        melds: [], 
        roundScore: 0, 
        totalScore: 0, 
        hasKnocked: false, 
        hasDropped: false, 
        isBot: false,
        socketId: client.id 
      };
      const room = this.diguGameService.joinRoom(data.roomId, player);
      if (room) {
        client.join(data.roomId);
        this.server.to(data.roomId).emit('playerJoined', room);
        return { event: 'joined', data: room };
      }
    } else if (bondiRoom) {
      const player = { id: client.id, name: data.name, hand: [], isSpectator: false, socketId: client.id };
      const room = this.gameService.joinRoom(data.roomId, player);
      if (room) {
        client.join(data.roomId);
        this.server.to(data.roomId).emit('playerJoined', room);
        return { event: 'joined', data: room };
      }
    }
    
    return { event: 'error', data: 'Room not found or full' };
  }

  @SubscribeMessage('joinAsSpectator')
  joinAsSpectator(@MessageBody() data: { roomId: string; name: string }, @ConnectedSocket() client: Socket) {
    const player = { id: client.id, name: data.name, hand: [], isSpectator: true, socketId: client.id };
    const room = this.gameService.joinAsSpectator(data.roomId, player);
    if (room) {
      client.join(data.roomId);
      this.server.to(data.roomId).emit('spectatorJoined', room);
      return { event: 'joinedAsSpectator', data: room };
    } else {
      return { event: 'error', data: 'Room not found' };
    }
  }

  @SubscribeMessage('startGame')
  startGame(@MessageBody() data: { roomId: string }) {
    // Check both services
    const diguRoom = this.diguGameService.getRoom(data.roomId);
    const bondiRoom = this.gameService.getRoom(data.roomId);
    
    if (diguRoom) {
      const room = this.diguGameService.startGame(data.roomId);
      if (room) {
        this.server.to(data.roomId).emit('gameStarted', room);
      }
    } else if (bondiRoom) {
      const room = this.gameService.startGame(data.roomId);
      if (room) {
        this.server.to(data.roomId).emit('gameStarted', room);
      }
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

  @SubscribeMessage('rematch')
  rematch(@MessageBody() data: { roomId: string }) {
    const room = this.gameService.rematchGame(data.roomId);
    if (room) {
      this.server.to(data.roomId).emit('rematchStarted', room);
    }
  }

  @SubscribeMessage('sendMessage')
  sendMessage(@MessageBody() data: { roomId: string; message: string; type: 'text' | 'emoji' }, @ConnectedSocket() client: Socket) {
    const chatMessage = this.gameService.addChatMessage(data.roomId, client.id, data.message, data.type);
    if (chatMessage) {
      this.server.to(data.roomId).emit('newMessage', chatMessage);
    }
  }

  // Digu-specific events
  @SubscribeMessage('diguDrawCard')
  diguDrawCard(@MessageBody() data: { roomId: string; fromDiscard: boolean }, @ConnectedSocket() client: Socket) {
    const room = this.diguGameService.drawCard(data.roomId, client.id, data.fromDiscard);
    if (room) {
      this.server.to(data.roomId).emit('gameStateUpdate', room);
    }
  }

  @SubscribeMessage('diguDiscardCard')
  diguDiscardCard(@MessageBody() data: { roomId: string; card: any }, @ConnectedSocket() client: Socket) {
    const room = this.diguGameService.discardCard(data.roomId, client.id, data.card);
    if (room) {
      this.server.to(data.roomId).emit('gameStateUpdate', room);
    }
  }

  @SubscribeMessage('diguDeclareMelds')
  diguDeclareMelds(@MessageBody() data: { roomId: string; melds: any[] }, @ConnectedSocket() client: Socket) {
    const room = this.diguGameService.declareMelds(data.roomId, client.id, data.melds);
    if (room) {
      this.server.to(data.roomId).emit('gameStateUpdate', room);
    }
  }

  @SubscribeMessage('diguKnock')
  diguKnock(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    const room = this.diguGameService.knock(data.roomId, client.id);
    if (room) {
      this.server.to(data.roomId).emit('roundEnded', room);
    }
  }

  @SubscribeMessage('diguDrop')
  diguDrop(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    const room = this.diguGameService.dropPlayer(data.roomId, client.id);
    if (room) {
      this.server.to(data.roomId).emit('playerDropped', room);
    }
  }

  @SubscribeMessage('diguVoteEndGame')
  diguVoteEndGame(@MessageBody() data: { roomId: string; voteEnd: boolean }, @ConnectedSocket() client: Socket) {
    const room = this.diguGameService.voteEndGame(data.roomId, client.id, data.voteEnd);
    if (room) {
      this.server.to(data.roomId).emit('voteUpdate', room);
    }
  }

  @SubscribeMessage('diguStartNewRound')
  diguStartNewRound(@MessageBody() data: { roomId: string }) {
    const room = this.diguGameService.startNewRound(data.roomId);
    if (room) {
      this.server.to(data.roomId).emit('newRoundStarted', room);
    }
  }
}
