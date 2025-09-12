"use client";

import { useState } from "react";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import styles from "./LoginPage.module.css";

export default function PwFind({ onComplete }) {
  const [univEmail, setUnivEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!univEmail) {
      setStatus("대학 이메일을 입력해주세요.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const q = query(collection(db, "users"), where("universityEmail", "==", univEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setStatus("등록된 계정이 없습니다.");
      } else {
        const userData = querySnapshot.docs[0].data();
        const email = userData.email;

        await sendPasswordResetEmail(auth, email);
        setStatus(`비밀번호 재설정 이메일을 ${email}로 전송했습니다.`);
      }
    } catch (err) {
      console.error(err);
      setStatus("이메일 전송 실패: " + err.message);
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
      <h2>비밀번호 찾기</h2>
      <span>인증한 대학 이메일을 입력해주세요.</span>

      <input
        type="email"
        placeholder="대학 이메일 입력"
        value={univEmail}
        onChange={(e) => setUnivEmail(e.target.value)}
        className={styles.input}
      />

      <button className={styles.button} style={{ height: "48px" }} onClick={handleReset} disabled={loading}>
        {loading ? "전송중..." : "비밀번호 재설정 이메일 보내기"}
      </button>

      {status && (
        <span style={{ color: status.includes("전송") ? "blue" : "red", fontSize: 14 }}>{status}</span>
      )}

      <button className={styles.button} style={{ marginTop: 16, height: "48px" }} onClick={onComplete}>
        로그인 화면으로 돌아가기
      </button>
    </div>
  );
}
