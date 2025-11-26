"use client";

import Image from "next/image";
import { useState } from "react";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import IdFind from "./IdFind";
import PwFind from "./PwFind";

export default function LoginPage() {
  const [mode, setMode] = useState("login");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 font-sans">
      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
            animation: fadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>

      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl animate-fadeIn relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="w-full text-center mb-10 mt-2">
          <div className="flex items-center justify-center mx-auto mb-4 relative">
            <Image 
              src="/icon.png" 
              alt="캠퍼스잇 로고" 
              width={200} 
              height={50} 
              priority 
              style={{ width: 'auto', height: 'auto' }}
              className="object-contain"
            />
          </div>
          <p className="text-gray-400 text-sm font-medium tracking-wide">
            대학생을 위한 올인원 라이프 스타일 플랫폼
          </p>
        </div>

        <div className="transition-all duration-300">
          {mode === "login" && <LoginForm setMode={setMode} />}
          {mode === "signup" && <SignUpForm setMode={setMode} />}
          {mode === "findID" && <IdFind />}
          {mode === "findPW" && <PwFind />}
        </div>

        {mode !== "login" && (
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <button 
              type="button" 
              onClick={() => setMode("login")} 
              className="text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors flex items-center justify-center gap-2 mx-auto group"
            >
              <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
              로그인 화면으로 돌아가기
            </button>
          </div>
        )}
      </div>
      
      <footer className="mt-8 text-gray-400 text-xs text-center font-medium">
        <p>&copy; {new Date().getFullYear()} CampusEat Corp. All rights reserved.</p>
      </footer>
    </div>
  );
}