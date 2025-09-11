"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import styles from "./HomePage.module.css";

export default function RestaurantPage() {
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
          <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}>
            {university ? `${university} 맛집추천!` : "맛집추천!"}
          </h2>

          <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: "200px",
                  height: "250px",
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  color: "#999",
                }}
              >
                카드 {i}
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: "1", textAlign: "center", color: "#aaa" }}>
          광고 배너
        </div>
      </div>
    </div>
  );
}
