"use client";

import { useState } from "react";
import SignUpStep1 from "./SignUpStep1";
import SignUpStep2 from "./SignUpStep2";
import SignUpStep3 from "./SignUpStep3";

export default function SignUpForm({ setMode }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nickname: "",
    email: "",
    password: "",
    university: "",
    universityEmail: "",
  });

  return (
    <div className="space-y-6">
      {step === 1 && <SignUpStep1 formData={formData} setFormData={setFormData} next={() => setStep(2)} />}
      {step === 2 && <SignUpStep2 formData={formData} setFormData={setFormData} next={() => setStep(3)} />}
      {step === 3 && <SignUpStep3 formData={formData} setMode={setMode} />}

      <div className="flex justify-center space-x-2 mt-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`w-6 h-1 rounded-full transition-colors duration-300 ${
              step === n ? "bg-blue-600" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}