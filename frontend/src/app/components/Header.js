"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../context/AuthProvider";
import { useUserInteraction } from "../context/UserInteractionProvider";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { handleOpenMailbox, unreadCount } = useUserInteraction();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const tabs = [
    { label: "맛집추천", path: "/restaurant" },
    { label: "번개모임", path: "/meeting" },
    { label: "자유게시판", path: "/community" },
    { label: "시간표", path: "/time" },
    { label: "교재거래", path: "/book" },
  ];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const handleProtectedNavigation = (path) => {
    if (!user) {
      router.push("/login");
    } else {
      router.push(path);
    }
  };

  const handleProtectedMailbox = () => {
    if (!user) {
      router.push("/login");
    } else {
      handleOpenMailbox();
    }
  };

  return (
    <header className="bg-white sticky top-0 z-40 relative">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-4 sm:py-5">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => router.push("/home")}
        >
          <Image
            src="/icon.png"
            alt="캠퍼스잇 로고"
            width={147}
            height={32}
          />
        </div>

        <nav className="hidden md:flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.path}
              onClick={() => handleProtectedNavigation(tab.path)}
              className={`font-medium transition pb-1 ${
                pathname.startsWith(tab.path)
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={handleProtectedMailbox}
            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <i className="fas fa-envelope text-xl text-gray-600"></i>
            {user && unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <>
                <button
                  onClick={() => router.push("/profile")}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="프로필 설정"
                >
                  <i className="fas fa-cog text-xl text-gray-600"></i>
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="메뉴 열기"
          >
            <i className="fas fa-bars text-xl text-gray-600"></i>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-lg md:hidden animate-fadeInDown">
          <nav className="flex flex-col p-4 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.path}
                onClick={() => handleProtectedNavigation(tab.path)}
                className={`p-3 text-left rounded-md font-semibold transition ${
                  pathname.startsWith(tab.path)
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
            {user && (
              <>
                <button
                  onClick={() => router.push("/profile")}
                  className={`p-3 text-left rounded-md font-semibold transition border-t mt-2 pt-3 ${
                    pathname === "/profile"
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  프로필
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}