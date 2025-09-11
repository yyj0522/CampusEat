"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import "./page.css"; 

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/login");
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="page-container">
      <h1 className="page-title">
        캠퍼스잇에 오신 것을 환영합니다!
      </h1>
      <p className="page-subtitle">
        캠퍼스 생활을 더 즐겁게 만드는 당신의 친구!
      </p>
    </div>
  );
}
