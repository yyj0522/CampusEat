"use client";

import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import styles from "./LoginPage.module.css";

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

  const handleNext = async () => {
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
    <div style={{ maxWidth: 400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <input
          type="text"
          placeholder="닉네임"
          value={formData.nickname}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, nickname: e.target.value }));
            setNicknameError("");
          }}
          className={styles.input}
        />
        {nicknameError && <span style={{ color: "red", fontSize: "12px" }}>{nicknameError}</span>}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
        <input
          type="email"
          placeholder="아이디(이메일)"
          value={formData.email}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, email: e.target.value }));
            setIsEmailChecked(false);
            setEmailStatus("");
          }}
          className={styles.input}
          style={{ flex: 1 }}
        />
         <button
         onClick={handleCheckEmail}
         disabled={checkingEmail}
         className={styles.button}  
         style={{ width: 90, height: "48px", fontSize: "16px" }} 
         >
          중복확인
          </button>
      </div>
      {emailStatus && (
        <span
          style={{
            color: emailStatus === "사용 가능한 이메일입니다." ? "blue" : "red",
            fontSize: 12,
          }}
        >
          {emailStatus}
        </span>
      )}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          type="password"
          placeholder="비밀번호"
          value={formData.password}
          onFocus={() => setShowPasswordRules(true)}
          onBlur={() => setShowPasswordRules(false)}
          onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
          className={styles.input}
          style={{ flex: 1 }}
        />

        {showPasswordRules && (
          <div
            style={{
              position: "absolute",
              left: "105%", 
              top: 0,
              width: 200,
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 8,
              fontSize: 12,
              lineHeight: 1.5,
              backgroundColor: "#f9f9f9",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              zIndex: 10,
            }}
          >
            * 8자 이상<br />
            * @, !, # 등 특수문자 1개 이상 포함<br />
            * 대문자 영어 포함
          </div>
        )}
      </div>
      {passwordError && <span style={{ color: "red", fontSize: "12px" }}>{passwordError}</span>}
      <input
        type="password"
        placeholder="비밀번호 확인"
        value={passwordCheck}
        onChange={(e) => setPasswordCheck(e.target.value)}
        className={styles.input}
      />
      {passwordMatchError && <span style={{ color: "red", fontSize: "12px" }}>{passwordMatchError}</span>}
      <button className={styles.button} style={{ height: "48px" }} onClick={handleNext}>
        다음
      </button>
    </div>
  );
}
