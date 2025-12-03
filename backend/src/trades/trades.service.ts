import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  Inject,
  forwardRef
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, LessThan, In } from 'typeorm';
import { CreateTradeDto } from './dto/create-trade.dto';
import { Trade, TradeStatus } from './entities/trade.entity';
import { TradeParticipant } from './entities/trade-participant.entity';
import { User } from '../users/user.entity';
import { TradeMessage } from './entities/trade-message.entity';
import { TradesGateway } from './trades.gateway';
import { Book } from './entities/book.entity';

@Injectable()
export class TradesService {
  private readonly logger = new Logger(TradesService.name);

  constructor(
    @InjectRepository(Trade)
    private tradeRepository: Repository<Trade>,

    @InjectRepository(Book)
    private bookRepository: Repository<Book>,

    @InjectRepository(TradeParticipant)
    private tradeParticipantRepository: Repository<TradeParticipant>,

    @InjectRepository(TradeMessage)
    private tradeMessageRepository: Repository<TradeMessage>,

    @Inject(forwardRef(() => TradesGateway))
    private tradesGateway: TradesGateway,
  ) {}

  async create(createTradeDto: CreateTradeDto, user: User): Promise<Trade> {
    const { books, ...tradeData } = createTradeDto;

    const bookEntities = books.map((bookDto) =>
      this.bookRepository.create(bookDto)
    );

    const trade = this.tradeRepository.create({
      ...tradeData,
      books: bookEntities,
      creator: user,
      university: user.university,
      status: TradeStatus.AVAILABLE,
    });

    const savedTrade = await this.tradeRepository.save(trade);

    const participant = this.tradeParticipantRepository.create({
      trade: savedTrade,
      user: user,
    });

    await this.tradeParticipantRepository.save(participant);

    return this.findOne(savedTrade.id);
  }

  async findAll(university: string, searchQuery: string): Promise<Trade[]> {
    const query = this.tradeRepository
      .createQueryBuilder('trade')
      .leftJoinAndSelect('trade.creator', 'creator')
      .leftJoinAndSelect('trade.books', 'books')
      .leftJoinAndSelect('trade.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'participantUser')
      .leftJoin('trade.books', 'book_search')
      .where('trade.university = :university', { university })
      .andWhere('trade.status != :status', { status: TradeStatus.COMPLETED })
      .orderBy('trade.createdAt', 'DESC');

    if (searchQuery) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('trade.title ILIKE :q', { q: `%${searchQuery}%` })
            .orWhere('book_search.bookTitle ILIKE :q', { q: `%${searchQuery}%` })
            .orWhere('book_search.courseName ILIKE :q', { q: `%${searchQuery}%` });
        }),
      );
    }

    const trades = await query.getMany();
    trades.forEach((t) => {
      t.participantCount = t.participants ? t.participants.length : 0;
    });

    return trades;
  }

  async findMyTrades(user: User): Promise<Trade[]> {
    try {
      const trades = await this.tradeRepository
        .createQueryBuilder('trade')
        .leftJoin('trade.participants', 'filter_participant')
        .leftJoinAndSelect('trade.creator', 'creator')
        .leftJoinAndSelect('trade.participants', 'all_participants')
        .leftJoinAndSelect('all_participants.user', 'participantUser')
        .leftJoinAndSelect('trade.books', 'books')
        .where(
          new Brackets((qb) => {
            qb.where('filter_participant.userId = :uid', { uid: user.id }).orWhere(
              'trade.creator.id = :uid',
              { uid: user.id }
            );
          }),
        )
        .andWhere('trade.status != :status', {
          status: TradeStatus.COMPLETED,
        })
        .orderBy('trade.createdAt', 'DESC')
        .getMany();

      trades.forEach((t) => {
        t.participantCount = t.participants ? t.participants.length : 0;
      });

      return trades;
    } catch (error) {
      console.error('내 거래 목록 조회 중 오류:', error);
      throw new InternalServerErrorException('참여중인 거래 목록 조회 실패');
    }
  }

  async findOne(id: number): Promise<Trade> {
    const trade = await this.tradeRepository.findOne({
      where: { id },
      relations: ['creator', 'participants', 'participants.user', 'books'],
    });

    if (!trade) {
      throw new NotFoundException(`Trade with ID "${id}" not found`);
    }

    trade.participantCount = trade.participants ? trade.participants.length : 0;
    return trade;
  }

  async findMessagesForTrade(
    tradeId: number,
    user: User,
  ): Promise<TradeMessage[]> {
    try {
      const participantEntry = await this.tradeParticipantRepository
        .createQueryBuilder('p')
        .where('p.tradeId = :tid', { tid: tradeId })
        .andWhere('p.userId = :uid', { uid: user.id })
        .getOne();

      if (!participantEntry) {
        throw new NotFoundException('해당 거래의 참여자가 아닙니다.');
      }

      return this.tradeMessageRepository
        .createQueryBuilder('m')
        .leftJoinAndSelect('m.sender', 'sender')
        .where('m.tradeId = :tid', { tid: tradeId })
        .andWhere('m.createdAt >= :joined', {
          joined: participantEntry.joinedAt,
        })
        .orderBy('m.createdAt', 'ASC')
        .getMany();
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('채팅 메시지 조회 오류:', error);
      throw new InternalServerErrorException('채팅 내역 조회 실패');
    }
  }

  async createMessage(
    tradeId: number,
    text: string,
    senderId: number,
  ): Promise<TradeMessage> {
    const trade = await this.findOne(tradeId);
    const sender = await User.findOneBy({ id: senderId });

    if (!sender) {
      throw new NotFoundException(`User with ID "${senderId}" not found`);
    }

    const message = this.tradeMessageRepository.create({
      text,
      trade,
      sender,
    });

    return this.tradeMessageRepository.save(message);
  }

  async createSystemMessage(
    tradeId: number,
    text: string,
  ): Promise<TradeMessage> {
    const trade = await this.findOne(tradeId);

    const message = this.tradeMessageRepository.create({
      text,
      trade,
      isSystemMessage: true,
    });

    return this.tradeMessageRepository.save(message);
  }

  async completeTrade(tradeId: number, user: User): Promise<void> {
    const trade = await this.findOne(tradeId);

    if (trade.creator.id !== user.id) {
      throw new UnauthorizedException('거래 생성자만 완료할 수 있습니다.');
    }

    await this.tradeRepository.remove(trade);

    await this.tradesGateway.broadcastTradeCompleted(tradeId);
  }

  async removeExpiredTrades(): Promise<void> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 30);

    const expired = await this.tradeRepository.find({
      where: {
        createdAt: LessThan(threshold),
        status: In([TradeStatus.AVAILABLE, TradeStatus.TRADING]),
      },
    });

    if (expired.length > 0) {
      await this.tradeRepository.remove(expired);

      this.logger.log(`Removed ${expired.length} expired trades.`);

      expired.forEach((trade) => {
        this.tradesGateway.broadcastTradeCompleted(trade.id);
      });
    }
  }

  async join(tradeId: number, user: User): Promise<void> {
    const trade = await this.findOne(tradeId);

    if (trade.participantCount >= trade.maxParticipants) {
      throw new ConflictException('이미 거래가 진행 중입니다.');
    }

    if (trade.participants.some((p) => p.user.id === user.id)) {
      throw new ConflictException('이미 참여중인 거래입니다.');
    }

    const participant = this.tradeParticipantRepository.create({
      trade,
      user,
    });

    await this.tradeParticipantRepository.save(participant);

    trade.status = TradeStatus.TRADING;
    trade.participants.push(participant);
    trade.participantCount = trade.participants.length;

    await this.tradeRepository.save(trade);

    await this.tradesGateway.broadcastJoin(tradeId, user.nickname, trade);
  }

  async leave(tradeId: number, user: User): Promise<void> {
    const trade = await this.findOne(tradeId);

    if (trade.creator.id === user.id) {
      throw new BadRequestException('판매자는 거래를 나갈 수 없습니다.');
    }

    const index = trade.participants.findIndex(
      (p) => p.user.id === user.id,
    );

    if (index === -1) {
      throw new NotFoundException('참여중인 거래가 아닙니다.');
    }

    const participant = trade.participants[index];

    await this.tradeParticipantRepository.remove(participant);

    trade.participants.splice(index, 1);
    trade.participantCount = trade.participants.length;

    trade.status = TradeStatus.AVAILABLE;
    await this.tradeRepository.save(trade);

    await this.tradesGateway.broadcastLeave(
      tradeId,
      user.nickname,
      user.id,
      trade,
    );
  }

  async kick(
    tradeId: number,
    targetUserId: number,
    creatorId: number,
  ): Promise<{ kickedUserNickname: string; updatedTrade: Trade }> {
    const trade = await this.findOne(tradeId);

    if (trade.creator.id !== creatorId) {
      throw new UnauthorizedException('거래 생성자만 강퇴할 수 있습니다.');
    }

    if (creatorId === targetUserId) {
      throw new BadRequestException('자신을 강퇴할 수 없습니다.');
    }

    const index = trade.participants.findIndex(
      (p) => p.user.id === targetUserId,
    );

    if (index === -1) {
      throw new NotFoundException('해당 사용자는 참여자가 아닙니다.');
    }

    const participant = trade.participants[index];
    const kickedUserNickname = participant.user.nickname;

    await this.tradeParticipantRepository.remove(participant);

    if (!trade.kickedUserIds.includes(targetUserId)) {
      trade.kickedUserIds.push(targetUserId);
    }

    trade.participants.splice(index, 1);
    trade.participantCount = trade.participants.length;

    trade.status = TradeStatus.AVAILABLE;
    await this.tradeRepository.save(trade);

    return {
      kickedUserNickname,
      updatedTrade: trade,
    };
  }
}
