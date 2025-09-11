"use client";

import { useState } from "react";
import SignUpStep1 from "./SignUpStep1";
import SignUpStep2 from "./SignUpStep2";
import SignUpStep3 from "./SignUpStep3";

export default function SignUpForm({ onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nickname: "",
    email: "",
    password: "",
    university: "",
    universityEmail: "",
  });

  return (
    <div>
      {step === 1 && <SignUpStep1 formData={formData} setFormData={setFormData} next={() => setStep(2)} />}
      {step === 2 && <SignUpStep2 formData={formData} setFormData={setFormData} next={() => setStep(3)} />}
      {step === 3 && <SignUpStep3 formData={formData} onComplete={onComplete} />}
      
      <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "16px" }}>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            style={{
              width: "30px",
              height: "6px",
              borderRadius: "4px",
              backgroundColor: step === n ? "#3b82f6" : "#d1d5db"
            }}
          />
        ))}
      </div>
    </div>
  );
}
