"use client";

import Image from "next/image";
import { useState } from "react";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import IdFind from "./IdFind";
import PwFind from "./PwFind";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // login, signup, findID, findPW

  return (
    <div className={styles.container}>
      <div className={styles.logoContainer}>
        <Image src="/icon.png" alt="캠퍼스잇 로고" width={200} height={200} />
        <h1 className={styles.title}>캠퍼스잇</h1>
      </div>
      <p className={styles.subtitle}>캠퍼스 생활을 더 즐겁게 만드는 당신의 친구!</p>

      {/* 모드에 따라 화면 전환 */}
      {mode === "login" && <LoginForm />}
      {mode === "signup" && <SignUpForm onComplete={() => setMode("login")} />}
      {mode === "findID" && <IdFind onComplete={() => setMode("login")} />}
      {mode === "findPW" && <PwFind onComplete={() => setMode("login")} />}

      {/* 하단 버튼: 로그인 모드에서만 표시 */}
      {mode === "login" && (
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 12 }}>
          <span
            style={{ color: "#3b82f6", cursor: "pointer" }}
            onClick={() => setMode("signup")}
          >
            회원가입
          </span>
          <span
            style={{ color: "#3b82f6", cursor: "pointer" }}
            onClick={() => setMode("findID")}
          >
            ID찾기
          </span>
          <span
            style={{ color: "#3b82f6", cursor: "pointer" }}
            onClick={() => setMode("findPW")}
          >
            PW찾기
          </span>
        </div>
      )}
    </div>
  );
}
