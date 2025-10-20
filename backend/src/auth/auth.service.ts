import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { CheckEmailDto } from './dto/check-email.dto';
import { CheckNicknameDto } from './dto/check-nickname.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { SendVerificationDto } from './dto/send-verification.dto';
import { FindIdDto } from './dto/find-id.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { User } from '../users/user.entity';
import { EmailService } from '../common/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async signUp(createUserDto: CreateUserDto): Promise<{ message: string }> {
    const { email, nickname, password, university, universityEmail } = createUserDto;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser && existingUser.status !== 'pending_verification') {
      throw new ConflictException('Email already exists');
    }
    const existingNickname = await User.findOne({ where: { nickname } });
    if (existingNickname && existingNickname.email !== email) {
      throw new ConflictException('Nickname already exists');
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    if (existingUser) {
      existingUser.nickname = nickname;
      existingUser.password = hashedPassword;
      await existingUser.save();
      return { message: 'User information updated. Please proceed with verification.' };
    } else {
      const user = User.create({
        email,
        nickname,
        password: hashedPassword,
        university,
        universityEmail,
        status: 'pending_verification',
      });
      await user.save();
      return { message: 'User successfully created. Please verify your university email.' };
    }
  }

  // ✅ 로그인 시 id(sub)와 email을 모두 payload에 포함
  async signIn(authCredentialsDto: AuthCredentialsDto): Promise<{ accessToken: string }> {
    const { email, password } = authCredentialsDto;
    const user = await User.createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (user && (await bcrypt.compare(password, user.password))) {
      if (user.status === '정지') {
        throw new UnauthorizedException('This account is suspended.');
      }
      if (user.status !== '활성') {
        throw new UnauthorizedException('Please verify your account first.');
      }

      const payload = { sub: user.id, email: user.email };
      const accessToken = await this.jwtService.sign(payload);
      return { accessToken };
    } else {
      throw new UnauthorizedException('login failed');
    }
  }

  async checkEmail(checkEmailDto: CheckEmailDto): Promise<{ message: string }> {
    const { email } = checkEmailDto;
    const user = await User.findOne({ where: { email } });
    if (user && user.status !== 'pending_verification') {
      throw new ConflictException('Email already exists');
    }
    return { message: 'Email is available' };
  }

  async checkNickname(checkNicknameDto: CheckNicknameDto): Promise<{ message: string }> {
    const { nickname } = checkNicknameDto;
    const user = await User.findOne({ where: { nickname } });
    if (user && user.status !== 'pending_verification') {
      throw new ConflictException('Nickname already exists');
    }
    return { message: 'Nickname is available' };
  }

  async sendVerification(sendVerificationDto: SendVerificationDto): Promise<{ message: string }> {
    const { email, university, universityEmail } = sendVerificationDto;
    const existingUniversityEmail = await User.findOne({ where: { universityEmail } });
    if (existingUniversityEmail && existingUniversityEmail.status !== 'pending_verification') {
      throw new ConflictException('이미 가입된 대학교 이메일입니다.');
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found. Please complete step 1 first.');
    }

    user.university = university;
    user.universityEmail = universityEmail;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    user.verificationCode = code;
    user.verificationCodeExpiresAt = expiresAt;
    await user.save();

    await this.emailService.sendVerificationEmail(user.universityEmail, code);
    return { message: 'Verification code sent successfully.' };
  }

  // ✅ 인증 완료 시 JWT 발급에도 sub 포함
  async verifyCodeAndActivateUser(verifyCodeDto: VerifyCodeDto): Promise<{ accessToken: string }> {
    const { email, code } = verifyCodeDto;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();
    if (
      !user.verificationCode ||
      user.verificationCode !== code ||
      !user.verificationCodeExpiresAt ||
      user.verificationCodeExpiresAt < now
    ) {
      throw new BadRequestException('Invalid or expired verification code.');
    }

    user.status = '활성';
    user.verificationCode = null;
    user.verificationCodeExpiresAt = null;
    await user.save();

    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.sign(payload);
    return { accessToken };
  }

  async findIdByUniversityEmail(findIdDto: FindIdDto): Promise<{ email: string }> {
    const { universityEmail } = findIdDto;
    const user = await User.findOne({ where: { universityEmail, status: '활성' } });
    if (!user) {
      throw new NotFoundException('해당 대학 이메일로 등록된 계정이 없습니다.');
    }
    return { email: user.email };
  }

  async requestPasswordReset(universityEmail: string): Promise<{ message: string }> {
    const user = await User.findOne({ where: { universityEmail, status: '활성' } });

    if (!user) {
      return { message: `비밀번호 재설정 이메일이 ${universityEmail}(으)로 전송되었습니다.` };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    user.passwordResetExpiresAt = expiresAt;
    await user.save();

    const resetUrl = `http://localhost:3001/reset-password?token=${resetToken}`;

    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetUrl);
      return { message: `비밀번호 재설정 이메일이 ${user.email}(으)로 전송되었습니다.` };
    } catch (error) {
      user.passwordResetToken = null;
      user.passwordResetExpiresAt = null;
      await user.save();
      throw new InternalServerErrorException('이메일 전송에 실패했습니다.');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, password } = resetPasswordDto;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ where: { passwordResetToken: hashedToken } });
    const now = new Date();
    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < now) {
      throw new BadRequestException('유효하지 않거나 만료된 토큰입니다.');
    }
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetToken = null;
    user.passwordResetExpiresAt = null;
    await user.save();
    return { message: '비밀번호가 성공적으로 변경되었습니다.' };
  }
}
