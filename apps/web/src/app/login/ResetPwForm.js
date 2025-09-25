"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "../../firebase";
import { confirmPasswordReset } from "firebase/auth";

export default function ResetPwForm() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleReset = async () => {
    if (!newPassword) return setMessage("새 비밀번호를 입력해주세요.");

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setMessage("비밀번호가 변경되었습니다. 로그인 페이지로 이동합니다.");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      console.error(err);
      setMessage("비밀번호 변경 실패: " + err.message);
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
        />

        <button
          onClick={handleReset}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
        >
          비밀번호 변경
        </button>

        {message && (
          <p
            className={`text-sm text-center ${
              message.includes("실패") ? "text-red-500" : "text-green-500"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
