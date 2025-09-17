"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp, doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import { FiArrowRight, FiHeart, FiUsers, FiBook, FiMessageSquare } from "react-icons/fi";

import sharedStyles from "./HomePage.module.css";
import homeStyles from "./Home.module.css";

function AdBanner({ style }) {
  return <div className={homeStyles.adBannerSection} style={style}>메인페이지 광고</div>;
}

export default function HomePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [popularPosts, setPopularPosts] = useState([]);

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

  useEffect(() => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000); 
    const postsRef = collection(db, "posts");

    const q = query(
      postsRef,
      where("createdAt", ">=", Timestamp.fromDate(yesterday)),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.views || 0) - (a.views || 0)) 
        .slice(0, 6); 

      setPopularPosts(posts);
    });

    return () => unsubscribe();
  }, []);

  const tabs = [
    { label: "맛집추천", path: "/restaurant" },
    { label: "번개모임", path: "/meeting" },
    { label: "학식&셔틀정보", path: "/information" },
    { label: "자유게시판", path: "/chat" },
  ];

  const cards = [
    {
      title: "맛집 추천",
      desc: "학교 주변의 숨겨진 맛집을 찾아보세요!",
      path: "/restaurant",
      icon: <FiHeart size={48} color="#ef4444" />,
    },
    {
      title: "번개 모임",
      desc: "점심약속부터 취미까지, 새로운 인연을 만들어 보세요.",
      path: "/meeting",
      icon: <FiUsers size={48} color="#4f46e5" />,
    },
    {
      title: "자유게시판",
      desc: "자유롭게 소통하고 정보를 공유하는 공간!",
      path: "/chat",
      icon: <FiMessageSquare size={48} color="#f59e0b" />,
    },
    {
      title: "학식&셔틀정보",
      desc: "우리학교 학식 메뉴와 통학버스 운행 정보를 확인하세요.",
      path: "/information",
      icon: <FiBook size={48} color="#10b981" />,
    },
  ];

  return (
    <div className={sharedStyles.container}>
      <div className={sharedStyles.navbar}>
        <div
          className={sharedStyles.navLeft}
          onClick={() => router.push("/home")}
          style={{ cursor: "pointer" }}
        >
          <Image src="/icon.png" alt="캠퍼스잇 로고" width={40} height={40} />
          <span className={sharedStyles.appName}>캠퍼스잇</span>
        </div>
        <div className={sharedStyles.navCenter}>
          {tabs.map((tab) => (
            <span key={tab.path} className={sharedStyles.navTab} onClick={() => router.push(tab.path)}>
              {tab.label}
            </span>
          ))}
        </div>
        <div className={sharedStyles.navRight}>
          {nickname && <span>{nickname}님 환영합니다!</span>}
          <button className={sharedStyles.logoutBtn} onClick={() => router.push("/profile")}>
            프로필
          </button>
        </div>
      </div>

      <div className={homeStyles.mainContent}>
        <div className={homeStyles.leftColumn}>
          <AdBanner />
          <div className={homeStyles.cardGridSection}>
            {cards.map((card) => (
              <div
                key={card.path}
                className={homeStyles.contentCard}
                onClick={() => router.push(card.path)}
              >
                <div className={homeStyles.cardIcon}>{card.icon}</div>
                <h3 className={homeStyles.cardTitle}>{card.title}</h3>
                <p className={homeStyles.cardDesc}>{card.desc}</p>
                <div className={homeStyles.cardLink}>
                  바로가기 <FiArrowRight />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={homeStyles.rightColumn}>
          <div
            className={homeStyles.infoCard}
            style={{ height: "50%", overflowY: "auto", marginBottom: "1rem" }}
          >
            <h2 className={homeStyles.sectionTitle}>
              실시간 인기 게시물
              <span className={homeStyles.viewAllLink} onClick={() => router.push("/chat")}>
                전체보기
              </span>
            </h2>
            <ul className={homeStyles.postList}>
              {popularPosts.map((post) => (
                <li
                  key={post.id}
                  className={homeStyles.postItem}
                  onClick={() => router.push(`/chat/${post.id}`)}
                >
                  <span className={homeStyles.postTitlePreview}>{post.title}</span>
                  <span className={homeStyles.postDate}>
                    {post.createdAt?.toDate().toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <AdBanner style={{ height: "50%" }} />
        </div>
      </div>
    </div>
  );
}
