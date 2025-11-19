import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../users/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      secretOrKey: configService.get('JWT_SECRET') as string,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload) {
    const { sub } = payload;
    const user = await User.findOne({ where: { id: sub } });

    if (!user) {
      throw new UnauthorizedException('Invalid token: user not found');
    }

    if (user.status === '정지') {
      if (user.suspensionEndDate && new Date() > user.suspensionEndDate) {
        user.status = '활성';
        user.suspensionEndDate = null;
        await user.save();
      } else {
        const dateStr = user.suspensionEndDate 
            ? `${user.suspensionEndDate.toLocaleDateString()}까지` 
            : '영구';
        throw new UnauthorizedException(`계정이 정지되었습니다. (해제일: ${dateStr})`);
      }
    }

    return user;
  }
}