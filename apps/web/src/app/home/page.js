"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Image from "next/image";
import styles from "./HomePage.module.css"; 

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("맛집추천");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push("/login"); 
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "맛집추천":
        return <div>맛집 추천 들어갈 공간</div>;
      case "번개모임":
        return <div>번개모임 들어갈 공간</div>;
      case "학식&셔틀정보":
        return <div>학식/셔틀 들어갈 공간</div>;
      case "자유게시판":
        return <div>자유게시판 들어갈 공간</div>;
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      {/* 상단바 */}
      <div className={styles.navbar}>
        <div className={styles.navLeft}>
          <Image src="/icon.png" alt="캠퍼스잇 로고" width={40} height={40} />
          <span className={styles.appName}>캠퍼스잇</span>
        </div>

        <div className={styles.navCenter}>
          {["맛집추천", "번개모임", "학식&셔틀정보", "자유게시판"].map((tab) => (
            <span
              key={tab}
              className={`${styles.navTab} ${activeTab === tab ? styles.activeTab : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </span>
          ))}
        </div>

        <div className={styles.navRight}>
          {user && <span>{user.email}님 환영합니다!</span>}
          <button className={styles.logoutBtn} onClick={handleLogout}>로그아웃</button>
        </div>
      </div>

      {/* 하단 내용 */}
      <div className={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
}
