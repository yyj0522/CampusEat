"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "../../../lib/api";

const SLIDE_INTERVAL_MS = 5500;
const slideEase = [0.22, 1, 0.36, 1];

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState([]);
  const [notices, setNotices] = useState([]);
  const [slideshowPaused, setSlideshowPaused] = useState(false);

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

  const goNextSlide = useCallback(() => {
    setCurrentSlide((prev) =>
      slides.length === 0 ? 0 : prev === slides.length - 1 ? 0 : prev + 1
    );
  }, [slides.length]);

  const goPrevSlide = useCallback(() => {
    setCurrentSlide((prev) =>
      slides.length === 0 ? 0 : prev === 0 ? slides.length - 1 : prev - 1
    );
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || slideshowPaused) return;
    const interval = setInterval(goNextSlide, SLIDE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [slides.length, slideshowPaused, goNextSlide]);

  useEffect(() => {
    const onKey = (e) => {
      if (slides.length === 0) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrevSlide();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNextSlide();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length, goNextSlide, goPrevSlide]);

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
      bar: "from-orange-400 to-amber-500",
      iconBg: "bg-orange-50",
      accent: "text-orange-600",
    },
    {
      id: "meeting",
      title: "번개 모임",
      subtitle: "맘이 통하는 친구를 찾아 보세요",
      icon: "fa-bolt",
      path: "/meeting",
      bar: "from-amber-400 to-yellow-500",
      iconBg: "bg-amber-50",
      accent: "text-amber-600",
    },
    {
      id: "community",
      title: "자유게시판",
      subtitle: "전국의 학우들과 소통해 보세요",
      icon: "fa-comments",
      path: "/community",
      bar: "from-indigo-500 to-violet-500",
      iconBg: "bg-indigo-50",
      accent: "text-indigo-600",
    },
    {
      id: "time",
      title: "시간표",
      subtitle: "나만의 시간표를 작성해 보세요",
      icon: "fa-clock",
      path: "/time",
      bar: "from-sky-400 to-blue-600",
      iconBg: "bg-sky-50",
      accent: "text-sky-600",
    },
    {
      id: "book",
      title: "교재 거래",
      subtitle: "더 이상 쓰지 않는 교재를 판매해 보세요",
      icon: "fa-book",
      path: "/book",
      bar: "from-emerald-400 to-teal-500",
      iconBg: "bg-emerald-50",
      accent: "text-emerald-600",
    },
  ];

  if (loading) return <div className="min-h-screen bg-gray-50" />;

  return (
    <div className="min-h-screen bg-gray-50/90 bg-[radial-gradient(ellipse_120%_70%_at_50%_-8%,rgba(99,102,241,0.07),transparent_52%)]">
      <main className="mx-auto max-w-7xl space-y-10 px-4 pb-24 pt-5 md:space-y-12 md:px-8 md:pt-10">
        <section
          className="relative isolate w-full overflow-hidden rounded-[1.75rem] shadow-[0_24px_56px_-18px_rgba(15,23,42,0.14)] ring-1 ring-black/[0.05] md:h-[420px] md:rounded-[2rem]"
          onMouseEnter={() => setSlideshowPaused(true)}
          onMouseLeave={() => setSlideshowPaused(false)}
          aria-roledescription="carousel"
          aria-label="추천 소식 슬라이드"
        >
          {slides.length === 0 ? (
            <div className="flex h-[280px] w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-gray-100 via-white to-gray-50 text-gray-400 md:h-full">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
              <span className="text-sm font-medium">슬라이드를 불러오는 중...</span>
            </div>
          ) : (
            <>
              <div className="relative block aspect-[4/3] w-full touch-pan-y md:hidden">
                <motion.div
                  className="flex h-full w-full"
                  animate={{ x: `-${currentSlide * 100}%` }}
                  transition={{
                    type: "tween",
                    duration: 0.55,
                    ease: slideEase,
                  }}
                >
                  {slides.map((slide, idx) => (
                    <div
                      key={slide.id ?? idx}
                      className="relative h-full min-w-full shrink-0"
                    >
                      <Image
                        src={slide.slideImage}
                        alt={slide.title}
                        fill
                        className="object-cover"
                        priority={idx === 0}
                        sizes="100vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/28 to-black/10" />
                      <div className="absolute inset-0 flex flex-col justify-end p-6 pb-14">
                        <div className="space-y-3">
                          <h2 className="text-xl font-bold leading-snug tracking-tight text-white drop-shadow-sm">
                            {slide.slideCaption}
                          </h2>
                          <p className="line-clamp-2 text-sm leading-relaxed text-white/88">
                            {slide.slideCaptionSmall || slide.title}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              handleNavigation(`/community/${slide.id}`)
                            }
                            className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-lg transition hover:bg-gray-50 active:scale-[0.98]"
                          >
                            자세히 보기
                            <i className="fas fa-arrow-right text-xs opacity-70" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
                <button
                  type="button"
                  aria-label="이전 슬라이드"
                  onClick={goPrevSlide}
                  className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:bg-black/50"
                >
                  <i className="fas fa-chevron-left text-xs" />
                </button>
                <button
                  type="button"
                  aria-label="다음 슬라이드"
                  onClick={goNextSlide}
                  className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:bg-black/50"
                >
                  <i className="fas fa-chevron-right text-xs" />
                </button>
              </div>

              <div className="relative hidden min-h-[380px] w-full md:block md:h-full">
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: slideEase }}
                    className="absolute inset-0 flex"
                    style={{
                      backgroundColor:
                        slides[currentSlide]?.slideBackgroundColor || "#EBF5FF",
                    }}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_18%_22%,rgba(255,255,255,0.55),transparent_55%),radial-gradient(ellipse_55%_45%_at_92%_78%,rgba(255,255,255,0.38),transparent_52%)]" />
                    <div className="relative z-10 flex w-full flex-col justify-center px-10 py-10 lg:w-[48%] lg:px-16 lg:py-14 xl:px-20">
                      <motion.h2
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.06, duration: 0.4, ease: slideEase }}
                        className="mb-4 break-keep text-3xl font-extrabold leading-[1.15] tracking-tight text-gray-900 lg:text-4xl xl:text-[2.65rem]"
                      >
                        {slides[currentSlide]?.slideCaption}
                      </motion.h2>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4, ease: slideEase }}
                        className="mb-8 max-w-md text-base font-medium leading-relaxed text-gray-600 lg:text-lg"
                      >
                        {slides[currentSlide]?.slideCaptionSmall ||
                          slides[currentSlide]?.title}
                      </motion.p>
                      <motion.button
                        type="button"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.14, duration: 0.35 }}
                        onClick={() =>
                          handleNavigation(
                            `/community/${slides[currentSlide]?.id}`
                          )
                        }
                        className="group inline-flex w-fit items-center gap-2 rounded-2xl bg-gray-900 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-gray-900/18 transition hover:bg-gray-800 hover:shadow-xl active:scale-[0.99]"
                      >
                        자세히 보기
                        <i className="fas fa-arrow-right text-sm transition-transform group-hover:translate-x-0.5" />
                      </motion.button>
                    </div>
                    <div className="relative z-10 flex flex-1 items-end justify-center overflow-hidden pb-4 pr-6 lg:pr-10">
                      <div className="absolute right-[8%] top-[18%] h-[min(420px,55vh)] w-[min(420px,55vh)] rounded-full bg-white/50 blur-3xl" />
                      <motion.div
                        className="relative h-full w-full max-w-[min(100%,520px)]"
                        initial={{ opacity: 0, scale: 0.94, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: slideEase }}
                      >
                        <Image
                          src={slides[currentSlide]?.slideImage}
                          alt={slides[currentSlide]?.title}
                          fill
                          className="object-contain object-bottom drop-shadow-[0_22px_44px_rgba(0,0,0,0.11)]"
                          sizes="(min-width: 768px) 50vw, 100vw"
                          priority={currentSlide === 0}
                        />
                      </motion.div>
                    </div>
                  </motion.div>
                </AnimatePresence>
                <button
                  type="button"
                  aria-label="이전 슬라이드"
                  onClick={goPrevSlide}
                  className="absolute left-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-900/10 bg-white/85 text-gray-800 shadow-lg backdrop-blur-md transition hover:bg-white hover:shadow-xl"
                >
                  <i className="fas fa-chevron-left text-sm" />
                </button>
                <button
                  type="button"
                  aria-label="다음 슬라이드"
                  onClick={goNextSlide}
                  className="absolute right-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-900/10 bg-white/85 text-gray-800 shadow-lg backdrop-blur-md transition hover:bg-white hover:shadow-xl"
                >
                  <i className="fas fa-chevron-right text-sm" />
                </button>
              </div>

              <div className="pointer-events-none absolute bottom-4 left-0 right-0 z-30 flex justify-center px-4 md:bottom-6">
                <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/22 bg-black/38 px-3 py-2 backdrop-blur-md md:border-gray-900/10 md:bg-white/88">
                  {slides.map((_, idx) => (
                    <motion.button
                      key={idx}
                      type="button"
                      aria-label={`슬라이드 ${idx + 1}로 이동`}
                      aria-current={idx === currentSlide ? "true" : undefined}
                      onClick={() => setCurrentSlide(idx)}
                      className="h-2 overflow-hidden rounded-full bg-white/32 md:bg-gray-900/14"
                      initial={false}
                      animate={{
                        width: idx === currentSlide ? 28 : 8,
                        opacity: idx === currentSlide ? 1 : 0.5,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 34,
                      }}
                    >
                      <span className="block h-full w-full rounded-full bg-white md:bg-gray-900" />
                    </motion.button>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>

        <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
          {menuItems.map((item) => (
            <motion.div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => handleNavigation(item.path)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleNavigation(item.path);
                }
              }}
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="group relative flex min-h-[132px] cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-gray-200/80 bg-white/90 p-4 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-sm md:min-h-[168px] md:rounded-3xl md:p-5"
            >
              <div
                className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${item.bar}`}
                aria-hidden
              />
              <div className="relative z-10 flex flex-col justify-between gap-4 pl-2">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.iconBg} shadow-inner transition-transform duration-300 group-hover:scale-105 md:h-12 md:w-12`}
                >
                  <i className={`fas ${item.icon} text-lg ${item.accent}`} />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight text-gray-900 md:text-lg">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs font-medium leading-snug text-gray-500 md:text-sm">
                    {item.subtitle}
                  </p>
                </div>
              </div>
              <div className="pointer-events-none absolute -right-6 -bottom-8 h-28 w-28 rounded-full bg-gradient-to-br from-gray-100 to-transparent opacity-60 transition-transform duration-500 group-hover:scale-110" />
            </motion.div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 overflow-hidden rounded-[1.75rem] border border-gray-200/80 bg-white/95 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-sm md:rounded-3xl">
            <div className="border-b border-gray-100/90 bg-gradient-to-r from-gray-50/90 to-white px-6 py-5 md:px-8 md:py-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Campus
                  </p>
                  <h2 className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 md:text-2xl">
                    최신 공지사항
                  </h2>
                </div>
              </div>
            </div>
            <div className="p-4 md:p-6">
              {notices.length === 0 ? (
                <div className="rounded-2xl bg-gray-50/90 py-14 text-center text-sm font-medium text-gray-400">
                  등록된 공지사항이 없습니다.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {notices.map((notice) => (
                    <li key={notice.id}>
                      <button
                        type="button"
                        onClick={() =>
                          handleNavigation(`/community/${notice.id}`)
                        }
                        className="group flex w-full items-center gap-4 rounded-xl px-3 py-4 text-left transition hover:bg-gray-50/95 md:px-4"
                      >
                        <span className="hidden w-14 shrink-0 text-right text-xs font-medium tabular-nums text-gray-400 sm:block">
                          {new Date(notice.createdAt).toLocaleDateString(
                            "ko-KR",
                            { month: "2-digit", day: "2-digit" }
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-indigo-700 md:text-[15px]">
                            {notice.title}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-gray-400 sm:hidden">
                            {new Date(notice.createdAt).toLocaleDateString(
                              "ko-KR",
                              { month: "2-digit", day: "2-digit" }
                            )}
                          </span>
                        </span>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200/80 bg-white text-gray-400 transition group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                          <i className="fas fa-chevron-right text-xs transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              onClick={() => handleNavigation("/restaurant")}
              className="group relative overflow-hidden rounded-[1.75rem] border border-gray-800/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-left text-white shadow-xl shadow-slate-900/25 md:rounded-3xl md:p-8"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
              <div className="relative z-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
                  맛집
                </p>
                <h3 className="mt-2 text-2xl font-bold leading-snug tracking-tight">
                  오늘 점심,
                  <br />
                  어디서 먹을까?
                </h3>
                <p className="mt-3 max-w-[220px] text-sm leading-relaxed text-white/65">
                  실패 없는 맛집 큐레이션
                </p>
                <span className="mt-6 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm transition group-hover:border-white/30 group-hover:bg-white group-hover:text-slate-900">
                  <i className="fas fa-arrow-right text-sm" />
                </span>
              </div>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              onClick={() => handleNavigation("/meeting")}
              className="group relative overflow-hidden rounded-[1.75rem] border border-gray-200/90 bg-white p-6 text-center shadow-sm ring-1 ring-black/[0.04] md:rounded-3xl md:p-7"
            >
              <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-100/80 bg-gradient-to-br from-sky-50 to-indigo-50 shadow-inner transition group-hover:scale-[1.03]">
                <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-35" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-white bg-sky-500 shadow-sm" />
                </span>
                <i className="fas fa-user-friends text-2xl text-sky-600" />
              </div>
              <h3 className="font-bold text-gray-900">
                지금 참여 가능한 모임
              </h3>
              <p className="mt-1.5 text-xs font-medium text-gray-500">
                새로운 친구들과 함께하세요
              </p>
            </motion.button>
          </div>
        </section>
      </main>
    </div>
  );
}