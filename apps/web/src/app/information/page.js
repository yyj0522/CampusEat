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

export default function InformationPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [university, setUniversity] = useState("");
  const currentPath = "/information";

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
        <div className={styles.navLeft} onClick={() => router.push("/home")} style={{ cursor: "pointer" }}>
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
              {university ? `${university} 학식&셔틀 정보!` : "학식&셔틀 정보!"}
            </h1>
            <p className={styles.boardSubtitle}>
              최신 정보를 확인하세요
            </p>
            <div className={styles.informationSection}>
              <div className={styles.infoCard}>
                <h2 className={styles.infoTitle}>학식</h2>
                <p>학식 메뉴, 가격, 시간 등 정보 표시</p>
              </div>
              <div className={styles.infoCard}>
                <h2 className={styles.infoTitle}>셔틀</h2>
                <p>셔틀 시간표, 경로 등 정보 표시</p>
              </div>
            </div>
          </div>
        </div>
        <AdBanner height="700px" />
      </div>
    </div>
  );
}
