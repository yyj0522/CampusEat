"use client";

import Image from "next/image";
import { useState } from "react";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.logoContainer}>
        <Image src="/icon.png" alt="캠퍼스잇 로고" width={200} height={200} />
        <h1 className={styles.title}>캠퍼스잇</h1>
      </div>
      <p className={styles.subtitle}>캠퍼스 생활을 더 즐겁게 만드는 당신의 친구!</p>

      {!showSignUp ? (
        <>
          <LoginForm />
          <div
            style={{ marginTop: "12px", color: "#3b82f6", cursor: "pointer" }}
            onClick={() => setShowSignUp(true)}
          >
            회원가입
          </div>
        </>
      ) : (
        <SignUpForm onComplete={() => setShowSignUp(false)} />
      )}
    </div>
  );
}
