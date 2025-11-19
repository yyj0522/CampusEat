"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api";

function SuccessModal({ message, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-[500px]">
        <p className="text-lg font-medium text-gray-800 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="bg-purple-600 text-white px-8 py-2 rounded-lg hover:bg-purple-700 transition w-full"
        >
          확인
        </button>
      </div>
    </div>
  );
}

export default function SignUpStep3({ formData, prev }) {
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timer, setTimer] = useState(180);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (timer === 0) {
      setError("인증 시간이 만료되었습니다. 이전 단계로 돌아가 다시 시도해주세요.");
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || timer === 0) return;

    if (!codeInput || codeInput.length !== 6) {
      setError("인증번호 6자리를 정확하게 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await apiClient.post('/auth/verify-code', {
        email: formData.email, 
        code: codeInput,
      });

      const { accessToken } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      setShowSuccessModal(true);

    } catch (error) {
      console.error("Verification Error:", error);
      if (error.response && (error.response.status === 400 || error.response.status === 404)) {
        setError("인증번호가 올바르지 않거나 만료되었습니다.");
      } else {
        setError("회원가입 처리 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    window.location.href = "/home";
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">{formData.universityEmail}(으)로 전송된 인증번호를 입력해주세요.</p>
        </div>
        <div>
          <label htmlFor="codeInput" className="sr-only">인증번호</label>
          <div className="relative">
            <input
              type="text"
              id="codeInput"
              placeholder="인증번호 6자리"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center tracking-[.5em] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
              maxLength={6}
              autoFocus
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-600 font-medium">
              {formatTime(timer)}
            </span>
          </div>
        </div>

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting || timer === 0}
          className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "가입 처리 중..." : "가입 완료"}
        </button>

        <button
          type="button"
          onClick={prev}
          className="w-full text-center text-gray-600 hover:underline text-sm"
        >
          이전 단계로
        </button>
      </form>

      {showSuccessModal && (
        <SuccessModal
          message="회원가입이 완료되었습니다!"
          onClose={handleSuccessModalClose}
        />
      )}
    </>
  );
}