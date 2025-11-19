"use client";

import Header from "../components/Header";
import Footer from "../components/Footer"; 

export default function LegalLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer /> 
    </>
  );
}