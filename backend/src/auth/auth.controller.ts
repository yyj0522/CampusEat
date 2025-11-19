import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { CheckEmailDto } from './dto/check-email.dto';
import { CheckNicknameDto } from './dto/check-nickname.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { SendVerificationDto } from './dto/send-verification.dto';
import { FindIdDto } from './dto/find-id.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GetUser } from './get-user.decorator';
import { User } from '../users/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  signUp(@Body() createUserDto: CreateUserDto) {
    return this.authService.signUp(createUserDto);
  }

  @Post('/signin')
  signIn(@Body() authCredentialsDto: AuthCredentialsDto): Promise<{ accessToken: string }> {
    return this.authService.signIn(authCredentialsDto);
  }

  @Get('/profile')
  @UseGuards(AuthGuard())
  getProfile(@GetUser() user: User) {
    return user;
  }

  @Post('/check-email')
  checkEmail(@Body() checkEmailDto: CheckEmailDto) {
    return this.authService.checkEmail(checkEmailDto);
  }

  @Post('/check-nickname')
  checkNickname(@Body() checkNicknameDto: CheckNicknameDto) {
    return this.authService.checkNickname(checkNicknameDto);
  }

  @Post('/send-verification')
  sendVerification(@Body() sendVerificationDto: SendVerificationDto) {
    return this.authService.sendVerification(sendVerificationDto);
  }

  @Post('/verify-code')
  verifyCodeAndActivateUser(@Body() verifyCodeDto: VerifyCodeDto) {
    return this.authService.verifyCodeAndActivateUser(verifyCodeDto);
  }

  @Post('/find-id')
  findId(@Body() findIdDto: FindIdDto) {
    return this.authService.findIdByUniversityEmail(findIdDto);
  }

  @Post('/request-password-reset')
  requestPasswordReset(@Body('universityEmail') universityEmail: string) {
    return this.authService.requestPasswordReset(universityEmail);
  }

  @Post('/reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}