"use client";

import { Suspense } from "react";
import ResetPwForm from "./ResetPwForm";

export default function ResetPwPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <ResetPwForm />
    </Suspense>
  );
}
