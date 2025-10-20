// 파일 전체 경로: src/app/(main)/home/page.js

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
// 1. import 경로를 절대 경로 별칭(@/)을 사용하도록 수정합니다.
import { useAuth } from "@/app/context/AuthProvider";

export default function HomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        { bgColor: "bg-gradient-to-r from-green-400 to-blue-500", title: "🎉 신학기 특별 이벤트", subtitle: "맛집 리뷰 작성하고 배달비 쿠폰 받아가세요!", buttonText: "자세히 보기", link: "/restaurant" },
        { bgColor: "bg-gradient-to-r from-purple-500 to-pink-500", title: "📢 전체 공지사항", subtitle: "캠퍼스잇 v1.2 업데이트 안내", buttonText: "공지 확인", link: "/community?category=notice" },
        { bgColor: "bg-gradient-to-r from-yellow-400 to-orange-500", title: "🔥 지금 가장 인기있는 번개모임", subtitle: "함께 저녁 식사 할 분들을 찾고 있어요!", buttonText: "모임 참여하기", link: "/meeting" },
    ];

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, [slides.length]);

    useEffect(() => {
        const slideInterval = setInterval(nextSlide, 5000);
        return () => clearInterval(slideInterval);
    }, [nextSlide]);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            }
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return <div className="min-h-screen bg-gray-50"></div>; // 로딩 중이거나 비로그인 시 빈 화면 표시
    }

    const quickLinks = [
        { title: "맛집추천", icon: "fa-utensils", color: "text-red-500", bgColor: "bg-red-50", path: "/restaurant", description: "학우들의 진짜 리뷰" },
        { title: "번개모임", icon: "fa-bolt", color: "text-yellow-500", bgColor: "bg-yellow-50", path: "/meeting", description: "오늘의 만남" },
        { title: "학식/셔틀", icon: "fa-bus", color: "text-green-500", bgColor: "bg-green-50", path: "/information", description: "필수 정보 확인" },
        { title: "커뮤니티", icon: "fa-comments", color: "text-blue-500", bgColor: "bg-blue-50", path: "/community", description: "소통과 정보공유" },
    ];

    const communityShortcuts = [
        { title: "공지사항", icon: "fa-bullhorn", path: "/community?category=notice" },
        { title: "자유게시판", icon: "fa-comments", path: "/community?category=free" },
        { title: "정보공유", icon: "fa-share-alt", path: "/community?category=info" },
        { title: "질문게시판", icon: "fa-question-circle", path: "/community?category=question" },
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

                <section className="max-w-6xl mx-auto px-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">주요 서비스</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {quickLinks.map(link => (
                            <div key={link.title} onClick={() => router.push(link.path)} className="bg-white rounded-2xl p-6 shadow-lg cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
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
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">오늘의 캠퍼스 라이프</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div onClick={() => router.push('/restaurant')} className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                            <h3 className="text-2xl font-bold text-gray-800">점심 뭐 먹지? 🤔</h3>
                            <p className="mt-2 text-gray-500">실패 없는 점심을 위해 학우들의 솔직한 맛집 리뷰를 확인해보세요.</p>
                            <div className="mt-6 font-semibold text-indigo-600 group-hover:underline">
                                맛집 보러가기 →
                            </div>
                        </div>
                        <div onClick={() => router.push('/meeting')} className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                            <h3 className="text-2xl font-bold text-gray-800">오늘 저녁 약속 있어? ⚡</h3>
                            <p className="mt-2 text-gray-500">번개 모임으로 새로운 친구들을 만나고 즐거운 저녁 시간을 보내보세요.</p>
                            <div className="mt-6 font-semibold text-indigo-600 group-hover:underline">
                                모임 참여하기 →
                            </div>
                        </div>
                    </div>
                </section>
                
                <section className="max-w-6xl mx-auto px-6">
                    <div className="bg-white rounded-2xl p-8 shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">주요 게시판 바로가기</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {communityShortcuts.map(shortcut => (
                                <div 
                                    key={shortcut.title} 
                                    onClick={() => router.push(shortcut.path)}
                                    className="text-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-indigo-50 hover:shadow-md transition-all"
                                >
                                    <i className={`fas ${shortcut.icon} text-2xl text-indigo-500`}></i>
                                    <p className="mt-2 font-semibold text-gray-700">{shortcut.title}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
}