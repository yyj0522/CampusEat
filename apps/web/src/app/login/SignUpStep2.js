"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

export default function SignUpStep2({ formData, setFormData, next }) {
  const [universities, setUniversities] = useState([]);
  const [emailStatus, setEmailStatus] = useState("");
  const universityDomains = {
    "서울대학교(본교)": "@snu.ac.kr",
    "연세대학교(본교)": "@yonsei.ac.kr",
    "고려대학교(본교)": "@korea.ac.kr",
    "신구대학교(본교)": "@shingu.ac.kr",
    "백석대학교(본교)": "@bu.ac.kr",
    "백석문화대학교(본교)": "@bscu.ac.kr",
    // 다른 대학 도메인 추가...
  };

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const docRef = doc(db, "UnivName", "UnivName");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const namesArray = docSnap.data().name[0];
          const list = namesArray.split(",").map((s) => s.trim());
          setUniversities(list);
        }
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

    const selectedUniversity = formData.university;
    if (!selectedUniversity || !universityDomains[selectedUniversity]) {
      setEmailStatus("");
      return;
    }

    const domain = universityDomains[selectedUniversity];
    if (!value.endsWith(domain)) {
      setEmailStatus("올바른 형식의 이메일을 입력해주세요.");
    } else {
      setEmailStatus("사용 가능한 이메일입니다.");
    }
  };

  const handleNext = async (e) => {
    e.preventDefault();

    const email = formData.universityEmail;
    const selectedUniversity = formData.university;

    if (!selectedUniversity || !email) {
      setEmailStatus("대학과 이메일을 입력해주세요.");
      return;
    }

    const domain = universityDomains[selectedUniversity];
    if (!email.endsWith(domain)) {
      setEmailStatus(`올바른 형식의 이메일주소를 입력해주세요. (${domain})`);
      return;
    }

    try {
      const q = query(collection(db, "users"), where("universityEmail", "==", email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setEmailStatus("이미 가입된 이메일입니다.");
        return;
      }
    } catch (err) {
      console.error(err);
      setEmailStatus("이메일 확인 중 오류가 발생했습니다.");
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const res = await fetch("/api/sendVerification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "인증번호 전송 실패");
      }
      const data = await res.json();
      if (data.success) {
        next();
      } else {
        setEmailStatus("인증번호 전송 실패: " + (data.error || "알 수 없는 오류"));
      }
    } catch (err) {
      console.error(err);
      setEmailStatus("인증번호 전송 중 오류가 발생했습니다: " + err.message);
    }
  };

  return (
    <form onSubmit={handleNext} className="space-y-4">
      <div>
        <label htmlFor="university" className="sr-only">대학교</label>
        <input
          type="text"
          id="university"
          placeholder="대학교 입력"
          value={formData.university}
          onChange={(e) => setFormData((prev) => ({ ...prev, university: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          autoComplete="off"
        />
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
        />
        {emailStatus && (
          <p
            className={`text-xs mt-1 ${
              emailStatus.includes("사용 가능") ? "text-blue-600" : "text-red-500"
            }`}
          >
            {emailStatus}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition duration-200 font-medium"
      >
        인증번호 받기
      </button>
    </form>
  );
}