"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import styles from "../home/HomePage.module.css";

function AdBanner({ height = "600px" }) {
  return (
    <div className={styles.adBanner} style={{ height }}>
      서브페이지 광고
    </div>
  );
}

function Modal({ message, onClose }) {
  if (!message) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          textAlign: "center",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          maxWidth: "300px",
        }}
      >
        <p style={{ fontSize: "16px", marginBottom: "16px" }}>{message}</p>
        <button
          onClick={onClose}
          style={{
            padding: "8px 16px",
            backgroundColor: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          확인
        </button>
      </div>
    </div>
  );
}

export default function MeetingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [university, setUniversity] = useState("");
  const [modalMessage, setModalMessage] = useState(null);
  const currentPath = "/meeting";

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
              className={`${styles.navTab} ${
                currentPath === tab.path ? styles.activeTab : ""
              }`}
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

      <div className={styles.content}>
        <AdBanner height="700px" />
        <div className={styles.mainContentContainer}>
          <div className={styles.boardSection}>
            <h1 className={styles.boardTitle}>
              {university ? `${university} 번개모임!` : "번개모임!"}
            </h1>
            <p style={{ fontSize: "18px", color: "#555", marginBottom: "32px" }}>
              새로운 인연을 만들어보세요!
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                alignItems: "center",
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "75%",
                    height: "150px",
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    padding: "0 16px",
                  }}
                >
                  <div style={{ fontWeight: "bold", color: "#555" }}>
                    번개모임 카드 {i}
                  </div>
                  <button
                    style={{
                      height: "100%",
                      padding: "0 16px",
                      backgroundColor: "#3b82f6",
                      color: "#fff",
                      border: "none",
                      borderRadius: "0 12px 12px 0",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                    onClick={() => setModalMessage(`카드 ${i} 참여 버튼이 클릭되었습니다.`)}
                  >
                    참여하기
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <AdBanner height="700px" />
      </div>
      <Modal message={modalMessage} onClose={() => setModalMessage(null)} />
    </div>
  );
}
