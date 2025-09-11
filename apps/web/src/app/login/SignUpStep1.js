"use client";

import { useState } from "react";
import styles from "./LoginPage.module.css";

export default function SignUpStep1({ formData, setFormData, next }) {
  const [passwordCheck, setPasswordCheck] = useState("");

  const handleNext = () => {
    if (!formData.nickname || !formData.email || !formData.password || !passwordCheck) {
      return alert("모든 항목을 입력해주세요.");
    }
    if (formData.password !== passwordCheck) {
      return alert("비밀번호가 일치하지 않습니다.");
    }
    next();
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
      <input
        type="text"
        placeholder="닉네임"
        value={formData.nickname}
        onChange={(e) => setFormData((prev) => ({ ...prev, nickname: e.target.value }))}
        className={styles.input}
      />
      <input
        type="email"
        placeholder="아이디(이메일)"
        value={formData.email}
        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
        className={styles.input}
      />
      <input
        type="password"
        placeholder="비밀번호"
        value={formData.password}
        onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
        className={styles.input}
      />
      <input
        type="password"
        placeholder="비밀번호 확인"
        value={passwordCheck}
        onChange={(e) => setPasswordCheck(e.target.value)}
        className={styles.input}
      />
      <button className={styles.button} style={{ height: "48px" }} onClick={handleNext}>
        다음
      </button>
    </div>
  );
}
