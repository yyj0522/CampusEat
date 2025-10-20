// 파일 전체 경로: src/app/login/ResetPwForm.js

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "@/lib/api"; // apiClient를 가져옵니다.

export default function ResetPwForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token"); // URL에서 token 파라미터를 가져옵니다.

  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage("유효하지 않은 접근입니다. 비밀번호 찾기를 다시 시도해주세요.");
    }
  }, [token]);

  const handleReset = async () => {
    if (!token) return;
    if (!newPassword) return setMessage("새 비밀번호를 입력해주세요.");

    setLoading(true);
    setMessage("");

    try {
      // NestJS 백엔드의 /auth/reset-password API를 호출합니다.
      const response = await apiClient.post('/auth/reset-password', {
        token: token,
        password: newPassword
      });

      setMessage(response.data.message); // 성공 메시지 표시
      setTimeout(() => router.push("/login"), 2000); // 2초 후 로그인 페이지로 이동

    } catch (err) {
      console.error(err);
      // 백엔드에서 보낸 에러 메시지를 사용합니다.
      setMessage(err.response?.data?.message || "비밀번호 변경 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-gray-800 text-center">비밀번호 재설정</h2>

        <input
          type="password"
          placeholder="새 비밀번호 입력"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={loading || !token}
        />

        <button
          onClick={handleReset}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium disabled:opacity-50"
          disabled={loading || !token}
        >
          {loading ? "변경 중..." : "비밀번호 변경"}
        </button>

        {message && (
          <p
            className={`text-sm text-center ${
              message.includes("실패") || message.includes("유효하지") ? "text-red-500" : "text-green-500"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}