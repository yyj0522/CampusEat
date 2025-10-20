// 파일 전체 경로: src/app/login/LoginForm.js

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
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "" });

  const showModal = (title, message) => {
    setModal({ isOpen: true, title, message });
  };

  const closeModal = () => {
    setModal({ isOpen: false, title: "", message: "" });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
      showModal("입력 오류", "이메일과 비밀번호를 모두 입력해주세요.");
      setIsLoading(false);
      return;
    }

    try {
      // --- ▼▼▼▼▼ 여기가 핵심 수정 부분입니다 ▼▼▼▼▼ ---
      // 1. login 함수가 반환하는 user 객체를 받습니다.
      const loggedInUser = await login(email, password);
      
      // 2. user 객체가 성공적으로 받아졌는지 확인합니다.
      if (loggedInUser) {
        // 3. 확인이 끝나면 홈 화면으로 이동합니다.
        router.push("/home");
      } else {
        // 혹시 모를 예외 상황 처리
        throw new Error("로그인 후 사용자 정보를 받아오지 못했습니다.");
      }
      // --- ▲▲▲▲▲ 여기가 핵심 수정 부분입니다 ▲▲▲▲▲ ---

    } catch (error) {
      setIsLoading(false);
      if (error.response && error.response.status === 401) {
        showModal("로그인 실패", error.response.data.message || "아이디 또는 비밀번호를 확인해주세요.");
      } else {
        showModal("로그인 실패", error.message || "로그인 중 오류가 발생했습니다.");
      }
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

      {modal.isOpen && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">{modal.title}</h3>
            <div className="mt-2 text-sm text-gray-600">
              <p>{modal.message}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <button
              onClick={closeModal}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}