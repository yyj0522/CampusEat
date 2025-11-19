import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GatheringsService } from './gatherings.service';
import { forwardRef, Inject } from '@nestjs/common';

@WebSocketGateway({
  namespace: 'gatherings',
  cors: {
    origin: '*',
  },
})
export class GatheringsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private clients: Map<number, string> = new Map();

  constructor(
    @Inject(forwardRef(() => GatheringsService))
    private readonly gatheringsService: GatheringsService,
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
  handleJoinRoom(
    @MessageBody() gatheringId: number,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`gathering-${gatheringId}`);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() gatheringId: number,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`gathering-${gatheringId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() payload: { gatheringId: number; text: string; senderId: number },
  ) {
    const message = await this.gatheringsService.createMessage(
      payload.gatheringId,
      payload.text,
      payload.senderId,
    );
    this.server
      .to(`gathering-${payload.gatheringId}`)
      .emit('newMessage', message);
  }

  @SubscribeMessage('kickUser')
  async handleKickUser(
    @MessageBody()
    payload: { gatheringId: number; targetUserId: number; creatorId: number },
  ) {
    try {
      const result = await this.gatheringsService.kick(
        payload.gatheringId,
        payload.targetUserId,
        payload.creatorId,
      );
      
      const systemMessage = await this.gatheringsService.createSystemMessage(
        payload.gatheringId,
        `**${result.kickedUserNickname}**님이 강퇴당했습니다.`,
      );
      this.server
        .to(`gathering-${payload.gatheringId}`)
        .emit('newMessage', systemMessage);

      const targetSocketId = this.clients.get(payload.targetUserId);
      if (targetSocketId) {
        this.server.to(targetSocketId).emit('kicked', { title: '모임' });
      }
      
      const updatedGathering = await this.gatheringsService.findOne(
        payload.gatheringId,
      );
      this.server.emit('updateGathering', updatedGathering);
      this.server
        .to(`gathering-${payload.gatheringId}`)
        .emit('updateGathering', updatedGathering);
    } catch (error) {
      console.error(error);
    }
  }

  async broadcastJoin(gatheringId: number, userNickname: string) {
    const systemMessage = await this.gatheringsService.createSystemMessage(
      gatheringId,
      `**${userNickname}**님이 참여했습니다.`,
    );
    this.server
      .to(`gathering-${gatheringId}`)
      .emit('newMessage', systemMessage);

    const updatedGathering = await this.gatheringsService.findOne(gatheringId);
    this.server.emit('updateGathering', updatedGathering);
  }

  async broadcastLeave(
    gatheringId: number,
    userNickname: string,
    userId: number,
  ) {
    const systemMessage = await this.gatheringsService.createSystemMessage(
      gatheringId,
      `**${userNickname}**님이 나갔습니다.`,
    );
    this.server
      .to(`gathering-${gatheringId}`)
      .emit('newMessage', systemMessage);
    
    const targetSocketId = this.clients.get(userId);
    if (targetSocketId) {
        this.server.to(targetSocketId).emit('leftMeeting', { title: '모임' });
    }

    const updatedGathering = await this.gatheringsService.findOne(gatheringId);
    this.server.emit('updateGathering', updatedGathering);
  }

  async broadcastDelete(gatheringId: number) {
    const updatedGathering = await this.gatheringsService.findOne(gatheringId);
    this.server.emit('updateGathering', updatedGathering);
    this.server
        .to(`gathering-${gatheringId}`)
        .emit('updateGathering', updatedGathering);
  }
}