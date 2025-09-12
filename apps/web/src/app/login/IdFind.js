"use client";

import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import styles from "./LoginPage.module.css";

export default function IdFind({ onComplete }) {
  const [univEmail, setUnivEmail] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFindId = async () => {
    if (!univEmail) {
      setError("대학 이메일을 입력해주세요.");
      setResult("");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");

    try {
      const q = query(collection(db, "users"), where("universityEmail", "==", univEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("해당 대학 이메일로 등록된 계정이 없습니다.");
      } else {
        const userDoc = querySnapshot.docs[0].data();
        setResult(`가입된 아이디는 ${userDoc.email} 입니다.`);
      }
    } catch (err) {
      console.error(err);
      setError("ID 조회 중 오류가 발생했습니다.");
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
      <h2>ID 찾기</h2>
      <span>인증한 대학 이메일을 입력해주세요.</span>
      <input
        type="email"
        placeholder="대학 이메일 입력"
        value={univEmail}
        onChange={(e) => setUnivEmail(e.target.value)}
        className={styles.input}
      />
      <button className={styles.button} style={{ height: "48px" }} onClick={handleFindId} disabled={loading}>
        {loading ? "조회중..." : "ID 찾기"}
      </button>

      {result && <span style={{ color: "blue", fontSize: 14 }}>{result}</span>}
      {error && <span style={{ color: "red", fontSize: 14 }}>{error}</span>}

      <button className={styles.button} style={{ marginTop: 16, height: "48px" }} onClick={onComplete}>
        로그인 화면으로 돌아가기
      </button>
    </div>
  );
}
