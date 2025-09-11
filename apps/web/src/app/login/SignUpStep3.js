"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import styles from "./LoginPage.module.css";

export default function SignUpStep3({ formData, onComplete }) {
  const router = useRouter();
  const [codeInput, setCodeInput] = useState("");

  const handleVerify = async () => {
    try {
      const snap = await getDoc(doc(db, "emailVerifications", formData.universityEmail));
      if (!snap.exists()) return alert("인증번호가 존재하지 않습니다.");

      const data = snap.data();
      const now = Timestamp.now();
      const diff = now.seconds - data.createdAt.seconds;

      if (diff > 180) return alert("인증번호 유효시간이 만료되었습니다.");
      if (data.code !== codeInput) return alert("인증번호가 올바르지 않습니다.");

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
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
      <input
        type="text"
        placeholder="인증번호 입력"
        value={codeInput}
        onChange={(e) => setCodeInput(e.target.value)}
        className={styles.input}
      />
      <button className={styles.button} style={{ height: "48px" }} onClick={handleVerify}>
        완료
      </button>
    </div>
  );
}
