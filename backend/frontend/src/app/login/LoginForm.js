"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthProvider";

export default function LoginForm({ setMode }) {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("이메일과 비밀번호를 모두 입력해주세요.");
      setIsLoading(false);
      return;
    }

    try {
      const loggedInUser = await login(email, password);
      
      if (loggedInUser) {
        router.push("/home");
      } else {
        throw new Error("로그인 후 사용자 정보를 받아오지 못했습니다.");
      }

    } catch (error) {
      setIsLoading(false);
      let msg = "로그인 중 오류가 발생했습니다.";
      
      if (error.response && error.response.status === 401) {
        msg = error.response.data?.message || "아이디 또는 비밀번호를 확인해주세요.";
      }
      
      setErrorMessage(msg);
    }
  };

  return (
    <>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <input
            type="password"
            id="password"
            name="password"
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errorMessage && (
            <p className="mt-2 text-sm text-red-500 text-left font-medium animate-fadeIn">
              {errorMessage}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition duration-200 font-medium disabled:opacity-50 shadow-lg hover:shadow-purple-300"
        >
          {isLoading ? "로그인 확인 중..." : "캠퍼스잇 로그인"}
        </button>
      </form>

      <div className="mt-4 flex justify-center space-x-6">
        <button
          type="button"
          className="text-gray-500 hover:text-purple-600 font-medium text-sm transition-colors"
          onClick={() => setMode("findID")}
        >
          ID찾기
        </button>
        <button
          type="button"
          className="text-gray-500 hover:text-purple-600 font-medium text-sm transition-colors"
          onClick={() => setMode("findPW")}
        >
          PW찾기
        </button>
      </div>

      <div className="mt-6 text-center">
        <button
          type="button"
          className="text-purple-600 hover:underline font-medium text-base transition-colors"
          onClick={() => setMode("signup")}
        >
          회원가입하러 가기
        </button>
      </div>
    </>
  );
}