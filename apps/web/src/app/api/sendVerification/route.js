import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request) {
  // 1. 요청 본문에서 email과 code를 안전하게 추출
  let email, code;
  try {
    const body = await request.json();
    email = body.email;
    code = body.code;
  } catch (error) {
    return NextResponse.json({ success: false, error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  // 2. 환경 변수에서 Gmail 정보 가져오기
  const user = process.env.GMAIL_ID;
  const pass = process.env.GMAIL_APP_PASSWORD;

  // 3. 필수 정보 확인
  if (!user || !pass) {
    console.error("Gmail ID 또는 앱 비밀번호 환경 변수가 설정되지 않았습니다.");
    return NextResponse.json({ success: false, error: "서버 설정 오류입니다." }, { status: 500 });
  }
  if (!email || !code) {
    return NextResponse.json({ success: false, error: "이메일 또는 인증 코드가 누락되었습니다." }, { status: 400 });
  }

  // 4. 이메일 발송 로직
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    const mailOptions = {
      from: `캠퍼스잇 <${user}>`,
      to: email,
      subject: "[캠퍼스잇] 대학교 이메일 인증번호 안내",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 12px; max-width: 600px; margin: auto;">
          <h2 style="color: #4A90E2;">캠퍼스잇 인증번호 안내</h2>
          <p>안녕하세요! 캠퍼스잇에 가입해 주셔서 감사합니다.</p>
          <p>요청하신 인증번호는 아래와 같습니다.</p>
          <div style="background-color: #f2f2f2; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <strong style="font-size: 24px; color: #333; letter-spacing: 5px;">${code}</strong>
          </div>
          <p>인증번호를 입력창에 정확히 입력해주세요.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    // 성공 시 응답
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Nodemailer 오류:", error);
    // 실패 시 응답
    return NextResponse.json({ success: false, error: "이메일 전송 서버에 문제가 발생했습니다." }, { status: 500 });
  }
}