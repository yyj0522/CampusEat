"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import styles from "./HomePage.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setUserData(docSnap.data());
    });
    return () => unsubscribe();
  }, [router]);

  const handleClick = (section, item) => {
    alert(`${section} > ${item} 클릭됨 (페이지 연결 예정)`);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  const tabs = [
    { label: "맛집추천", path: "/restaurant" },
    { label: "번개모임", path: "/meeting" },
    { label: "학식&셔틀정보", path: "/information" },
    { label: "자유게시판", path: "/chat" },
  ];

  if (!userData) return <p className={styles.loading}>로딩 중...</p>;

  const currentPath = "/profile"; 

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
          {userData?.nickname && <span>{userData.nickname}님 환영합니다!</span>}
          <button
            className={styles.logoutBtn}
            onClick={() => router.push("/profile")}
          >
            프로필
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>내 정보</h2>
          <ul className={styles.list}>
            <li>이름: {userData.nickname}</li>
            <li>이메일: {userData.email}</li>
            <li>
              학교: {userData.university} ({userData.universityEmail})
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>계정 정보</h2>
          <ul className={styles.list}>
            <li onClick={() => handleClick("계정 정보", "아이디 변경")}>
              아이디 변경
            </li>
            <li onClick={() => handleClick("계정 정보", "비밀번호 변경")}>
              비밀번호 변경
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>맛집 추천</h2>
          <ul className={styles.list}>
            <li onClick={() => handleClick("맛집 추천", "내가 남긴 리뷰")}>
              내가 남긴 리뷰
            </li>
            <li onClick={() => handleClick("맛집 추천", "내가 자주간 맛집")}>
              내가 자주간 맛집
            </li>
            <li onClick={() => handleClick("맛집 추천", "내가 추천한 맛집")}>
              내가 추천한 맛집
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>커뮤니티</h2>
          <ul className={styles.list}>
            <li onClick={() => router.push("/profile/nickname")}>
              닉네임 변경
            </li>
            <li onClick={() => router.push("/profile/myposts")}>
              내가 작성한 글
            </li>
            <li onClick={() => router.push("/profile/mycomments")}>
              내가 작성한 댓글
            </li>
          </ul>
        </section>

        <div
          style={{
            padding: "16px",
            borderRadius: "8px",
            backgroundColor: "#fee2e2",
            textAlign: "center",
            cursor: "pointer",
            color: "#b91c1c",
            fontWeight: "bold",
            fontSize: "16px",
          }}
          onClick={handleLogout}
        >
          로그아웃
        </div>
      </div>
    </div>
  );
}
