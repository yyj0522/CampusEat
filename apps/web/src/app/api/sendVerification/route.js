import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_ID,        
    pass: process.env.GMAIL_APP_PASSWORD, 
  },
});

export async function POST(req) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) return NextResponse.json({ success: false, error: "이메일 또는 코드 누락" });

    await transporter.sendMail({
      from: process.env.GMAIL_ID,
      to: email,
      subject: "캠퍼스잇 대학 이메일 인증",
      text: `인증번호: ${code} (3분 내 입력)`,
      html: `<p>인증번호: <strong>${code}</strong></p><p>3분 내 입력해주세요.</p>`,
    });

    await setDoc(doc(db, "emailVerifications", email), {
      code,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
