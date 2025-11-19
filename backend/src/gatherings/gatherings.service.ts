import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Brackets } from 'typeorm';
import { CreateGatheringDto } from './dto/create-gathering.dto';
import { Gathering, GatheringType } from './entities/gathering.entity';
import { GatheringParticipant } from './entities/gathering-participant.entity';
import { User } from '../users/user.entity';
import { GatheringMessage } from './entities/gathering-message.entity';
import { forwardRef, Inject } from '@nestjs/common';
import { GatheringsGateway } from './gatherings.gateway';

@Injectable()
export class GatheringsService {
  constructor(
    @InjectRepository(Gathering)
    private gatheringRepository: Repository<Gathering>,
    @InjectRepository(GatheringParticipant)
    private gatheringParticipantRepository: Repository<GatheringParticipant>,
    @InjectRepository(GatheringMessage)
    private gatheringMessageRepository: Repository<GatheringMessage>,
    @Inject(forwardRef(() => GatheringsGateway))
    private gatheringsGateway: GatheringsGateway,
  ) {}

  async create(
    createGatheringDto: CreateGatheringDto,
    user: User,
  ): Promise<Gathering> {
    const myGatherings = await this.findMyGatherings(user);
    if (
      createGatheringDto.type === 'meeting' &&
      myGatherings.some(
        (m) => m.type === 'meeting' && !m.kickedUserIds.includes(user.id),
      )
    ) {
      throw new ConflictException(
        "이미 참여(생성 포함) 중인 '취미&약속' 모임이 있어 새로 만들 수 없습니다.",
      );
    }
    if (
      createGatheringDto.type === 'carpool' &&
      myGatherings.some(
        (m) => m.type === 'carpool' && !m.kickedUserIds.includes(user.id),
      )
    ) {
      throw new ConflictException("이미 참여 중인 '택시&카풀'이 있습니다.");
    }
    const gathering = this.gatheringRepository.create({
      ...createGatheringDto,
      creator: user,
      university: user.university,
    });
    const savedGathering = await this.gatheringRepository.save(gathering);
    const participant = this.gatheringParticipantRepository.create({
      gathering: savedGathering,
      user: user,
    });
    await this.gatheringParticipantRepository.save(participant);
    savedGathering.participantCount = 1;
    return this.gatheringRepository.save(savedGathering);
  }

  async findAll(university: string, type: GatheringType): Promise<Gathering[]> {
    return this.gatheringRepository.find({
      where: {
        university,
        type,
        status: 'active',
        datetime: MoreThan(new Date()),
      },
      relations: ['creator'],
      order: { datetime: 'ASC' },
    });
  }

  async findMyGatherings(user: User): Promise<Gathering[]> {
    try {
      const gatherings = await this.gatheringRepository
        .createQueryBuilder('gathering')
        .leftJoin('gathering.participants', 'participant')
        .leftJoinAndSelect('gathering.creator', 'creator')
        .leftJoinAndSelect('gathering.participants', 'all_participants')
        .leftJoinAndSelect('all_participants.user', 'participantUser')
        .where(
          new Brackets((qb) => {
            qb.where('participant.userId = :userId', { userId: user.id })
              .andWhere('gathering.status IN (:...statuses)', { statuses: ['active', 'deleted_by_admin'] })
              .andWhere(
                  new Brackets((subQb) => {
                      subQb.where('gathering.datetime > :now', { now: new Date() })
                           .orWhere('gathering.status = :deletedStatus', { deletedStatus: 'deleted_by_admin' });
                  })
              );
          }),
        )
        .orWhere(
          new Brackets((qb) => {
            qb.where('gathering.kickedUserIds @> ARRAY[:userId::int]', {
              userId: user.id,
            });
          }),
        )
        .orderBy('gathering.datetime', 'ASC')
        .getMany();

      gatherings.forEach((g) => {
        g.participantCount = g.participants.length;
      });
      return gatherings;
    } catch (error) {
      console.error('내 모임 목록 조회 중 오류 발생:', error);
      throw new InternalServerErrorException(
        '참여중인 모임 목록을 불러오는 데 실패했습니다.',
      );
    }
  }

  async findOne(id: number): Promise<Gathering> {
    const gathering = await this.gatheringRepository.findOne({
      where: { id },
      relations: ['creator', 'participants', 'participants.user'],
    });
    if (!gathering) {
      throw new NotFoundException(`Gathering with ID "${id}" not found`);
    }
    gathering.participantCount = gathering.participants.length;
    return gathering;
  }

  async findMessagesForGathering(
    gatheringId: number,
    user: User,
  ): Promise<GatheringMessage[]> {
    try {
      const participantEntry = await this.gatheringParticipantRepository
        .createQueryBuilder('participant')
        .where('participant.gatheringId = :gatheringId', { gatheringId })
        .andWhere('participant.userId = :userId', { userId: user.id })
        .getOne();
      if (!participantEntry) {
        throw new NotFoundException('해당 모임의 참여자가 아닙니다.');
      }
      const joinedAt = participantEntry.joinedAt;
      return this.gatheringMessageRepository
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.sender', 'sender')
        .where('message.gatheringId = :gatheringId', { gatheringId })
        .andWhere('message.createdAt >= :joinedAt', { joinedAt })
        .orderBy('message.createdAt', 'ASC')
        .getMany();
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('채팅 메시지 조회 중 오류 발생:', error);
      throw new InternalServerErrorException(
        '채팅 내역을 불러오는 데 실패했습니다.',
      );
    }
  }

  async createMessage(
    gatheringId: number,
    text: string,
    senderId: number,
  ): Promise<GatheringMessage> {
    const gathering = await this.findOne(gatheringId);
    const sender = await User.findOneBy({ id: senderId });
    if (!sender) {
      throw new NotFoundException(`User with ID "${senderId}" not found`);
    }
    const message = this.gatheringMessageRepository.create({
      text,
      gathering,
      sender,
    });
    return this.gatheringMessageRepository.save(message);
  }

  async createSystemMessage(
    gatheringId: number,
    text: string,
  ): Promise<GatheringMessage> {
    const gathering = await this.findOne(gatheringId);
    const message = this.gatheringMessageRepository.create({
      text,
      gathering,
      isSystemMessage: true,
    });
    return this.gatheringMessageRepository.save(message);
  }

  async remove(id: number, user: User): Promise<void> {
    const gathering = await this.findOne(id);
    
    const isAdmin = user.role === 'sub_admin' || user.role === 'super_admin';

    if (gathering.creator.id !== user.id && !isAdmin) {
      throw new UnauthorizedException('모임 생성자만 삭제할 수 있습니다.');
    }

    if (isAdmin && gathering.creator.id !== user.id) {
        gathering.status = 'deleted_by_admin';
        await this.gatheringRepository.save(gathering);
        await this.gatheringsGateway.broadcastDelete(id); 
    } else {
        await this.gatheringRepository.remove(gathering);
    }
  }

  async join(gatheringId: number, user: User): Promise<void> {
    const gathering = await this.findOne(gatheringId);
    if (gathering.participantCount >= gathering.maxParticipants) {
      throw new ConflictException('모임 정원이 가득 찼습니다.');
    }
    const existingParticipant = await this.gatheringParticipantRepository
      .createQueryBuilder('participant')
      .where('participant.gatheringId = :gatheringId', { gatheringId })
      .andWhere('participant.userId = :userId', { userId: user.id })
      .getOne();
    if (existingParticipant) {
      throw new ConflictException('이미 참여중인 모임입니다.');
    }
    const myGatherings = await this.findMyGatherings(user);
    if (
      gathering.type === 'meeting' &&
      myGatherings.some(
        (m) => m.type === 'meeting' && !m.kickedUserIds.includes(user.id),
      )
    ) {
      throw new ConflictException(
        "이미 참여(생성 포함) 중인 '취미&약속' 모임이 있습니다.",
      );
    }
    if (
      gathering.type === 'carpool' &&
      myGatherings.some(
        (m) => m.type === 'carpool' && !m.kickedUserIds.includes(user.id),
      )
    ) {
      throw new ConflictException("이미 참여 중인 '택시&카풀'이 있습니다.");
    }
    const participant = this.gatheringParticipantRepository.create({
      gathering,
      user,
    });
    await this.gatheringParticipantRepository.save(participant);
    await this.gatheringRepository.increment(
      { id: gatheringId },
      'participantCount',
      1,
    );
    await this.gatheringsGateway.broadcastJoin(gatheringId, user.nickname);
  }

  async leave(gatheringId: number, user: User): Promise<void> {
    const gathering = await this.findOne(gatheringId);
    
    if (gathering.status !== 'deleted_by_admin' && gathering.creator.id === user.id) {
      throw new BadRequestException(
        '모임 생성자는 나갈 수 없습니다. 모임을 삭제해주세요.',
      );
    }
    
    const participant = await this.gatheringParticipantRepository
      .createQueryBuilder('participant')
      .where('participant.gatheringId = :gatheringId', { gatheringId })
      .andWhere('participant.userId = :userId', { userId: user.id })
      .getOne();
      
    if (!participant) {
      return; 
    }
    
    await this.gatheringParticipantRepository.remove(participant);
    
    if (gathering.status !== 'deleted_by_admin') {
        await this.gatheringRepository.decrement(
          { id: gatheringId },
          'participantCount',
          1,
        );
        await this.gatheringsGateway.broadcastLeave(
          gatheringId,
          user.nickname,
          user.id,
        );
    }
  }

  async kick(
    gatheringId: number,
    targetUserId: number,
    creatorId: number,
  ): Promise<{ kickedUserNickname: string }> {
    const gathering = await this.findOne(gatheringId);
    if (gathering.creator.id !== creatorId) {
      throw new UnauthorizedException('모임 생성자만 강퇴할 수 있습니다.');
    }
    if (targetUserId === creatorId) {
      throw new BadRequestException('자기 자신을 강퇴할 수 없습니다.');
    }
    const participantToRemove = await this.gatheringParticipantRepository
      .createQueryBuilder('participant')
      .leftJoinAndSelect('participant.user', 'user')
      .where('participant.gatheringId = :gatheringId', { gatheringId })
      .andWhere('participant.userId = :targetUserId', { targetUserId })
      .getOne();
    if (!participantToRemove) {
      throw new NotFoundException(
        '해당 사용자는 모임에 참여하고 있지 않습니다.',
      );
    }

    if (!gathering.kickedUserIds.includes(targetUserId)) {
      gathering.kickedUserIds.push(targetUserId);
      await this.gatheringRepository.save(gathering);
    }

    const kickedUserNickname = participantToRemove.user.nickname;
    await this.gatheringParticipantRepository.remove(participantToRemove);
    await this.gatheringRepository.decrement(
      { id: gatheringId },
      'participantCount',
      1,
    );
    return { kickedUserNickname };
  }

  async acknowledgeKick(gatheringId: number, user: User): Promise<void> {
    const gathering = await this.findOne(gatheringId);
    if (!gathering.kickedUserIds.includes(user.id)) {
      throw new BadRequestException('강퇴 기록이 없는 모임입니다.');
    }
    gathering.kickedUserIds = gathering.kickedUserIds.filter(
      (id) => id !== user.id,
    );
    await this.gatheringRepository.save(gathering);
  }
}