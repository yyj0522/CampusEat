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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <div className="w-full text-center mb-8">
          <div className="flex items-center justify-center mx-auto mb-4">
            <Image 
              src="/icon.png" 
              alt="캠퍼스잇 로고" 
              width={230} 
              height={50} 
              priority 
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
          <p className="text-gray-500 text-lg">대학생을 위한 종합 플랫폼</p>
        </div>

        {mode === "login" && <LoginForm setMode={setMode} />}
        {mode === "signup" && <SignUpForm setMode={setMode} />}
        {mode === "findID" && <IdFind />}
        {mode === "findPW" && <PwFind />}

        {mode !== "login" && (
          <div className="mt-6 text-center">
            <button 
              type="button" 
              onClick={() => setMode("login")} 
              className="text-sm text-gray-500 hover:text-purple-600 hover:underline transition-colors"
            >
              로그인 화면으로 돌아가기
            </button>
          </div>
        )}
      </div>
      
      <footer className="mt-8 text-gray-400 text-xs text-center">
        &copy; {new Date().getFullYear()} CampusEat. All rights reserved.
      </footer>
    </div>
  );
}