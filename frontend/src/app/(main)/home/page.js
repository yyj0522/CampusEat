"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
  const [noticePage, setNoticePage] = useState(1);
  const itemsPerNoticePage = 5;

  const sectionRefs = useRef([]);

  const serviceBanners = useMemo(() => ([
    { id: 1, title: "맛집추천", path: "/restaurant", image: "/banner1.png" },
    { id: 2, title: "번개모임", path: "/meeting", image: "/banner2.png" },
    { id: 3, title: "자유게시판", path: "/community", image: "/banner3.png" },
    { id: 4, title: "시간표", path: "/time", image: "/banner4.png" },
    { id: 5, title: "교재거래", path: "/book", image: "/banner5.png" },
  ]), []);

  const serviceCount = serviceBanners.length;
  const [focusedIndex, setFocusedIndex] = useState(2);

  const handleNextFeature = useCallback(() => {
    setFocusedIndex((prev) => (prev + 1) % serviceCount);
  }, [serviceCount]);

  const handlePrevFeature = useCallback(() => {
    setFocusedIndex((prev) => (prev - 1 + serviceCount) % serviceCount);
  }, [serviceCount]);

  useEffect(() => {
    const fetchSlideshow = async () => {
      try {
        const response = await apiClient.get("/posts/slideshow");
        setSlides(response.data);
      } catch (error) {
        console.error(error);
      }
    };
    const fetchNotices = async () => {
      try {
        const response = await apiClient.get("/posts");
        const noticeData = response.data
          .filter(post => post.category === 'notice')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNotices(noticeData);
      } catch (error) {
        console.error(error);
      }
    };
    fetchSlideshow();
    fetchNotices();
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) =>
      slides.length === 0 ? 0 : prev === slides.length - 1 ? 0 : prev + 1
    );
  }, [slides.length]);

  useEffect(() => {
    if (slides.length > 1) {
      const slideInterval = setInterval(nextSlide, 5000);
      return () => clearInterval(slideInterval);
    }
  }, [nextSlide, slides.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in-up-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      sectionRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [slides, notices]);

  const handleProtectedNavigation = (path) => {
    if (!user) {
      router.push("/login");
    } else {
      router.push(path);
    }
  };

  const totalNoticePages = Math.ceil(notices.length / itemsPerNoticePage);
  const currentNotices = notices.slice(
    (noticePage - 1) * itemsPerNoticePage,
    noticePage * itemsPerNoticePage
  );

  const handleNoticeClick = (id) => {
    router.push(`/community/${id}`);
  };

  if (loading) {
    return <div className="min-h-screen bg-white"></div>;
  }

  const communityShortcuts = [
    { title: "자유게시판", icon: "fa-comments", path: "/community?category=free" },
    { title: "정보공유", icon: "fa-share-alt", path: "/community?category=info" },
    { title: "질문게시판", icon: "fa-question-circle", path: "/community?category=question" },
    { title: "거래게시판", icon: "fa-handshake", path: "/community?category=trade" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <main className="space-y-12 md:space-y-16 pb-12">
        <section className="w-full mt-6 px-4 md:px-8 lg:px-12">
          <div
            className="relative w-full max-w-6xl mx-auto overflow-hidden rounded-[2rem] shadow-sm aspect-[5/4] sm:aspect-[16/9] lg:aspect-[21/8]"
          >
            {slides.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                <span>등록된 슬라이드가 없습니다.</span>
              </div>
            ) : (
              <div
                className="flex w-full h-full transition-transform duration-700 ease-in-out"
                style={{ 
                  width: `${slides.length * 100}%`,
                  transform: `translateX(-${(100 / slides.length) * currentSlide}%)`,
                }}
              >
                {slides.map((slide, index) => (
                  <div
                    key={slide.id || index}
                    className="flex-shrink-0 w-full h-full flex relative"
                    style={{ width: `${100 / slides.length}%`, backgroundColor: slide.slideBackgroundColor || '#EBF5FF' }}
                  >
                    <div className="
                        absolute top-12 left-8 sm:top-24 sm:left-12 w-2/3 z-10 flex flex-col justify-start items-start
                        lg:static lg:w-3/5 lg:h-full lg:justify-center lg:pl-20 lg:pr-4
                    ">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-2 lg:mb-3 break-keep drop-shadow-sm lg:drop-shadow-none">
                            {slide.slideCaption || "새로운 소식"}
                        </h2>
                        <p className="text-gray-700 lg:text-gray-600 text-sm md:text-base lg:text-lg font-medium">
                            {slide.slideCaptionSmall || slide.title}
                        </p>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleProtectedNavigation(`/community/${slide.id}`);
                            }}
                            className="mt-4 lg:mt-6 px-4 py-2 lg:px-6 lg:py-3 bg-black text-white text-xs sm:text-sm md:text-base font-bold rounded-xl w-fit shadow-md hover:bg-gray-800 transition-colors"
                        >
                            자세히보기
                        </button>
                    </div>

                    <div className="
                        absolute bottom-0 right-0 w-2/3 h-2/3 
                        lg:top-0 lg:w-2/5 lg:h-full lg:flex lg:items-center lg:justify-center
                    ">
                        <img
                            src={slide.slideImage}
                            alt={slide.title}
                            className="w-full h-full object-contain object-bottom lg:object-cover lg:object-center" 
                        />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {slides.length > 1 && (
              <div className="absolute bottom-4 lg:bottom-6 left-6 lg:left-20 flex items-center space-x-2 z-20">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentSlide ? "bg-black w-6 lg:w-8" : "bg-gray-400/50 w-3 lg:w-4"
                    }`}
                  ></button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section
          ref={(el) => (sectionRefs.current[0] = el)}
          className="max-w-6xl mx-auto px-6 fade-in-up mt-12"
        >
          <h2 className="text-3xl font-extrabold text-gray-800 text-center mb-10">
            캠퍼스잇의 주요 기능
          </h2>

          <div className="relative w-full h-[400px] flex justify-center items-center">
            <div className="absolute w-full h-full flex justify-center items-center perspective-1000">
              {serviceBanners.map((service, index) => {
                let offset = (index - focusedIndex + serviceCount) % serviceCount;
                if (offset > serviceCount / 2) offset -= serviceCount;
                
                const isActive = offset === 0;
                const absOffset = Math.abs(offset);
                
                return (
                  <div
                    key={service.id}
                    onClick={() => {
                        if (isActive) handleProtectedNavigation(service.path);
                        else setFocusedIndex(index);
                    }}
                    className={`absolute transition-all duration-500 ease-out cursor-pointer rounded-2xl shadow-2xl overflow-hidden bg-white ${isActive ? 'ring-4 ring-purple-500 ring-offset-2' : ''}`}
                    style={{
                        width: '260px',
                        height: '360px',
                        zIndex: 20 - absOffset,
                        opacity: isActive ? 1 : Math.max(0.2, 0.7 - absOffset * 0.2),
                        transform: `translateX(${offset * 70}%) scale(${1 - absOffset * 0.2})`,
                        left: '50%',
                        marginLeft: '-130px', 
                        filter: isActive ? 'brightness(100%)' : 'brightness(70%) blur(1px)'
                    }}
                  >
                    <Image
                        src={service.image}
                        alt={service.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                        priority={isActive}
                    />
                    {isActive && (
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4">
                            <h3 className="text-white text-xl font-bold text-center">{service.title}</h3>
                        </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handlePrevFeature}
              className="absolute left-0 md:left-10 z-30 p-4 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all transform hover:scale-110"
            >
              <i className="fas fa-chevron-left text-gray-800 text-xl"></i>
            </button>

            <button
              onClick={handleNextFeature}
              className="absolute right-0 md:right-10 z-30 p-4 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all transform hover:scale-110"
            >
              <i className="fas fa-chevron-right text-gray-800 text-xl"></i>
            </button>
          </div>
        </section>

        <section
          ref={(el) => (sectionRefs.current[1] = el)}
          className="max-w-6xl mx-auto px-6 fade-in-up"
        >
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">주요 게시판 바로가기</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {communityShortcuts.map((shortcut) => (
                <div
                  key={shortcut.title}
                  onClick={() => handleProtectedNavigation(shortcut.path)}
                  className="text-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-indigo-50 hover:shadow-md transition-all"
                >
                  <i className={`fas ${shortcut.icon} text-2xl text-indigo-500`}></i>
                  <p className="mt-2 font-semibold text-gray-700">{shortcut.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          ref={(el) => (sectionRefs.current[3] = el)}
          className="max-w-6xl mx-auto px-6 fade-in-up"
        >
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                <i className="fas fa-bullhorn text-purple-500 mr-2"></i>공지사항
              </h2>
            </div>

            <div className="overflow-hidden">
              <div className="min-w-full">
                <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-4 p-3 text-xs font-semibold text-gray-500 text-center">
                    <div className="col-span-2 md:col-span-1">번호</div>
                    <div className="col-span-7 md:col-span-9 text-left pl-2">제목</div>
                    <div className="col-span-3 md:col-span-2">작성일</div>
                </div>
                <div className="divide-y divide-gray-100">
                  {currentNotices.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 text-sm">등록된 공지사항이 없습니다.</div>
                  ) : (
                    currentNotices.map((notice, index) => (
                      <div 
                        key={notice.id}
                        onClick={() => handleNoticeClick(notice.id)}
                        className="grid grid-cols-12 gap-4 p-3 hover:bg-purple-50 cursor-pointer transition-colors items-center text-sm text-gray-700"
                      >
                        <div className="col-span-2 md:col-span-1 text-center font-medium text-gray-500">
                            {notices.length - ((noticePage - 1) * itemsPerNoticePage) - index}
                        </div>
                        <div className="col-span-7 md:col-span-9 text-left pl-2 font-medium truncate">
                            {notice.title}
                        </div>
                        <div className="col-span-3 md:col-span-2 text-center text-xs text-gray-500">
                            {new Date(notice.createdAt).toLocaleDateString("ko-KR")}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {totalNoticePages > 1 && (
              <div className="flex justify-center items-center mt-6 space-x-1 md:space-x-2">
                <button 
                  onClick={() => setNoticePage(1)} 
                  disabled={noticePage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30"
                >
                  <i className="fas fa-angle-double-left"></i>
                </button>
                <button 
                  onClick={() => setNoticePage(prev => Math.max(1, prev - 1))} 
                  disabled={noticePage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30"
                >
                  <i className="fas fa-angle-left"></i>
                </button>

                <div className="flex space-x-1 mx-2">
                    {Array.from({ length: totalNoticePages }, (_, i) => i + 1).map(num => (
                        <button
                            key={num}
                            onClick={() => setNoticePage(num)}
                            className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                                noticePage === num 
                                ? "bg-purple-600 text-white" 
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                        >
                            {num}
                        </button>
                    ))}
                </div>

                <button 
                  onClick={() => setNoticePage(prev => Math.min(totalNoticePages, prev + 1))} 
                  disabled={noticePage === totalNoticePages}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30"
                >
                  <i className="fas fa-angle-right"></i>
                </button>
                <button 
                  onClick={() => setNoticePage(totalNoticePages)} 
                  disabled={noticePage === totalNoticePages}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30"
                >
                  <i className="fas fa-angle-double-right"></i>
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}