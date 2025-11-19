import {
  WebSocketGateway, SubscribeMessage, MessageBody,
  ConnectedSocket, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TradesService } from './trades.service';
import { forwardRef, Inject, Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: 'trades',
  cors: {
    origin: ['http://localhost:3001', 'https://campuseat.shop'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class TradesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(TradesGateway.name);
  private clients: Map<number, string> = new Map();

  constructor(
    @Inject(forwardRef(() => TradesService))
    private readonly tradesService: TradesService
  ) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId;
    if (userId) {
      this.clients.set(Number(userId), client.id);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId;
    if (userId) {
      this.clients.delete(Number(userId));
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() tradeId: number, @ConnectedSocket() client: Socket): void {
    client.join(tradeId.toString());
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@MessageBody() tradeId: number, @ConnectedSocket() client: Socket): void {
    client.leave(tradeId.toString());
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() payload: { tradeId: number; text: string; senderId: number }): Promise<void> {
    const { tradeId, text, senderId } = payload;
    const message = await this.tradesService.createMessage(tradeId, text, senderId);
    this.server.to(tradeId.toString()).emit('newMessage', message);
  }

  @SubscribeMessage('kickUser')
  async handleKickUser(@MessageBody() payload: { tradeId: number; targetUserId: number; creatorId: number }): Promise<void> {
    const { tradeId, targetUserId, creatorId } = payload;
    try {
      const { kickedUserNickname, updatedTrade } = await this.tradesService.kick(tradeId, targetUserId, creatorId);

      const systemMessage = await this.tradesService.createSystemMessage(tradeId, `**${kickedUserNickname}**님이 강퇴당했습니다.`);
      this.server.to(tradeId.toString()).emit('newMessage', systemMessage);

      const targetSocketId = this.clients.get(targetUserId);
      if (targetSocketId) {
        this.server.to(targetSocketId).emit('kicked', { tradeId, title: systemMessage.trade.title });
      }

      this.server.emit('updateTrade', updatedTrade); 

    } catch (error) {
      this.logger.error(`강퇴 처리 중 웹소켓 오류: ${error.message}`);
    }
  }

  async broadcastJoin(tradeId: number, userNickname: string, updatedTrade: any) {
    const message = await this.tradesService.createSystemMessage(tradeId, `**${userNickname}**님이 참여했습니다.`);
    this.server.to(tradeId.toString()).emit('newMessage', message);
    
    this.server.emit('updateTrade', updatedTrade);
  }

  async broadcastLeave(tradeId: number, userNickname: string, userId: number, updatedTrade: any) {
    const message = await this.tradesService.createSystemMessage(tradeId, `**${userNickname}**님이 나갔습니다.`);
    this.server.to(tradeId.toString()).emit('newMessage', message);

    const targetSocketId = this.clients.get(userId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('leftTrade', { tradeId });
    }

    this.server.emit('updateTrade', updatedTrade);
  }

  async broadcastTradeCompleted(tradeId: number) {
    this.server.emit('tradeCompleted', { tradeId });
  }
}