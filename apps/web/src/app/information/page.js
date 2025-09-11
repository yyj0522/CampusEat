"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import styles from "./HomePage.module.css";

export default function InformationPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [university, setUniversity] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setNickname(snap.data().nickname);
          setUniversity(snap.data().university);
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const tabs = [
    { label: "맛집추천", path: "/restaurant" },
    { label: "번개모임", path: "/meeting" },
    { label: "학식&셔틀정보", path: "/information" },
    { label: "자유게시판", path: "/chat" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.navbar}>
        <div
          className={styles.navLeft}
          onClick={() => router.push("/home")}
          style={{ cursor: "pointer" }}
        >
          <Image src="/icon.png" alt="캠퍼스잇 로고" width={40} height={40} />
          <span className={styles.appName}>캠퍼스잇</span>
        </div>

        <div className={styles.navCenter}>
          {tabs.map((tab) => (
            <span
              key={tab.path}
              className={styles.navTab}
              onClick={() => router.push(tab.path)}
            >
              {tab.label}
            </span>
          ))}
        </div>

        <div className={styles.navRight}>
          {nickname && <span>{nickname}님 환영합니다!</span>}
          <button
            className={styles.logoutBtn}
            onClick={() => router.push("/profile")}
          >
            프로필
          </button>
        </div>
      </div>
      <div style={{ display: "flex", marginTop: "32px" }}>
        <div style={{ flex: "1", textAlign: "center", color: "#aaa" }}>
          광고 배너
        </div>
        <div style={{ flex: "3", textAlign: "center" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>
            {university ? `${university} 학식&셔틀 정보!` : "학식&셔틀 정보!"}
          </h1>
          <p style={{ fontSize: "18px", color: "#555", marginBottom: "32px" }}>
            최신 정보를 확인하세요
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "16px",
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              padding: "16px",
              minHeight: "500px",
              alignItems: "stretch",
            }}
          >
            <div style={{ flex: 1, textAlign: "center", padding: "16px" }}>
              <h2 style={{ fontWeight: "bold", marginBottom: "16px" }}>학식</h2>
              <p>학식 메뉴, 가격, 시간 등 정보 표시</p>
            </div>
            <div
              style={{
                width: "1px",
                backgroundColor: "#ddd",
              }}
            ></div>
            <div style={{ flex: 1, textAlign: "center", padding: "16px" }}>
              <h2 style={{ fontWeight: "bold", marginBottom: "16px" }}>셔틀</h2>
              <p>셔틀 시간표, 경로 등 정보 표시</p>
            </div>
          </div>
        </div>
        <div style={{ flex: "1", textAlign: "center", color: "#aaa" }}>
          광고 배너
        </div>
      </div>
    </div>
  );
}
