// 파일 전체 경로: src/app/login/IdFind.js

"use client";

import { useState } from "react";
import apiClient from "@/lib/api"; // apiClient를 가져옵니다.

export default function IdFind() {
  const [univEmail, setUnivEmail] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFindId = async (e) => {
    e.preventDefault();

    if (!univEmail) {
      setError("대학 이메일을 입력해주세요.");
      setResult("");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");

    try {
      // NestJS 백엔드의 /auth/find-id API를 호출합니다.
      const response = await apiClient.post('/auth/find-id', { universityEmail: univEmail });

      const { email } = response.data;
      setResult(`가입된 아이디는 ${email} 입니다.`);

    } catch (err) {
      console.error(err);
      // 백엔드에서 보낸 에러 메시지를 사용합니다.
      if (err.response && err.response.status === 404) {
        setError(err.response.data.message);
      } else {
        setError("ID 조회 중 오류가 발생했습니다.");
      }
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleFindId} className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800">아이디 찾기</h2>
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
        {loading ? "조회중..." : "ID 찾기"}
      </button>

      {result && <p className="mt-4 text-sm text-blue-600 text-center">{result}</p>}
      {error && <p className="mt-4 text-sm text-red-500 text-center">{error}</p>}
    </form>
  );
}