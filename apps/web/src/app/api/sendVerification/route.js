import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const { email, code } = await request.json();

    const user = process.env.GMAIL_ID;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      console.error("Gmail 환경 변수가 설정되지 않았습니다.");
      return NextResponse.json({ success: false, error: "서버 설정 오류입니다." }, { status: 500 });
    }
    if (!email || !code) {
      return NextResponse.json({ success: false, error: "이메일 또는 인증 코드가 누락되었습니다." }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    const mailOptions = {
      from: `캠퍼스잇 <${user}>`,
      to: email,
      subject: "[캠퍼스잇] 이메일 인증번호 안내",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2 style="color: #4A90E2;">캠퍼스잇 인증번호 안내</h2>
          <p>요청하신 인증번호는 아래와 같습니다.</p>
          <div style="background-color: #f2f2f2; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <strong style="font-size: 24px; color: #333; letter-spacing: 5px;">${code}</strong>
          </div>
          <p>인증번호를 입력창에 정확히 입력해주세요.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("API Route 오류:", error);
    return NextResponse.json({ success: false, error: "서버 내부 오류가 발생했습니다." }, { status: 500 });
  }
}