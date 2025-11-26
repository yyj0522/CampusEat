"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api";

export default function SignUpStep2({ formData, setFormData, next }) {
  const [universities, setUniversities] = useState([]);
  const [emailStatus, setEmailStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const universityDomains = {
    "서울대학교(본교)": "@snu.ac.kr",
    "연세대학교(본교)": "@yonsei.ac.kr",
    "고려대학교(본교)": "@korea.ac.kr",
    "신구대학교(본교)": "@shingu.ac.kr",
    "백석대학교(본교)": "@bu.ac.kr",
    "백석문화대학교(본교)": "@bscu.ac.kr",
  };

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await apiClient.get("/universities");
        setUniversities(response.data);
      } catch (err) {
        console.error("대학 불러오기 실패:", err);
      }
    };
    fetchUniversities();
  }, []);

  const filteredUniversities = universities.filter((u) =>
    u.toLowerCase().includes(formData.university?.toLowerCase() || "")
  );

  const handleEmailChange = (value) => {
    setFormData((prev) => ({ ...prev, universityEmail: value }));
    setEmailStatus("");
  };

  const handleNext = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const { email, university, universityEmail } = formData;

    if (!university || !universityEmail) {
      setEmailStatus("대학과 이메일을 모두 입력해주세요.");
      return;
    }

    const domain = universityDomains[university];
    if (!universityEmail.endsWith(domain)) {
      setEmailStatus(`올바른 형식의 이메일 주소를 입력해주세요. (${domain})`);
      return;
    }

    setIsSubmitting(true);

    try {
      setEmailStatus("인증번호를 전송 중입니다...");
      await apiClient.post("/auth/send-verification", {
        email,
        university,
        universityEmail,
      });

      next();
    } catch (err) {
      console.error("인증번호 전송 오류:", err);
      if (err.response && err.response.status === 409) {
        setEmailStatus(err.response.data.message);
      } else {
        setEmailStatus(`인증번호 전송 중 오류가 발생했습니다: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleNext} className="space-y-4">
      <div>
        <label htmlFor="university" className="sr-only">대학교</label>
        <input
          type="text"
          id="university"
          placeholder="대학교 검색"
          value={formData.university}
          onChange={(e) => setFormData((prev) => ({ ...prev, university: e.target.value, universityEmail: "" }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          autoComplete="off"
        />
        {formData.university && filteredUniversities.length > 0 && (
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg mt-2">
                {filteredUniversities.map((u) => (
                <div
                    key={u}
                    className="p-3 cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                    onClick={() => setFormData((prev) => ({ ...prev, university: u }))}
                >
                    {u}
                </div>
                ))}
            </div>
        )}
      </div>
      <div>
        <label htmlFor="universityEmail" className="sr-only">대학교 이메일</label>
        <input
          type="email"
          id="universityEmail"
          placeholder="대학교 이메일"
          value={formData.universityEmail}
          onChange={(e) => handleEmailChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          required
          disabled={!formData.university || !universityDomains[formData.university]}
        />
        {emailStatus && (
          <p className={`text-xs mt-1 ${emailStatus.includes("성공") ? "text-blue-600" : "text-red-500"}`}>
            {emailStatus}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "확인 중..." : "인증번호 받기"}
      </button>
    </form>
  );
}