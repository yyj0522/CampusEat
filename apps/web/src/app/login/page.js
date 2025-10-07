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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mx-auto mb-4">
            <Image
              src="/icon.png"
              alt="캠퍼스잇 아이콘"
              width={64}
              height={64}
            />
          </div>

          <h1 className="text-3xl font-bold text-gray-800">캠퍼스잇</h1>
          <p className="text-gray-600 mt-2">대학생을 위한 종합 플랫폼</p>
        </div>

        {mode === "login" && <LoginForm />}
        {mode === "signup" && <SignUpForm />}
        {mode === "findID" && <IdFind setMode={setMode} />}
        {mode === "findPW" && <PwFind setMode={setMode} />}

        {mode === "login" && (
          <div className="mt-6 text-center">
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                className="text-blue-600 hover:underline font-medium"
                onClick={() => setMode("signup")}
              >
                회원가입
              </button>
              <button
                type="button"
                className="text-blue-600 hover:underline font-medium"
                onClick={() => setMode("findID")}
              >
                ID찾기
              </button>
              <button
                type="button"
                className="text-blue-600 hover:underline font-medium"
                onClick={() => setMode("findPW")}
              >
                PW찾기
              </button>
            </div>
          </div>
        )}

        {mode === "signup" && (
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              이미 계정이 있으신가요?
              <button
                type="button"
                className="text-purple-600 hover:underline font-medium ml-1"
                onClick={() => setMode("login")}
              >
                로그인
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
