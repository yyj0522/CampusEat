"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import styles from "./LoginPage.module.css";

export default function SignUpStep2({ formData, setFormData, next }) {
  const [universities, setUniversities] = useState([]);

  useEffect(() => {
    const fetchUniversities = async () => {
      const querySnapshot = await getDocs(collection(db, "newUniversities"));
      const list = [];
      querySnapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setUniversities(list);
    };
    fetchUniversities();
  }, []);

  const handleNext = async () => {
    if (!formData.university || !formData.universityEmail) {
      return alert("대학교와 대학교 이메일을 입력해주세요.");
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const res = await fetch("/api/sendVerification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.universityEmail, code }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "인증번호 전송 실패");
      }

      const data = await res.json();
      if (data.success) {
        alert("인증번호가 이메일로 전송되었습니다. 3분 내 입력해주세요.");
        next();
      } else {
        alert("인증번호 전송 실패: " + (data.error || "알 수 없는 오류"));
      }
    } catch (err) {
      console.error(err);
      alert("인증번호 전송 중 오류가 발생했습니다: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
      <select
        className={styles.input}
        value={formData.university}
        onChange={(e) => setFormData((prev) => ({ ...prev, university: e.target.value }))}
      >
        <option value="">대학교 선택</option>
        {universities.map((u) => (
          <option key={u.id} value={u.id}>
            {u.id}
          </option>
        ))}
      </select>

      <input
        type="email"
        placeholder="대학교 이메일"
        value={formData.universityEmail}
        onChange={(e) => setFormData((prev) => ({ ...prev, universityEmail: e.target.value }))}
        className={styles.input}
      />

      <button className={styles.button} style={{ height: "48px" }} onClick={handleNext}>
        인증번호 받기
      </button>
    </div>
  );
}
