"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import '../../styles/style.css'; 

export default function ProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState({ nickname: "", email: "", university: "", universityEmail: "" });

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  const handleClick = (section, item) => {
    alert(`${section} > ${item} 클릭됨 (페이지 연결 예정)`);
  };

  if (!userData) return <p className="loading">로딩 중...</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 코드는 layout.js에서 관리하므로 여기서 삭제합니다. */}

      {/* 하단 컨텐츠 (기존 CSS 유지) */}
      <div className="content">
        <section className="section">
          <h2>내 정보</h2>
          <ul className="list">
            <li>이름: {userData.nickname}</li>
            <li>이메일: {userData.email}</li>
            <li>학교: {userData.university} ({userData.universityEmail})</li>
          </ul>
        </section>

        <section className="section">
          <h2>계정 정보</h2>
          <ul className="list">
            <li onClick={() => handleClick("계정 정보", "아이디 변경")}>아이디 변경</li>
            <li onClick={() => handleClick("계정 정보", "비밀번호 변경")}>비밀번호 변경</li>
          </ul>
        </section>

        <section className="section">
          <h2>맛집 추천</h2>
          <ul className="list">
            <li onClick={() => handleClick("맛집 추천", "내가 남긴 리뷰")}>내가 남긴 리뷰</li>
            <li onClick={() => handleClick("맛집 추천", "내가 자주간 맛집")}>내가 자주간 맛집</li>
            <li onClick={() => handleClick("맛집 추천", "내가 추천한 맛집")}>내가 추천한 맛집</li>
          </ul>
        </section>

        <section className="section">
          <h2>커뮤니티</h2>
          <ul className="list">
            <li onClick={() => router.push("/profile/nickname")}>닉네임 변경</li>
            <li onClick={() => router.push("/profile/myposts")}>내가 작성한 글</li>
            <li onClick={() => router.push("/profile/mycomments")}>내가 작성한 댓글</li>
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