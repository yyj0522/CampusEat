"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import '@fortawesome/fontawesome-free/css/all.min.css';

// 수정: './(main)/...'이 아닌 './...' 경로에서 가져옵니다.
import { AuthProvider } from "./context/AuthProvider";
import { RestaurantProvider } from "./context/RestaurantProvider";
import { ChatProvider } from "./context/ChatProvider";
import { UserInteractionProvider } from "./context/UserInteractionProvider";

import GlobalChatWidget from "./components/GlobalChatWidget";
import CustomContextMenu from "./components/CustomContextMenu";
import ReportModal from "./components/ReportModal";
import DirectMessageModal from "./components/DirectMessageModal";
import MailboxModal from "./components/MailboxModal";

const geistSans = Geist({ variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono" });

// 'use client'가 있는 파일에서는 metadata를 export 할 수 없습니다.
// 필요하다면 별도 서버 컴포넌트나 page.js에서 관리해야 합니다.
// export const metadata = { ... };

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head></head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <RestaurantProvider>
            <ChatProvider>
              <UserInteractionProvider>
                {/* Header는 (main)/layout.js로 이동했으므로 여기엔 없습니다. */}
                {children}
                
                {/* 전역 컴포넌트들은 여기에 위치합니다. */}
                <GlobalChatWidget />
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