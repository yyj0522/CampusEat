"use client";

import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

export default function SignUpStep1({ formData, setFormData, next }) {
  const [passwordCheck, setPasswordCheck] = useState("");
  const [isEmailChecked, setIsEmailChecked] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [nicknameError, setNicknameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordMatchError, setPasswordMatchError] = useState("");
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");

  const handleCheckEmail = async () => {
    if (!formData.email) return setEmailStatus("이메일을 입력해주세요.");
    setCheckingEmail(true);
    try {
      const q = query(collection(db, "users"), where("email", "==", formData.email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setEmailStatus("중복된 이메일입니다.");
        setIsEmailChecked(false);
      } else {
        setEmailStatus("사용 가능한 이메일입니다.");
        setIsEmailChecked(true);
      }
    } catch (err) {
      console.error(err);
      setEmailStatus("이메일 확인 중 오류가 발생했습니다.");
      setIsEmailChecked(false);
    }
    setCheckingEmail(false);
  };

  const checkNicknameDuplicate = async () => {
    if (!formData.nickname) {
      setNicknameError("닉네임을 입력해주세요.");
      return false;
    }
    try {
      const q = query(collection(db, "users"), where("nickname", "==", formData.nickname));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setNicknameError("중복된 닉네임입니다.");
        return false;
      } else {
        setNicknameError("");
        return true;
      }
    } catch (err) {
      console.error(err);
      setNicknameError("닉네임 확인 중 오류가 발생했습니다.");
      return false;
    }
  };

  const validatePassword = (pw) => {
    const lengthCheck = pw.length >= 8;
    const specialCharCheck = /[!@#\$%\^&\*]/.test(pw);
    const upperCaseCheck = /[A-Z]/.test(pw);
    return lengthCheck && specialCharCheck && upperCaseCheck;
  };

  const handleNext = async (e) => {
    e.preventDefault();

    if (!formData.nickname || !formData.email || !formData.password || !passwordCheck) {
      return;
    }

    if (!validatePassword(formData.password)) {
      setPasswordError("비밀번호 생성규칙을 확인해주세요.");
      return;
    } else {
      setPasswordError("");
    }

    if (formData.password !== passwordCheck) {
      setPasswordMatchError("비밀번호가 일치하지 않습니다.");
      return;
    } else {
      setPasswordMatchError("");
    }

    if (!isEmailChecked) {
      setEmailStatus("이메일 중복 확인을 해주세요.");
      return;
    }

    const isNicknameOk = await checkNicknameDuplicate();
    if (!isNicknameOk) return;

    next();
  };

  return (
    <form onSubmit={handleNext} className="space-y-4">
      <div>
        <label htmlFor="nickname" className="sr-only">닉네임</label>
        <input
          type="text"
          id="nickname"
          placeholder="닉네임"
          value={formData.nickname}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, nickname: e.target.value }));
            setNicknameError("");
          }}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
        {nicknameError && <p className="text-red-500 text-xs mt-1">{nicknameError}</p>}
      </div>

      <div className="flex space-x-2">
        <div className="flex-1">
          <label htmlFor="email" className="sr-only">아이디(이메일)</label>
          <input
            type="email"
            id="email"
            placeholder="아이디(이메일)"
            value={formData.email}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, email: e.target.value }));
              setIsEmailChecked(false);
              setEmailStatus("");
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <button
          type="button"
          onClick={handleCheckEmail}
          disabled={checkingEmail}
          className="w-24 h-12 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checkingEmail ? "확인중..." : "중복확인"}
        </button>
      </div>
      {emailStatus && (
        <p
          className={`text-xs mt-1 ${
            emailStatus === "사용 가능한 이메일입니다." ? "text-blue-600" : "text-red-500"
          }`}
        >
          {emailStatus}
        </p>
      )}

      <div className="relative">
        <label htmlFor="password" className="sr-only">비밀번호</label>
        <input
          type="password"
          id="password"
          placeholder="비밀번호"
          value={formData.password}
          onFocus={() => setShowPasswordRules(true)}
          onBlur={() => setShowPasswordRules(false)}
          onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
        {showPasswordRules && (
          <div className="absolute left-full top-0 ml-4 w-52 p-3 text-xs leading-tight bg-gray-50 border border-gray-200 rounded-lg shadow-md z-10">
            * 8자 이상<br />
            * @, !, # 등 특수문자 1개 이상 포함<br />
            * 대문자 영어 포함
          </div>
        )}
      </div>
      {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
      
      <div>
        <label htmlFor="passwordCheck" className="sr-only">비밀번호 확인</label>
        <input
          type="password"
          id="passwordCheck"
          placeholder="비밀번호 확인"
          value={passwordCheck}
          onChange={(e) => setPasswordCheck(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
        {passwordMatchError && <p className="text-red-500 text-xs mt-1">{passwordMatchError}</p>}
      </div>

      <button
        type="submit"
        className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition duration-200 font-medium"
      >
        다음
      </button>
    </form>
  );
}