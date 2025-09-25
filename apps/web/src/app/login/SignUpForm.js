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

  // 1. 인증번호를 저장할 상태를 부모인 SignUpForm에 만듭니다.
  const [verificationCode, setVerificationCode] = useState("");

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
          // 2. 인증번호를 담을 '가방'(함수)을 props로 전달합니다.
          setVerificationCode={setVerificationCode} 
        />
      );
    case 3:
      return (
        <SignUpStep3 
          formData={formData} 
          prev={prevStep}
          // 3. 형이 받아온 '인증번호'(값)를 동생에게 전달합니다.
          verificationCode={verificationCode}
        />
      );
    default:
      return <SignUpStep1 formData={formData} setFormData={setFormData} next={nextStep} />;
  }
}