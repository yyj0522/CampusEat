import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    if (user.role === 'sub_admin' || user.role === 'super_admin') {
      return true;
    }

    throw new UnauthorizedException('관리자 권한이 필요합니다.');
  }
}