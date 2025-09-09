"use client";

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBCqhLLYnqtN1l0eJiKhI05u0DkxcPgnk8",   
  authDomain: "whattoday-ccdce.firebaseapp.com",
  projectId: "whattoday-ccdce",
  storageBucket: "whattoday-ccdce.appspot.com",
  messagingSenderId: "804568381273",
  appId: "1:804568381273:web:93d6b20675652d69113e48",
  measurementId: "G-JNFTBEV1WE"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
