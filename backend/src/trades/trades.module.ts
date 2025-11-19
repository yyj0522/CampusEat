import { Module, forwardRef } from '@nestjs/common';
import { TradesService } from './trades.service';
import { TradesController } from './trades.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trade } from './entities/trade.entity';
import { TradeParticipant } from './entities/trade-participant.entity';
import { TradeMessage } from './entities/trade-message.entity';
import { User } from '../users/user.entity';
import { AuthModule } from '../auth/auth.module';
import { TradesGateway } from './trades.gateway';
import { Book } from './entities/book.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trade,
      TradeParticipant,
      User,
      TradeMessage,
      Book,
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [TradesController],
  providers: [TradesService, TradesGateway],
  exports: [TradesService, TypeOrmModule.forFeature([Trade])],
})
export class TradesModule {}