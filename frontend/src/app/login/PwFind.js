"use client";

import { useState } from "react";
import apiClient from "@/lib/api"; 

export default function PwFind() {
  const [univEmail, setUnivEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!univEmail) {
      setStatus("대학 이메일을 입력해주세요.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const response = await apiClient.post('/auth/request-password-reset', { universityEmail: univEmail });
      
      setStatus(response.data.message);

    } catch (err) {
      console.error(err);
      setStatus(err.response?.data?.message || "이메일 전송 중 오류가 발생했습니다.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleReset} className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800">비밀번호 찾기</h2>
        <p className="text-gray-600 text-sm mt-2">인증한 대학 이메일을 입력해주세요.</p>
      </div>

      <div>
        <label htmlFor="univEmail" className="sr-only">대학 이메일</label>
        <input
          type="email"
          id="univEmail"
          name="univEmail"
          placeholder="대학 이메일 입력"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={univEmail}
          onChange={(e) => setUnivEmail(e.target.value)}
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
        disabled={loading}
      >
        {loading ? "전송중..." : "비밀번호 재설정 이메일 보내기"}
      </button>

      {status && (
        <p
          className={`mt-4 text-sm text-center ${
            status.includes("전송") || status.includes("successfully") ? "text-blue-600" : "text-red-500"
          }`}
        >
          {status}
        </p>
      )}
    </form>
  );
}