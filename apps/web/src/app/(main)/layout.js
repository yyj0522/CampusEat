"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { AuthProvider } from "../context/AuthProvider"; 
import { RestaurantProvider } from "../context/RestaurantProvider";

export default function MainLayout({ children }) {
  return (
    <AuthProvider>
      <RestaurantProvider>
        <Header />
        <main>{children}</main>
        <Footer />
      </RestaurantProvider>
    </AuthProvider>
  );
}