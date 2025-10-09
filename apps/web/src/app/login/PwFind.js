"use client";

import { useState } from "react";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";

export default function PwFind({ setMode }) {
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
      const q = query(collection(db, "users"), where("universityEmail", "==", univEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setStatus("등록된 계정이 없습니다.");
      } else {
        const userData = querySnapshot.docs[0].data();
        const email = userData.email;

        await sendPasswordResetEmail(auth, email);
        setStatus(`비밀번호 재설정 이메일을 ${email}로 전송했습니다.`);
      }
    } catch (err) {
      console.error(err);
      setStatus("이메일 전송 실패: " + err.message);
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
            status.includes("전송") ? "text-blue-600" : "text-red-500"
          }`}
        >
          {status}
        </p>
      )}
    </form>
  );
}