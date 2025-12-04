"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "../../../lib/api";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState([]);
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const slideRes = await apiClient.get("/posts/slideshow");
        setSlides(slideRes.data);

        const noticeRes = await apiClient.get("/posts");
        const noticeData = noticeRes.data
          .filter((post) => post.category === "notice")
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5); 
        setNotices(noticeData);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (slides.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [slides.length]);

  const handleNavigation = (path) => {
    if (!user && path !== "/login") {
      router.push("/login");
    } else {
      router.push(path);
    }
  };

  const menuItems = [
    {
      id: "restaurant",
      title: "오늘 뭐 먹지?",
      subtitle: "최고의 선택을 도와드려요",
      icon: "fa-utensils",
      path: "/restaurant",
      bg: "bg-orange-50 hover:bg-orange-100",
      accent: "text-orange-500",
      iconBg: "bg-orange-100",
    },
    {
      id: "meeting",
      title: "번개 모임",
      subtitle: "맘이 통하는 친구를 찾아 보세요",
      icon: "fa-bolt",
      path: "/meeting",
      bg: "bg-yellow-50 hover:bg-yellow-100",
      accent: "text-yellow-500",
      iconBg: "bg-yellow-100",
    },
    {
      id: "community",
      title: "자유게시판",
      subtitle: "전국의 학우들과 소통해 보세요",
      icon: "fa-comments",
      path: "/community",
      bg: "bg-indigo-50 hover:bg-indigo-100",
      accent: "text-indigo-600",
      iconBg: "bg-indigo-100",
    },
    {
      id: "time",
      title: "시간표",
      subtitle: "나만의 시간표를 작성해 보세요",
      icon: "fa-clock",
      path: "/time",
      bg: "bg-blue-50 hover:bg-blue-100",
      accent: "text-blue-500",
      iconBg: "bg-blue-100",
    },
    {
      id: "book",
      title: "교재 거래",
      subtitle: "더 이상 쓰지 않는 교재를 판매해 보세요",
      icon: "fa-book",
      path: "/book",
      bg: "bg-emerald-50 hover:bg-emerald-100",
      accent: "text-emerald-600",
      iconBg: "bg-emerald-100",
    },
  ];

  if (loading) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <main className="pb-24 pt-4 md:pt-8 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
        
        <section className="relative w-full rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-200/50 group md:h-[400px]">
          {slides.length === 0 ? (
            <div className="w-full h-[300px] md:h-full bg-white flex items-center justify-center text-gray-400">
              슬라이드를 불러오는 중...
            </div>
          ) : (
            <>
              <div className="block md:hidden aspect-[4/3] w-full relative">
                 <div
                    className="flex w-full h-full transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1)"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                 >
                    {slides.map((slide, idx) => (
                      <div key={idx} className="min-w-full h-full relative">
                        <Image
                          src={slide.slideImage}
                          alt={slide.title}
                          fill
                          className="object-cover"
                          priority={idx === 0}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                           <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full mb-3 border border-white/10">
                                  HOT ISSUE
                              </span>
                              <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
                                 {slide.slideCaption}
                              </h2>
                              <p className="text-white/80 text-sm mb-6 line-clamp-1">
                                 {slide.slideCaptionSmall || slide.title}
                              </p>
                              <button
                                onClick={() => handleNavigation(`/community/${slide.id}`)}
                                className="px-6 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
                              >
                                자세히 보기
                              </button>
                           </div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="hidden md:block w-full h-full bg-white relative">
                 {slides.map((slide, idx) => {
                    return (
                        <div 
                            key={idx}
                            className={`absolute inset-0 flex transition-opacity duration-1000 ${currentSlide === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                            style={{ backgroundColor: slide.slideBackgroundColor || '#EBF5FF' }}
                        >
                            <div className="w-1/2 h-full flex flex-col justify-center items-start p-12 lg:p-20 z-10">
                                <span className={`inline-block px-4 py-1.5 bg-black text-white text-xs font-bold rounded-full mb-6 shadow-sm`}>
                                    HOT ISSUE
                                </span>
                                <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 leading-tight break-keep tracking-tight">
                                    {slide.slideCaption}
                                </h2>
                                <p className="text-gray-600 text-lg mb-8 font-medium">
                                    {slide.slideCaptionSmall || slide.title}
                                </p>
                                <button
                                    onClick={() => handleNavigation(`/community/${slide.id}`)}
                                    className={`px-8 py-3.5 bg-black hover:bg-gray-800 text-white text-base font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5`}
                                >
                                    자세히 보기
                                </button>
                            </div>
                            
                            <div className="w-1/2 h-full relative flex items-end justify-center overflow-hidden">
                                <div className={`absolute w-[400px] h-[400px] rounded-full bg-white blur-3xl opacity-40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}></div>
                                <div className="relative w-full h-full z-10">
                                    <Image
                                        src={slide.slideImage}
                                        alt={slide.title}
                                        fill
                                        className="object-contain object-bottom" 
                                        priority={idx === 0}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                 })}
              </div>
              
              <div className="absolute bottom-6 right-6 md:bottom-10 md:left-20 md:right-auto flex gap-3 z-20">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-500 ${
                      currentSlide === idx 
                        ? `w-8 bg-black` 
                        : "w-2 bg-gray-400/50 hover:bg-gray-500/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`
                relative group overflow-hidden rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1
                ${item.bg} 
                border border-white/50
                flex flex-col justify-between min-h-[140px] md:min-h-[180px]
              `}
            >
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className={`w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300 ${item.accent}`}>
                  <i className={`fas ${item.icon} text-xl`}></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-700">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 font-medium group-hover:text-gray-600">{item.subtitle}</p>
                </div>
              </div>
              
              <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${item.accent.replace("text", "bg")}`}></div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-6 bg-purple-600 rounded-full"></span>
                <h2 className="text-xl font-bold text-gray-900">최신 공지사항</h2>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              {notices.length === 0 ? (
                <div className="py-10 text-center text-gray-400 bg-gray-50 rounded-2xl">
                  등록된 공지사항이 없습니다.
                </div>
              ) : (
                notices.map((notice) => (
                  <div
                    key={notice.id}
                    onClick={() => handleNavigation(`/community/${notice.id}`)}
                    className="group flex items-center justify-between p-4 rounded-2xl hover:bg-purple-50 transition-colors cursor-pointer border border-transparent hover:border-purple-100"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 flex-1 min-w-0">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 text-[10px] font-bold w-fit">
                        NOTICE
                      </span>
                      <h3 className="text-sm md:text-base font-semibold text-gray-800 truncate group-hover:text-purple-700 transition-colors">
                        {notice.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 pl-4">
                      <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                        {new Date(notice.createdAt).toLocaleDateString("ko-KR", {month: "2-digit", day: "2-digit"})}
                      </span>
                      <i className="fas fa-chevron-right text-gray-300 text-xs group-hover:text-purple-500 group-hover:translate-x-1 transition-transform"></i>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden group cursor-pointer" onClick={() => handleNavigation("/restaurant")}>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4 text-yellow-400">
                  <i className="fas fa-star text-sm"></i>
                  <span className="text-xs font-bold tracking-wider">학우들의 PICK!</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">오늘 점심,<br/>어디서 먹을까?</h3>
                <p className="text-gray-400 text-sm mb-6">실패 없는 맛집 큐레이션</p>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:bg-white group-hover:text-black transition-all">
                  <i className="fas fa-arrow-right"></i>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl translate-y-1/2 translate-x-1/4"></div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center group cursor-pointer" onClick={() => handleNavigation("/meeting")}>
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative">
                <i className="fas fa-user-friends text-blue-500 text-2xl"></i>
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-bounce"></span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">지금 참여 가능한 모임</h3>
              <p className="text-xs text-gray-500">새로운 친구들과 함께하세요</p>
            </div>
          </div>
        </section>
      </main>

      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}