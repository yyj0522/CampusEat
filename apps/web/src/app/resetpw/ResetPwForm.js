"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "../../firebase";
import { confirmPasswordReset } from "firebase/auth";
import styles from "../login/LoginPage.module.css"; 

export default function ResetPwForm() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleReset = async () => {
    if (!newPassword) return setMessage("새 비밀번호를 입력해주세요.");

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setMessage("비밀번호가 변경되었습니다. 로그인 페이지로 이동합니다.");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      console.error(err);
      setMessage("비밀번호 변경 실패: " + err.message);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center", 
        alignItems: "center",   
        minHeight: "100vh",       
        backgroundColor: "#f9f9f9", 
      }}
    >
      <div
        style={{
          maxWidth: 400,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: 20,
          border: "1px solid #ddd",
          borderRadius: 8,
          backgroundColor: "#fff",
        }}
      >
        <h2>비밀번호 재설정</h2>
        <input
          type="password"
          placeholder="새 비밀번호 입력"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={styles.input}
        />
        <button className={styles.button} onClick={handleReset}>
          비밀번호 변경
        </button>
        {message && (
          <span style={{ color: message.includes("실패") ? "red" : "green", fontSize: 14 }}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
