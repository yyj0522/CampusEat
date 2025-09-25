"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";

export default function SignUpStep3({ formData, setMode }) {
  const router = useRouter();
  const [codeInput, setCodeInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(180);
  const [canResend, setCanResend] = useState(true);
  const [emailError, setEmailError] = useState("");

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const sendVerification = async () => {
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const res = await fetch("/api/sendVerification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.universityEmail, code }),
      });
      if (!res.ok) throw new Error("인증번호 전송 실패");
      setTimeLeft(180);
      setCanResend(false);
      setEmailError("");
    } catch (err) {
      console.error(err);
      setEmailError("인증번호 전송 중 오류가 발생했습니다.");
    }
  };

  const handleResend = async () => {
    if (canResend) {
      await sendVerification();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    try {
      const snap = await getDoc(doc(db, "emailVerifications", formData.universityEmail));
      if (!snap.exists()) {
        setEmailError("인증번호가 존재하지 않습니다.");
        return;
      }

      const data = snap.data();
      const now = Timestamp.now();
      const diff = now.seconds - data.createdAt.seconds;

      if (diff > 180) {
        setEmailError("인증번호 유효시간이 만료되었습니다.");
        return;
      }
      if (data.code !== codeInput) {
        setEmailError("인증번호가 올바르지 않습니다.");
        return;
      }

      // 회원가입 프로세스
      const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await setDoc(doc(db, "users", userCred.user.uid), {
        nickname: formData.nickname,
        email: formData.email,
        university: formData.university,
        universityEmail: formData.universityEmail,
      });

      alert("회원가입 완료!");
      router.push("/home");
      setMode("login");
    } catch (err) {
      console.error(err);
      setEmailError(err.message || "회원가입 중 오류가 발생했습니다.");
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <div className="text-left">
        <p className="text-blue-600 text-xs">남은 시간: {formatTime(timeLeft)}</p>
      </div>

      <div className="flex space-x-2">
        <label htmlFor="codeInput" className="sr-only">인증번호</label>
        <input
          type="text"
          id="codeInput"
          placeholder="인증번호 입력"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          className="flex-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          required
        />
        <button
          type="button"
          onClick={handleResend}
          disabled={!canResend || timeLeft > 0}
          className="w-24 h-12 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          재전송
        </button>
      </div>

      {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}

      <button
        type="submit"
        className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition duration-200 font-medium"
      >
        완료
      </button>
    </form>
  );
}