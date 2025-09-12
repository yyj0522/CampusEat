"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import styles from "./LoginPage.module.css";

export default function SignUpStep3({ formData, onComplete }) {
  const router = useRouter();
  const [codeInput, setCodeInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(180);
  const [canResend, setCanResend] = useState(true);
  const [emailError, setEmailError] = useState("");

  // 타이머 포맷 함수
  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // 타이머
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const sendVerification = async () => {
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const res = await fetch("/api/sendVerification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.universityEmail, code }),
      });
      if (!res.ok) throw new Error("인증번호 전송 실패");
      setTimeLeft(180); 
      setCanResend(false); 
    } catch (err) {
      console.error(err);
      setEmailError("인증번호 전송 중 오류가 발생했습니다.");
    }
  };

  const handleResend = async () => {
    await sendVerification();
  };

  const handleVerify = async () => {
    try {
      const snap = await getDoc(doc(db, "emailVerifications", formData.universityEmail));
      if (!snap.exists()) return setEmailError("인증번호가 존재하지 않습니다.");

      const data = snap.data();
      const now = Timestamp.now();
      const diff = now.seconds - data.createdAt.seconds;

      if (diff > 180) return setEmailError("인증번호 유효시간이 만료되었습니다.");
      if (data.code !== codeInput) return setEmailError("인증번호가 올바르지 않습니다.");

      // 이메일 중복 체크
      const userSnap = await getDoc(doc(db, "users", formData.email));
      if (userSnap.exists()) return setEmailError("이미 가입된 이메일입니다.");

      // 회원가입
      const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await setDoc(doc(db, "users", userCred.user.uid), {
        nickname: formData.nickname,
        email: formData.email,
        university: formData.university,
        universityEmail: formData.universityEmail,
      });

      alert("회원가입 완료!");
      router.push("/home");
      onComplete();
    } catch (err) {
      console.error(err);
      setEmailError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 8 }}>
      {/* 타이머 */}
      <span style={{ color: "blue", fontSize: 12, textAlign: "left" }}>
        남은 시간: {formatTime(timeLeft)}
      </span>

      {/* 인증번호 입력 + 재전송 버튼 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="text"
          placeholder="인증번호 입력"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          className={styles.input}
          style={{ flex: 1 }}
        />
        <button
  onClick={handleResend}
  disabled={!canResend}
  className={styles.button}
  style={{ width: 90, height: "48px", fontSize: "16px" }}
>
  재전송
</button>

      </div>

      {emailError && <span style={{ color: "red", fontSize: 12 }}>{emailError}</span>}

      {/* 완료 버튼 */}
      <button className={styles.button} style={{ height: "48px" }} onClick={handleVerify}>
        완료
      </button>
    </div>
  );
}
