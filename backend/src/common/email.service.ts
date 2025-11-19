import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASS'),
      },
    });
  }

  async sendVerificationEmail(email: string, code: string) {
    const mailOptions = {
      from: this.configService.get('EMAIL_USER'),
      to: email,
      subject: '[캠퍼스잇] 대학교 이메일 인증 번호입니다.',
      html: `<h1>캠퍼스잇 인증 번호</h1><p>인증 번호: <strong>${code}</strong></p>`,
    };
    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(email: string, resetUrl: string) {
    const mailOptions = {
      from: this.configService.get('EMAIL_USER'),
      to: email,
      subject: '[캠퍼스잇] 비밀번호 재설정 안내',
      html: `
        <h1>캠퍼스잇 비밀번호 재설정</h1>
        <p>아래 버튼을 클릭하여 비밀번호를 재설정해주세요. 이 링크는 10분간 유효합니다.</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #7c3aed; text-decoration: none; border-radius: 5px;">
          비밀번호 재설정하기
        </a>
        <p>만약 버튼이 작동하지 않으면, 아래 링크를 복사하여 주소창에 붙여넣어주세요:</p>
        <p>${resetUrl}</p>
      `,
    };
    await this.transporter.sendMail(mailOptions);
  }
}