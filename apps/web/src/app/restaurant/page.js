"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import Script from "next/script";
import styles from "../home/HomePage.module.css";

function AdBanner({ height = "600px" }) {
  return (
    <div className={styles.adBanner} style={{ height }}>
      서브페이지 광고
    </div>
  );
}

export default function RestaurantPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [university, setUniversity] = useState("");
  const currentPath = "/restaurant";

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
              {university ? `${university} 맛집추천!` : "맛집추천!"}
            </h1>
            <p style={{ fontSize: "18px", color: "#555", marginBottom: "32px" }}>
              새로운 인연을 만들어보세요!
            </p>
            <div className={styles.restaurantCardContainer}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.restaurantCard}>
                  카드 {i}
                </div>
              ))}
            </div>
          </div>
        </div>
        <AdBanner height="700px" />
      </div>
    </div>
  );
}
