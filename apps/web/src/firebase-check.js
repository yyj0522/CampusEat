// apps/web/src/firebase-check.js
import React, { useEffect } from "react";
import { app, auth, db } from "./firebase";

export default function FirebaseCheck() {
  useEffect(() => {
    if (app && auth && db) {
      console.log("✅ Firebase initialized successfully!");
      console.log("Firebase Config:", {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      console.error("❌ Firebase initialization failed!");
    }
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>Firebase Check</h1>
      <p>브라우저 콘솔에서 Firebase 초기화 상태를 확인하세요.</p>
    </div>
  );
}
