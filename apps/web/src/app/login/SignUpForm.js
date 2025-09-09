"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebase"; // db: Firestore 사용 시
import { createUserWithEmailAndPassword } from "firebase/auth";
import styles from "./LoginPage.module.css";

export default function SignUpForm({ onComplete }) {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");
  const [checking, setChecking] = useState(false);

  const handleSignUp = async () => {
    if (!nickname || !email || !password || !passwordCheck)
      return alert("모든 항목을 입력해주세요.");
    if (password !== passwordCheck) return alert("비밀번호가 일치하지 않습니다.");

    setChecking(true);
    try {
      // Firebase Auth 회원가입
      await createUserWithEmailAndPassword(auth, email, password);
      alert("회원가입 완료!");
      onComplete(); // 로그인 화면으로 돌아가기
    } catch (err) {
      alert(err.message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
      <input
        type="text"
        placeholder="닉네임"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        className={styles.input}
      />
      <input
        type="email"
        placeholder="아이디(이메일)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={styles.input}
      />
      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={styles.input}
      />
      <input
        type="password"
        placeholder="비밀번호 확인"
        value={passwordCheck}
        onChange={(e) => setPasswordCheck(e.target.value)}
        className={styles.input}
      />
      <button
  className={styles.button}
  style={{ height: "48px" }} // 원하는 높이(px 또는 vw)
  onClick={handleSignUp}
  disabled={checking}
>
  완료
</button>
    </div>
  );
}
