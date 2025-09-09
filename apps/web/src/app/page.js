"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/login");
    }, 2500); // 2.5초 후 자동 이동

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <h1 className="text-6xl md:text-7xl font-extrabold mb-4 animate-fadeIn">
        캠퍼스잇에 오신 것을 환영합니다!
      </h1>
      <p className="text-lg md:text-2xl text-gray-600 text-center animate-fadeIn delay-500">
        캠퍼스 생활을 더 즐겁게 만드는 당신의 친구!
      </p>
    </div>
  );
}
