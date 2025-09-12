"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import Script from "next/script";
import styles from "./HomePage.module.css";

function AdBanner({ width = "90%", height = "600px", marginLeft = 0, marginRight = 0 }) {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    return (
      <div
        style={{
          width: "200px",
          height,
          marginLeft,
          marginRight,
          marginTop: "50px",
          backgroundColor: "#e5e7eb",
          borderRadius: "12px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#555",
          fontWeight: "bold",
          fontSize: "14px",
        }}
      >
        테스트 광고
      </div>
    );
  }

  return (
    <div style={{ width, height, marginLeft, marginRight, textAlign: "center" }}>
      <Script
        id="adsense"
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

export default function MeetingPage() {
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

      <div style={{ display: "flex", marginTop: "32px", gap: "16px" }}>
        <div style={{ flex: "1", display: "flex", justifyContent: "flex-start" }}>
          <AdBanner width="80%" height="700px" marginLeft="64px" />
        </div>

        <div style={{ flex: "3", textAlign: "center" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>
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
                  onClick={() => alert(`카드 ${i} 참여 버튼 클릭됨`)}
                >
                  참여하기
                </button>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: "1", display: "flex", justifyContent: "flex-end" }}>
          <AdBanner width="80%" height="700px" marginRight="64px" />
        </div>
      </div>
    </div>
  );
}
