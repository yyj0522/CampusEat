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

  // ✅ ID(sub) 기반으로 유저 인증
  async validate(payload) {
    const { sub } = payload;
    const user = await User.findOne({ where: { id: sub } });

    if (!user) {
      throw new UnauthorizedException('Invalid token: user not found');
    }

    return user;
  }
}
