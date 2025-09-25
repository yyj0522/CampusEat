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
    const pathname = usePathname(); // 현재 경로를 알기 위해 사용
    const { handleOpenMailbox, unreadCount } = useUserInteraction();

    const [nickname, setNickname] = useState("");

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

    return (
        <header className="bg-white shadow-md sticky top-0 z-10">
            <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
                <div className="flex items-center cursor-pointer" onClick={() => router.push("/home")}>
                    <Image src="/icon.png" alt="캠퍼스잇 로고" width={40} height={40} />
                    <span className="ml-2 text-xl font-bold text-gray-800">캠퍼스잇</span>
                </div>

                <nav className="hidden md:flex space-x-6">
                    {tabs.map((tab) => (
                        <button 
                            key={tab.path} 
                            onClick={() => router.push(tab.path)}
                            className={`font-medium transition ${pathname === tab.path ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-700 hover:text-blue-600"}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center space-x-4">
                    {nickname && <span className="text-gray-700">{nickname}님</span>}
                    
                    <button onClick={handleOpenMailbox} className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <i className="fas fa-envelope text-xl text-gray-600"></i>
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => router.push("/profile")}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                    >
                        프로필
                    </button>
                </div>
            </div>
        </header>
    );
}