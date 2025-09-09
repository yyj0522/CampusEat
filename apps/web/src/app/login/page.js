"use client";

import Image from "next/image";
import Button from "../components/Button";
import Input from "../components/Input";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="flex items-center mb-6 space-x-3">
        <Image src="/icon.png" alt="CampusEat Logo" width={80} height={80} />
        <h1 className="text-[80px] font-extrabold leading-none">캠퍼스잇</h1>
      </div>

      <p className="text-gray-600 text-center mb-8 text-lg">
        캠퍼스 생활을 더 즐겁게 만드는 당신의 친구!
      </p>

      <div className="w-80 p-6 bg-white rounded-2xl shadow">
        <Input placeholder="이메일" />
        <Input placeholder="비밀번호" type="password" className="mt-4" />
        <Button label="로그인" onClick={() => alert("로그인 시도")} className="mt-4" />
        <Button label="회원가입" variant="secondary" className="mt-2" />
      </div>
    </div>
  );
}
