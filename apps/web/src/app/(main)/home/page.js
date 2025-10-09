"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function HomePage() {
    const router = useRouter();
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

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, [slides.length]);

    useEffect(() => {
        const slideInterval = setInterval(nextSlide, 5000);
        return () => clearInterval(slideInterval);
    }, [nextSlide]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
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
    
    const recommendedFeatures = [
        { title: "중고 거래", icon: "fa-exchange-alt", color: "text-purple-500", bgColor: "bg-purple-50", path: "/community/market", description: "안전하고 편리하게 거래해요" },
        { title: "스터디 그룹", icon: "fa-book-open", color: "text-indigo-500", bgColor: "bg-indigo-50", path: "/community/study", description: "함께 공부하고 성장해요" },
        { title: "분실물 센터", icon: "fa-search", color: "text-teal-500", bgColor: "bg-teal-50", path: "/community/lostfound", description: "잃어버린 물건을 찾아보세요" },
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
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">캠퍼스잇 추천 기능</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {recommendedFeatures.map(feature => (
                             <div 
                                key={feature.title} 
                                onClick={() => router.push(feature.path)}
                                className="bg-white rounded-2xl p-6 shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex items-center space-x-5"
                            >
                                <div className={`w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center ${feature.bgColor}`}>
                                    <i className={`fas ${feature.icon} text-3xl ${feature.color}`}></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">{feature.title}</h3>
                                    <p className="text-gray-500 text-sm mt-1">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}