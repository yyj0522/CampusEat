"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import styles from "./LoginPage.module.css";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    setErrorMessage("");
    if (!email || !password) {
      setErrorMessage("이메일과 비밀번호 입력 필수!");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/home");
    } catch (err) {
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setErrorMessage("아이디 또는 비밀번호를 확인해주세요.");
      } else if (err.code === "auth/invalid-email") {
        setErrorMessage("올바른 이메일 형식이 아닙니다.");
      } else {
        setErrorMessage("아이디 또는 비밀번호가 일치하지 않습니다.");
      }
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.inputsColumn}>
        <input
          type="email"
          placeholder="이메일"
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <button className={styles.button} onClick={handleLogin}>
          로그인
        </button>
      </div>

      {errorMessage && (
        <p style={{ color: "red", fontSize: "14px", marginTop: "10px", textAlign: "center" }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}
