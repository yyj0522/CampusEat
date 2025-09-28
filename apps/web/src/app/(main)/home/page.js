"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";

export default function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState({ nickname: "", university: "" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setCurrentUser({
              nickname: snap.data().nickname || "사용자",
              university: snap.data().university || "우리 대학",
            });
          } else {
            setCurrentUser({ nickname: "사용자", university: "우리 대학" });
          }
        } catch (error) {
          console.error("유저 정보 가져오기 실패:", error);
          setCurrentUser({ nickname: "사용자", university: "우리 대학" });
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 코드는 layout.js에서 관리하므로 여기서 삭제합니다. */}

      {/* 홈 화면 중앙 컨텐츠 */}
      <main className="min-h-[80vh]">
        {/* 히어로 섹션 */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              환영합니다, {currentUser.nickname || "사용자"}님!
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8">
              {currentUser.university || "우리 대학"} 학생들을 위한 종합 플랫폼
            </p>
            <div className="text-lg opacity-80">
              오늘도 캠퍼스잇과 함께 즐거운 대학생활을 시작해보세요!
            </div>
          </div>
        </section>

        {/* 신학기 이벤트 */}
        <section className="bg-white py-8 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-xl p-6 text-white text-center">
              <h3 className="text-2xl font-bold mb-2">🎉 신학기 특별 이벤트</h3>
              <p className="text-lg opacity-90">
                맛집 리뷰 작성하고 배달비 쿠폰 받아가세요!
              </p>
              <button
                className="mt-4 bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
                onClick={() => router.push("/event")}
              >
                자세히 보기
              </button>
            </div>
          </div>
        </section>

        {/* 핵심 기능 미리보기 */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
              캠퍼스잇의 핵심 기능
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div
                className="bg-white rounded-xl p-6 shadow-lg cursor-pointer hover:shadow-2xl transition"
                onClick={() => router.push("/restaurant")}
              >
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-utensils text-2xl text-red-600"></i>
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">맛집추천</h3>
                <p className="text-gray-600 text-center mb-4">
                  AI가 추천하는 맛집과 실제 학생들의 리뷰를 확인하세요
                </p>
              </div>

              <div
                className="bg-white rounded-xl p-6 shadow-lg cursor-pointer hover:shadow-2xl transition"
                onClick={() => router.push("/meeting")}
              >
                <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-bolt text-2xl text-yellow-600"></i>
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">번개모임</h3>
                <p className="text-gray-600 text-center mb-4">
                  같이 밥먹고, 공부하고, 놀 친구들을 찾아보세요
                </p>
              </div>

              <div
                className="bg-white rounded-xl p-6 shadow-lg cursor-pointer hover:shadow-2xl transition"
                onClick={() => router.push("/information")}
              >
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-bus text-2xl text-green-600"></i>
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">학식/셔틀</h3>
                <p className="text-gray-600 text-center mb-4">
                  오늘의 학식 메뉴와 셔틀버스 시간표를 확인하세요
                </p>
              </div>

              <div
                className="bg-white rounded-xl p-6 shadow-lg cursor-pointer hover:shadow-2xl transition"
                onClick={() => router.push("/community")}
              >
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-comments text-2xl text-purple-600"></i>
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">커뮤니티</h3>
                <p className="text-gray-600 text-center mb-4">
                  학우들과 자유롭게 소통하고 정보를 공유하세요
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 빠른 액세스 */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
              빠른 액세스
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => router.push("/restaurant")}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-4 rounded-xl hover:shadow-lg transition flex flex-col items-center"
              >
                <i className="fas fa-search text-2xl mb-2"></i>
                <span className="font-medium">점심 추천받기</span>
              </button>

              <button
                onClick={() => router.push("/meeting")}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4 rounded-xl hover:shadow-lg transition flex flex-col items-center"
              >
                <i className="fas fa-plus text-2xl mb-2"></i>
                <span className="font-medium">모임 만들기</span>
              </button>

              <button
                onClick={() => router.push("/information")}
                className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-4 rounded-xl hover:shadow-lg transition flex flex-col items-center"
              >
                <i className="fas fa-clock text-2xl mb-2"></i>
                <span className="font-medium">셔틀 시간표</span>
              </button>

              <button
                onClick={() => router.push("/community")}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-xl hover:shadow-lg transition flex flex-col items-center"
              >
                <i className="fas fa-edit text-2xl mb-2"></i>
                <span className="font-medium">글 작성하기</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}