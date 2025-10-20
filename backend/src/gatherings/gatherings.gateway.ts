// src/gatherings/gatherings.gateway.ts
import {
  WebSocketGateway, SubscribeMessage, MessageBody,
  ConnectedSocket, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GatheringsService } from './gatherings.service';
import { forwardRef, Inject, Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: 'gatherings',
  cors: {
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class GatheringsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(GatheringsGateway.name);
  private clients: Map<number, string> = new Map(); // userId -> socketId

  constructor(
    @Inject(forwardRef(() => GatheringsService))
    private readonly gatheringsService: GatheringsService
  ) {}

  // ✅ 사용자가 연결될 때, userId와 socketId를 매핑하여 저장합니다.
  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId;
    if (userId) {
      this.clients.set(Number(userId), client.id);
    }
  }

  // ✅ 사용자가 연결을 끊을 때, 매핑 정보를 삭제합니다.
  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId;
     if (userId) {
      this.clients.delete(Number(userId));
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() gatheringId: number, @ConnectedSocket() client: Socket): void {
    client.join(gatheringId.toString());
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@MessageBody() gatheringId: number, @ConnectedSocket() client: Socket): void {
    client.leave(gatheringId.toString());
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() payload: { gatheringId: number; text: string; senderId: number }): Promise<void> {
    const { gatheringId, text, senderId } = payload;
    const message = await this.gatheringsService.createMessage(gatheringId, text, senderId);
    this.server.to(gatheringId.toString()).emit('newMessage', message);
  }

  @SubscribeMessage('kickUser')
  async handleKickUser(@MessageBody() payload: { gatheringId: number; targetUserId: number; creatorId: number }): Promise<void> {
    const { gatheringId, targetUserId, creatorId } = payload;
    try {
      const { kickedUserNickname } = await this.gatheringsService.kick(gatheringId, targetUserId, creatorId);

      const systemMessage = await this.gatheringsService.createSystemMessage(gatheringId, `**${kickedUserNickname}**님이 강퇴당했습니다.`);
      this.server.to(gatheringId.toString()).emit('newMessage', systemMessage);

      // ✅ 강퇴당한 사용자에게만 'kicked' 이벤트를 보냅니다.
      const targetSocketId = this.clients.get(targetUserId);
      if (targetSocketId) {
        this.server.to(targetSocketId).emit('kicked', { gatheringId, title: systemMessage.gathering.title });
      }

      const updatedGathering = await this.gatheringsService.findOne(gatheringId);
      this.server.to(gatheringId.toString()).emit('updateGathering', updatedGathering);

    } catch (error) {
      this.logger.error(`강퇴 처리 중 웹소켓 오류: ${error.message}`);
    }
  }

  async broadcastJoin(gatheringId: number, userNickname: string) {
    const message = await this.gatheringsService.createSystemMessage(gatheringId, `**${userNickname}**님이 참여했습니다.`);
    this.server.to(gatheringId.toString()).emit('newMessage', message);
    const updatedGathering = await this.gatheringsService.findOne(gatheringId);
    this.server.to(gatheringId.toString()).emit('updateGathering', updatedGathering);
  }

  async broadcastLeave(gatheringId: number, userNickname: string, userId: number) {
    const message = await this.gatheringsService.createSystemMessage(gatheringId, `**${userNickname}**님이 나갔습니다.`);
    this.server.to(gatheringId.toString()).emit('newMessage', message);

    // ✅ 나간 사용자에게만 'leftMeeting' 이벤트를 보냅니다.
    const targetSocketId = this.clients.get(userId);
    if (targetSocketId) {
        this.server.to(targetSocketId).emit('leftMeeting', { gatheringId });
    }

    const updatedGathering = await this.gatheringsService.findOne(gatheringId);
    this.server.to(gatheringId.toString()).emit('updateGathering', updatedGathering);
  }
}

