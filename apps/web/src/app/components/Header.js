"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useUserInteraction } from "../context/UserInteractionProvider";

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const { handleOpenMailbox, unreadCount } = useUserInteraction();

    const [nickname, setNickname] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false); // 모바일 메뉴 상태

    const tabs = [
        { label: "맛집추천", path: "/restaurant" },
        { label: "번개모임", path: "/meeting" },
        { label: "학식/셔틀정보", path: "/information" },
        { label: "자유게시판", path: "/community" },
    ];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const snap = await getDoc(doc(db, "users", currentUser.uid));
                if (snap.exists()) {
                    setNickname(snap.data().nickname);
                }
            } else {
                setNickname("");
            }
        });
        return () => unsubscribe();
    }, []);
    
    // 화면 크기가 변경될 때 모바일 메뉴를 닫기 위한 로직
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) { // Tailwind의 md 브레이크포인트
                setIsMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 페이지 이동 시 모바일 메뉴 닫기
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);


    return (
        // [수정] relative 클래스 추가하여 모바일 메뉴의 기준점으로 설정
        <header className="bg-white shadow-md sticky top-0 z-40 relative">
            <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
                {/* 로고 */}
                <div className="flex items-center cursor-pointer" onClick={() => router.push("/home")}>
                    <Image src="/icon.png" alt="캠퍼스잇 로고" width={40} height={40} />
                    <span className="ml-2 text-xl font-bold text-gray-800">캠퍼스잇</span>
                </div>

                {/* PC 웹용 네비게이션 탭 */}
                <nav className="hidden md:flex space-x-6">
                    {tabs.map((tab) => (
                        <button 
                            key={tab.path} 
                            onClick={() => router.push(tab.path)}
                            className={`font-medium transition pb-1 ${pathname.startsWith(tab.path) ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-700 hover:text-blue-600"}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* 우측 아이콘 및 버튼 그룹 */}
                <div className="flex items-center space-x-2 sm:space-x-4">
                    {/* 메일함 (모든 화면에서 보임) */}
                    <button onClick={handleOpenMailbox} className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <i className="fas fa-envelope text-xl text-gray-600"></i>
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white">
                                {unreadCount > 10 ? '10+' : unreadCount}
                            </span>
                        )}
                    </button>
                    
                    {/* PC 웹용 닉네임 및 프로필 버튼 */}
                    <div className="hidden md:flex items-center space-x-4">
                        {nickname && <span className="text-gray-700 font-semibold">{nickname}님</span>}
                        <button
                            onClick={() => router.push("/profile")}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                        >
                            프로필
                        </button>
                    </div>

                    {/* 모바일용 메뉴 버튼 (햄버거) */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="메뉴 열기"
                    >
                        <i className="fas fa-bars text-xl text-gray-600"></i>
                    </button>
                </div>
            </div>

            {/* 모바일 메뉴 (펼쳐지는 부분) */}
            {isMenuOpen && (
                <div className="absolute top-full left-0 w-full bg-white shadow-lg md:hidden animate-fadeInDown">
                    <nav className="flex flex-col p-4 space-y-1">
                        {tabs.map((tab) => (
                            <button 
                                key={tab.path} 
                                onClick={() => router.push(tab.path)}
                                className={`p-3 text-left rounded-md font-semibold transition ${pathname.startsWith(tab.path) ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-100"}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                        {/* 프로필 링크 추가 */}
                        <button 
                            onClick={() => router.push("/profile")}
                            className={`p-3 text-left rounded-md font-semibold transition border-t mt-2 pt-3 ${pathname === "/profile" ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-100"}`}
                        >
                            프로필
                        </button>
                    </nav>
                </div>
            )}
        </header>
    );
}