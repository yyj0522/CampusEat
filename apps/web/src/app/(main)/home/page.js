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
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            bgColor: "bg-gradient-to-r from-green-400 to-blue-500",
            title: "🎉 신학기 특별 이벤트",
            subtitle: "맛집 리뷰 작성하고 배달비 쿠폰 받아가세요!",
            buttonText: "자세히 보기",
            link: "/restaurant"
        },
        {
            bgColor: "bg-gradient-to-r from-purple-500 to-pink-500",
            title: "📢 전체 공지사항",
            subtitle: "캠퍼스잇 v1.2 업데이트 안내",
            buttonText: "공지 확인",
            link: "/community?category=notice"
        },
        {
            bgColor: "bg-gradient-to-r from-yellow-400 to-orange-500",
            title: "🔥 지금 가장 인기있는 번개모임",
            subtitle: "함께 저녁 식사 할 분들을 찾고 있어요!",
            buttonText: "모임 참여하기",
            link: "/meeting"
        },
    ];

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    };

    useEffect(() => {
        const slideInterval = setInterval(nextSlide, 5000); // 5초마다 슬라이드 변경
        return () => clearInterval(slideInterval);
    }, []);

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

    const quickLinks = [
        { title: "맛집추천", icon: "fa-utensils", color: "text-red-500", bgColor: "bg-red-50", path: "/restaurant", description: "학우들의 진짜 리뷰" },
        { title: "번개모임", icon: "fa-bolt", color: "text-yellow-500", bgColor: "bg-yellow-50", path: "/meeting", description: "오늘의 만남" },
        { title: "학식/셔틀", icon: "fa-bus", color: "text-green-500", bgColor: "bg-green-50", path: "/information", description: "필수 정보 확인" },
        { title: "커뮤니티", icon: "fa-comments", color: "text-blue-500", bgColor: "bg-blue-50", path: "/community", description: "소통과 정보공유" },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="space-y-12 md:space-y-16 py-12">
                <section className="max-w-6xl mx-auto px-6">
                    <div className="relative w-full aspect-[2/1] md:aspect-[3/1] overflow-hidden rounded-2xl shadow-xl">
                        {slides.map((slide, index) => (
                            <div
                                key={index}
                                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${slide.bgColor} ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                            >
                                <div className="w-full h-full flex flex-col items-center justify-center text-white p-6 text-center">
                                    <h2 className="text-2xl md:text-3xl font-bold">{slide.title}</h2>
                                    <p className="mt-2 text-md md:text-lg opacity-90">{slide.subtitle}</p>
                                    <button
                                        onClick={() => router.push(slide.link)}
                                        className="mt-6 bg-white/30 backdrop-blur-sm text-white px-6 py-2 rounded-lg font-semibold hover:bg-white/50 transition"
                                    >
                                        {slide.buttonText}
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                            {slides.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentSlide ? 'bg-white w-6' : 'bg-white/50'}`}
                                ></button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- 주요 서비스 바로가기 섹션 --- */}
                <section className="max-w-6xl mx-auto px-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">주요 서비스</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {quickLinks.map(link => (
                            <div
                                key={link.title}
                                onClick={() => router.push(link.path)}
                                className="bg-white rounded-2xl p-6 shadow-lg cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                            >
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${link.bgColor}`}>
                                    <i className={`fas ${link.icon} text-3xl ${link.color}`}></i>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800">{link.title}</h3>
                                <p className="text-gray-500 text-sm mt-1">{link.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="max-w-6xl mx-auto px-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">실시간 캠퍼스 소식</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">커뮤니티 인기글 🔥</h3>
                            <div className="bg-white rounded-xl p-4 shadow-lg space-y-3">
                                <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                    <p className="font-semibold text-gray-800 line-clamp-1">이번 학기 꼭 들어야 할 교양수업 추천</p>
                                    <p className="text-sm text-gray-500">자유게시판 - 15분 전</p>
                                </div>
                                <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                    <p className="font-semibold text-gray-800 line-clamp-1">중고 전공서적 C언어 팝니다!</p>
                                    <p className="text-sm text-gray-500">거래게시판 - 1시간 전</p>
                                </div>
                                <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                    <p className="font-semibold text-gray-800 line-clamp-1">제1학생회관 1층에 분실물 보관중입니다</p>
                                    <p className="text-sm text-gray-500">정보공유 - 3시간 전</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">마감 임박 번개모임 ⚡️</h3>
                            <div className="bg-white rounded-xl p-4 shadow-lg space-y-3">
                                <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                    <p className="font-semibold text-gray-800 line-clamp-1">오늘 저녁 6시 정문에서 치맥하실 분</p>
                                    <p className="text-sm text-gray-500">마감까지 2시간 30분 남음</p>
                                </div>
                                <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                    <p className="font-semibold text-gray-800 line-clamp-1">중앙도서관에서 카공할 2인 구해요!</p>
                                    <p className="text-sm text-gray-500">마감까지 4시간 10분 남음</p>
                                </div>
                                <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                    <p className="font-semibold text-gray-800 line-clamp-1">천안역 방향 택시 같이 타실 분 (3/4)</p>
                                    <p className="text-sm text-gray-500">1명 남음!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}