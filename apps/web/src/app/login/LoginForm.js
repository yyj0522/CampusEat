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
  

  const handleLogin = async () => {
    if (!email || !password) return alert("이메일과 비밀번호 입력 필수!");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/home");
    } catch (err) {
      alert(err.message);
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
        <button className={styles.button} onClick={handleLogin}>로그인</button>
      </div>
    </div>
  );
}
