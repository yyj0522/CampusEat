// 파일 전체 경로: src/app/login/SignUpForm.js

"use client";

import { useState } from "react";
import SignUpStep1 from "./SignUpStep1";
import SignUpStep2 from "./SignUpStep2";
import SignUpStep3 from "./SignUpStep3";

export default function SignUpForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nickname: "",
    university: "",
    universityEmail: "",
  });

  // 1. verificationCode 상태를 완전히 제거합니다.
  // const [verificationCode, setVerificationCode] = useState("");

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  switch (step) {
    case 1:
      return <SignUpStep1 formData={formData} setFormData={setFormData} next={nextStep} />;
    case 2:
      return (
        <SignUpStep2 
          formData={formData} 
          setFormData={setFormData} 
          next={nextStep}
          // 2. setVerificationCode prop 전달을 제거합니다.
        />
      );
    case 3:
      return (
        <SignUpStep3 
          formData={formData} 
          prev={prevStep}
          // 3. verificationCode prop 전달을 제거합니다.
        />
      );
    default:
      return <SignUpStep1 formData={formData} setFormData={setFormData} next={nextStep} />;
  }
}