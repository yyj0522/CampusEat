"use client"; // 클라이언트 컴포넌트로 사용

import { useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// apps/web/src/firebase.js에서 불러와도 되지만, 여기서는 예시로 직접 작성
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export default function FirebaseCheckPage() {
  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      console.log("✅ Firebase initialized successfully:", app.name);
    } catch (error) {
      console.error("❌ Firebase initialization failed:", error.message);
    }
  }, []);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Firebase Check</h1>
      <p>브라우저 콘솔을 열어 Firebase 연결 상태를 확인하세요.</p>
    </div>
  );
}
