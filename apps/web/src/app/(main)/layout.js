"use client";

import Header from "../components/Header";

export default function MainLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}