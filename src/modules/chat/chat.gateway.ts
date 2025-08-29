import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Should be restricted in production
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: { matchId: string; content: string }): Promise<void> {
    // In a real implementation, we'd get the userId from the authenticated socket
    const userId = client.handshake.query.userId as string;
    const message = await this.chatService.createMessage(userId, payload.matchId, payload.content);

    // Broadcast the message to the room for that match
    this.server.to(`match_${payload.matchId}`).emit('newMessage', message);
  }

  afterInit(server: Server) {
    this.logger.log('ChatGateway Initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    // Here we would handle user authentication and joining rooms
    const { matchId } = client.handshake.query;
    if (matchId) {
      client.join(`match_${matchId}`);
      this.logger.log(`Client ${client.id} joined room match_${matchId}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
