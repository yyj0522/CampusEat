"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import '@fortawesome/fontawesome-free/css/all.min.css';

import { AuthProvider } from "./context/AuthProvider";
import { RestaurantProvider } from "./context/RestaurantProvider";
import { ChatProvider } from "./context/ChatProvider";
import { UserInteractionProvider } from "./context/UserInteractionProvider";

import CustomContextMenu from "./components/CustomContextMenu";
import ReportModal from "./components/ReportModal";
import DirectMessageModal from "./components/DirectMessageModal";
import MailboxModal from "./components/MailboxModal";

const geistSans = Geist({ variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono" });

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head></head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <RestaurantProvider>
            <ChatProvider>
              <UserInteractionProvider>
                {children}
                <CustomContextMenu />
                <ReportModal />
                <DirectMessageModal />
                <MailboxModal />
              </UserInteractionProvider>
            </ChatProvider>
          </RestaurantProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
