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
    const [isMenuOpen, setIsMenuOpen] = useState(false); 

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
    
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) { 
                setIsMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);


    return (
        <header className="bg-white shadow-md sticky top-0 z-40 relative">
            <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-2">
                <div className="flex items-center cursor-pointer" onClick={() => router.push("/home")}>
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
                            onClick={() => router.push(tab.path)}
                            className={`font-medium transition pb-1 ${pathname.startsWith(tab.path) ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-700 hover:text-blue-600"}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center space-x-2 sm:space-x-4">
                    <button onClick={handleOpenMailbox} className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <i className="fas fa-envelope text-xl text-gray-600"></i>
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white">
                                {unreadCount > 10 ? '10+' : unreadCount}
                            </span>
                        )}
                    </button>
                    
                    <div className="hidden md:flex items-center space-x-4">
                        {nickname && <span className="text-gray-700 font-semibold">{nickname}님</span>}
                        <button
                            onClick={() => router.push("/profile")}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                        >
                            프로필
                        </button>
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
                                onClick={() => router.push(tab.path)}
                                className={`p-3 text-left rounded-md font-semibold transition ${pathname.startsWith(tab.path) ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-100"}`}
                            >
                                {tab.label}
                            </button>
                        ))}
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