"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import styles from "./LoginPage.module.css";

export default function SignUpStep2({ formData, setFormData, next }) {
  const [universities, setUniversities] = useState([]);
  const [emailStatus, setEmailStatus] = useState("");

  // 대학 이메일 도메인 매핑
  const universityDomains = {
    "서울대학교(본교)": "@snu.ac.kr",
    "연세대학교(본교)": "@yonsei.ac.kr",
    "고려대학교(본교)": "@korea.ac.kr",
    "신구대학교(본교)": "@shingu.ac.kr",
    "백석대학교(본교)": "@bu.ac.kr",
    "백석문화대학교(본교)": "@bscu.ac.kr",
  };

  // 대학 리스트 불러오기
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const docRef = doc(db, "UnivName", "UnivName");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const namesArray = docSnap.data().name[0];
          const list = namesArray.split(",").map((s) => s.trim());
          setUniversities(list);
        }
      } catch (err) {
        console.error("대학 불러오기 실패:", err);
      }
    };
    fetchUniversities();
  }, []);

  // 자동완성 필터링
  const filteredUniversities = universities.filter((u) =>
    u.toLowerCase().includes(formData.university?.toLowerCase() || "")
  );

  // 이메일 입력 시 실시간 검증
  const handleEmailChange = (value) => {
    setFormData((prev) => ({ ...prev, universityEmail: value }));

    const selectedUniversity = formData.university;
    if (!selectedUniversity || !universityDomains[selectedUniversity]) {
      setEmailStatus("");
      return;
    }

    const domain = universityDomains[selectedUniversity];
    if (!value.endsWith(domain)) {
      setEmailStatus("올바른 형식의 이메일을 입력해주세요.");
    } else {
      setEmailStatus("사용 가능한 이메일입니다.");
    }
  };

  // 인증번호 발송 전 중복 이메일 확인
  const handleNext = async () => {
    const email = formData.universityEmail;
    const selectedUniversity = formData.university;

    if (!selectedUniversity || !email) {
      setEmailStatus("대학과 이메일을 입력해주세요.");
      return;
    }

    const domain = universityDomains[selectedUniversity];
    if (!email.endsWith(domain)) {
      setEmailStatus(`올바른 형식의 이메일주소를 입력해주세요. (${domain})`);
      return;
    }

    // 중복 이메일 체크
    try {
      const q = query(collection(db, "users"), where("universityEmail", "==", email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setEmailStatus("이미 가입된 이메일입니다.");
        return;
      }
    } catch (err) {
      console.error(err);
      setEmailStatus("이메일 확인 중 오류가 발생했습니다.");
      return;
    }

    // 이메일 중복이 아니면 인증번호 발송
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const res = await fetch("/api/sendVerification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "인증번호 전송 실패");
      }
      const data = await res.json();
      if (data.success) {
        next();
      } else {
        setEmailStatus("인증번호 전송 실패: " + (data.error || "알 수 없는 오류"));
      }
    } catch (err) {
      console.error(err);
      setEmailStatus("인증번호 전송 중 오류가 발생했습니다: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* 대학 입력 + 자동완성 */}
      <input
        type="text"
        placeholder="대학교 입력"
        value={formData.university}
        onChange={(e) => setFormData((prev) => ({ ...prev, university: e.target.value }))}
        className={styles.input}
        autoComplete="off"
      />
      <div style={{ maxHeight: 150, overflowY: "auto", border: "1px solid #ccc", borderRadius: 4 }}>
        {filteredUniversities.map((u) => (
          <div
            key={u}
            style={{ padding: 8, cursor: "pointer" }}
            onClick={() => setFormData((prev) => ({ ...prev, university: u }))}
          >
            {u}
          </div>
        ))}
      </div>

      {/* 이메일 입력 */}
      <input
        type="email"
        placeholder="대학교 이메일"
        value={formData.universityEmail}
        onChange={(e) => handleEmailChange(e.target.value)}
        className={styles.input}
      />
      {emailStatus && (
        <span style={{ color: emailStatus === "사용 가능한 이메일입니다." ? "blue" : "red", fontSize: 12 }}>
          {emailStatus}
        </span>
      )}

      <button className={styles.button} style={{ height: "48px" }} onClick={handleNext}>
        인증번호 받기
      </button>
    </div>
  );
}
