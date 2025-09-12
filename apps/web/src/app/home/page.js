"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import { FiChevronRight } from "react-icons/fi";
import Script from "next/script";
import styles from "./HomePage.module.css";

// 광고 배너 컴포넌트 (환경별 자동 변경)
function TestAdBanner({ width = "100%", height = "100px", marginLeft = 0, marginRight = 0 }) {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    // 로컬 개발 환경: 단순 박스 광고
    return (
      <div
        style={{
          width,
          height,
          marginLeft,
          marginRight,
          backgroundColor: "#e5e7eb",
          borderRadius: "12px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#555",
          fontWeight: "bold",
        }}
      >
        테스트 광고
      </div>
    );
  }

  // 배포 환경: Google AdSense 테스트 배너
  return (
    <div style={{ width, height, marginLeft, marginRight, textAlign: "center" }}>
      <Script
        id="adsense-test"
        strategy="afterInteractive"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
        crossOrigin="anonymous"
      />
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", height }}
        data-ad-client="ca-pub-3940256099942544"
        data-ad-slot="6300978111"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
      <Script id="adsense-init" strategy="afterInteractive">
        {`(adsbygoogle = window.adsbygoogle || []).push({});`}
      </Script>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) setNickname(snap.data().nickname);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const tabs = [
    { label: "맛집추천", path: "/restaurant" },
    { label: "번개모임", path: "/meeting" },
    { label: "자유게시판", path: "/chat" },
    { label: "학식&셔틀정보", path: "/information" }, 
  ];

  const cards = [
    { title: "맛집 추천", desc: "학교 주변 인기 맛집!", path: "/restaurant" },
    { title: "번개 모임", desc: "새로운 친구와 모임!", path: "/meeting" },
    { title: "자유게시판", desc: "학교 생활 이야기!", path: "/chat" },
    { title: "학식&셔틀정보", desc: "다양한 학교 정보!", path: "/information" },
  ];

  const cardStyles = [
    { gridColumn: "1 / 2", gridRow: "1 / 2" }, 
    { gridColumn: "2 / 3", gridRow: "1 / 2" },
    { gridColumn: "1 / 2", gridRow: "2 / 3" }, 
    { gridColumn: "2 / 3", gridRow: "2 / 3" }, 
  ];

  return (
    <div className={styles.container}>
      {/* 상단 네비게이션 */}
      <div className={styles.navbar}>
        <div className={styles.navLeft} onClick={() => router.push("/home")} style={{ cursor: "pointer" }}>
          <Image src="/icon.png" alt="캠퍼스잇 로고" width={40} height={40} />
          <span className={styles.appName}>캠퍼스잇</span>
        </div>
        <div className={styles.navCenter}>
          {tabs.map(tab => (
            <span key={tab.path} className={styles.navTab} onClick={() => router.push(tab.path)}>
              {tab.label}
            </span>
          ))}
        </div>
        <div className={styles.navRight}>
          {nickname && <span>{nickname}님 환영합니다!</span>}
          <button className={styles.logoutBtn} onClick={() => router.push("/profile")}>프로필</button>
        </div>
      </div>

      {/* 상단 광고 영역 */}
      <div style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
        <div style={{ flex: "1" }}>
          <TestAdBanner height="250px" width="95%" marginLeft="16px" />
        </div>
        <div style={{ flex: "2" }}>
          <TestAdBanner height="250px" width="100%" />
        </div>
        <div style={{ flex: "1" }}>
          <TestAdBanner height="250px" width="95%" marginRight="32px" />
        </div>
      </div>

      {/* 기능 카드 영역 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "3fr 1.8fr",
        gridTemplateRows: "5fr 1.2fr",
        gap: "16px",
        marginTop: "32px",
        padding: "0 16px",
      }}>
        {cards.map((card, idx) => (
          <div
            key={card.path}
            onClick={() => router.push(card.path)}
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              transition: "transform 0.2s",
              padding: "12px",
              ...cardStyles[idx],
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>{card.title}</h3>
            <p style={{ margin: "4px 0", textAlign: "center", color: "#555" }}>{card.desc}</p>
            <FiChevronRight size={20} color="#3b82f6" />
          </div>
        ))}
      </div>
    </div>
  );
}
